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
FROM python:3.13.1-slim
WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./backend/

# Copy built frontend static files
COPY --from=frontend-builder /app/dist ./static

# Expose port 8080 for Cloud Run
EXPOSE 8080

# Run the backend
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8080"]
