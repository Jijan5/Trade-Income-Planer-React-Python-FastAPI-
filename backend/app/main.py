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

# Security: HTTP Security Headers Middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to all responses"""
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # 🛡️ Security Headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        
        return response

# Security: Rate Limiting Middleware
class RateLimitMiddleware(BaseHTTPMiddleware):
    """In-memory rate limiting middleware. Applies a global limit to all routes
    and a much stricter limit specifically to sensitive auth endpoints."""
    def __init__(self, app, max_requests: int = 100, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests: dict = {}
        self._last_cleanup = time.time()

        # Brute-force protection: stricter limits for login/auth endpoints
        self.auth_paths = ["/api/token", "/api/register", "/api/forgot-password", "/api/reset-password"]
        self.auth_max_requests = 10   # max 10 attempts per minute per IP
        self.auth_window_seconds = 60
        self.auth_requests: dict = {}

    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for OPTIONS preflight requests (must reach CORSMiddleware)
        if request.method == "OPTIONS":
            return await call_next(request)

        # Skip rate limiting for health checks, docs, and static assets only
        if request.url.path in ["/health", "/docs", "/openapi.json", "/redoc"] \
                or request.url.path.startswith('/static'):
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        current_time = time.time()

        # --- Strict Brute-Force Protection for Auth Endpoints ---
        if request.url.path in self.auth_paths:
            if client_ip not in self.auth_requests:
                self.auth_requests[client_ip] = []
            self.auth_requests[client_ip] = [
                t for t in self.auth_requests[client_ip]
                if current_time - t < self.auth_window_seconds
            ]
            if len(self.auth_requests[client_ip]) >= self.auth_max_requests:
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Too many attempts. Please wait 60 seconds before trying again."},
                    headers={"Retry-After": str(self.auth_window_seconds)}
                )
            self.auth_requests[client_ip].append(current_time)
            return await call_next(request)

        # --- General Rate Limiting for all other routes ---
        # Periodic cleanup to prevent unbounded memory growth
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
            return JSONResponse(
                status_code=429,
                content={"detail": "Rate limit exceeded. Please try again later."},
                headers={"Retry-After": str(self.window_seconds)}
            )

        self.requests[client_ip].append(current_time)
        return await call_next(request)

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
