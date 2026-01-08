# 龙高墙 API 文档

本文档详细介绍了龙高墙应用程序中可用的API端点及其用法。

api网址 https://api-wall.renzhen.fun/

## 消息获取 API

### 获取消息列表

**端点:** `/get_messages`

**方法:** `GET`

**描述:** 获取消息列表，支持排序、过滤和分页功能。

**参数:**
- `s` (string): 排序方式(可为likes、dislikes、newest)，默认为 "newest"
- `w` (string): 搜索关键词，默认为空字符串
- `f` (string): 过滤条件(可为files、all)，默认为 'all'
- `start` (integer): 分页起始索引，默认为 0
- `end` (integer): 分页结束索引，默认为 10

**返回:**
```json
{
  "data": [消息列表],
  "total": 消息总数
}
```

**示例:**
```
GET /get_messages?s=newest&w=学校&f=all&start=0&end=10
```

### 获取公告

**端点:** `/notice`

**方法:** `POST`

**描述:** 获取系统公告内容。

**返回:**
```json
{
  "success": true,
  "content": "公告内容"
}
```

### 获取页面大小

**端点:** `/get_page_size`

**方法:** `GET`

**描述:** 获取消息分页的页面大小设置。

**返回:**
```json
{
  "page_size": 页面大小值
}
```

### 获取所有消息

**端点:** `/get_all_messages`

**方法:** `GET`

**描述:** 获取系统中的所有消息列表。

**返回:**
```json
[所有消息列表]
```

### 获取消息详情

**端点:** `/get_message_details/<message_id>`

**方法:** `POST`

**描述:** 获取指定ID消息的详细信息。

**参数:**
- `message_id` (path parameter): 消息ID

**返回:**
- 成功:
```json
{
  "success": true,
  "message": {消息详情}
}
```
- 失败:
```json
{
  "success": false,
  "error": "消息不存在"
}
```

### 获取消息分区

**端点:** `/get_message_partitions/<message_id>`

**方法:** `POST`

**描述:** 获取指定消息的分区标签信息。

**参数:**
- `message_id` (path parameter): 消息ID

**返回:**
- 成功:
```json
{
  "success": true,
  "partition": [标签列表]
}
```
- 失败:
```json
{
  "success": false,
  "error": "消息不存在"
}
```

### 获取所有标签

**端点:** `/get_tags`

**方法:** `POST`

**描述:** 获取系统中所有可用的标签列表。

**返回:**
```json
[标签列表]
```

### 获取分区消息

**端点:** `/get_partition_messages`

**方法:** `POST`

**描述:** 获取指定分区下的所有消息ID。

**请求体:**
```json
{
  "partition": "分区名称"
}
```

**返回:**
```json
{
  "success": true,
  "data": [消息ID列表]
}
```

### 获取消息列表

**端点:** `/get_message_list`

**方法:** `POST`

**描述:** 获取系统中的消息列表。

**返回:**
```json
[消息列表]
```

## 使用示例

### 前端获取消息列表示例 (JavaScript)

```javascript
// 获取消息列表
async function getMessages(sort = 'newest', keyword = '', filter = 'all', start = 0, end = 10) {
  const response = await fetch(`/get_messages?s=${sort}&w=${keyword}&f=${filter}&start=${start}&end=${end}`);
  const data = await response.json();
  return data;
}

// 使用示例
getMessages('newest', '学校', 'all', 0, 10)
  .then(result => {
    console.log(`共有 ${result.total} 条消息`);
    console.log('当前页消息:', result.data);
  })
  .catch(error => console.error('获取消息失败:', error));
```

### 获取消息详情示例

```javascript
// 获取消息详情
async function getMessageDetails(messageId) {
  const response = await fetch(`/get_message_details/${messageId}`, {
    method: 'POST'
  });
  return await response.json();
}

// 使用示例
getMessageDetails('message123')
  .then(result => {
    if (result.success) {
      console.log('消息详情:', result.message);
    } else {
      console.error(result.error);
    }
  });
```

### 获取分区消息示例

```javascript
// 获取分区消息
async function getPartitionMessages(partition) {
  const response = await fetch('/get_partition_messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ partition })
  });
  return await response.json();
}

// 使用示例
getPartitionMessages('学习')
  .then(result => {
    if (result.success) {
      console.log('该分区下的消息ID:', result.data);
    }
  });
```