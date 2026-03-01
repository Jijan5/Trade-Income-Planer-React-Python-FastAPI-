import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
# from sendgrid import SendGridAPIClient
# from sendgrid.helpers.mail import Mail

# --- Email Configuration ---
# Load environment variables
SMTP_SERVER = os.getenv("SMTP_SERVER")
SMTP_PORT = int(os.getenv("SMTP_PORT")) # Default to 587 if not set
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
SUPPORT_EMAIL = os.getenv("SUPPORT_EMAIL")
# SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
# IS_PRODUCTION = os.getenv("ENVIRONMENT") == "production"

def send_contact_email(name: str, from_email: str, subject: str, message: str):
    """
    Sends the contact form submission to the support email address.
    Chooses the email sending method based on the environment.
    """
    # if IS_PRODUCTION and SENDGRID_API_KEY:
    #     # --- PRODUCTION EMAIL LOGIC (using SendGrid) ---
    #     # To enable, uncomment this block, install sendgrid library (`pip install sendgrid`),
    #     # and set SENDGRID_API_KEY and ENVIRONMENT=production in your .env file.
    #     html_content = f"""
    #     <h3>New Contact Form Submission</h3>
    #     <p><strong>Name:</strong> {name}</p>
    #     <p><strong>Email:</strong> {from_email}</p>
    #     <p><strong>Subject:</strong> {subject}</p>
    #     <p><strong>Message:</strong></p>
    #     <p>{message.replace('\n', '<br>')}</p>
    #     """
    #     message = Mail(
    #         from_email=SMTP_USER, # This should be a verified sender in SendGrid
    #         to_emails=SUPPORT_EMAIL,
    #         subject=f"New Contact Form Submission: {subject}",
    #         html_content=html_content
    #     )
    #     try:
    #         sg = SendGridAPIClient(SENDGRID_API_KEY)
    #         response = sg.send(message)
    #         print(f"SendGrid email sent successfully! Status code: {response.status_code}")
    #     except Exception as e:
    #         print(f"Failed to send email via SendGrid: {e}")
    # else:
        # --- LOCAL DEVELOPMENT EMAIL LOGIC (using SMTP) ---
    if not all([SMTP_USER, SMTP_PASSWORD, SMTP_SERVER, SUPPORT_EMAIL]):
        print("SMTP credentials are not fully set in .env. Skipping email for local dev.")
        return

    msg = MIMEMultipart()
    msg['From'] = SMTP_USER
    msg['To'] = SUPPORT_EMAIL
    msg['Subject'] = f"[LOCAL] New Contact Form: {subject}"

    body = f"""
    You have received a new message from your website contact form (via local SMTP).

    Name: {name}
    Email: {from_email}
    Subject: {subject}

    Message:
    {message}
    """
    msg.attach(MIMEText(body, 'plain'))

    try:
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        text = msg.as_string()
        server.sendmail(SMTP_USER, SUPPORT_EMAIL, text)
        server.quit()
        print(f"Local SMTP: Contact form email sent successfully to {SUPPORT_EMAIL}")
    except Exception as e:
        print(f"Local SMTP: Failed to send contact form email: {e}")
def send_contact_reply_email(recipient_email: str, subject: str, message: str):
    """
    Sends a reply from the admin to a user who submitted a contact form.
    """
    if not all([SMTP_USER, SMTP_PASSWORD, SMTP_SERVER]):
        print("SMTP credentials are not fully set in .env. Skipping email for local dev.")
        return

    msg = MIMEMultipart()
    msg['From'] = f"Support Team <{SMTP_USER}>"
    msg['To'] = recipient_email
    msg['Subject'] = subject

    # Simple HTML body for better formatting
    body = f"""
    <html>
        <body>
            <p>Hello,</p>
            <p>Thank you for contacting us. Here is a reply regarding your inquiry:</p>
            <div style="border-left: 2px solid #ccc; padding-left: 10px; margin-left: 5px;">
                <p>{message.replace('\n', '<br>')}</p>
            </div>
            <p>Best regards,<br>The Support Team</p>
        </body>
    </html>
    """
    msg.attach(MIMEText(body, 'html'))

    try:
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        text = msg.as_string()
        server.sendmail(SMTP_USER, recipient_email, text)
        server.quit()
        print(f"Local SMTP: Reply email sent successfully to {recipient_email}")
    except Exception as e:
        print(f"Local SMTP: Failed to send reply email: {e}")
        raise e # Re-raise the exception to be caught by the endpoint

def send_password_reset_email(recipient_email: str, pin: str):
    """
    Sends a password reset PIN to the user's email.
    Used for production password reset functionality.
    """
    if not all([SMTP_USER, SMTP_PASSWORD, SMTP_SERVER]):
        print("SMTP credentials are not fully set in .env. Cannot send password reset email.")
        return False

    msg = MIMEMultipart()
    msg['From'] = f"Trade Income Planner <{SMTP_USER}>"
    msg['To'] = recipient_email
    msg['Subject'] = "Password Reset PIN - Trade Income Planner"

    # HTML body with PIN
    body = f"""
    <html>
        <body>
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #333;">Password Reset Request</h2>
                <p>Hello,</p>
                <p>You requested to reset your password. Please use the following PIN code:</p>
                <div style="background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0;">
                    {pin}
                </div>
                <p><strong>Important:</strong></p>
                <ul>
                    <li>This PIN is valid for 15 minutes only</li>
                    <li>Do not share this PIN with anyone</li>
                    <li>If you didn't request this, please ignore this email</li>
                </ul>
                <p>Best regards,<br>The Trade Income Planner Team</p>
            </div>
        </body>
    </html>
    """
    msg.attach(MIMEText(body, 'html'))

    try:
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        text = msg.as_string()
        server.sendmail(SMTP_USER, recipient_email, text)
        server.quit()
        print(f"SMTP: Password reset PIN email sent successfully to {recipient_email}")
        return True
    except Exception as e:
        print(f"SMTP: Failed to send password reset email: {e}")
        return False
