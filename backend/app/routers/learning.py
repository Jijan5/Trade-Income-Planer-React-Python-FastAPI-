import os
import uuid
import shutil
from typing import Optional, List
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, File, Form, UploadFile, Query
from sqlmodel import Session, select
from ..database import get_session
from ..models import (
    User, LearningModule, ModuleBundle, BundleModule,
    ModuleAccess, ModuleView, LearningModuleRead, ModuleBundleRead
)
from ..dependencies import get_current_user

router = APIRouter(tags=["Learning"])

PREMIUM_DAILY_LIMIT = 3

# ─── Helpers ────────────────────────────────────────────────────────────────────

def _get_plan_level(plan: str) -> str:
    """Return canonical plan level."""
    plan_lower = plan.lower() if plan else "free"
    if "platinum" in plan_lower:
        return "platinum"
    if "premium" in plan_lower:
        return "premium"
    if "basic" in plan_lower:
        return "basic"
    return "free"

def _user_has_access(user: User, module_id: int, bundle_id: Optional[int], session: Session) -> dict:
    """
    Returns a dict: { allowed: bool, reason: str }
    reason: 'unlimited' | 'purchased' | 'premium_ok' | 'premium_limit' | 'gate'
    """
    plan = _get_plan_level(user.plan)

    # Admin / Platinum → unlimited
    if user.role == "admin" or plan == "platinum":
        return {"allowed": True, "reason": "unlimited"}

    # Check purchased access
    q = select(ModuleAccess).where(ModuleAccess.user_id == user.id)
    if bundle_id:
        q = q.where(ModuleAccess.bundle_id == bundle_id)
    else:
        q = q.where(ModuleAccess.module_id == module_id)
    purchased = session.exec(q).first()
    if purchased:
        return {"allowed": True, "reason": "purchased"}

    # Premium → 3/day limit
    if plan == "premium":
        today = date.today()
        views_today = session.exec(
            select(ModuleView).where(
                ModuleView.user_id == user.id,
                ModuleView.viewed_at >= datetime(today.year, today.month, today.day)
            )
        ).all()
        if len(views_today) < PREMIUM_DAILY_LIMIT:
            return {"allowed": True, "reason": "premium_ok", "views_today": len(views_today)}
        return {"allowed": False, "reason": "premium_limit"}

    # Free / Basic → gate
    return {"allowed": False, "reason": "gate"}


def _log_view(user: User, module_id: int, session: Session):
    """Log a module view for Premium quota tracking."""
    plan = _get_plan_level(user.plan)
    if plan == "premium":
        view = ModuleView(user_id=user.id, module_id=module_id)
        session.add(view)
        session.commit()


def _save_thumbnail(file: UploadFile, prefix: str) -> str:
    """Save thumbnail to static/learning/ and return relative path."""
    os.makedirs("static/learning", exist_ok=True)
    ext = os.path.splitext(file.filename)[1] or ".jpg"
    filename = f"{prefix}_{uuid.uuid4()}{ext}"
    path = os.path.join("static/learning", filename)
    with open(path, "wb") as buf:
        shutil.copyfileobj(file.file, buf)
    return f"/static/learning/{filename}"


# ─── Public / User Endpoints ────────────────────────────────────────────────────

@router.get("/api/learning/modules", response_model=List[LearningModuleRead])
def list_modules(session: Session = Depends(get_session)):
    """List all published modules (no auth required for browsing)."""
    return session.exec(
        select(LearningModule).where(LearningModule.is_published == True)
        .order_by(LearningModule.created_at.desc())
    ).all()


@router.get("/api/learning/modules/{module_id}")
def get_module(
    module_id: int,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user)
):
    """Get full module content — access-gated."""
    module = session.get(LearningModule, module_id)
    if not module or not module.is_published:
        raise HTTPException(status_code=404, detail="Module not found")

    if module.is_free:
        access = {"allowed": True, "reason": "free"}
    else:
        access = _user_has_access(user, module_id, None, session)
        
    if not access["allowed"]:
        raise HTTPException(
            status_code=403,
            detail={"reason": access["reason"], "module": {"id": module.id, "title": module.title, "price": module.price}}
        )

    # Log view for premium
    _log_view(user, module_id, session)

    data = LearningModuleRead.model_validate(module, from_attributes=True)
    return {**data.model_dump(), "access_reason": access.get("reason"), "views_today": access.get("views_today")}


@router.get("/api/learning/bundles", response_model=List[ModuleBundleRead])
def list_bundles(session: Session = Depends(get_session)):
    """List all published bundles with their modules."""
    bundles = session.exec(
        select(ModuleBundle).where(ModuleBundle.is_published == True)
        .order_by(ModuleBundle.created_at.desc())
    ).all()
    result = []
    for bundle in bundles:
        links = session.exec(select(BundleModule).where(BundleModule.bundle_id == bundle.id)).all()
        module_ids = [lnk.module_id for lnk in links]
        modules = [session.get(LearningModule, mid) for mid in module_ids if session.get(LearningModule, mid)]
        bundle_dict = ModuleBundleRead.model_validate(bundle, from_attributes=True)
        bundle_dict.modules = [LearningModuleRead.model_validate(m, from_attributes=True) for m in modules]
        result.append(bundle_dict)
    return result


@router.get("/api/learning/bundles/{bundle_id}")
def get_bundle(
    bundle_id: int,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user)
):
    """Get full bundle with all modules — access-gated."""
    bundle = session.get(ModuleBundle, bundle_id)
    if not bundle or not bundle.is_published:
        raise HTTPException(status_code=404, detail="Bundle not found")

    if bundle.is_free:
        access = {"allowed": True, "reason": "free"}
    else:
        access = _user_has_access(user, 0, bundle_id, session)
        
    if not access["allowed"]:
        raise HTTPException(
            status_code=403,
            detail={"reason": access["reason"], "bundle": {"id": bundle.id, "title": bundle.title, "price": bundle.price}}
        )

    links = session.exec(select(BundleModule).where(BundleModule.bundle_id == bundle_id)).all()
    module_ids = [lnk.module_id for lnk in links]
    modules = [session.get(LearningModule, mid) for mid in module_ids if session.get(LearningModule, mid)]

    # Log view for each module in bundle
    for m in modules:
        _log_view(user, m.id, session)

    bundle_data = ModuleBundleRead.model_validate(bundle, from_attributes=True)
    bundle_data.modules = [LearningModuleRead.model_validate(m, from_attributes=True) for m in modules]
    return {**bundle_data.model_dump(), "access_reason": access.get("reason")}


@router.get("/api/learning/my_views_today")
def my_views_today(
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user)
):
    """How many modules has this Premium user viewed today."""
    today = date.today()
    count = len(session.exec(
        select(ModuleView).where(
            ModuleView.user_id == user.id,
            ModuleView.viewed_at >= datetime(today.year, today.month, today.day)
        )
    ).all())
    return {"views_today": count, "limit": PREMIUM_DAILY_LIMIT}


# ─── Admin CRUD Endpoints ───────────────────────────────────────────────────────

def _require_admin(user: User = Depends(get_current_user)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return user


@router.get("/api/admin/learning/modules")
def admin_list_modules(
    session: Session = Depends(get_session),
    user: User = Depends(_require_admin)
):
    """List ALL modules (incl. unpublished) for admin."""
    return session.exec(select(LearningModule).order_by(LearningModule.created_at.desc())).all()


@router.post("/api/admin/learning/modules", response_model=LearningModuleRead)
async def admin_create_module(
    title: str = Form(...),
    description: str = Form(""),
    content_html: str = Form(""),
    video_url: str = Form(""),
    price: float = Form(0.0),
    is_published: bool = Form(False),
    is_free: bool = Form(False),
    thumbnail: Optional[UploadFile] = File(None),
    session: Session = Depends(get_session),
    user: User = Depends(_require_admin)
):
    thumbnail_url = None
    if thumbnail and thumbnail.filename:
        thumbnail_url = _save_thumbnail(thumbnail, "module")

    module = LearningModule(
        title=title,
        description=description or None,
        content_html=content_html or None,
        thumbnail_url=thumbnail_url,
        video_url=video_url or None,
        price=price,
        is_published=is_published,
        is_free=is_free,
    )
    session.add(module)
    session.commit()
    session.refresh(module)
    return module


@router.put("/api/admin/learning/modules/{module_id}", response_model=LearningModuleRead)
async def admin_update_module(
    module_id: int,
    title: str = Form(...),
    description: str = Form(""),
    content_html: str = Form(""),
    video_url: str = Form(""),
    price: float = Form(0.0),
    is_published: bool = Form(False),
    is_free: bool = Form(False),
    thumbnail: Optional[UploadFile] = File(None),
    session: Session = Depends(get_session),
    user: User = Depends(_require_admin)
):
    module = session.get(LearningModule, module_id)
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    if thumbnail and thumbnail.filename:
        module.thumbnail_url = _save_thumbnail(thumbnail, "module")

    module.title = title
    module.description = description or None
    module.content_html = content_html or None
    module.video_url = video_url or None
    module.price = price
    module.is_published = is_published
    module.is_free = is_free
    module.updated_at = datetime.utcnow()

    session.add(module)
    session.commit()
    session.refresh(module)
    return module


@router.delete("/api/admin/learning/modules/{module_id}")
def admin_delete_module(
    module_id: int,
    session: Session = Depends(get_session),
    user: User = Depends(_require_admin)
):
    module = session.get(LearningModule, module_id)
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    # Remove from bundles first
    links = session.exec(select(BundleModule).where(BundleModule.module_id == module_id)).all()
    for lnk in links:
        session.delete(lnk)
    session.delete(module)
    session.commit()
    return {"status": "deleted"}


# ─── Bundle Admin CRUD ──────────────────────────────────────────────────────────

@router.get("/api/admin/learning/bundles")
def admin_list_bundles(
    session: Session = Depends(get_session),
    user: User = Depends(_require_admin)
):
    bundles = session.exec(select(ModuleBundle).order_by(ModuleBundle.created_at.desc())).all()
    result = []
    for bundle in bundles:
        links = session.exec(select(BundleModule).where(BundleModule.bundle_id == bundle.id)).all()
        module_ids = [lnk.module_id for lnk in links]
        result.append({**bundle.model_dump(), "module_ids": module_ids})
    return result


@router.post("/api/admin/learning/bundles")
async def admin_create_bundle(
    title: str = Form(...),
    description: str = Form(""),
    price: float = Form(0.0),
    is_published: bool = Form(False),
    is_free: bool = Form(False),
    module_ids: str = Form(""),   # comma-separated list of module IDs
    thumbnail: Optional[UploadFile] = File(None),
    session: Session = Depends(get_session),
    user: User = Depends(_require_admin)
):
    thumbnail_url = None
    if thumbnail and thumbnail.filename:
        thumbnail_url = _save_thumbnail(thumbnail, "bundle")

    bundle = ModuleBundle(
        title=title,
        description=description or None,
        thumbnail_url=thumbnail_url,
        price=price,
        is_published=is_published,
        is_free=is_free,
    )
    session.add(bundle)
    session.commit()
    session.refresh(bundle)

    # Assign modules
    if module_ids.strip():
        for mid_str in module_ids.split(","):
            try:
                mid = int(mid_str.strip())
                session.add(BundleModule(bundle_id=bundle.id, module_id=mid))
            except ValueError:
                pass
        session.commit()

    return {**bundle.model_dump(), "module_ids": [int(m) for m in module_ids.split(",") if m.strip()]}


@router.put("/api/admin/learning/bundles/{bundle_id}")
async def admin_update_bundle(
    bundle_id: int,
    title: str = Form(...),
    description: str = Form(""),
    price: float = Form(0.0),
    is_published: bool = Form(False),
    is_free: bool = Form(False),
    module_ids: str = Form(""),
    thumbnail: Optional[UploadFile] = File(None),
    session: Session = Depends(get_session),
    user: User = Depends(_require_admin)
):
    bundle = session.get(ModuleBundle, bundle_id)
    if not bundle:
        raise HTTPException(status_code=404, detail="Bundle not found")

    if thumbnail and thumbnail.filename:
        bundle.thumbnail_url = _save_thumbnail(thumbnail, "bundle")

    bundle.title = title
    bundle.description = description or None
    bundle.price = price
    bundle.is_published = is_published
    bundle.is_free = is_free
    bundle.updated_at = datetime.utcnow()
    session.add(bundle)
    session.commit()

    # Re-assign modules
    old_links = session.exec(select(BundleModule).where(BundleModule.bundle_id == bundle_id)).all()
    for lnk in old_links:
        session.delete(lnk)
    session.commit()

    new_ids = []
    if module_ids.strip():
        for mid_str in module_ids.split(","):
            try:
                mid = int(mid_str.strip())
                session.add(BundleModule(bundle_id=bundle_id, module_id=mid))
                new_ids.append(mid)
            except ValueError:
                pass
        session.commit()

    session.refresh(bundle)
    return {**bundle.model_dump(), "module_ids": new_ids}


@router.delete("/api/admin/learning/bundles/{bundle_id}")
def admin_delete_bundle(
    bundle_id: int,
    session: Session = Depends(get_session),
    user: User = Depends(_require_admin)
):
    bundle = session.get(ModuleBundle, bundle_id)
    if not bundle:
        raise HTTPException(status_code=404, detail="Bundle not found")
    links = session.exec(select(BundleModule).where(BundleModule.bundle_id == bundle_id)).all()
    for lnk in links:
        session.delete(lnk)
    session.delete(bundle)
    session.commit()
    return {"status": "deleted"}
