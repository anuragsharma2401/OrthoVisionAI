from email.message import EmailMessage
import os
import smtplib


def send_password_reset_otp(to_email: str, otp: str) -> None:
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_username = os.getenv("SMTP_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD")
    from_email = os.getenv("SMTP_FROM_EMAIL") or smtp_username
    from_name = os.getenv("SMTP_FROM_NAME", "OrthoVision AI")

    if not all([smtp_host, smtp_username, smtp_password, from_email]):
        raise RuntimeError("SMTP is not configured.")

    message = EmailMessage()
    message["Subject"] = "Your OrthoVision AI password reset OTP"
    message["From"] = f"{from_name} <{from_email}>"
    message["To"] = to_email
    message.set_content(
        f"Your OrthoVision AI password reset OTP is {otp}.\n\n"
        "This code expires soon. If you did not request it, please ignore this email."
    )

    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.starttls()
        server.login(smtp_username, smtp_password)
        server.send_message(message)
