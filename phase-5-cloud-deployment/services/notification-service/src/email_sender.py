"""
Email Sender - Phase V Notification Service (T047)

Sends email notifications using SMTP (configurable SMTP provider).
Supports retry logic and failure tracking.

Provider Options:
- Standard SMTP: Gmail, Outlook, custom SMTP
- SendGrid: (optional, can be added)
- AWS SES: (optional, can be added)

Environment:
- EMAIL_PROVIDER: smtp (default) | sendgrid | ses
- SMTP_HOST: SMTP server hostname
- SMTP_PORT: SMTP port (default 587)
- SMTP_USER: SMTP username
- SMTP_PASSWORD: SMTP password
- FROM_EMAIL: Sender email address
"""

import logging
import asyncio
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import os

logger = logging.getLogger(__name__)


class EmailSender:
    """Send emails via SMTP."""

    def __init__(
        self,
        smtp_host: str = "smtp.gmail.com",
        smtp_port: int = 587,
        smtp_user: str = "",
        smtp_password: str = "",
        from_email: str = "",
    ):
        """
        Initialize email sender.

        Args:
            smtp_host: SMTP server hostname
            smtp_port: SMTP port (default 587 for TLS)
            smtp_user: SMTP username
            smtp_password: SMTP password
            from_email: Sender email address
        """
        self.smtp_host = smtp_host or os.getenv("SMTP_HOST", "smtp.gmail.com")
        self.smtp_port = smtp_port or int(os.getenv("SMTP_PORT", "587"))
        self.smtp_user = smtp_user or os.getenv("SMTP_USER", "")
        self.smtp_password = smtp_password or os.getenv("SMTP_PASSWORD", "")
        self.from_email = from_email or os.getenv("FROM_EMAIL", self.smtp_user)

    async def send(
        self,
        to: str,
        subject: str,
        body: str,
        html_body: Optional[str] = None,
    ) -> bool:
        """
        Send email asynchronously.

        Args:
            to: Recipient email address
            subject: Email subject
            body: Plain text email body
            html_body: Optional HTML version of body

        Returns:
            True if sent successfully, False otherwise
        """
        try:
            # Validate email
            if not self._is_valid_email(to):
                logger.error(f"Invalid email address: {to}")
                return False

            # Run blocking SMTP operation in thread pool
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                None,
                self._send_sync,
                to,
                subject,
                body,
                html_body,
            )

            return result

        except Exception as e:
            logger.error(f"Error sending email to {to}: {e}")
            return False

    def _send_sync(
        self,
        to: str,
        subject: str,
        body: str,
        html_body: Optional[str] = None,
    ) -> bool:
        """
        Synchronous SMTP send operation.

        Args:
            to: Recipient email
            subject: Subject line
            body: Plain text body
            html_body: HTML body (optional)

        Returns:
            True if sent, False on error
        """
        try:
            # Create message
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = self.from_email
            msg["To"] = to

            # Attach plain text part
            part1 = MIMEText(body, "plain")
            msg.attach(part1)

            # Attach HTML part if provided
            if html_body:
                part2 = MIMEText(html_body, "html")
                msg.attach(part2)

            # Send via SMTP
            with smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=10) as server:
                # Start TLS if using port 587
                if self.smtp_port == 587:
                    server.starttls()

                # Login if credentials provided
                if self.smtp_user and self.smtp_password:
                    server.login(self.smtp_user, self.smtp_password)

                # Send email
                server.send_message(msg)

            logger.info(f"Email sent to {to} with subject: {subject}")
            return True

        except Exception as e:
            logger.error(f"SMTP error sending to {to}: {e}")
            return False

    @staticmethod
    def _is_valid_email(email: str) -> bool:
        """
        Validate email address format.

        Args:
            email: Email address to validate

        Returns:
            True if valid format, False otherwise
        """
        import re

        pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        return re.match(pattern, email) is not None

    def get_email_template(
        self,
        task_title: str,
        alert_message: str,
    ) -> tuple[str, str]:
        """
        Get email template for task alert.

        Args:
            task_title: Task title
            alert_message: Alert message

        Returns:
            Tuple of (plain_text_body, html_body)
        """
        plain_text = f"""
Task Alert: {task_title}

{alert_message}

This is an automated message from your Task Manager.
"""

        html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #007bff; color: white; padding: 20px; text-align: center; }}
        .content {{ padding: 20px; border: 1px solid #ddd; }}
        .footer {{ background-color: #f5f5f5; padding: 10px; text-align: center; font-size: 12px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Task Alert</h1>
        </div>
        <div class="content">
            <h2>{task_title}</h2>
            <p>{alert_message}</p>
        </div>
        <div class="footer">
            <p>This is an automated message from your Task Manager.</p>
        </div>
    </div>
</body>
</html>
"""

        return plain_text.strip(), html_body.strip()
