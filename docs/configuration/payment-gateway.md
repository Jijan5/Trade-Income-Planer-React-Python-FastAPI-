# Payment Gateway Setup Guide (you can change with your local payment gateway like stripe or something else)

This guide explains how to configure the Midtrans payment gateway for subscriptions and payments.

## Supported Payment Methods

Midtrans supports various payment methods:

- Credit/Debit Cards (Visa, Mastercard, JCB)
- Bank Transfers (BCA, BRI,BNI, Mandiri)
- E-Wallet (GoPay, OVO, DANA)
- QRIS
- And many more

## Prerequisites

1. A Midtrans account ([signup.midtrans.com](https://signup.midtrans.com))
2. Access to the Midtrans Dashboard

## Midtrans Configuration

### Step 1: Get Your API Keys

1. Log in to [Midtrans Dashboard](https://dashboard.midtrans.com)
2. Go to **Settings → Access Keys**
3. Note your:
   - **Server Key** (for backend)
   - **Client Key** (for frontend)

### Step 2: Configure Environment Variables

Add the following to your `.env` file:

```
env
MIDTRANS_SERVER_KEY=your_server_key_here
MIDTRANS_CLIENT_KEY=your_client_key_here
```

### Step 3: Sandbox vs Production

The application is configured to use **Sandbox mode** by default for testing:

```
python
# In backend/app/routers/payment.py
snap = midtransclient.Snap(
    is_production=False,  # Set to True for production
    server_key=os.getenv("MIDTRANS_SERVER_KEY"),
    client_key=os.getenv("MIDTRANS_CLIENT_KEY")
)
```

To switch to production:

1. Change `is_production=False` to `is_production=True`
2. Use your production API keys

!!! warning "Sandbox Mode"
Never use sandbox credentials in production!

## Subscription Plans

The application supports the following subscription plans:

| Plan     | Features                | Billing        |
| -------- | ----------------------- | -------------- |
| Basic    | Limited features        | Monthly/Yearly |
| Premium  | Full features           | Monthly/Yearly |
| Platinum | All features + priority | Monthly/Yearly |

## Payment Flow

### 1. Create Transaction

The frontend sends a payment request to the backend:

```
javascript
// Example API call
const response = await axios.post('/api/payment/create_transaction', {
  plan_id: 'premium',
  amount: 29.99,
  billing_cycle: 'monthly'
});

// Returns snap token
const { token, order_id } = response.data;
```

### 2. Initialize Snap

The frontend uses the token to show Midtrans payment page:

```
javascript
snap.pay(token, {
  onSuccess: function(result) {
    // Payment successful
    verifyPayment(order_id);
  },
  onPending: function(result) {
    // Payment pending
  },
  onError: function(result) {
    // Payment failed
  }
});
```

### 3. Verify Payment

After payment, the backend verifies with Midtrans:

```
python
# Backend endpoint: POST /api/payment/verify
@app.post("/api/payment/verify")
async def verify_payment(req: VerifyPaymentRequest):
    # Check transaction status
    status = core.transactions.status(req.order_id)

    if status['transaction_status'] == 'settlement':
        # Update user plan in database
        update_user_plan(user_id, plan_id)
        return {"status": "success"}
```

## Payment Webhook (Optional)

For production, set up a webhook to receive payment notifications:

1. Go to Midtrans Dashboard → **Settings → Webhooks**
2. Add your endpoint: `https://yourdomain.com/api/payment/webhook`
3. Handle the notification in your backend

## Testing Payments

### Using Midtrans Sandbox

1. Use sandbox server/client keys
2. Test cards provided by Midtrans:

| Card Number         | Description        |
| ------------------- | ------------------ |
| 4111 1111 1111 1111 | Success            |
| 4111 1111 1111 1112 | Challenge/Failed   |
| 4000 0000 0000 9995 | Insufficient funds |

Use any future expiry date and any 3-digit CVV.

### Testing with Docker

```
bash
# Run with test profile
docker-compose --profile test up
```

## Troubleshooting

### Payment Not Working

1. **Check API Keys**: Ensure server and client keys are correct
2. **Network**: Ensure your server can reach Midtrans API
3. **Logs**: Check application logs for errors

### Transaction Status Issues

Common transaction statuses:

| Status       | Meaning                     |
| ------------ | --------------------------- |
| `capture`    | Card transaction successful |
| `settlement` | Bank transfer completed     |
| `pending`    | Awaiting payment            |
| `deny`       | Transaction rejected        |
| `expire`     | Transaction expired         |

### Common Errors

- **401 Unauthorized**: Check your server key
- **404 Not Found**: Check order_id format
- **400 Bad Request**: Check payment parameters

## Security Best Practices

1. **Never expose server key** in frontend code
2. **Use HTTPS** in production
3. **Validate payment** on server side only
4. **Implement webhook** for reliable notifications
5. **Log all transactions** for auditing

## Production Checklist

- [ ] Use production API keys
- [ ] Enable production mode (`is_production=True`)
- [ ] Set up SSL/TLS
- [ ] Configure webhook endpoint
- [ ] Test with real transactions (small amount)
- [ ] Monitor transactions in Midtrans Dashboard
