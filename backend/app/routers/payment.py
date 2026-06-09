import os
import hmac
import hashlib
import json
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Request, Header
import httpx
from pydantic import BaseModel
from dotenv import load_dotenv
from sqlmodel import Session, select
from ..database import get_session
from ..dependencies import get_current_user
from ..models import User

load_dotenv()

router = APIRouter()

# Strip surrounding quotes if accidentally included in .env values
LEMONSQUEEZY_API_KEY = os.getenv("LEMONSQUEEZY_API_KEY", "").strip('"').strip("'")
LEMONSQUEEZY_STORE_ID = os.getenv("LEMONSQUEEZY_STORE_ID", "").strip('"').strip("'")
LEMONSQUEEZY_WEBHOOK_SECRET = os.getenv("LEMONSQUEEZY_WEBHOOK_SECRET", "").strip('"').strip("'")

# LemonSqueezy Variant IDs mapping based on user input
VARIANT_IDS = {
    "basic": {
        "monthly": "1602482",
        "yearly": "1602632"
    },
    "premium": {
        "monthly": "1602546",
        "yearly": "1602644"
    },
    "platinum": {
        "monthly": "1602552",
        "yearly": "1602641"
    }
}

class PaymentRequest(BaseModel):
    plan_id: str
    amount: float
    billing_cycle: str

@router.post("/api/payment/create_transaction")
async def create_transaction(req: PaymentRequest, current_user=Depends(get_current_user)):
    try:
        plan_key = req.plan_id.lower()
        cycle_key = req.billing_cycle.lower()

        if plan_key not in VARIANT_IDS or cycle_key not in VARIANT_IDS[plan_key]:
            raise HTTPException(status_code=400, detail="Invalid plan or billing cycle")

        variant_id = VARIANT_IDS[plan_key][cycle_key]

        headers = {
            "Accept": "application/vnd.api+json",
            "Content-Type": "application/vnd.api+json",
            "Authorization": f"Bearer {LEMONSQUEEZY_API_KEY}"
        }

        payload = {
            "data": {
                "type": "checkouts",
                "attributes": {
                    "checkout_data": {
                        "custom": {
                            "user_id": str(current_user.id),
                            "plan_id": plan_key,
                            "billing_cycle": cycle_key
                        }
                    }
                },
                "relationships": {
                    "store": {
                        "data": {
                            "type": "stores",
                            "id": str(LEMONSQUEEZY_STORE_ID)
                        }
                    },
                    "variant": {
                        "data": {
                            "type": "variants",
                            "id": variant_id
                        }
                    }
                }
            }
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.lemonsqueezy.com/v1/checkouts",
                headers=headers,
                json=payload
            )
            
            if response.status_code not in [200, 201]:
                print(f"LemonSqueezy Error: {response.text}")
                raise HTTPException(status_code=500, detail="Failed to create checkout session")
                
            data = response.json()
            checkout_url = data["data"]["attributes"]["url"]

        return {"checkout_url": checkout_url}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Checkout Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to process payment")


@router.post("/api/payment/webhook")
async def verify_payment(
    request: Request, 
    x_signature: str = Header(None), 
    session: Session = Depends(get_session)
):
    """
    Webhook endpoint to receive events from LemonSqueezy
    """
    if not LEMONSQUEEZY_WEBHOOK_SECRET:
        print("Webhook Error: LEMONSQUEEZY_WEBHOOK_SECRET is not configured")
        raise HTTPException(status_code=500, detail="Webhook secret not configured")

    if not x_signature:
        print("Webhook Error: Missing X-Signature header")
        raise HTTPException(status_code=400, detail="Missing signature header")

    # Get raw body for HMAC verification
    raw_body = await request.body()
    
    # Verify the HMAC-SHA256 signature
    mac = hmac.new(
        LEMONSQUEEZY_WEBHOOK_SECRET.encode('utf-8'),
        raw_body,
        hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(mac, x_signature):
        print(f"Webhook signature mismatch. Got: {x_signature}, Expected: {mac}")
        raise HTTPException(status_code=401, detail="Invalid signature")

    try:
        # Parse payload
        payload = json.loads(raw_body)
        event_name = payload.get("meta", {}).get("event_name")
        custom_data = payload.get("meta", {}).get("custom_data", {})
        
        user_id_str = custom_data.get("user_id")
        plan_id = custom_data.get("plan_id", "basic")
        billing_cycle = custom_data.get("billing_cycle", "monthly")

        # We care about successful payments for subscriptions/orders
        if event_name in ["subscription_created", "order_created", "subscription_payment_success"] and user_id_str:
            user_id = int(user_id_str)
            
            # Find the user
            user = session.exec(select(User).where(User.id == user_id)).first()
            if user:
                plan_name = plan_id.capitalize()  # "basic" → "Basic"
                # Ensure plan name matches expected values
                if plan_name not in ["Basic", "Premium", "Platinum"]:
                    print(f"Webhook Warning: Unknown plan '{plan_id}', defaulting to Basic")
                    plan_name = "Basic"

                user.plan = plan_name
                user.plan_billing_cycle = billing_cycle.capitalize()
                user.plan_start_date = datetime.utcnow()
                
                if billing_cycle.lower() == "monthly":
                    user.plan_expires_at = datetime.utcnow() + timedelta(days=30)
                elif billing_cycle.lower() == "yearly":
                    user.plan_expires_at = datetime.utcnow() + timedelta(days=365)
                    
                session.add(user)
                session.commit()
                print(f"✅ Webhook: Updated user {user_id} to {user.plan} ({billing_cycle}) plan.")
            else:
                print(f"⚠️ Webhook Warning: User {user_id} not found in database")

        elif event_name in ["subscription_expired", "subscription_cancelled"]:
            # Downgrade user to Free plan when subscription ends
            if user_id_str:
                user_id = int(user_id_str)
                user = session.exec(select(User).where(User.id == user_id)).first()
                if user:
                    user.plan = "Free"
                    user.plan_billing_cycle = None
                    user.plan_expires_at = None
                    session.add(user)
                    session.commit()
                    print(f"✅ Webhook: Downgraded user {user_id} to Free plan (subscription ended).")
                
        return {"status": "success"}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Webhook Processing Error: {e}")
        raise HTTPException(status_code=500, detail="Webhook processing failed")

@router.post("/api/payment/trial")
async def claim_platinum_trial(current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    """
    Claim a 7-day free trial of the Platinum plan.
    User can only claim this once.
    """
    if current_user.has_used_trial:
        raise HTTPException(status_code=400, detail="You have already claimed your 7-day trial.")
        
    if current_user.plan != "Free":
        raise HTTPException(status_code=400, detail="You already have an active subscription.")
        
    current_user.plan = "Platinum"
    current_user.plan_start_date = datetime.utcnow()
    current_user.plan_expires_at = datetime.utcnow() + timedelta(days=7)
    current_user.has_used_trial = True
    
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    
    return {"status": "success", "message": "7-day Platinum trial activated!"}
