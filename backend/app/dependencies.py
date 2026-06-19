from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import select, Session
from datetime import datetime
from .database import get_session
from .models import User, Tenant
from .auth import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/token")

async def get_current_user(token: str = Depends(oauth2_scheme), session: Session = Depends(get_session)):
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    subject: str = payload.get("sub")
    if subject is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    # Look up user by ID (preferred — faster index lookup) or username
    if subject.isdigit():
        user = session.exec(select(User).where(User.id == int(subject))).first()
    else:
        user = session.exec(select(User).where(User.username == subject)).first()

    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    # Read tenant_id from the JWT payload — avoids a second DB query on every request.
    # The tenant_id is embedded in the token at login and cannot be tampered with
    # because the token is signed with SECRET_KEY.
    token_tenant_id = payload.get("tenant_id")
    if token_tenant_id is None or user.tenant_id != token_tenant_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant mismatch")

    # Auto-downgrade expired paid plans.
    # Only triggers a DB write when the plan is actually expired, not on every request.
    if user.plan != "Free" and user.plan_expires_at and user.plan_expires_at < datetime.utcnow():
        user.plan = "Free"
        user.plan_billing_cycle = None
        session.add(user)
        session.commit()
        session.refresh(user)

    return user


async def get_current_admin_user(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin privileges required")
    return current_user


async def get_current_active_user(current_user: User = Depends(get_current_user)):
    if current_user.status != "active":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is not active.")
    return current_user


async def get_current_tenant(token: str = Depends(oauth2_scheme), session: Session = Depends(get_session)):
    """Get the current tenant from the JWT token.
    Reads tenant_id directly from the token payload — no extra DB query needed.
    Falls back to DB lookup only if the tenant_id is missing from the token.
    """
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    tenant_id: int = payload.get("tenant_id")
    if tenant_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token - no tenant_id")
    tenant = session.exec(select(Tenant).where(Tenant.id == tenant_id, Tenant.is_active == True)).first()
    if not tenant:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant not active or not found")
    return tenant
