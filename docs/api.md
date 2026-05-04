# API Reference

This document provides an overview of the Trade Income Planner API endpoints.

## Base URL

```
http://localhost:8080
```

## Authentication

### POST /api/auth/register

Register a new user.

**Request:**

```
json
{
  "username": "string",
  "email": "user@example.com",
  "password": "string"
}
```

**Response:**

```
json
{
  "message": "User registered successfully"
}
```

### POST /api/auth/login

Login and get access token.

**Request:**

```
json
{
  "username": "user@example.com",
  "password": "string"
}
```

**Response:**

```
json
{
  "access_token": "string",
  "token_type": "bearer"
}
```

### POST /api/auth/logout

Logout current user.

**Headers:**

- `Authorization: Bearer <token>`

**Response:**

```
json
{
  "message": "Logged out successfully"
}
```

## Users

### GET /api/users/me

Get current user profile.

**Headers:**

- `Authorization: Bearer <token>`

**Response:**

```
json
{
  "id": 1,
  "username": "string",
  "email": "user@example.com",
  "plan": "basic",
  "role": "user"
}
```

### PUT /api/users/me

Update current user profile.

**Headers:**

- `Authorization: Bearer <token>`

**Request:**

```
json
{
  "username": "string",
  "bio": "string"
}
```

### GET /api/users/{user_id}/profile

Get user profile by ID.

**Response:**

```json
{
  "id": 1,
  "username": "string",
  "bio": "string",
  "avatar_url": "string"
}
```

### GET /api/users/me/theme

Get the current user's saved theme configuration.

**Headers:**

- `Authorization: Bearer <token>`

**Response:**

```json
{
  "bg_color": "#030308",
  "panel_color": "#0a0f1c",
  "neon_color": "#00cfff",
  "button_color": "#00cfff",
  "panel_border_color": "#00cfff",
  "button_border_color": "#00cfff",
  "panel_neon_enabled": true,
  "button_neon_enabled": true,
  "panel_neon_radius": "20px",
  "button_neon_radius": "20px",
  "panel_neon_opacity": 0.2,
  "button_neon_opacity": 0.4,
  "glass_opacity": 0.6,
  "glass_blur": "12px",
  "font_family": "Inter",
  "text_color": "#ffffff",
  "neon_font_style": "none"
}
```

### PUT /api/users/me/theme

Update the current user's theme configuration. All fields are optional (partial update).

**Headers:**

- `Authorization: Bearer <token>`
- Requires **Premium** or **Platinum** plan.

**Request:**

```json
{
  "panel_border_color": "#ff00ff",
  "glass_opacity": 0.1,
  "panel_neon_enabled": false
}
```

**Response:** Returns the updated `UserTheme` object.

## Simulation

### POST /api/simulation/calculate

Run trading simulation.

**Headers:**

- `Authorization: Bearer <token>`

**Request:**

```
json
{
  "initial_balance": 10000.00,
  "capital_utilization": 10.00,
  "risk_per_trade": 2.00,
  "risk_reward_ratio": 2.00,
  "win_rate": 50.00,
  "trades_per_day": 5,
  "simulation_days": 30,
  "fees_per_trade": 1.00,
  "risk_type": "dynamic"
}
```

**Response:**

```
json
{
  "status": "success",
  "summary": {
    "initial_balance": "10000.00",
    "final_balance": "15000.00",
    "total_profit": "5000.00",
    "total_roi": "50.00%"
  },
  "daily_breakdown": [...],
  "monte_carlo": {...}
}
```

### POST /api/simulation/goal-plan

Calculate goal planning.

**Headers:**

- `Authorization: Bearer <token>`

**Request:**

```
json
{
  "initial_balance": 10000.00,
  "target_balance": 50000.00,
  "deadline_months": 12
}
```

**Response:**

```
json
{
  "status": "success",
  "required_monthly_return": "15.00%",
  "feasibility": "Realistic",
  "message": "Goal is achievable"
}
```

### POST /api/simulation/health

Analyze trading health.

**Headers:**

- `Authorization: Bearer <token>`

**Request:**

```
json
{
  "trades": [
    {
      "pnl": 100.00,
      "risk_amount": 100.00,
      "balance": 10000.00,
      "is_win": true
    }
  ]
}
```

**Response:**

```
json
{
  "overall_score": 85,
  "risk_score": 90,
  "emotional_score": 80,
  "system_score": 85,
  "summary": "Good trading discipline",
  "trading_identity": "Disciplined Trader"
}
```

## Communities

### GET /api/communities

List all communities.

**Response:**

```
json
[
  {
    "id": 1,
    "name": "Trading Community",
    "description": "A community for traders",
    "member_count": 100
  }
]
```

### POST /api/communities

Create a new community.

**Headers:**

- `Authorization: Bearer <token>`

**Request:**

```
json
{
  "name": "string",
  "description": "string",
  "is_private": false
}
```

### GET /api/communities/{community_id}

Get community details.

### POST /api/communities/{community_id}/join

Join a community.

**Headers:**

- `Authorization: Bearer <token>`

### POST /api/communities/{community_id}/leave

Leave a community.

**Headers:**

- `Authorization: Bearer <token>`

## Posts

### GET /api/posts

List posts.

**Query Parameters:**

- `community_id`: Filter by community
- `limit`: Number of posts (default: 20)

### POST /api/posts

Create a new post.

**Headers:**

- `Authorization: Bearer <token>`

**Request:**

```
json
{
  "title": "string",
  "content": "string",
  "community_id": 1
}
```

### GET /api/posts/{post_id}

Get post details.

### DELETE /api/posts/{post_id}

Delete a post.

**Headers:**

- `Authorization: Bearer <token>`

## Payment

All payments are processed via **LemonSqueezy**. Plan upgrades are applied automatically upon successful webhook verification from LemonSqueezy.

### POST /api/payment/lemonsqueezy/checkout

Initiate a checkout session for a subscription plan.

**Headers:**

- `Authorization: Bearer <token>`

**Request:**

```json
{
  "plan": "Premium",
  "billing_cycle": "monthly"
}
```

**Response:**

```json
{
  "checkout_url": "https://app.lemonsqueezy.com/checkout/..."
}
```

### POST /api/payment/lemonsqueezy/webhook

Webhook endpoint called by LemonSqueezy after a successful payment. Verifies the `X-Signature` header against the configured `LEMONSQUEEZY_WEBHOOK_SECRET` and upgrades the user's plan automatically.

**Headers:**

- `X-Signature: <hmac-sha256-signature>`

**Response:**

```json
{
  "status": "ok"
}
```

## Error Responses

All endpoints may return error responses:

### 400 Bad Request

```
json
{
  "detail": "Invalid input data"
}
```

### 401 Unauthorized

```
json
{
  "detail": "Invalid or expired token"
}
```

### 403 Forbidden

```
json
{
  "detail": "Insufficient permissions"
}
```

### 404 Not Found

```
json
{
  "detail": "Resource not found"
}
```

### 500 Internal Server Error

```
json
{
  "detail": "Internal server error"
}
```
