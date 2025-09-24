## 龙华高级中学校园墙

一个基于Flask开发的校园墙

### 部署
- ### 安装依赖
```
pip install -r requirements.txt
```

- ### 下载ffmpeg
  
- ### 配置SMTP服务器(可选)
  1. 如果没有SMTP服务器，**可以注释掉app.py中76-84行、547-555行和605-616行的代码**
  2. 填写SMTP服务器的配置信息(app.py:78-84)
```python

smtp_server = ""
smtp_port = 465
sender_email = ""
email_sender_password = ""
```

### 后台管理功能与使用
- 修改managers.json中的管理员账户密码
- 打开网站/admin目录登录管理员

### 故障排查
 - 见/logs目录下的日志文件