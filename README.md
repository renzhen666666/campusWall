## 龙华高级中学校园墙

一个基于Flask开发的校园墙

#### 部署
- 安装依赖
```
pip install -r requirements.txt
```
- 配置SMTP服务器(可选)
 - **如果没有SMTP服务器**，可以注释掉app.py中76-84行、547-555行和605-616行的代码
 - 填写SMTP服务器的配置信息(app.py:78-84)
  - `smtp_server`：SMTP服务器地址
  - `smtp_port`：SMTP服务器端口
  - `sender_email`：发件人邮箱
  - `email_sender_password`：发件人邮箱密码

#### 后台管理功能与使用
- 修改managers.json中的管理员账户密码
- 打开网站/admin目录登录管理员

#### 故障排查
 - 见/logs目录下的日志文件