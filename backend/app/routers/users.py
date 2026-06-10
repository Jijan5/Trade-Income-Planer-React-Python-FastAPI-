import os
import uuid
import shutil
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, File, Form, UploadFile
from sqlmodel import Session, select, func
from ..database import get_session
from ..models import User, UserRead, Community, CommunityMember, Notification, NotificationRead, UserTheme, UserThemeCreateUpdate, Comment, Post, Achievement, UserAchievement
from ..dependencies import get_current_user, get_current_active_user
from ..auth import get_password_hash

router = APIRouter()

@router.get("/api/users/me", response_model=UserRead)
async def read_user_profile(user: User = Depends(get_current_user)):
    user_data = user.dict()
    if user.avatar_url and not user.avatar_url.startswith('https'):
        user_data['avatar_url'] = f"{os.getenv('API_BASE_URL', '')}{user.avatar_url}"
    return UserRead(**user_data)

class RequestPasswordPinRequest(BaseModel):
    pass 

@router.post("/api/users/me/request-password-pin")
async def request_password_pin(user: User = Depends(get_current_active_user), session: Session = Depends(get_session)):
    import secrets
    import string
    from datetime import timedelta, datetime
    from ..email_utils import send_password_reset_email
    
    pin = ''.join(secrets.choice(string.digits) for _ in range(6))
    user.reset_token = pin
    user.reset_token_expires = datetime.utcnow() + timedelta(minutes=15)
    session.add(user)
    session.commit()

    email_sent = send_password_reset_email(user.email, pin)
    if email_sent:
        print(f"\n========================================")
        print(f" [PRODUCTION] Profile Password PIN sent to: {user.email}")
        print(f"========================================\n")
    else:
        print(f"\n========================================")
        print(f" [LOCAL/DEBUG] PROFILE PASSWORD PIN: {pin} ")
        print(f" [Email failed to send - check SMTP settings]")
        print(f"========================================\n")

    return {"status": "success", "message": "PIN sent to your email address."}

class ChangePasswordRequest(BaseModel):
    pin: str
    new_password: str

@router.post("/api/users/me/change-password")
async def change_password(req: ChangePasswordRequest, user: User = Depends(get_current_active_user), session: Session = Depends(get_session)):
    from datetime import datetime
    
    if not user.reset_token or user.reset_token != req.pin:
        raise HTTPException(status_code=400, detail="Invalid PIN")
    
    if user.reset_token_expires and datetime.utcnow() > user.reset_token_expires:
        raise HTTPException(status_code=400, detail="PIN expired")
        
    user.hashed_password = get_password_hash(req.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    session.add(user)
    session.commit()
    
    return {"status": "success", "message": "Password updated successfully."}

@router.put("/api/users/me", response_model=UserRead)
async def update_user_profile(
    username: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    full_name: Optional[str] = Form(None),
    country_code: Optional[str] = Form(None),
    phone_number: Optional[str] = Form(None),
    avatar_file: Optional[UploadFile] = File(None),
    user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    if username and username != user.username:
        existing_user = session.exec(select(User).where(User.username == username, User.tenant_id == user.tenant_id)).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Username already taken")
        user.username = username

    if email and email != user.email:
        existing = session.exec(select(User).where(User.email == email, User.tenant_id == user.tenant_id)).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        user.email = email
    
    if full_name is not None: user.full_name = full_name
    if country_code is not None: user.country_code = country_code
    if phone_number is not None: user.phone_number = phone_number
        
    if avatar_file:
        os.makedirs("static/avatars", exist_ok=True)
        filename = f"avatar_{user.id}_{uuid.uuid4()}_{avatar_file.filename}"
        file_path = os.path.join("static/avatars", filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(avatar_file.file, buffer)
        user.avatar_url = f"/static/avatars/{filename}"
    
    session.add(user)
    session.commit()
    session.refresh(user)
    return user

@router.get("/api/users/me/theme", response_model=UserTheme)
async def get_user_theme(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    theme = session.exec(select(UserTheme).where(UserTheme.user_id == user.id)).first()
    if not theme:
        # Create default theme if not exists
        theme = UserTheme(user_id=user.id)
        session.add(theme)
        session.commit()
        session.refresh(theme)
    return theme

@router.put("/api/users/me/theme", response_model=UserTheme)
async def update_user_theme(
    theme_update: UserThemeCreateUpdate,
    user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    theme = session.exec(select(UserTheme).where(UserTheme.user_id == user.id)).first()
    if not theme:
        theme = UserTheme(user_id=user.id)
    
    update_data = theme_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(theme, key, value)
        
    session.add(theme)
    session.commit()
    session.refresh(theme)
    return theme


@router.get("/api/users/search")
async def search_users(q: str = "", session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    if not q:
        return []
    users = session.exec(select(User).where(User.tenant_id == user.tenant_id, User.username.ilike(f"%{q}%")).limit(5)).all()
    return [{"username": user.username, "avatar_url": user.avatar_url} for user in users]

@router.get("/api/users/me/communities", response_model=list[Community])
async def get_my_communities(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    return session.exec(select(Community).where(Community.creator_username == user.username, Community.tenant_id == user.tenant_id)).all()

@router.get("/api/users/me/joined_communities", response_model=list[int])
async def get_joined_communities(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    members = session.exec(select(CommunityMember).where(CommunityMember.user_id == user.id)).all()
    return [m.community_id for m in members]

# Notifications
@router.get("/api/notifications", response_model=list[NotificationRead])
async def get_notifications(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    notifications = session.exec(
        select(Notification)
        .where(Notification.user_id == user.id)
        .order_by(Notification.created_at.desc())
        .limit(50)
    ).all()

    if not notifications:
        return []

    # ── Batch fetch actors (1 query instead of N) ──────────────────────────
    actor_usernames = list({n.actor_username for n in notifications})
    actors_rows     = session.exec(select(User).where(User.username.in_(actor_usernames), User.tenant_id == user.tenant_id)).all()
    actor_map       = {a.username: a for a in actors_rows}

    # ── Batch fetch related posts and comments (2 queries instead of N) ───
    post_ids    = list({n.post_id    for n in notifications if n.post_id    and not n.comment_id})
    comment_ids = list({n.comment_id for n in notifications if n.comment_id})
    post_map    = {p.id: p for p in (session.exec(select(Post).where(Post.id.in_(post_ids))).all()        if post_ids    else [])}
    comment_map = {c.id: c for c in (session.exec(select(Comment).where(Comment.id.in_(comment_ids))).all() if comment_ids else [])}

    response_data = []
    for notif in notifications:
        actor = actor_map.get(notif.actor_username)

        if notif.type == "system_broadcast":
            content_preview = notif.content or "System Announcement"
        elif notif.comment_id:
            c = comment_map.get(notif.comment_id)
            content_preview = c.content[:75] if c else ""
        elif notif.post_id:
            p = post_map.get(notif.post_id)
            content_preview = p.content[:75] if p else ""
        else:
            content_preview = ""

        response_data.append(NotificationRead(
            id=notif.id, actor_username=notif.actor_username,
            actor_avatar_url=actor.avatar_url if actor else None,
            actor_role=actor.role if actor else "user",
            actor_plan=actor.plan if actor else "Free",
            type=notif.type, content_preview=content_preview,
            post_id=notif.post_id, community_id=notif.community_id,
            is_read=notif.is_read, created_at=notif.created_at,
        ))
    return response_data

@router.get("/api/notifications/unread_count", response_model=dict)
async def get_unread_notification_count(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    # Use SQL COUNT — far cheaper than fetching all rows
    count = session.exec(
        select(func.count()).where(Notification.user_id == user.id, Notification.is_read == False)
    ).one()
    return {"count": count}

@router.post("/api/notifications/mark_as_read")
async def mark_notifications_as_read(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    notifications = session.exec(select(Notification).where(Notification.user_id == user.id, Notification.is_read == False)).all()
    for notif in notifications:
        notif.is_read = True
        session.add(notif)
    session.commit()
    return {"status": "success"}

# Achievement APIs
@router.get("/api/achievements")
async def get_achievements(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    achievements = session.exec(select(Achievement)).all()
    unlocked = session.exec(select(UserAchievement).where(UserAchievement.user_id == user.id)).all()
    unlocked_ids = {ua.achievement_id for ua in unlocked}
    
    result = []
    for ach in achievements:
        criteria = json.loads(ach.criteria)
        progress = get_achievement_progress(user.id, ach.id, session)
        result.append({
            "id": ach.id,
            "slug": ach.slug,
            "name": ach.name,
            "description": ach.description,
            "category": ach.category,
            "icon": ach.icon,
            "rarity": ach.rarity,
            "unlocked": ach.id in unlocked_ids,
            "progress": progress
        })
    return result

@router.post("/api/achievements/check")
async def check_achievements(request: dict, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    from ..utils import check_and_unlock_achievements
    new_unlocks = check_and_unlock_achievements(user.id, request['event'], request.get('data'), session)
    return {"unlocked": new_unlocks}
