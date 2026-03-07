<template>
  <div class="wall-page">
    <!-- 搜索和筛选栏 -->
    <div class="filter-bar">
      <form class="search-form" @submit.prevent="handleSearch">
        <div class="search-input-wrapper">
          <i class="bi bi-search"></i>
          <input
            v-model="searchWord"
            type="text"
            placeholder="搜索留言..."
            class="search-input"
          >
          <button v-if="searchWord" type="button" class="search-clear" @click="clearSearch">
            <i class="bi bi-x"></i>
          </button>
        </div>
      </form>
      <div class="filter-options">
        <select class="filter-select" v-model="filter" @change="refreshMessages">
          <option value="all">全部</option>
          <option value="files">有图/视频</option>
        </select>
        <select class="filter-select" v-model="sortBy" @change="refreshMessages">
          <option value="newest">最新</option>
          <option value="likes">👍最多</option>
          <option value="dislikes">👎最多</option>
        </select>
        <button class="btn-refresh" @click="refreshMessages" :disabled="loading">
          <i class="bi bi-arrow-clockwise"></i>
          刷新
        </button>
      </div>
    </div>

    <!-- 搜索结果提示 -->
    <div v-if="searchWord" class="search-result">
      找到 <strong>{{ searchWord }}</strong> 相关的 {{ messages.length }} 条内容
    </div>

    <!-- 留言列表 -->
    <div class="messages-container">
      <div v-if="loading && messages.length === 0" class="loading-state">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">加载中...</span>
        </div>
        <p>加载中...</p>
      </div>
      <div v-else-if="messages.length === 0" class="empty-state">
        <i class="bi bi-inbox"></i>
        <p>暂无留言</p>
        <button v-if="!searchWord" class="btn-create" @click="openPublishModal">
          <i class="bi bi-plus-circle me-2"></i>
          发布第一条留言
        </button>
      </div>
      <div v-else class="message-list" ref="messageList">
        <MessageCard
          v-for="message in messages"
          :key="message.id"
          :message="message"
          @refresh="refreshSpecificMessage"
        />
        <div v-if="hasMore" class="load-more">
          <button class="btn-load-more" @click="loadMore" :disabled="loadingMore">
            <span v-if="loadingMore" class="spinner-border spinner-border-sm me-2"></span>
            加载更多
          </button>
        </div>
      </div>
    </div>

    <!-- 发布按钮（固定在右下角） -->
    <div class="fab-group">
      <button class="fab fab-publish" @click="openPublishModal">
        <i class="bi bi-pencil-square"></i>
      </button>
      <button class="fab fab-top" @click="scrollToTop">
        <svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13 30L25 18L37 30" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    </div>


    <!-- 发布模态框 -->
    <Modal
      :visible="showPublishModal"
      :show-close="false"
      :show-footer="true"
      @close="closePublishModal"
      @update:visible="handlePublishModalUpdate"
    >
      <template #default>
        <div class="publish-modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="bi bi-send me-2"></i>发布新留言
            </h5>
          </div>
          <div class="modal-body">
            <form @submit.prevent="handlePublish">
              <textarea
                v-model="publishText"
                class="publish-textarea"
                placeholder="想说什么就说什么..."
                rows="4"
              ></textarea>

              <div class="publish-tags">
                <div class="tags-display">
                  <span v-for="(tag, index) in publishTags" :key="index" class="tag-badge">
                    #{{ tag }}
                    <button type="button" class="tag-remove" @click="removeTag(index)">
                      <i class="bi bi-x"></i>
                    </button>
                  </span>
                </div>
                <input
                  v-model="tagInput"
                  type="text"
                  class="tag-input"
                  placeholder="添加标签（回车或逗号分隔）"
                  @keydown="handleTagInput"
                >
                <div v-if="tagSuggestions.length > 0" class="tag-suggestions">
                  <span
                    v-for="tag in tagSuggestions"
                    :key="tag"
                    class="tag-suggestion"
                    @click="addTag(tag)"
                  >
                    #{{ tag }}
                  </span>
                </div>
              </div>

              <div class="publish-files">
                <label for ="file" class="upload-container-header"> 
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> 
                    <path d="M7 10V9C7 6.23858 9.23858 4 12 4C14.7614 4 17 6.23858 17 9V10C19.2091 10 21 11.7909 21 14C21 15.4806 20.1956 16.8084 19 17.5M7 10C4.79086 10 3 11.7909 3 14C3 15.4806 3.8044 16.8084 5 17.5M7 10C7.43285 10 7.84965 10.0688 8.24006 10.1959M12 12V21M12 12L15 15M12 12L9 15" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg> <p>拖到此处或点击选择文件</p>
                </label> 
                <label for="file" class="upload-container-footer"> 
                  <svg fill="#000000" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M15.331 6H8.5v20h15V14.154h-8.169z"></path><path d="M18.153 6h-.009v5.342H23.5v-.002z"></path></g></svg> 
                  <p>选择文件</p> 
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M5.16565 10.1534C5.07629 8.99181 5.99473 8 7.15975 8H16.8402C18.0053 8 18.9237 8.9918 18.8344 10.1534L18.142 19.1534C18.0619 20.1954 17.193 21 16.1479 21H7.85206C6.80699 21 5.93811 20.1954 5.85795 19.1534L5.16565 10.1534Z" stroke="#000000" stroke-width="2"></path> <path d="M19.5 5H4.5" stroke="#000000" stroke-width="2" stroke-linecap="round"></path> <path d="M10 3C10 2.44772 10.4477 2 11 2H13C13.5523 2 14 2.44772 14 3V5H10V3Z" stroke="#000000" stroke-width="2"></path> </g></svg>
                </label> 
                <input
                  id="file"
                  type="file"
                  multiple
                  accept="image/*,audio/*,video/*"
                  @change="handleFileSelect"
                  ref="fileInput"
                >
                <div v-if="uploadFiles.length > 0" class="file-list">
                  <div v-for="(file, index) in uploadFiles" :key="index" class="file-item">
                    <i class="bi bi-file-earmark"></i>
                    <span>{{ file.name }}</span>
                    <button type="button" class="file-remove" @click="removeFile(index)">
                      <i class="bi bi-x"></i>
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
          <div v-if="uploading" class="upload-progress">
            <div class="progress">
              <div class="progress-bar" :style="{ width: uploadProgress + '%' }"></div>
            </div>
            <p>{{ statusText }}</p>
          </div>
        </div>
      </template>
      <template #footer>
        <button type="button" class="btn btn-secondary" @click="closePublishModal">取消</button>
        <button type="button" class="btn btn-primary" @click="handlePublish" :disabled="publishing || (!publishText.trim() && uploadFiles.length === 0)">
          <span v-if="publishing" class="spinner-border spinner-border-sm me-2"></span>
          发布
        </button>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch, inject } from 'vue'
import { useRoute } from 'vue-router'
import api from '../services/api'
import MessageCard from '../components/MessageCard.vue'
import Modal from '../components/Modal.vue'

const Alert = inject('Alert')

const route = useRoute()

const messages = ref([])
const loading = ref(true)
const loadingMore = ref(false)
const hasMore = ref(true)
const searchWord = ref('')
const filter = ref('all')
const sortBy = ref('newest')
const pageStart = ref(0)
const pageSize = 15

const publishText = ref('')
const publishTags = ref([])
const tagInput = ref('')
const tagSuggestions = ref([])
const uploadFiles = ref([])
const uploading = ref(false)
const uploadProgress = ref(0)
const statusText = ref('')
const publishing = ref(false)
const uploadedFilenames = ref([])

const showPublishModal = ref(false)
const fileInput = ref(null)
const messageList = ref(null)

const availableTags = ref([])

// 浏览位置相关
const STORAGE_KEY_OF_SCROLL_POSITION = 'wall_scroll_position'
const STORAGE_KEY_OF_MSG_FILTER = 'wall_msg_filter'

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

const saveScrollPosition = () => {
  if (messageList.value) {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    localStorage.setItem(STORAGE_KEY_OF_SCROLL_POSITION, scrollTop)
    localStorage.setItem(STORAGE_KEY_OF_MSG_FILTER, {
      filter: filter.value,
      sortBy: sortBy.value,
      searchWord: searchWord.value
    })
  }
}

const restoreScrollPosition = () => {
  const savedPosition = localStorage.getItem(STORAGE_KEY_OF_SCROLL_POSITION)  
  const savedFilter = localStorage.getItem(STORAGE_KEY_OF_MSG_FILTER, '{}')
  if (savedPosition) {
    nextTick(() => {
      window.scrollTo(0, parseInt(savedPosition))
      /*
      filter.value = JSON.parse(savedFilter).filter || 'all'
      sortBy.value = JSON.parse(savedFilter).sortBy || 'newest'
      searchWord.value = JSON.parse(savedFilter).searchWord || ''
      */

      localStorage.removeItem(STORAGE_KEY_OF_MSG_FILTER)
      localStorage.removeItem(STORAGE_KEY_OF_SCROLL_POSITION)
    })
  }
}


const refreshMessages = async () => {
  loading.value = true
  pageStart.value = 0
  messages.value = []
  await loadMessages()
}

const refreshSpecificMessage = async (messageId) => {
  try {
    const response = await api.getMessageDetail(messageId);
    if (response.data) {
      const updatedMessage = response.data;
      
      const index = messages.value.findIndex(msg => msg.id === messageId);
      if (index !== -1) {
        // 逐个更新属性而不是替换整个对象
        const targetMessage = messages.value[index];
        
        // 只更新API返回的字段
        Object.keys(updatedMessage).forEach(key => {
          targetMessage[key] = updatedMessage[key];
        });
        
        // 确保关键字段存在
        if (!targetMessage.hasOwnProperty('id')) {
          targetMessage.id = messageId;
        }
        
        // 触发响应式更新
        messages.value.splice(index, 1); // 移除
        messages.value.splice(index, 0, targetMessage); // 重新插入
      }
    }
  } catch (error) {
    console.error('刷新特定消息失败:', error);
  }
}


const loadMessages = async () => {
  try {
    const response = await api.getMessages({
      s: sortBy.value,
      w: searchWord.value,
      f: filter.value,
      start: pageStart.value,
      end: pageStart.value + pageSize
    })
    if (response.data) {
      const newMessages = response.data.data || []
      messages.value = [...messages.value, ...newMessages]
      hasMore.value = newMessages.length === pageSize
    }
  } catch (error) {
    console.error('加载留言失败:', error)
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const loadMore = async () => {
  if (loadingMore.value || !hasMore.value) return
  loadingMore.value = true
  pageStart.value += pageSize
  await loadMessages()
}

const handleSearch = () => {
  refreshMessages()
}

const clearSearch = () => {
  searchWord.value = ''
  refreshMessages()
}



const handleTagInput = (event) => {
  if (event.key === 'Enter' || event.key === ',') {
    event.preventDefault()
    const tag = tagInput.value.trim().replace(',', '')
    if (tag && !publishTags.value.includes(tag)) {
      publishTags.value.push(tag)
      tagInput.value = ''
    }
  } else {
    showSuggestionTags(tagInput.value)
  }
}

const showSuggestionTags = async (input) => {
  if (!input) {
    tagSuggestions.value = []
    return
  }
  try {
    const response = await api.getTags()
    if (response.data) {
      availableTags.value = response.data || []
      tagSuggestions.value = availableTags.value.filter(tag =>
        tag.toLowerCase().includes(input.toLowerCase()) &&
        !publishTags.value.includes(tag)
      ).slice(0, 5)
    }
  } catch (error) {
    console.error('获取标签失败:', error)
  }
}

const addTag = (tag) => {
  if (!publishTags.value.includes(tag)) {
    publishTags.value.push(tag)
    tagInput.value = ''
    tagSuggestions.value = []
  }
}

const removeTag = (index) => {
  publishTags.value.splice(index, 1)
}

const handleFileSelect = (event) => {
  const files = Array.from(event.target.files)
  uploadFiles.value = [...uploadFiles.value, ...files]
}

const removeFile = (index) => {
  uploadFiles.value.splice(index, 1)
}

// 文件上传配置
const CHUNK_SIZE = 5 * 1024 * 1024 // 5MB 分片大小
const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB 最大文件大小

// 分片上传单个文件
const uploadFileChunked = async (file) => {
  const fileKey = `${Date.now()}_${file.name}`
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
  const uploadedFilenames = []

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE
    const end = Math.min(start + CHUNK_SIZE, file.size)
    const chunk = file.slice(start, end)

    const formData = new FormData()
    formData.append('chunk', chunk)
    formData.append('chunkIndex', i)
    formData.append('totalChunks', totalChunks)
    formData.append('fileKey', fileKey)
    formData.append('originalName', file.name)

    try {
      const response = await api.chunkedUpload(formData)
      if (response.data.success) {
        uploadProgress.value = Math.round(((i + 1) / totalChunks) * 100)
        statusText.value = `上传 ${file.name}: ${uploadProgress.value}%`
      } else {
        throw new Error(response.data.error || '分片上传失败')
      }
    } catch (error) {
      console.error('分片上传失败:', error)
      throw error
    }
  }

  // 合并分片
  try {
    const mergeResponse = await api.mergeChunks({ fileKey })
    if (mergeResponse.data.success) {
      uploadedFilenames.push(...mergeResponse.data.filenames)
    } else {
      throw new Error(mergeResponse.data.error || '合并文件失败')
    }
  } catch (error) {
    console.error('合并文件失败:', error)
    throw error
  }

  return uploadedFilenames
}

// 直接上传单个文件
const uploadFileDirect = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('originalName', file.name)

  try {
    const response = await api.directUpload(formData)
    if (response.data.success) {
      return response.data.filenames
    } else {
      throw new Error(response.data.error || '文件上传失败')
    }
  } catch (error) {
    console.error('文件上传失败:', error)
    throw error
  }
}

// 上传所有文件
const uploadAllFiles = async () => {
  if (uploadFiles.value.length === 0) return []

  uploading.value = true
  uploadProgress.value = 0
  uploadedFilenames.value = []

  try {
    for (let i = 0; i < uploadFiles.value.length; i++) {
      const file = uploadFiles.value[i]
      statusText.value = `正在上传 ${i + 1}/${uploadFiles.value.length}: ${file.name}`

      // 根据文件大小选择上传方式
      let filenames
      if (file.size > CHUNK_SIZE) {
        filenames = await uploadFileChunked(file)
      } else {
        filenames = await uploadFileDirect(file)
      }

      uploadedFilenames.value.push(...filenames)
    }

    statusText.value = '上传完成!'
    return uploadedFilenames.value
  } catch (error) {
    console.error('文件上传失败:', error)
    statusText.value = '上传失败: ' + (error.message || '未知错误')
    throw error
  } finally {
    uploading.value = false
  }
}

// 处理发布留言
const handlePublish = async () => {
  if (publishing.value) return

  // 验证输入
  if (!publishText.value.trim() && uploadFiles.value.length === 0) {
    Alert.showTopRightAlert('请输入留言内容或上传文件', 'warning', '提示')
    return
  }

  publishing.value = true

  try {
    // 先上传文件
    let filenames = []
    if (uploadFiles.value.length > 0) {
      filenames = await uploadAllFiles()
    }

    // 提交留言
    const response = await api.submitMessage({
      text: publishText.value.trim(),
      tags: publishTags.value.join(','),
      filenames: filenames
    })

    if (response.data.success) {
      // 重置表单
      publishText.value = ''
      publishTags.value = []
      uploadFiles.value = []
      uploadedFilenames.value = []
      tagInput.value = ''
      uploadProgress.value = 0
      statusText.value = ''

      // 关闭模态框
      closePublishModal()

      // 刷新留言列表
      await refreshMessages()

      // 显示成功提示
      Alert.showCenterAlert('发布成功!', 'success', '成功', 1500)
    } else {
      throw new Error(response.data.error || '发布失败')
    }
  } catch (error) {
    console.error('发布失败:', error)
    Alert.showTopRightAlert('发布失败: ' + (error.message || '未知错误'), 'warning', '错误')
  } finally {
    publishing.value = false
  }
}

const openPublishModal = () => {
  showPublishModal.value = true
}

const closePublishModal = () => {
  showPublishModal.value = false
}

const handlePublishModalUpdate = (newVal) => {
  showPublishModal.value = newVal
}

// 监听全局发布模态框打开事件
const handleOpenPublishModal = () => {
  showPublishModal.value = true
}

onMounted(() => {
  if (route.query.s) sortBy.value = route.query.s
  if (route.query.w) searchWord.value = route.query.w
  if (route.query.f) filter.value = route.query.f

  loadMessages().then(() => {
    restoreScrollPosition()
  })

  // 监听滚动事件保存位置
  window.addEventListener('scroll', saveScrollPosition)
  
  // 监听全局发布模态框打开事件
  window.addEventListener('open-publish-modal', handleOpenPublishModal)
})

onUnmounted(() => {
  window.removeEventListener('scroll', saveScrollPosition)
  window.removeEventListener('open-publish-modal', handleOpenPublishModal)
})
</script>

<style scoped>
:root {
  --primary-color: #6A0DAD;
  --primary-light: rgba(106, 13, 173, 0.1);
  --primary-dark: #5a0b91;
}

.wall-page {
  width: 100%;
}

/* 筛选栏 */
.filter-bar {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.search-form {
  flex: 1;
  min-width: 250px;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: var(--card-bg, white);
  border: 2px solid var(--border-color, #e0e0e0);
  border-radius: 10px;
  padding: 12px 16px;
  transition: border-color 0.3s;
}

.search-input-wrapper:focus-within {
  border-color: var(--primary-color);
}

.search-input-wrapper i {
  color: #999;
  font-size: 1.1rem;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 1rem;
  padding: 0 12px;
  background: transparent;
  color: var(--text-primary, #333);
}

.search-clear {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
}

.search-clear:hover {
  color: var(--primary-color);
}

.filter-options {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.filter-select {
  padding: 10px 16px;
  border: 2px solid var(--border-color, #e0e0e0);
  border-radius: 10px;
  background: var(--card-bg, white);
  font-size: 0.95rem;
  cursor: pointer;
  transition: border-color 0.3s;
  color: var(--text-primary, #333);
}

.filter-select:focus {
  outline: none;
  border-color: var(--primary-color);
}

.btn-refresh {
  padding: 10px 20px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-refresh:hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
}

.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 搜索结果 */
.search-result {
  padding: 16px;
  background: var(--primary-light);
  border-radius: 10px;
  margin-bottom: 20px;
  color: #666;
  font-size: 0.95rem;
}

.search-result strong {
  color: var(--primary-color);
}

/* 留言容器 */
.messages-container {
  min-height: 400px;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  color: #999;
}

.loading-state i,
.empty-state i {
  font-size: 4rem;
  margin-bottom: 20px;
  color: #ddd;
}

.empty-state p {
  font-size: 1.1rem;
  margin-bottom: 24px;
}

.btn-create {
  padding: 12px 24px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s;
}

.btn-create:hover {
  background: var(--primary-dark);
  transform: translateY(-2px);
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.load-more {
  text-align: center;
  padding: 20px;
}

.btn-load-more {
  padding: 12px 32px;
  background: var(--card-bg, white);
  color: var(--primary-color);
  border: 2px solid var(--primary-color);
  border-radius: 10px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s;
}

.btn-load-more:hover {
  background: var(--primary-light);
}

/* FAB 按钮组容器 */
.fab-group {
  position: fixed;
  bottom: 20px;
  right: 20px;
  display: flex;
  flex-direction: column-reverse; /* 让发布按钮在底部，向上按钮在顶部 */
  gap: 10px;
  z-index: 1000;
}

.fab {
  width: 60px;
  height: 60px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.5rem;
  box-shadow: 0 4px 20px rgba(106, 13, 173, 0.4);
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;

  z-index: 1000;
  margin-top: 20px;
}

.fab:hover {
  background: var(--primary-dark);
  transform: translateY(-3px) scale(1.1);
  box-shadow: 0 6px 25px rgba(106, 13, 173, 0.5);
}

/* 向上按钮特有样式 */
.fab-top {
  width: 60px;
  height: 60px;
  font-size: 1.25rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  transform: translateY(20px);
}


.fab-top:hover {
  background: var(--primary-dark, #5a6268);
  transform: translateY(-2px) scale(1.1);
  box-shadow: 0 6px 16px rgba(0,0,0,0.2);
}

.fab-publish {
  background: var(--primary-color);
}


/* 发布模态框 */
.publish-modal-content {
  display: flex;
  flex-direction: column;
  max-width: 80vh;
  max-height: 80vh;

  min-width: 50vh;



  
  border-radius: 16px;
}

.publish-modal-content .modal-header {
  background: var(--card-bg, white);
  padding: 16px 20px;
}

.publish-modal-content .modal-title {
  
  color: var(--primary-color);
  font-weight: 600;
  font-size: 1.2rem;
  margin: 0;
}

.publish-modal-content .modal-body {
  background: var(--card-bg, white);
  padding: 20px;
}

.publish-modal-footer {
  background: var(--card-bg, white);
}


.publish-textarea {
  width: 100%;
  padding: 16px;
  border: 2px solid var(--border-color, #e0e0e0);
  border-radius: 10px;
  font-size: 1rem;
  resize: none;
  margin-bottom: 20px;
  transition: border-color 0.3s;
  background: var(--input-bg, #f5f5f5);
}

.publish-textarea:focus {
  outline: none;
  border-color: var(--primary-color);
}

.publish-tags {
  margin-bottom: 20px;
}

.tags-display {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.tag-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--primary-light);
  color: var(--primary-color);
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
}

.tag-remove {
  background: none;
  border: none;
  color: var(--primary-color);
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
}

.tag-remove:hover {
  opacity: 0.7;
}

.tag-input {
  width: 100%;
  padding: 12px;
  border: 2px solid var(--border-color, #e0e0e0);
  border-radius: 10px;
  font-size: 0.95rem;
  transition: border-color 0.3s;
  background: var(--input-bg, #f5f5f5);
}

.tag-input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.tag-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.tag-suggestion {
  padding: 6px 12px;
  background: #f0f0f0;
  color: #666;
  border-radius: 15px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s;
}

.tag-suggestion:hover {
  background: var(--primary-light);
  color: var(--primary-color);
}

.publish-files {
  height: auto;
  width: 100%;
  border-radius: 10px;
  box-shadow: 4px 4px 30px rgba(0, 0, 0, .2);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  gap: 5px;
  background-color: rgba(0, 110, 255, 0.041);


}

.publish-files i {
  font-size: 4rem;
  color: var(--primary-color);
}

.publish-files .upload-container-header {
  flex: 1;
  width: 100%;
  border: 2px dashed var(--primary-color, #e0e0e0);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;

  height: 160px;
}
.upload-container-header svg {
  height: 100px;
}

.upload-container-header p {
  text-align: center;
  color: black;
}

.upload-container-footer {
  background-color: rgba(0, 110, 255, 0.075);
  width: 100%;
  height: 40px;
  padding: 8px;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  color: black;
  border: none;
}

.upload-container-footer svg {
  height: 130%;
  fill: var(--primary-color);
  background-color: rgba(70, 66, 66, 0.103);
  border-radius: 50%;
  padding: 2px;
  cursor: pointer;
  box-shadow: 0 2px 30px rgba(0, 0, 0, 0.205);
}

.upload-container-footer p {
  flex: 1;
  text-align: center;
}

.publish-files input {
  display: none;
}


.file-upload-label {
  display: block;
  padding: 30px;
  border: 2px dashed var(--border-color, #e0e0e0);
  border-radius: 10px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.file-upload-label:hover {
  border-color: var(--primary-color);
  background: var(--primary-light);
}

.file-upload-label i {
  display: block;
  font-size: 2rem;
  color: var(--primary-color);
  margin-bottom: 10px;
}

.file-upload-label span {
  display: block;
  font-weight: 600;
  color: #333;
  margin-bottom: 5px;
}

.file-upload-label small {
  color: #999;
}

.file-upload-label input {
  display: none;
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;

  width: 100%;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: var(--bg-color, #f5f5f5);
  border-radius: 8px;
  border: 1px solid var(--border-color, #e0e0e0);

  width: 100%;
}

.file-item i {
  color: var(--primary-color);
  font-size: 1.1rem;
}

.file-item span {
  flex: 1;
  font-size: 0.9rem;
  color: var(--text-primary, #333);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-remove {
  background: none;
  border: none;
  color: var(--text-primary, #333);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
}

.file-remove:hover {
  color: #dc3545;
}

.upload-progress {
  padding: 16px;
  background: var(--bg-color, #f5f5f5);
  border-top: 1px solid var(--border-color, #e0e0e0);
}

.upload-progress .progress {
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 10px;
}

.upload-progress .progress-bar {
  background: var(--primary-color);
  transition: width 0.3s ease;
}

.upload-progress p {
  margin: 0;
  text-align: center;
  font-size: 0.9rem;
  color: #666;
}

.btn-primary {
  background: var(--primary-color);
  border-color: var(--primary-color);
}

.btn-primary:hover {
  background: var(--primary-dark);
  border-color: var(--primary-dark);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 响应式 */
@media (max-width: 768px) {
  .filter-bar {
    flex-direction: column;
  }

  .filter-options {
    width: 100%;
  }

  .filter-select {
    flex: 1;
  }

  .fab {
    bottom: 20px;
    right: 20px;
    width: 50px;
    height: 50px;
    font-size: 1.25rem;
  }
  

}
</style>