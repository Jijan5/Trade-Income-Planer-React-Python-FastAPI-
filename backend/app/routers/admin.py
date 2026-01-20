from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, SQLModel
from ..database import get_session
from ..dependencies import get_current_admin_user, get_current_user
from ..models import User, UserRead, AdminUserUpdate, Feedback, PostResponse, Post, Report, BroadcastRequest, Notification, UserUpdateAdmin

router = APIRouter(prefix="/api/admin", tags=["Admin"])

@router.get("/users", response_model=list[UserRead])
async def get_all_users(user: User = Depends(get_current_admin_user), session: Session = Depends(get_session)):
    return session.exec(select(User)).all()

@router.get("/stats")
async def get_dashboard_stats(user: User = Depends(get_current_admin_user), session: Session = Depends(get_session)):
    users = session.exec(select(User)).all()
    
    total_users = len(users)
    active_subs = len([u for u in users if u.plan != "Free"])
    
    # Calculate MRR (Monthly Recurring Revenue) based on active plans
    plan_prices = {"Basic": 12, "Premium": 19, "Platinum": 28, "Free": 0}
    mrr = sum(plan_prices.get(u.plan, 0) for u in users)
    
    # Subscription Distribution
    dist_map = {"Basic": 0, "Premium": 0, "Platinum": 0}
    for u in users:
        if u.plan in dist_map:
            dist_map[u.plan] += 1
            
    subs_distribution = [
        {"name": k, "value": v} for k, v in dist_map.items() if v > 0
    ]
    
    # User Growth (Simple grouping by month based on created_at)
    # Note: Assuming User model has created_at, otherwise fallback to now
    growth_map = {}
    for u in users:
        # Use created_at if available, else fallback
        joined_date = getattr(u, "created_at", datetime.now())
        if isinstance(joined_date, str):
            try:
                joined_date = datetime.fromisoformat(joined_date)
            except:
                joined_date = datetime.now()
        
        month_key = joined_date.strftime("%b") # e.g., "Jan", "Feb"
        growth_map[month_key] = growth_map.get(month_key, 0) + 1
        
    user_growth = [{"name": k, "users": v} for k, v in growth_map.items()]

    return {
        "totalUsers": total_users,
        "activeSubs": active_subs,
        "mrr": mrr,
        "userGrowth": user_growth,
        "subsDistribution": subs_distribution
    }

@router.get("/subscriptions")
async def get_admin_subscriptions(user: User = Depends(get_current_admin_user), session: Session = Depends(get_session)):
    # Generate subscription list from users with paid plans
    # In a real app with payment gateway, this would query a 'Transaction' table
    users = session.exec(select(User).where(User.plan != "Free")).all()
    plan_prices = {"Basic": 12, "Premium": 19, "Platinum": 28}
    
    return [{
        "id": f"SUB-{u.id}", "user": u.username, "plan": u.plan, 
        "amount": plan_prices.get(u.plan, 0), "status": "paid", 
        "date": getattr(u, "created_at", datetime.now()), "billing": "Monthly"
    } for u in users]

@router.get("/feedbacks", response_model=list[Feedback])
async def get_all_feedbacks(user: User = Depends(get_current_admin_user), session: Session = Depends(get_session)):
    return session.exec(select(Feedback).order_by(Feedback.created_at.desc())).all()

@router.get("/posts", response_model=list[PostResponse])
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

@router.post("/broadcast")
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

@router.delete("/feedbacks/{feedback_id}")
async def delete_feedback(feedback_id: int, user: User = Depends(get_current_admin_user), session: Session = Depends(get_session)):
    feedback = session.get(Feedback, feedback_id)
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    session.delete(feedback)
    session.commit()
    return {"status": "success"}

@router.get("/reports", response_model=list[Report])
async def get_admin_reports(user: User = Depends(get_current_admin_user), session: Session = Depends(get_session)):
    return session.exec(select(Report).order_by(Report.created_at.desc())).all()

@router.delete("/reports/{report_id}")
async def delete_report(report_id: int, user: User = Depends(get_current_admin_user), session: Session = Depends(get_session)):
    report = session.get(Report, report_id)
    if report:
        session.delete(report)
        session.commit()
    return {"status": "success"}

@router.put("/users/{user_id}", response_model=User)
async def update_user_by_admin(user_id: int, user_data: UserUpdateAdmin, admin: User = Depends(get_current_user), session: Session = Depends(get_session)):
    if admin.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    db_user = session.get(User, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = user_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_user, key, value)

    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user