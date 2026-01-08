import requests


url = "https://wall.long-gao.com/"



res = requests.get(f"{url}api/get_all_messages")

print(res.status_code)
print(res.text)
messages = res.json()

like_cnt = 0
message_cnt = len(messages)
comment_cnt = 0

for message in messages:
    like_cnt += message.get("likes", 0)
    comment_cnt += len(message.get("comments", []))


print(f"{message_cnt} messages, {like_cnt} likes, {comment_cnt} comments")