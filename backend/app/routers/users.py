import os
import uuid
import shutil
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, File, Form, UploadFile
from sqlmodel import Session, select
from ..database import get_session
from ..models import User, UserRead, Community, CommunityMember, Notification, NotificationRead
from ..dependencies import get_current_user
from ..auth import get_password_hash

router = APIRouter()

@router.get("/api/users/me", response_model=UserRead)
async def read_user_profile(user: User = Depends(get_current_user)):
    return user

@router.put("/api/users/me", response_model=UserRead)
async def update_user_profile(
    username: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    password: Optional[str] = Form(None),
    full_name: Optional[str] = Form(None),
    country_code: Optional[str] = Form(None),
    phone_number: Optional[str] = Form(None),
    avatar_file: Optional[UploadFile] = File(None),
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    if username and username != user.username:
        existing_user = session.exec(select(User).where(User.username == username)).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Username already taken")
        user.username = username

    if email and email != user.email:
        existing = session.exec(select(User).where(User.email == email)).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        user.email = email
    
    if full_name is not None: user.full_name = full_name
    if country_code is not None: user.country_code = country_code
    if phone_number is not None: user.phone_number = phone_number
        
    if password:
        user.hashed_password = get_password_hash(password)
        
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

@router.get("/api/users/search")
async def search_users(q: str = "", session: Session = Depends(get_session)):
    if not q:
        return []
    users = session.exec(select(User).where(User.username.ilike(f"{q}%")).limit(5)).all()
    return [{"username": user.username} for user in users]

@router.get("/api/users/me/communities", response_model=list[Community])
async def get_my_communities(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    return session.exec(select(Community).where(Community.creator_username == user.username)).all()

@router.get("/api/users/me/joined_communities", response_model=list[int])
async def get_joined_communities(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    members = session.exec(select(CommunityMember).where(CommunityMember.user_id == user.id)).all()
    return [m.community_id for m in members]

# Notifications
@router.get("/api/notifications", response_model=list[NotificationRead])
async def get_notifications(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    notifications = session.exec(
        select(Notification).where(Notification.user_id == user.id).order_by(Notification.created_at.desc()).limit(50)
    ).all()
    
    response_data = []
    for notif in notifications:
        actor = session.exec(select(User).where(User.username == notif.actor_username)).first()
        content_preview = ""
        # ... (logic preview content just like before) ...
        # Simplified for brevity, assume logic is imported or copied
        from ..models import Comment, Post
        if notif.type == "system_broadcast":
            content_preview = notif.content if notif.content else "System Announcement"
        elif notif.comment_id:
            comment = session.get(Comment, notif.comment_id)
            if comment: content_preview = comment.content[:75]
        elif notif.post_id:
            post = session.get(Post, notif.post_id)
            if post: content_preview = post.content[:75]

        response_data.append(
            NotificationRead(
                id=notif.id, actor_username=notif.actor_username, actor_avatar_url=actor.avatar_url if actor else None,
                actor_role=actor.role if actor else "user",
                actor_plan=actor.plan if actor else "Free",
                type=notif.type, content_preview=content_preview, post_id=notif.post_id,
                community_id=notif.community_id, is_read=notif.is_read, created_at=notif.created_at
            )
        )
    return response_data

@router.get("/api/notifications/unread_count", response_model=dict)
async def get_unread_notification_count(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    results = session.exec(select(Notification).where(Notification.user_id == user.id, Notification.is_read == False)).all()
    return {"count": len(results)}

@router.post("/api/notifications/mark_as_read")
async def mark_notifications_as_read(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    notifications = session.exec(select(Notification).where(Notification.user_id == user.id, Notification.is_read == False)).all()
    for notif in notifications:
        notif.is_read = True
        session.add(notif)
    session.commit()
    return {"status": "success"}
