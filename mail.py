from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.header import Header
from dotenv import load_dotenv
import smtplib
import random
import os
import json

smtp_server = ""
smtp_port = 465
sender_email = ""
sender_password = ""


class MailSender:
    def __init__(self, smtp_server, smtp_port, sender_email, sender_password):
        self.smtp_server = smtp_server
        self.smtp_port = smtp_port
        self.sender_email = sender_email
        self.sender_password = sender_password


    def send_mail(self, send_email, title, template, **kwargs):
        msg = MIMEMultipart('alternative')
        msg['From'] = self.sender_email  # 发件人
        msg['To'] = send_email      # 收件人
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

    def send_all_response_email(self):
        with open(os.path.join('help', 'help.json'), "r", encoding='utf-8') as f:
            help_dict = json.load(f)

        for item in help_dict:
            self.send_response_email(
                recipient_email=item['email'],
                title="龙高校园墙 - 已收到您的反馈",
                message={
                    'report_id': item['id'],
                    'timestamp': item['timestamp'],
                    'content': item['text']
            })


if __name__ == "__main__":
    sender = MailSender(smtp_server, smtp_port, sender_email, sender_password)
    #sender.send_all_response_email()