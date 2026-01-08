from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from ..database import get_session
from ..models import User, UserRead, AdminUserUpdate, Feedback, PostResponse, Post, Report, BroadcastRequest, Notification
from ..dependencies import get_current_admin_user

router = APIRouter()

@router.get("/api/admin/users", response_model=list[UserRead])
async def get_all_users(user: User = Depends(get_current_admin_user), session: Session = Depends(get_session)):
    return session.exec(select(User)).all()

@router.get("/api/admin/feedbacks", response_model=list[Feedback])
async def get_all_feedbacks(user: User = Depends(get_current_admin_user), session: Session = Depends(get_session)):
    return session.exec(select(Feedback).order_by(Feedback.created_at.desc())).all()

@router.get("/api/admin/posts", response_model=list[PostResponse])
async def get_admin_posts(user: User = Depends(get_current_admin_user), session: Session = Depends(get_session)):
    posts = session.exec(select(Post).order_by(Post.created_at.desc())).all()
    if not posts:
        return []
    
    usernames = {p.username for p in posts}
    users = session.exec(select(User).where(User.username.in_(usernames))).all()
    user_map = {u.username: u for u in users}

    results = []
    for post in posts:
        user = user_map.get(post.username)
        post_dict = post.dict()
        post_dict['user_role'] = user.role if user else "user"
        post_dict['user_plan'] = user.plan if user else "Free"
        post_dict['user_avatar_url'] = user.avatar_url if user else None
        if 'user_reaction' not in post_dict:
            post_dict['user_reaction'] = None
        results.append(PostResponse(**post_dict))
    return results

@router.post("/api/admin/broadcast")
async def broadcast_message(request: BroadcastRequest, user: User = Depends(get_current_admin_user), session: Session = Depends(get_session)):
    users = session.exec(select(User)).all()
    count = 0
    for u in users:
        if u.id == user.id: continue
        
        notif = Notification(
            user_id=u.id, 
            actor_username="System", 
            type="system_broadcast", 
            content=request.message,
            post_id=None, 
            community_id=None)
        session.add(notif)
        count += 1
    session.commit()
    return {"status": "success", "count": count}

@router.put("/api/admin/users/{user_id}", response_model=UserRead)
async def admin_update_user(
    user_id: int, 
    user_update: AdminUserUpdate, 
    admin_user: User = Depends(get_current_admin_user), 
    session: Session = Depends(get_session)
):
    user_to_update = session.get(User, user_id)
    if not user_to_update:
        raise HTTPException(status_code=404, detail="User not found")

    user_data = user_update.model_dump(exclude_unset=True)
    for key, value in user_data.items():
        setattr(user_to_update, key, value)
    
    session.add(user_to_update)
    session.commit()
    session.refresh(user_to_update)
    return user_to_update

@router.delete("/api/admin/feedbacks/{feedback_id}")
async def delete_feedback(feedback_id: int, user: User = Depends(get_current_admin_user), session: Session = Depends(get_session)):
    feedback = session.get(Feedback, feedback_id)
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    session.delete(feedback)
    session.commit()
    return {"status": "success"}

@router.get("/api/admin/reports", response_model=list[Report])
async def get_admin_reports(user: User = Depends(get_current_admin_user), session: Session = Depends(get_session)):
    return session.exec(select(Report).order_by(Report.created_at.desc())).all()

@router.delete("/api/admin/reports/{report_id}")
async def delete_report(report_id: int, user: User = Depends(get_current_admin_user), session: Session = Depends(get_session)):
    report = session.get(Report, report_id)
    if report:
        session.delete(report)
        session.commit()
    return {"status": "success"}
