"""
SMTP Email Utility for NutriAI
Sends personalized meal reminder emails via Gmail SMTP.
"""

import os
import ssl
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pathlib import Path

from dotenv import load_dotenv

# Load backend/.env regardless of where the process is started from.
load_dotenv(dotenv_path=Path(__file__).resolve().parents[1] / ".env")

logger = logging.getLogger(__name__)

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_EMAIL = os.getenv("SMTP_EMAIL", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "NutriAI Diet Planner")


def send_email(to_email: str, subject: str, body: str, smtp_email: str = None, smtp_password: str = None) -> bool:
    """
    Send an email via Gmail SMTP.

    Args:
        to_email: Recipient email address.
        subject: Email subject line.
        body: Email body content (plain text).
        smtp_email: Optional sender email to use.
        smtp_password: Optional sender password to use.

    Returns:
        True if sent successfully, False otherwise.
    """
    # Use provided email/password if available, otherwise fallback to .env/global
    final_email = (smtp_email or SMTP_EMAIL).strip()
    final_password = (smtp_password or SMTP_PASSWORD).replace(" ", "").strip()

    if not final_email or not final_password:
        logger.warning(f"⚠️ SMTP credentials not configured for {to_email}. Skipping email send.")
        return False

    try:
        message = MIMEMultipart("alternative")
        message["From"] = f"{SMTP_FROM_NAME} <{final_email}>"
        message["To"] = to_email
        message["Subject"] = subject

        # Create a styled HTML version of the email
        html_body = _build_html_email(subject, body)

        # Attach both plain text and HTML
        message.attach(MIMEText(body, "plain"))
        message.attach(MIMEText(html_body, "html"))

        context = ssl.create_default_context()

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()
            server.starttls(context=context)
            server.ehlo()
            server.login(final_email, final_password)
            server.sendmail(final_email, to_email, message.as_string())

        logger.info(f"✅ Email sent to {to_email} (from {final_email})")
        return True

    except smtplib.SMTPAuthenticationError:
        logger.error(
            f"❌ SMTP authentication failed for {final_email}. "
            "Verification needed."
        )
        return False
    except smtplib.SMTPException as smtp_err:
        logger.error(f"❌ SMTP error sending to {to_email}: {smtp_err}")
        return False
    except Exception as e:
        logger.error(f"❌ Unexpected error sending email to {to_email}: {e}")
        return False


def _build_html_email(subject: str, body: str) -> str:
    """Build a nicely styled HTML email from plain text content."""
    # Convert newlines to HTML breaks
    html_lines = body.replace("\n", "<br>")

    return f"""
    <html>
    <head>
        <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #f0fdf4; }}
            .container {{ max-width: 520px; margin: 24px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }}
            .header {{ background: linear-gradient(135deg, #059669, #10b981); padding: 28px 24px; text-align: center; }}
            .header h1 {{ color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; }}
            .header p {{ color: #d1fae5; margin: 6px 0 0; font-size: 13px; }}
            .body {{ padding: 28px 24px; color: #1e293b; font-size: 15px; line-height: 1.7; }}
            .footer {{ background: #f8fafc; padding: 16px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }}
            .footer a {{ color: #059669; text-decoration: none; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🥗 NutriAI</h1>
                <p>{subject}</p>
            </div>
            <div class="body">
                {html_lines}
            </div>
            <div class="footer">
                Sent by <strong>NutriAI Diet Planner</strong><br>
                <a href="#">Manage your reminder preferences</a>
            </div>
        </div>
    </body>
    </html>
    """
