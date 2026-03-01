# Quick Start Guide

This guide will help you get the Trade Income Planner up and running quickly.

## Prerequisites

Before you begin, ensure you have the following installed:

- Python 3.11 or higher
- Node.js 18 or higher
- MySQL 8.0 or higher (or use Docker)
- Docker and Docker Compose (optional)

## Local Development Setup

### 1. Clone the Repository

```
bash
git clone https://github.com/Jijan5/Trade-Income-Planer-React-Python-FastAPI-.git
cd trade-income-planer
```

### 2. Backend Setup

#### Create a Virtual Environment

```
bash
# Create virtual environment
python -m venv venv

# Activate on Windows
venv\Scripts\activate

# Activate on Linux/Mac
source venv/bin/activate
```

#### Install Python Dependencies

```
bash
pip install -r requirements.txt
```

#### Configure Environment Variables

Create a `.env` file in the project root:

```
env
# Database Configuration
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_SERVER=localhost
MYSQL_PORT=3306
MYSQL_DB=trading_db

# JWT Configuration
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Midtrans Payment Gateway
MIDTRANS_SERVER_KEY=your_midtrans_server_key
MIDTRANS_CLIENT_KEY=your_midtrans_client_key

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```

### 3. Frontend Setup

```bash
# Install Node.js dependencies
npm install

# Build the frontend
npm run build
```

### 4. Run the Application

```
bash
# Run the backend server
uvicorn backend.app.main:app --reload

# The application will be available at http://localhost:8080
```

## Docker Setup (Recommended)

The easiest way to run the application is using Docker Compose:

```
bash
# Build and run all services
docker-compose up --build

# The application will be available at http://localhost:8080
```

See the [Docker Setup](docker.md) guide for more details.

## First Time Setup

1. Open your browser and navigate to `http://localhost:8080`
2. Register a new account
3. If you're the first user, you'll be automatically assigned admin privileges
4. Configure your payment gateway in the admin panel (optional)
5. Start using the application!

## Troubleshooting

### Database Connection Issues

Make sure your MySQL server is running and the credentials in `.env` are correct.

### Port Already in Use

If port 8080 is already in use, you can change the port:

```
bash
uvicorn backend.app.main:app --reload --port 8000
```

### Frontend Build Errors

Clear the node_modules and reinstall:

```
bash
rm -rf node_modules
npm install
```
