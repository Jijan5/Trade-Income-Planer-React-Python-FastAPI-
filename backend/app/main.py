import os
import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.sessions import SessionMiddleware
from dotenv import load_dotenv
from .database import create_db_and_tables
from .routers import auth, users, posts, communities, simulation, admin, general, payment

load_dotenv()

app = FastAPI(title="Trading Simulation", version="1.0.0")

# Security: HTTP Security Headers Middleware (Pure ASGI to prevent Starlette BaseHTTPMiddleware body bugs)
class SecurityHeadersMiddleware:
    """Add security headers to all responses"""
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                from starlette.datastructures import MutableHeaders
                headers = MutableHeaders(scope=message)
                # 🛡️ Security Headers
                headers["X-Content-Type-Options"] = "nosniff"
                headers["X-Frame-Options"] = "DENY"
                headers["X-XSS-Protection"] = "1; mode=block"
                headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
                headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
                headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
            await send(message)

        await self.app(scope, receive, send_wrapper)

# Security: Rate Limiting Middleware (Pure ASGI to prevent Starlette BaseHTTPMiddleware body bugs)
class RateLimitMiddleware:
    """In-memory rate limiting middleware. Applies a global limit to all routes
    and a much stricter limit specifically to sensitive auth endpoints."""
    def __init__(self, app, max_requests: int = 100, window_seconds: int = 60):
        self.app = app
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests: dict = {}
        self._last_cleanup = time.time()

        # Brute-force protection: stricter limits for login/auth endpoints
        self.auth_paths = ["/api/token", "/api/register", "/api/forgot-password", "/api/reset-password"]
        self.auth_max_requests = 10   # max 10 attempts per minute per IP
        self.auth_window_seconds = 60
        self.auth_requests: dict = {}

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        # Skip rate limiting for OPTIONS preflight requests
        if scope.get("method") == "OPTIONS":
            await self.app(scope, receive, send)
            return

        path = scope.get("path", "")
        # Skip rate limiting for health checks, docs, and static assets only
        if path in ["/health", "/docs", "/openapi.json", "/redoc"] or path.startswith('/static'):
            await self.app(scope, receive, send)
            return

        # Get client IP address
        client = scope.get("client")
        client_ip = client[0] if client else "unknown"
        current_time = time.time()

        # --- Strict Brute-Force Protection for Auth Endpoints ---
        if path in self.auth_paths:
            if client_ip not in self.auth_requests:
                self.auth_requests[client_ip] = []
            self.auth_requests[client_ip] = [
                t for t in self.auth_requests[client_ip]
                if current_time - t < self.auth_window_seconds
            ]
            if len(self.auth_requests[client_ip]) >= self.auth_max_requests:
                await self.send_429(send, self.auth_window_seconds)
                return
            self.auth_requests[client_ip].append(current_time)
            await self.app(scope, receive, send)
            return

        # --- General Rate Limiting for all other routes ---
        if current_time - self._last_cleanup > 300:  # every 5 minutes
            cutoff = current_time - self.window_seconds
            self.requests = {
                ip: times for ip, times in self.requests.items()
                if any(t > cutoff for t in times)
            }
            self._last_cleanup = current_time

        if client_ip not in self.requests:
            self.requests[client_ip] = []

        self.requests[client_ip] = [
            t for t in self.requests[client_ip]
            if current_time - t < self.window_seconds
        ]

        if len(self.requests[client_ip]) >= self.max_requests:
            await self.send_429(send, self.window_seconds)
            return

        self.requests[client_ip].append(current_time)
        await self.app(scope, receive, send)

    async def send_429(self, send, retry_after):
        import json
        content = json.dumps({"detail": "Rate limit exceeded. Please try again later."}).encode("utf-8")
        await send({
            "type": "http.response.start",
            "status": 429,
            "headers": [
                (b"content-type", b"application/json"),
                (b"retry-after", str(retry_after).encode("utf-8")),
            ],
        })
        await send({
            "type": "http.response.body",
            "body": content,
        })

# Setup CORS - Restricted to allowed origins only
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "").split(",")
ALLOWED_ORIGINS = [o.strip() for o in ALLOWED_ORIGINS if o.strip()]

# Fallback to a safe default if env is not set (prevents wide-open CORS in production)
if not ALLOWED_ORIGINS:
    ALLOWED_ORIGINS = [os.getenv("FRONTEND_URL", "http://localhost:5173")]

# NOTE: Starlette/FastAPI applies middleware in REVERSE registration order.
# The last middleware added runs FIRST. We need:
#   Request flow: RateLimitMiddleware -> SessionMiddleware -> SecurityHeadersMiddleware -> CORSMiddleware -> route
# So we register them in the opposite order:

# 1. Add configurable rate limiting (runs last in registration = first on request)
RATE_LIMIT_REQUESTS = int(os.getenv("RATE_LIMIT_REQUESTS", "100"))
RATE_LIMIT_WINDOW = int(os.getenv("RATE_LIMIT_WINDOW", "60"))
app.add_middleware(RateLimitMiddleware, max_requests=RATE_LIMIT_REQUESTS, window_seconds=RATE_LIMIT_WINDOW)

# 2. SessionMiddleware is required by Authlib for OAuth2 state/nonce
_SESSION_SECRET = os.getenv("SECRET_KEY", "changeme-use-a-strong-random-secret")
app.add_middleware(SessionMiddleware, secret_key=_SESSION_SECRET)

# 3. Add security headers middleware
app.add_middleware(SecurityHeadersMiddleware)

# 4. CORS runs FIRST (registered last) so preflight OPTIONS requests are handled
#    before any rate limiting or other middleware can block them.
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}

# Serve the 'static' folder so it can be accessed from a browser
import os
if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")
else:
    print("Warning: static directory not found, avatars disabled")

# DB Startup
@app.on_event("startup")
def startup_event():
    create_db_and_tables()
    seed_default_tenant()

def seed_default_tenant():
    """Ensure the 'default' tenant row exists — required for all user operations."""
    from .database import engine
    from .models import Tenant
    from sqlmodel import Session, select

    domain = os.getenv("FRONTEND_URL", os.getenv("API_BASE_URL", "localhost"))
    # Strip protocol so it can be stored as a domain string
    domain = domain.replace("http://", "").replace("https://", "").split(":")[0]

    with Session(engine) as session:
        existing = session.exec(select(Tenant).where(Tenant.name == "default")).first()
        if not existing:
            tenant = Tenant(name="default", domain=domain)
            session.add(tenant)
            session.commit()
            print(f"[startup] Default tenant created (domain={domain})")
        else:
            print(f"[startup] Default tenant already exists (id={existing.id})")

# Include Routers
app.include_router(general.router)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(posts.router)
app.include_router(communities.router)
app.include_router(simulation.router)
app.include_router(admin.router)
app.include_router(payment.router)
