FROM python:3.13.1-slim
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt ./
RUN pip install -r requirements.txt

# Copy the backend code
COPY backend/ ./backend/

# Copy the built frontend (if needed for serving static files)
COPY src/ ./src/
COPY public/ ./public/
COPY index.html package.json vite.config.js ./

# Build the frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Final stage
FROM python:3.13.1-slim
WORKDIR /app

# Copy backend requirements and install
COPY requirements.txt ./
RUN pip install -r requirements.txt

# Copy backend code
COPY backend/ ./backend/

# Copy built frontend
COPY --from=frontend-builder /app/dist ./static

# Expose port 8080 for Cloud Run
EXPOSE 8080

# Run the backend
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8080"]
