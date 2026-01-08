from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.header import Header
from dotenv import load_dotenv
import smtplib
import random
import os
import json

smtp_server = "post-office.r-z.top"
smtp_port = 465
sender_email = "wall-manager@long-gao.com"
sender_password = "V98vNddDn3CKAHSk"

"""
WebMail: https://mail.rz7.top/roundcube
用户名: wall-manager@long-gao.com
密码: V98vNddDn3CKAHSk
POP service [ Address: mail.long-gao.com Port: 110/995 ]
IMAP service [ Address: mail.long-gao.com Port: 143/993 ]
SMTP service [ Address: mail.long-gao.com Port: 25/465/587 ]
"""


class MailSender:
    def __init__(self, smtp_server, smtp_port, sender_email, sender_password):
        self.smtp_server = smtp_server
        self.smtp_port = smtp_port
        self.sender_email = sender_email
        self.sender_password = sender_password


    def send_mail(self, send_email, title, template, sender=None, **kwargs):
        if sender is None:
            sender = self.sender_email

        msg = MIMEMultipart('alternative')
        msg['From'] = sender                 # 发件人
        msg['To'] = send_email                   # 收件人
        msg['Subject'] = Header(title, 'utf-8')  # 邮件主题

        with open(template, 'r', encoding='utf-8') as f:
            html_content = f.read()
            for key, value in kwargs.items():
                html_content = html_content.replace(key, value)

        msg.attach(MIMEText(html_content, 'html', 'utf-8'))

        try:
            server = smtplib.SMTP_SSL(self.smtp_server, self.smtp_port)
            server.login(self.sender_email, self.sender_password)
            server.sendmail(self.sender_email, [send_email], msg.as_string())
            print("邮件发送成功")
        except Exception as e:
            print(f"邮件发送失败: {e}")
        finally:
            server.quit()

    def send_response_email(self, title, recipient_email, message, strongtitle='您的反馈：', response="我们已经收到。如有需要，后续会与您联系。"):
        template = os.path.join("templates", "response_mail_template.html")
        self.send_mail(
            recipient_email,
            title,
            template,
            messagetimestamp=message['timestamp'],
            messagecontent=message['content'],
            messageresponse=response,
            strongtitle=strongtitle
        )



if __name__ == "__main__":
    sender = MailSender(smtp_server, smtp_port, sender_email, sender_password)
    sender.send_mail(
        "3045387398@qq.com",
        "龙高校园墙 - 邮箱验证码",
        os.path.join("templates", "email_verification_code.html"),
        from_email="龙华高级中学校园墙",
        verificationcode=str(random.randint(100000, 999999)),
    )