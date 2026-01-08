import re
from typing import Optional
from sqlmodel import select, Session
from .models import User, Notification

async def process_mentions_and_create_notifications(
    session: Session,
    content: str,
    author_user: User,
    post_id: int,
    community_id: Optional[int],
    notified_user_ids: set,
    comment_id: Optional[int] = None
):
    mentioned_usernames = set(re.findall(r'@(\w+)', content))
    for username in mentioned_usernames:
        if username == author_user.username:
            continue
        
        mentioned_user = session.exec(select(User).where(User.username == username)).first()
        if mentioned_user and mentioned_user.id not in notified_user_ids:
            notif_type = "mention_comment" if comment_id else "mention_post"
            notification = Notification(
                user_id=mentioned_user.id, actor_username=author_user.username, type=notif_type,
                post_id=post_id, comment_id=comment_id, community_id=community_id
            )
            session.add(notification)
            notified_user_ids.add(mentioned_user.id)
