import midtransclient
import time
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
import httpx
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from sqlmodel import Session, select
from ..database import get_session
from ..dependencies import get_current_user
from ..models import User

load_dotenv()

router = APIRouter()

# --- config Midtrans payment gateway SandBox ---
snap = midtransclient.Snap(
    is_production=False,
    server_key=os.getenv("MIDTRANS_SERVER_KEY"),
    client_key=os.getenv("MIDTRANS_CLIENT_KEY")
)

core = midtransclient.CoreApi(
    is_production=False,
    server_key=os.getenv("MIDTRANS_SERVER_KEY"),
    client_key=os.getenv("MIDTRANS_CLIENT_KEY")
)

# model for data sent from frontend
class PaymentRequest(BaseModel):
    plan_id: str
    amount: float
    billing_cycle: str
    
class VerifyPaymentRequest(BaseModel):
    order_id: str

@router.post("/api/payment/create_transaction")
async def create_transaction(req: PaymentRequest, current_user=Depends(get_current_user)):
    try:
        # 1. convert currency to IDR
        # USD = IDR (auto updated)
        # API currency converter with httpx, install httpx: pip install httpx
        async with httpx.AsyncClient() as client:
            exchange_rate_url = "https://api.exchangerate-api.com/v4/latest/USD"  # Free API
            response = await client.get(exchange_rate_url)
            data = response.json()
            exchange_rate = data["rates"]["IDR"]
            
        amount_idr = int(req.amount * exchange_rate)

        if amount_idr < 10000:
            amount_idr = 10000 

        # 2. make Order ID Unique
        # Format: TIP_{user_id}_{plan_id}_{billing_cycle}_{timestamp}
        # Menggunakan underscore (_) sebagai pemisah agar mudah di-parse saat verifikasi
        order_id = f"TIP_{current_user.id}_{req.plan_id}_{req.billing_cycle}_{int(time.time())}"

        # 3. ready for midtrans params
        param = {
            "transaction_details": {
                "order_id": order_id,
                "gross_amount": amount_idr
            },
            "credit_card": {
                "secure": True
            },
            "customer_details": {
                "first_name": current_user.username,
                "email": current_user.email,
            },
            "item_details": [{
                "id": req.plan_id,
                "price": amount_idr,
                "quantity": 1,
                "name": f"{req.plan_id.capitalize()} Plan ({req.billing_cycle})"
            }]
        }

        # 4. Minta Snap Token ke Midtrans
        transaction = snap.create_transaction(param)
        
        # 5. Kembalikan Token ke Frontend
        return {"token": transaction['token'], "order_id": order_id}

    except Exception as e:
        print(f"Midtrans Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to processed payment")
    
@router.post("/api/payment/verify")
async def verify_payment(req: VerifyPaymentRequest, session: Session = Depends(get_session)):
    try:
        # Cek status transaksi ke Midtrans Core API
        transaction_status_response = core.transactions.status(req.order_id)
        transaction_status = transaction_status_response['transaction_status']
        fraud_status = transaction_status_response.get('fraud_status', '')
        
        is_paid = False
        if transaction_status == 'capture':
            if fraud_status == 'challenge':
                pass
            else:
                is_paid = True
        elif transaction_status == 'settlement':
            is_paid = True
            
        if is_paid:
            # Parse order_id to get user_id and plan_id
            # Format: TIP_{user_id}_{plan_id}_{billing_cycle}_{timestamp}
            parts = req.order_id.split('_')
            if len(parts) >= 5:
                user_id = int(parts[1])
                plan_id = parts[2]
                
                # Update User Plan in Database
                user = session.get(User, user_id)
                if user:
                    user.plan = plan_id.capitalize() # Basic, Premium, Platinum
                    session.add(user)
                    # Format: TIP_{user_id}_{plan_id}_{billing_cycle}_{timestamp}
                    if len(parts) >= 4:
                        billing_cycle = parts[3]
                        user.plan_billing_cycle = billing_cycle.capitalize()
                        user.plan_start_date = datetime.utcnow()
                        
                        if billing_cycle.lower() == "monthly":
                            user.plan_expires_at = datetime.utcnow() + timedelta(days=30)
                        elif billing_cycle.lower() == "yearly":
                            user.plan_expires_at = datetime.utcnow() + timedelta(days=365)
                    session.commit()
                    session.refresh(user)
                    return {"status": "success", "message": "Plan updated successfully", "plan": user.plan}
        
        return {"status": "pending", "message": "Payment not verified yet or failed"}

    except Exception as e:
        print(f"Verification Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to verify payment")