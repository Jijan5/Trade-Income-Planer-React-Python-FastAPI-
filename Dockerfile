# =============================================================================
# Trade Income Planner — Dockerfile
# =============================================================================
# Multi-stage build:
#   Stage 1 (frontend-builder) : Compiles the React app into /dist
#   Stage 2 (base)             : Production Python image serving the FastAPI
#                                backend. The compiled React /dist is copied
#                                in as /static so one container serves both.
#
# No secrets or credentials are baked into this image.
# All configuration is injected at runtime via environment variables
# (see docker-compose.yml and .env.example).
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1 — Build the React frontend
# -----------------------------------------------------------------------------
FROM node:25-alpine AS frontend-builder
WORKDIR /app

# Copy dependency manifests first for better layer caching
COPY package*.json ./
RUN npm install

# Copy source files and build
COPY src/ ./src/
COPY public/ ./public/
COPY index.html vite.config.js ./
RUN npm run build
# Output: /app/dist

# -----------------------------------------------------------------------------
# Stage 2 — Production runtime (Python + FastAPI)
# -----------------------------------------------------------------------------
FROM python:3.13.1-slim AS base

# Install system utilities:
#   dumb-init — proper PID 1 signal handling inside containers
#   curl      — required for the HEALTHCHECK command
RUN apt-get update && apt-get install -y --no-install-recommends \
  dumb-init \
  curl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Create a non-root user for security (never run as root in production)
RUN adduser --disabled-password --gecos '' appuser \
  && chown -R appuser:appuser /app
USER appuser

# Copy backend source code
COPY backend/ ./backend/

# Copy compiled React frontend (served as static files by FastAPI)
COPY --from=frontend-builder /app/dist ./static

# Expose the application port.
# Default is 8080. Override by setting PORT in your .env file.
EXPOSE 8080

# Container health check — hits the /health endpoint every 30s
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:${PORT:-8080}/health || exit 1

# Default concurrency (Gunicorn workers). Override via WEB_CONCURRENCY in .env
ENV WEB_CONCURRENCY=4

# Start the server using Gunicorn with Uvicorn workers for async support
CMD exec dumb-init gunicorn backend.app.main:app \
  --bind 0.0.0.0:${PORT:-8080} \
  --workers ${WEB_CONCURRENCY} \
  --worker-class uvicorn.workers.UvicornWorker \
  --worker-connections 1000 \
  --max-requests 1000 \
  --max-requests-jitter 100 \
  --timeout 120 \
  --keep-alive 5 \
  --preload \
  --access-logfile - \
  --error-logfile -
