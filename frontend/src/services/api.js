import axios from 'axios'

// 开发环境通过代理，baseURL 为空字符串；生产环境使用环境变量或默认值
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (process.env.NODE_ENV === 'production' ? 'https://api-eo.long-gao.com/' : '')

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    config.withCredentials = true;
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    console.log('Response:', response)
    return response
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response
      

      // 处理服务器错误
      if (status >= 500) {
        console.error('服务器错误:', data)
        return Promise.reject(new Error('服务器错误,请稍后重试'))
      }

      // 处理其他错误
      console.error('API Error:', data)
      const errorMessage = data?.error || data?.message || '请求失败'
      return Promise.reject(new Error(errorMessage))
    } else if (error.request) {
      // 请求已发出但没有收到响应
      console.error('网络错误:', error.message)
      return Promise.reject(new Error('网络连接失败,请检查网络设置'))
    } else {
      // 请求配置出错
      console.error('请求配置错误:', error.message)
      return Promise.reject(new Error('请求配置错误'))
    }
  }
)

export default {
  // 消息相关
  getMessages(params) {
    return api.get('/api/get_messages', { params })
  },
  getHotMessages() {
    return api.post('/api/get_hot_messages')
  },
  getMessageDetail(id) {
    return api.post(`/api/get_message_details/${id}`)
  },
  getMessagePartitions(id) {
    return api.post(`/api/get_message_partitions/${id}`)
  },
  submitMessage(data) {
    const formData = new FormData()
    if (data.text) formData.append('text', data.text)
    if (data.tags) formData.append('tags', data.tags)
    if (data.filenames && data.filenames.length > 0) {
      data.filenames.forEach((filename, index) => {
        formData.append(`filenames`, filename)
      })
    }
    return api.post('/api/wall/submit', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  likeMessage(id) {
    return api.post(`/api/wall/like/${id}`)
  },
  dislikeMessage(id) {
    return api.post(`/api/wall/dislike/${id}`)
  },
  commentMessage(id, data) {
    const formData = new FormData()
    formData.append('text', data.text)
    if (data.refer) formData.append('refer', data.refer)
    if (data.refer_id) formData.append('refer_id', data.refer_id)
    if (data.files && data.files.length > 0) {
      data.files.forEach(file => {
        formData.append('file', file)
      })
    }
    return api.post(`/api/wall/comment/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  // 文件上传
  chunkedUpload(formData) {
    return api.post('/api/chunked_upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  mergeChunks(data) {
    return api.post('/api/merge_chunks', data)
  },
  directUpload(formData) {
    return api.post('/api/direct_upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  // 标签和分区
  getTags() {
    return api.post('/api/get_tags')
  },
  getPartitionMessages(partition) {
    return api.post('/api/get_partition_messages', { partition })
  },

  // 通知
  getNotice() {
    return api.post('/api/notice')
  },

  // 应用
  getApps() {
    return api.post('/api/apps')
  },

  // 帮助和反馈
  submitHelp(data) {
    const formData = new FormData()
    formData.append('title', data.title)
    formData.append('email', data.email)
    formData.append('text', data.text)
    return api.post('/help/form', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  submitReport(messageId, data) {
    const formData = new FormData()
    formData.append('text', data.text)
    formData.append('email', data.email)
    formData.append('category', data.category)
    return api.post(`/help/report/${messageId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  // 管理员
  adminLogin(data) {
    const formData = new FormData()
    formData.append('username', data.username)
    formData.append('password', data.password)
    return api.post('/api/admin/login', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  adminLogout() {
    return api.get('/api/admin/logout')
  },
  adminVerify() {
    return api.get('/api/admin/verify')
  },

  // 留言管理
  adminGetMessages(params = {}) {
    return api.get(`api/admin/api/messages/`, { params })
  },
  adminGetMessage(messageId) {
    return api.get(`api/admin/api/get_message/${messageId}`)
  },
  adminDeleteMessage(messageId) {
    return api.post(`api/admin/delete_message/${messageId}`)
  },
  adminDeleteComment(messageId, commentId) {
    return api.post(`api/admin/api/delete_comment/${messageId}/${commentId}`)
  },
  adminApproveMessage(messageId) {
    return api.post(`api/admin/approve_message/${messageId}`)
  },
  adminRepairMessage(messageId) {
    return api.post(`api/admin/repair_message/${messageId}`)
  },
  adminGetApprovedIds() {
    return api.get(`api/admin/api/approved_ids`)
  },
  adminGetWall() {
    return api.get('/api/admin/wall')
  },

  // 公告管理
  adminGetNotice() {
    return api.get('/api/admin/notice')
  },
  adminPostNotice(text) {
    const formData = new FormData()
    formData.append('text', text)
    return api.post('/api/admin/notice', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  // 举报管理
  adminGetReport() {
    return api.get('/api/admin/report')
  },
  adminDeleteReport(messageId, reportId) {
    return api.post(`api/admin/api/delete_report/${messageId}/${reportId}`)
  },

  // 日志管理
  adminGetLog(search = '') {
    return api.get('/api/admin/log', { params: { search } })
  },
  adminGetAdminLog(search = '') {
    return api.get('/api/admin/admin_log', { params: { search } })
  },

}