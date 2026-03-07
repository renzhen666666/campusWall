"""
邮件发送模块
"""
import os
import smtplib
import random
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.header import Header
from typing import Optional

from config import get_settings

settings = get_settings()


class MailSender:
    """邮件发送器"""
    
    def __init__(self, smtp_server: str = None, smtp_port: int = None, 
                 sender_email: str = None, sender_password: str = None):
        self.smtp_server = smtp_server or settings.SMTP_SERVER
        self.smtp_port = smtp_port or settings.SMTP_PORT
        self.sender_email = sender_email or settings.SENDER_EMAIL
        self.sender_password = sender_password or settings.EMAIL_SENDER_PASSWORD

    def send_mail(self, send_email: str, title: str, template: str, 
                  sender: str = None, **kwargs):
        """发送邮件"""
        if sender is None:
            sender = self.sender_email

        msg = MIMEMultipart('alternative')
        msg['From'] = sender
        msg['To'] = send_email
        msg['Subject'] = Header(title, 'utf-8')

        if os.path.exists(template):
            with open(template, 'r', encoding='utf-8') as f:
                html_content = f.read()
                for key, value in kwargs.items():
                    html_content = html_content.replace(key, str(value))
            msg.attach(MIMEText(html_content, 'html', 'utf-8'))
        else:
            msg.attach(MIMEText(kwargs.get('content', ''), 'plain', 'utf-8'))

        try:
            server = smtplib.SMTP_SSL(self.smtp_server, self.smtp_port)
            server.login(self.sender_email, self.sender_password)
            server.sendmail(self.sender_email, [send_email], msg.as_string())
            print("邮件发送成功")
        except Exception as e:
            print(f"邮件发送失败: {e}")
        finally:
            try:
                server.quit()
            except:
                pass

    def send_response_email(self, title: str, recipient_email: str, 
                            message: dict, strongtitle: str = '您的反馈：',
                            response: str = "我们已经收到。如有需要，后续会与您联系。"):
        """发送回复邮件"""
        template = os.path.join("templates", "response_mail_template.html")
        self.send_mail(
            recipient_email,
            title,
            template,
            messagetimestamp=message.get('timestamp', ''),
            messagecontent=message.get('content', ''),
            messageresponse=response,
            strongtitle=strongtitle
        )


if __name__ == "__main__":
    sender = MailSender()
    sender.send_mail(
        "test@example.com",
        "龙高校园墙 - 邮箱验证码",
        os.path.join("templates", "email_verification_code.html"),
        from_email="龙华高级中学校园墙",
        verificationcode=str(random.randint(100000, 999999)),
    )
