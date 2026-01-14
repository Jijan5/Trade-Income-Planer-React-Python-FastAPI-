import midtransclient
import time
from fastapi import APIRouter, Depends, HTTPException
import httpx
from pydantic import BaseModel
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

# --- config Midtrans payment gateway---
snap = midtransclient.Snap(
    is_production=False,
    SERVER_KEY = os.getenv("MIDTRANS_SERVER_KEY"),
    CLIENT_KEY = os.getenv("MIDTRANS_CLIENT_KEY")
)

# Model untuk data yang dikirim dari Frontend
class PaymentRequest(BaseModel):
    plan_id: str
    amount: float
    billing_cycle: str

@router.post("/api/payment/create_transaction")
async def create_transaction(req: PaymentRequest, current_user: dict = Depends(get_current_user)):
    try:
        # 1. convert currency to IDR (PENTING)
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
        # Format: TIP-{user_id}-{timestamp}
        order_id = f"TIP-{current_user['id']}-{int(time.time())}"

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
                "first_name": current_user.get('username', 'Trader'),
                "email": current_user.get('email', 'user@example.com'),
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
