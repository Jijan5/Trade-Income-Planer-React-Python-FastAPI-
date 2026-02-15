import os
import uuid
import shutil
import aiofiles
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, File, Form, UploadFile
from sqlmodel import Session, select
from sqlalchemy import text
from ..database import get_session
from ..models import Community, CommunityCreate, CommunityMember, CommunityMemberRead, Post, PostResponse, User, Comment, Reaction, Notification, Report
from ..dependencies import get_current_user, get_current_active_user

router = APIRouter()

@router.get("/api/communities", response_model=list[Community])
async def get_communities(session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    communities = session.exec(select(Community).where(Community.tenant_id == user.tenant_id)).all()
    # Return communities with their stored URLs - frontend will handle URL construction
    return communities

@router.get("/api/communities/{community_id}/members", response_model=list[CommunityMemberRead])
async def get_community_members(community_id: int, user: User = Depends(get_current_active_user), session: Session = Depends(get_session)):
    community = session.get(Community, community_id)
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")
    
    # Ensure the user is either the creator OR a member
    member = session.exec(select(CommunityMember).where(CommunityMember.community_id == community_id, CommunityMember.user_id == user.id)).first()
    if community.creator_username != user.username and not member and user.role != "admin":
        raise HTTPException(status_code=403, detail="Unauthorized: Must be creator or member to view member list")

    members = session.exec(
        select(CommunityMember, User)
        .join(User, CommunityMember.user_id == User.id)
        .where(CommunityMember.community_id == community_id, User.tenant_id == user.tenant_id)
    ).all()

    return [
        CommunityMemberRead(
            user_id=member.User.id, username=member.User.username, avatar_url=member.User.avatar_url, joined_at=member.CommunityMember.joined_at
        ) for member in members
    ]

@router.post("/api/communities/{community_id}/join")
async def join_community(community_id: int, user: User = Depends(get_current_active_user), session: Session = Depends(get_session)):
    if user.role == "admin":
        return {"status": "success", "message": "Admin access"}
    
    comm = session.get(Community, community_id)
    if not comm:
        raise HTTPException(status_code=404, detail="Community not found")
    
    existing = session.exec(select(CommunityMember).where(CommunityMember.community_id == community_id, CommunityMember.user_id == user.id)).first()
    if existing:
        return {"status": "already_joined"}
    
    member = CommunityMember(community_id=community_id, user_id=user.id)
    session.add(member)
    
    comm.members_count += 1
    session.add(comm)
    
    session.commit()
    return {"status": "success"}

@router.post("/api/communities/{community_id}/leave")
async def leave_community(community_id: int, user: User = Depends(get_current_active_user), session: Session = Depends(get_session)):
    if user.role == "admin":
        return {"status": "success", "message": "Admin access"}
    
    comm = session.get(Community, community_id)
    if not comm:
        raise HTTPException(status_code=404, detail="Community not found")

    if comm.creator_username == user.username:
        raise HTTPException(status_code=403, detail="Creators cannot leave their own community.")
    member = session.exec(select(CommunityMember).where(CommunityMember.community_id == community_id, CommunityMember.user_id == user.id)).first()
    if not member:
        raise HTTPException(status_code=400, detail="Not a member")
    
    session.delete(member)
    if comm and comm.members_count > 0:
        comm.members_count -= 1
        session.add(comm)
        
    session.commit()
    return {"status": "success"}

@router.delete("/api/communities/{community_id}/members/{username_to_kick}")
async def kick_community_member(community_id: int, username_to_kick: str, user: User = Depends(get_current_active_user), session: Session = Depends(get_session)):
    community = session.get(Community, community_id)
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")

    if community.creator_username != user.username:
        raise HTTPException(status_code=403, detail="Only the creator can kick members.")

    if community.creator_username == username_to_kick:
        raise HTTPException(status_code=400, detail="Creator cannot be kicked.")

    user_to_kick = session.exec(select(User).where(User.username == username_to_kick, User.tenant_id == user.tenant_id)).first()
    if not user_to_kick:
        raise HTTPException(status_code=404, detail="User to kick not found.")

    member_record = session.exec(select(CommunityMember).where(CommunityMember.community_id == community_id, CommunityMember.user_id == user_to_kick.id)).first()
    if not member_record:
        raise HTTPException(status_code=404, detail="User is not a member of this community.")

    session.delete(member_record)
    if community.members_count > 0:
        community.members_count -= 1
        session.add(community)
    
    # Notify the kicked user
    notif = Notification(
        user_id=user_to_kick.id,
        actor_username=user.username,
        type="system_broadcast",
        content=f"You have been kicked from the community '{community.name}'.",
        community_id=community_id,
        tenant_id=user.tenant_id
    )
    session.add(notif)
    session.commit()
    return {"status": "success"}

@router.post("/api/communities", response_model=Community)
async def create_community(
    name: str = Form(...),
    description: str = Form(...),
    bg_type: str = Form("color"),
    bg_value: str = Form("#1f2937"),
    text_color: str = Form("#ffffff"),
    font_family: str = Form("sans"),
    hover_animation: str = Form("none"),
    hover_color: str = Form("#3b82f6"),
    avatar_file: Optional[UploadFile] = File(None),
    bg_image_file: Optional[UploadFile] = File(None),
    user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    avatar_url = None
    if avatar_file:
        os.makedirs("static/avatars", exist_ok=True)
        filename = f"comm_av_{uuid.uuid4()}_{avatar_file.filename}"
        file_path = os.path.join("static/avatars", filename)
        async with aiofiles.open(file_path, "wb") as buffer:
            contents = await avatar_file.read()
            await buffer.write(contents)
        avatar_url = f"/static/avatars/{filename}"

    final_bg_value = bg_value
    if bg_type == "image" and bg_image_file:
        os.makedirs("static/backgrounds", exist_ok=True)
        filename = f"comm_bg_{uuid.uuid4()}_{bg_image_file.filename}"
        file_path = os.path.join("static/backgrounds", filename)
        async with aiofiles.open(file_path, "wb") as buffer:
            contents = await bg_image_file.read()
            await buffer.write(contents)
        final_bg_value = f"/static/backgrounds/{filename}"

    db_community = Community(
        name=name,
        description=description,
        creator_username=user.username,
        avatar_url=avatar_url,
        bg_type=bg_type,
        bg_value=final_bg_value,
        text_color=text_color,
        font_family=font_family,
        hover_animation=hover_animation,
        hover_color=hover_color,
        members_count=1,
        active_count=1,
        tenant_id = user.tenant_id
    )
    
    session.add(db_community)
    session.commit()
    session.refresh(db_community)
    # Automatically add creator as a member
    member = CommunityMember(community_id=db_community.id, user_id=user.id, tenant_id=user.tenant_id)
    session.add(member)
    session.commit()
    return db_community

@router.put("/api/communities/{community_id}", response_model=Community)
async def update_community(
    community_id: int,
    name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    bg_type: Optional[str] = Form(None),
    bg_value: Optional[str] = Form(None),
    text_color: Optional[str] = Form(None),
    font_family: Optional[str] = Form(None),
    hover_animation: Optional[str] = Form(None),
    hover_color: Optional[str] = Form(None),
    avatar_file: Optional[UploadFile] = File(None),
    bg_image_file: Optional[UploadFile] = File(None),
    user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    community = session.get(Community, community_id)
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")
    if community.creator_username != user.username:
        raise HTTPException(status_code=403, detail="Not authorized")

    if name: community.name = name
    if description: community.description = description
    if bg_type: community.bg_type = bg_type
    if text_color: community.text_color = text_color
    if font_family: community.font_family = font_family
    if hover_animation: community.hover_animation = hover_animation
    if hover_color: community.hover_color = hover_color

    if avatar_file:
        os.makedirs("static/avatars", exist_ok=True)
        filename = f"comm_av_{uuid.uuid4()}_{avatar_file.filename}"
        file_path = os.path.join("static/avatars", filename)
        async with aiofiles.open(file_path, "wb") as buffer:
            contents = await avatar_file.read()
            buffer.write(contents)
        community.avatar_url = f"/static/avatars/{filename}"

    if bg_type == "image" and bg_image_file:
        os.makedirs("static/backgrounds", exist_ok=True)
        filename = f"comm_bg_{uuid.uuid4()}_{bg_image_file.filename}"
        file_path = os.path.join("static/backgrounds", filename)
        async with aiofiles.open(file_path, "wb") as buffer:
            contents = await bg_image_file.read()
            buffer.write(contents)
        community.bg_value = f"/static/backgrounds/{filename}"
    elif bg_value:
        community.bg_value = bg_value

    session.add(community)
    session.commit()
    session.refresh(community)
    return community

@router.delete("/api/communities/{community_id}")
async def delete_community(community_id: int, user: User = Depends(get_current_active_user), session: Session = Depends(get_session)):
    community = session.get(Community, community_id)
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")
    
    if community.creator_username != user.username and user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this community")

    post_ids = session.exec(select(Post.id).where(Post.community_id == community_id)).all()

    if post_ids:
        comment_ids = session.exec(select(Comment.id).where(Comment.post_id.in_(post_ids))).all()
        session.exec(text("DELETE FROM notification WHERE post_id IN :pids"), params={"pids": post_ids})
        if comment_ids:
             session.exec(text("DELETE FROM notification WHERE comment_id IN :cids"), params={"cids": comment_ids})
             session.exec(text("DELETE FROM report WHERE comment_id IN :cids"), params={"cids": comment_ids})

        session.exec(text("DELETE FROM report WHERE post_id IN :pids"), params={"pids": post_ids})
        session.exec(text("DELETE FROM reaction WHERE post_id IN :pids"), params={"pids": post_ids})
        session.exec(text("DELETE FROM comment WHERE post_id IN :pids"), params={"pids": post_ids})
        session.exec(text("DELETE FROM post WHERE id IN :pids"), params={"pids": post_ids})

    session.exec(text("DELETE FROM communitymember WHERE community_id = :cid"), params={"cid": community_id})
    session.exec(text("DELETE FROM notification WHERE community_id = :cid"), params={"cid": community_id})
    session.delete(community)
    session.commit()
    return {"status": "success"}
  
@router.get("/api/communities/{community_id}/posts", response_model=list[PostResponse])
async def get_community_posts(community_id: int, session: Session = Depends(get_session)):
    posts = session.exec(select(Post).where(Post.community_id == community_id).order_by(Post.created_at.desc())).all()
    if not posts:
        return []

    # Assuming all posts in a community belong to the same tenant
    community = session.get(Community, community_id)
    if not community:
        # This case should ideally not happen if posts exist for the community_id
        raise HTTPException(status_code=404, detail="Community not found")

    usernames = {p.username for p in posts}
    users = session.exec(select(User).where(User.username.in_(usernames), User.tenant_id == community.tenant_id)).all()
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

@router.post("/api/communities/{community_id}/posts", response_model=Post)
async def create_community_post(community_id: int, content: str = Form(...), link_url: Optional[str] = Form(None), image_file: Optional[UploadFile] = File(None), user: User = Depends(get_current_active_user), session: Session = Depends(get_session)):
    try:
        image_url_to_save = None
        if image_file:
            os.makedirs("static/images", exist_ok=True)
            filename = f"{uuid.uuid4()}-{image_file.filename}"
            file_path = os.path.join("static/images", filename)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(image_file.file, buffer)
            image_url_to_save = f"/static/images/{filename}"
            
        db_post = Post(
            community_id=community_id, 
            username=user.username, 
            content=content,
            image_url=image_url_to_save,
            link_url=link_url
        )
        db_post.tenant_id = user.tenant_id
        session.add(db_post)
        session.commit()
        session.refresh(db_post)
        return db_post
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=str(e))