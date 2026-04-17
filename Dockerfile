# Build frontend
FROM node:25-alpine AS frontend-builder
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
RUN npm install

# Copy source files
COPY src/ ./src/
COPY public/ ./public/
COPY index.html vite.config.js ./

# Build the frontend
RUN npm run build

# Production stage
FROM python:3.13.1-slim as base

# Install dumb-init for better signal handling
RUN apt-get update && apt-get install -y --no-install-recommends \
  dumb-init \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Create non-root user
RUN adduser --disabled-password --gecos '' appuser && chown -R appuser:appuser /app
USER appuser

# Copy backend code
COPY backend/ ./backend/

# Copy built frontend static files
COPY --from=frontend-builder /app/dist ./static

# Expose port (dynamic $PORT)
EXPOSE 8080

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT:-8080}/health || exit 1

# Dynamic concurrency based on CPU cores (for Gunicorn)
ENV WEB_CONCURRENCY=4

# Run with Gunicorn + Uvicorn workers for high concurrency
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
