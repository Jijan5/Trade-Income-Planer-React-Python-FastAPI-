# Environment Variables

This guide describes all environment variables used in the Trade Income Planner application.

## Required Variables

### Database Configuration

| Variable         | Description           | Example             |
| ---------------- | --------------------- | ------------------- |
| `MYSQL_USER`     | MySQL username        | `root`              |
| `MYSQL_PASSWORD` | MySQL password        | `your_password`     |
| `MYSQL_SERVER`   | MySQL server hostname | `localhost` or `db` |
| `MYSQL_PORT`     | MySQL port            | `3306`              |
| `MYSQL_DB`       | Database name         | `trading_db`        |

### Security

| Variable                      | Description                                      | Example                |
| ----------------------------- | ------------------------------------------------ | ---------------------- |
| `SECRET_KEY`                  | JWT secret key (generate a strong random string) | `your-secret-key-here` |
| `ALGORITHM`                   | JWT algorithm                                    | `HS256`                |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiration time in minutes                 | `30`                   |

### Application

| Variable | Description | Default |
| -------- | ----------- | ------- |
| `PORT`   | Server port | `8080`  |

## Optional Variables

### Payment Gateway (Midtrans)

| Variable              | Description         | Example             |
| --------------------- | ------------------- | ------------------- |
| `MIDTRANS_SERVER_KEY` | Midtrans Server Key | `SB-server-key-xxx` |
| `MIDTRANS_CLIENT_KEY` | Midtrans Client Key | `SB-client-key-xxx` |

!!! note
For sandbox testing, use the sandbox keys from your Midtrans dashboard. For production, switch to production keys.

### Email Configuration

| Variable        | Description                   | Example                |
| --------------- | ----------------------------- | ---------------------- |
| `SMTP_HOST`     | SMTP server hostname          | `smtp.gmail.com`       |
| `SMTP_PORT`     | SMTP port                     | `587`                  |
| `SMTP_USER`     | SMTP username                 | `your_email@gmail.com` |
| `SMTP_PASSWORD` | SMTP password or app password | `your_app_password`    |

!!! tip "Gmail App Password"
If using Gmail, you need to generate an App Password: 1. Go to Google Account → Security 2. Enable 2-Step Verification 3. Go to App Passwords 4. Generate a new app password for "Mail"

### CORS Configuration

The application is pre-configured to allow the following origins:

- `http://localhost:3000`
- `http://localhost:4000`
- `http://localhost:5173`
- `http://127.0.0.1:5173`

To modify CORS settings, edit `backend/app/main.py`.

## Setting Up Environment Variables

### Method 1: .env File

Create a `.env` file in the project root:

```
env
# Database
MYSQL_USER=root
MYSQL_PASSWORD=password
MYSQL_SERVER=localhost
MYSQL_PORT=3306
MYSQL_DB=trading_db

# Security
SECRET_KEY=your-super-secret-key-change-this
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Midtrans
MIDTRANS_SERVER_KEY=SB-server-key-xxx
MIDTRANS_CLIENT_KEY=SB-client-key-xxx

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```

### Method 2: Docker Environment

In `docker-compose.yaml`, add environment variables to the backend service:

```
yaml
services:
  backend:
    environment:
      - MYSQL_USER=root
      - MYSQL_PASSWORD=password
      - MYSQL_SERVER=db
      - MYSQL_PORT=3306
      - MYSQL_DB=trading_db
      - SECRET_KEY=your-secret-key
      - MIDTRANS_SERVER_KEY=your-server-key
```

### Method 3: System Environment

On Linux/Mac:

```
bash
export MYSQL_USER=root
export MYSQL_PASSWORD=password
# ... other variables
```

On Windows (Command Prompt):

```
cmd
set MYSQL_USER=root
set MYSQL_PASSWORD=password
```

## Generating a Secret Key

Generate a secure secret key using Python:

```
python
import secrets
print(secrets.token_hex(32))
```

## Variable Precedence

Environment variables are loaded in the following order (later overrides earlier):

1. Default values in code
2. `.env` file (via python-dotenv)
3. System environment variables
4. Docker compose environment section
