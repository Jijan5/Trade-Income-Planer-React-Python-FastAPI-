# Email Settings Guide

This guide explains how to configure email settings for Trade Income Planner.

## Email Features

The application uses email for:

- User registration confirmation
- Password reset
- Subscription notifications
- Contact form submissions

## Supported SMTP Providers

The application supports any SMTP provider:

- Gmail
- Outlook
- Yahoo
- Mailgun
- SendGrid
- Amazon SES
- Custom SMTP server

## Configuration

### Environment Variables

Add the following to your `.env` file:

```
env
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SUPPORT_EMAIL=support@yourdomain.com
```

**Note:** The application uses `SMTP_SERVER` (not `SMTP_HOST`) as the environment variable name.

### Gmail Setup

If using Gmail:

1. Enable 2-Factor Authentication on your Google Account
2. Go to **Security → App Passwords**
3. Generate a new app password for "Mail"
4. Use the app password as `SMTP_PASSWORD`

### Other SMTP Providers

| Provider | SMTP Host           | Port                  |
| -------- | ------------------- | --------------------- |
| Gmail    | smtp.gmail.com      | 587 (TLS) / 465 (SSL) |
| Outlook  | smtp.office365.com  | 587                   |
| Yahoo    | smtp.mail.yahoo.com | 587                   |
| Mailgun  | smtp.mailgun.org    | 587                   |

## Email Code Configuration

The email functionality is in `backend/app/email_utils.py`:

```
python
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv

load_dotenv()

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = os.getenv("SMTP_PORT")
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")

def send_email(to_email, subject, body):
    msg = MIMEMultipart()
    msg['From'] = SMTP_USER
    msg['To'] = to_email
    msg['Subject'] = subject

    msg.attach(MIMEText(body, 'html'))

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.send_message(msg)
```

## Testing Email

### Test Email Sending

```
python
from backend.app.email_utils import send_email

# Test sending an email
send_email(
    to_email="test@example.com",
    subject="Test Email",
    body="<h1>Hello!</h1><p>This is a test email.</p>"
)
```

### Using Docker

```
bash
# Set environment variables in docker-compose.yaml
docker-compose up -d
```

## Troubleshooting

### Connection Issues

- **Connection timeout**: Check SMTP host and port
- **SSL/TLS errors**: Ensure correct port (587 for TLS, 465 for SSL)
- **Authentication failed**: Check username and password

### Email Not Received

1. Check spam/junk folder
2. Verify email address is correct
3. Check if SMTP credentials are correct
4. Ensure sender domain is not blocked

### Gmail Security

If using Gmail:

1. Ensure 2-Factor Authentication is enabled
2. Use App Password instead of regular password
3. Check "Less secure app access" is disabled (if prompted)

## Email Templates

Customize email templates in `backend/app/email_utils.py`:

```
python
def get_registration_email(username, confirmation_link):
    return f"""
    <html>
        <body>
            <h2>Welcome {username}!</h2>
            <p>Thank you for registering.</p>
            <p>Click the link below to confirm your email:</p>
            <a href="{confirmation_link}">Confirm Email</a>
        </body>
    </html>
    """

def get_password_reset_email(reset_link):
    return f"""
    <html>
        <body>
            <h2>Password Reset</h2>
            <p>Click the link below to reset your password:</p>
            <a href="{reset_link}">Reset Password</a>
            <p>This link expires in 30 minutes.</p>
        </body>
    </html>
    """
```

## Production Recommendations

1. **Use a dedicated email service** (Mailgun, SendGrid) for better deliverability
2. **Set up SPF and DKIM** for email authentication
3. **Monitor email sending** limits and reputation
4. **Log all emails** for debugging and compliance
5. **Use unsubscribe links** in marketing emails (required by law)
