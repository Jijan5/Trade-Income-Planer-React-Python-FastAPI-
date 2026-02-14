import os
import uuid
import shutil
import aiofiles
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, File, Form, UploadFile, status
from sqlmodel import Session, select, SQLModel
from sqlalchemy import text
from ..database import get_session
from ..models import (Post, PostCreate, PostResponse, Comment, CommentCreate, CommentResponse, Reaction, ReactionCreate, Notification, User, Report)
from ..dependencies import get_current_user, get_current_active_user
from ..utils import process_mentions_and_create_notifications

router = APIRouter()

class NotificationSelfCreate(SQLModel):
    message: str
    type: str = "system_broadcast"
    
class AppealCreate(SQLModel):
    message: str

@router.get("/api/posts", response_model=list[PostResponse])
async def get_all_posts(session: Session = Depends(get_session), skip: int = 0, limit: int = 10, current_user: User = Depends(get_current_user)):
    query = (
        select(Post, User)
        .join(User, Post.username == User.username)
        .where(Post.tenant_id == current_user.tenant_id)
        .order_by(Post.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    results = session.exec(query).all()
    
    # Fetch reactions for these posts by the current user
    post_ids = [post.id for post, _ in results]
    user_reactions = {}
    if post_ids:
        reactions = session.exec(
            select(Reaction).where(
                Reaction.username == current_user.username,
                Reaction.post_id.in_(post_ids)
            )
        ).all()
        user_reactions = {r.post_id: r.type for r in reactions}

    response_list = []
    for post, user in results:
        post_dict = post.dict()
        post_dict['user_role'] = user.role
        post_dict['user_plan'] = user.plan
        post_dict['user_avatar_url'] = user.avatar_url
        post_dict['user_reaction'] = user_reactions.get(post.id)
        response_list.append(PostResponse(**post_dict))
    return response_list

@router.get("/api/posts/{post_id}", response_model=PostResponse)
async def get_post(post_id: int, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    post = session.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    user = session.exec(select(User).where(User.username == post.username, User.tenant_id == current_user.tenant_id)).first()
    
    reaction = session.exec(select(Reaction).where(Reaction.post_id == post_id, Reaction.username == current_user.username)).first()
    
    post_dict = post.dict()
    post_dict['user_role'] = user.role if user else "user"
    post_dict['user_plan'] = user.plan if user else "Free"
    post_dict['user_avatar_url'] = user.avatar_url if user else None
    post_dict['user_reaction'] = reaction.type if reaction else None

    return PostResponse(**post_dict)

@router.post("/api/posts", response_model=Post)
async def create_post(
    content: str = Form(...),
    community_id: Optional[int] = Form(None),
    link_url: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    try:
        image_url_to_save = None
        if image:
            os.makedirs("static/images", exist_ok=True)
            filename = f"{uuid.uuid4()}-{image.filename}"
            file_path = os.path.join("static/images", filename)
            async with aiofiles.open(file_path, "wb") as buffer:
                contents = await image.read()
                await buffer.write(contents)
            
            # Set the URL to be saved in the database
            image_url_to_save = f"/static/images/{filename}"
        # Create the Post object
            
        db_post = Post(
            community_id=community_id,
            username=user.username,
            content=content,
            image_url=image_url_to_save,
            link_url=link_url,
            tenant_id=user.tenant_id  # Ensure tenant_id is set
        )
        session.add(db_post)
        session.commit()
        session.refresh(db_post)

        await process_mentions_and_create_notifications(
            session=session, content=content, author_user=user, post_id=db_post.id,
            community_id=community_id, notified_user_ids=set()
        )
        session.refresh(db_post) # Refresh again to get any updates from notifications
        # Prepare the response
        post_dict = db_post.dict()
        post_dict['tenant_id'] = db_post.tenant_id # Add tenant_id to the response
        post_dict['user_role'] = user.role
        post_dict['user_plan'] = user.plan
        post_dict['user_avatar_url'] = user.avatar_url
        post_dict['user_reaction'] = None # No reaction on creation
        
        return PostResponse(**post_dict)
    except Exception as e:
        session.rollback()
         # Log the error for debugging
        print(f"Error creating post: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/posts/{post_id}/comments", response_model=list[CommentResponse])
async def get_post_comments(post_id: int, session: Session = Depends(get_session)):
    comments = session.exec(select(Comment).where(Comment.post_id == post_id).order_by(Comment.created_at.asc())).all()
    if not comments:
        return []

    usernames = {c.username for c in comments}
    # Assuming all comments on a post belong to the same tenant as the post/current_user
    post = session.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    users = session.exec(select(User).where(User.username.in_(usernames), User.tenant_id == post.tenant_id)).all()
    user_map = {u.username: u for u in users}

    results = []
    for comment in comments:
        user = user_map.get(comment.username)
        comment_dict = comment.dict()
        comment_dict['user_role'] = user.role if user else "user"
        comment_dict['user_plan'] = user.plan if user else "Free"
        comment_dict['user_avatar_url'] = user.avatar_url if user else None
        results.append(CommentResponse(**comment_dict))
    return results

@router.post("/api/posts/{post_id}/comments", response_model=CommentResponse)
async def create_comment(post_id: int, comment: CommentCreate, user: User = Depends(get_current_active_user), session: Session = Depends(get_session)):
    try:
        post = session.get(Post, post_id)
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        db_comment = Comment(post_id=post_id, username=user.username, content=comment.content, parent_id=comment.parent_id, tenant_id=user.tenant_id)
        session.add(db_comment)
        session.commit()
        session.refresh(db_comment)
        
        if post:
            post.comments_count += 1
            session.add(post)
            
        notified_user_ids = set()
        await process_mentions_and_create_notifications(
            session=session, content=comment.content, author_user=user, post_id=post_id,
            community_id=post.community_id, notified_user_ids=notified_user_ids, comment_id=db_comment.id
        )

        if comment.parent_id:
            parent_comment = session.exec(select(Comment).where(Comment.id == comment.parent_id, Comment.tenant_id == user.tenant_id)).first()
            if parent_comment:
                parent_owner = session.exec(select(User).where(User.username == parent_comment.username, User.tenant_id == user.tenant_id)).first()
                if parent_owner and parent_owner.id != user.id and parent_owner.id not in notified_user_ids:
                    reply_notif = Notification(user_id=parent_owner.id, actor_username=user.username, type='reply_comment', post_id=post_id, comment_id=db_comment.id, community_id=post.community_id, tenant_id=user.tenant_id)
                    session.add(reply_notif)
                    notified_user_ids.add(parent_owner.id)
        else:
            post_owner = session.exec(select(User).where(User.username == post.username, User.tenant_id == user.tenant_id)).first()
            if post_owner and post_owner.id != user.id and post_owner.id not in notified_user_ids:
                reply_notif = Notification(user_id=post_owner.id, actor_username=user.username, type='reply_post', post_id=post_id, comment_id=db_comment.id, community_id=post.community_id, tenant_id=user.tenant_id)
                session.add(reply_notif)
                notified_user_ids.add(post_owner.id)
            
        session.commit()
        session.refresh(db_comment)
        
        comment_dict = db_comment.dict()
        comment_dict['user_role'] = user.role
        comment_dict['user_plan'] = user.plan
        comment_dict['user_avatar_url'] = user.avatar_url
        return CommentResponse(**comment_dict)
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/posts/{post_id}/react")
async def react_to_post(post_id: int, reaction: ReactionCreate, user: User = Depends(get_current_active_user), session: Session = Depends(get_session)):
    existing_reaction = session.exec(select(Reaction).where(Reaction.post_id == post_id, Reaction.username == user.username)).first()
    post = session.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    if existing_reaction:
        if existing_reaction.type == reaction.type:
            session.delete(existing_reaction)
            post.likes -= 1
        else:
            existing_reaction.type = reaction.type
            session.add(existing_reaction)
    else:
        new_reaction = Reaction(post_id=post_id, username=user.username, type=reaction.type, tenant_id=user.tenant_id)
        session.add(new_reaction)
        post.likes += 1
        post_owner = session.exec(select(User).where(User.username == post.username, User.tenant_id == user.tenant_id)).first()
        if post_owner and post_owner.id != user.id:
            notif = Notification(
                user_id=post_owner.id, actor_username=user.username, type='react_post',
                post_id=post_id, community_id=post.community_id, tenant_id=user.tenant_id
            )
            session.add(notif)
    session.add(post)
    session.commit()
    return {"status": "success"}

@router.delete("/api/posts/{post_id}/react", status_code=status.HTTP_204_NO_CONTENT)
async def delete_reaction(post_id: int, user: User = Depends(get_current_active_user), session: Session = Depends(get_session)):
    post = session.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    reaction = session.exec(select(Reaction).where(Reaction.post_id == post_id, Reaction.username == user.username)).first()
    if reaction:
        session.delete(reaction)
        post.likes = max(0, post.likes - 1)
        session.add(post)
        session.commit()
    return

@router.post("/api/posts/{post_id}/share")
async def share_post(post_id: int, session: Session = Depends(get_session)):
    post = session.get(Post, post_id)
    if post:
        post.shares_count += 1
        session.add(post)
        session.commit()
    return {"status": "success"}

@router.put("/api/posts/{post_id}", response_model=Post)
async def update_post(post_id: int, post_data: PostCreate, user: User = Depends(get_current_active_user), session: Session = Depends(get_session)):
    post = session.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.username != user.username and user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to edit this post")
    
    post.content = post_data.content
    post.image_url = post_data.image_url
    post.link_url = post_data.link_url
    post.is_edited = True
    session.add(post)
    session.commit()
    session.refresh(post)
    return post

@router.delete("/api/posts/{post_id}")
async def delete_post(post_id: int, user: User = Depends(get_current_active_user), session: Session = Depends(get_session)):
    post = session.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.username != user.username and user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this post")
    
    # 1. Delete Reports associated with the post
    reports = session.exec(select(Report).where(Report.post_id == post_id)).all()
    for r in reports: session.delete(r)

    # 2. Delete Reports & Notifications associated with comments of the post
    comments = session.exec(select(Comment).where(Comment.post_id == post_id)).all()
    comment_ids = [c.id for c in comments]
    if comment_ids:
        comment_reports = session.exec(select(Report).where(Report.comment_id.in_(comment_ids))).all()
        for r in comment_reports: session.delete(r)
        comment_notifs = session.exec(select(Notification).where(Notification.comment_id.in_(comment_ids))).all()
        for n in comment_notifs: session.delete(n)
    
    notifications = session.exec(select(Notification).where(Notification.post_id == post_id)).all()
    for n in notifications: session.delete(n)

    reactions = session.exec(select(Reaction).where(Reaction.post_id == post_id)).all()
    for r in reactions: session.delete(r)
    
    session.commit()
    session.exec(text("DELETE FROM comment WHERE post_id = :post_id ORDER BY id DESC"), params={"post_id": post_id})
    session.delete(post)
    session.commit()
    return {"status": "success"}

@router.put("/api/comments/{comment_id}", response_model=Comment)
async def update_comment(comment_id: int, comment_data: CommentCreate, user: User = Depends(get_current_active_user), session: Session = Depends(get_session)):
    comment = session.get(Comment, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.username != user.username and user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to edit this comment")
    
    comment.content = comment_data.content
    comment.is_edited = True
    session.add(comment)
    session.commit()
    session.refresh(comment)
    return comment

@router.delete("/api/comments/{comment_id}")
async def delete_comment(comment_id: int, user: User = Depends(get_current_active_user), session: Session = Depends(get_session)):
    comment = session.get(Comment, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.username != user.username and user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this comment")
    
    # Delete reports associated with the comment
    reports = session.exec(select(Report).where(Report.comment_id == comment_id)).all()
    for r in reports: session.delete(r)

    # Delete notifications associated with the comment
    notifications = session.exec(select(Notification).where(Notification.comment_id == comment_id)).all()
    for n in notifications: session.delete(n)
    
    post = session.get(Post, comment.post_id)
    if post:
        post.comments_count = max(0, post.comments_count - 1)
        session.add(post)

    session.delete(comment)
    session.commit()
    return {"status": "success"}

@router.post("/api/notifications/self")
async def create_self_notification(notif_data: NotificationSelfCreate, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    notif = Notification(
        user_id=user.id,
        actor_username="System",
        type=notif_data.type,
        content_preview=notif_data.message,
        tenant_id=user.tenant_id,
        post_id=None,
        comment_id=None,
        community_id=None
    )
    session.add(notif)
    session.commit()
    return {"status": "success"}

@router.post("/api/users/me/appeal")
async def submit_appeal(appeal_data: AppealCreate, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    if user.status != 'suspended':
        raise HTTPException(status_code=400, detail="Only suspended users can appeal.")
    
    user.appeal_message = appeal_data.message
    user.appeal_status = "pending"
    session.add(user)
    session.commit()
    return {"status": "success", "detail": "Appeal submitted successfully."}