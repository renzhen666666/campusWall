<template>
  <div class="message-card">
    <div class="card-header">
      <div class="message-user"> 
        <UserCardSimple :userId="message?.publisher ? message.publisher : 0" />
      </div>
      <div class="message-meta">
        <span class="message-time" @click="handleClickTime($event, message.timestamp)">{{ formatTime(message.timestamp) }}</span>
      </div>
    </div>

    <div class="card-body">
      <p class="message-text">{{ message.text }}</p>

      <div v-if="message.files && message.files.length > 0" class="message-files">
        <div class="files-grid">
          <div v-for="(file, index) in message.files" :key="index" class="file-item" @click="openFilePreview(index, message.files)">
            <!-- 图片缩略图 -->
            <div v-if="isImage(file)" class="file-link file-image-wrapper">
              <img
                :src="getFileTinyUrl(file)"
                :alt="file"
                class="file-image"
                loading="lazy"
              >
            </div>
            <!-- 视频缩略图 -->
            <div v-else-if="isVideo(file)" class="file-link file-media-wrapper">
              <div class="file-thumbnail">
                <i class="bi bi-play-circle-fill"></i>
                <span class="file-type-label">视频</span>
              </div>
            </div>
            <!-- PDF 文件 -->
            <div v-else-if="isPdf(file)" class="file-link file-media-wrapper">
              <div class="file-thumbnail pdf">
                <i class="bi bi-file-earmark-pdf-fill"></i>
                <span class="file-type-label">PDF</span>
              </div>
            </div>
            <!-- Office 文件 -->
            <div v-else-if="isOfficeFile(file)" class="file-link file-media-wrapper">
              <div class="file-thumbnail office">
                <i :class="getFileIcon(file)"></i>
                <span class="file-type-label">{{ getFileTypeLabel(file) }}</span>
              </div>
            </div>
            <!-- 压缩包 -->
            <div v-else-if="isArchiveFile(file)" class="file-link file-media-wrapper">
              <div class="file-thumbnail archive">
                <i class="bi bi-file-earmark-zip-fill"></i>
                <span class="file-type-label">{{ getFileTypeLabel(file) }}</span>
              </div>
            </div>
            <!-- 其他文件 -->
            <div v-else class="file-link file-media-wrapper">
              <div class="file-thumbnail other">
                <i :class="getFileIcon(file)"></i>
                <span class="file-type-label">{{ getFileTypeLabel(file) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="message.tags && message.tags.length > 0" class="message-tags">
        <router-link
          v-for="tag in message.tags"
          :key="tag"
          :to="`/p/${encodeURIComponent(tag)}`"
          class="tag-badge"
        >
          #{{ tag }}
        </router-link>
      </div>
    </div>

    <div class="card-footer">
      <button
        :id="`msg-${message.id}-like-btn`"
        class="action-btn"
        :class="{ 'active': message.liked }"
        @click="handleLike(message.id)"
        title="点赞"
      >
        <i class="bi" :class="message.liked ? 'bi-hand-thumbs-up-fill' : 'bi-hand-thumbs-up'"></i>
        <span :id="`msg-${message.id}-like-count`">{{ message.likes || 0 }}</span>
      </button>
      <button
        :id="`msg-${message.id}-dislike-btn`"
        class="action-btn"
        :class="{ 'active': message.disliked }"
        @click="handleDislike(message.id)"
        title="点踩"
      >
        <i class="bi" :class="message.disliked ? 'bi-hand-thumbs-down-fill' : 'bi-hand-thumbs-down'"></i>
      </button>
      <button
        class="action-btn"
        :class="{ 'active': showCommentForm }"
        @click="toggleCommentForm"
        title="评论"
      >
        <i class="bi bi-chat"></i>
        <span>{{ message.comments ? message.comments.length : 0 }}</span>
      </button>
      <div class="card-actions">
        <button class="action-menu-btn" @click="toggleMenu" ref="menuBtn">
          <i class="bi bi-three-dots"></i>
        </button>
        <div v-if="showMenu" class="action-menu" ref="menu">
          <button class="menu-item" @click="handleReport">
            <i class="bi bi-flag me-2"></i>举报
          </button>
          <button class="menu-item" @click="handleRefresh">
            <i class="bi bi-arrow-clockwise me-2"></i>刷新
          </button>
          <button class="menu-item" @click="handleShare">
            <i class="bi bi-share me-2"></i>分享
          </button>
        </div>
      </div>
    </div>

    <!-- 内联评论表单 -->
    <div v-if="showCommentForm" class="inline-comment-form">
      <form @submit.prevent="submitInlineComment">
        <textarea
          v-model="commentText"
          class="comment-input"
          placeholder="写下你的评论..."
          rows="2"
        ></textarea>
        <div class="comment-actions">
          <button type="submit" class="btn-submit" :disabled="!commentText.trim()">
            <i class="bi bi-send me-1"></i>
            发送
          </button>
        </div>
      </form>
    </div>

    <div v-if="message.comments && message.comments.length > 0" class="message-comments">
      <div v-for="(comment, index) in message.comments.slice(0, (showAllComment ? message.comments.length-1 : 2))" :key="index" class="comment">
        <div class="comment-header">
          <span class="comment-time">{{ formatTime(comment.timestamp) }}</span>
        </div>
        <p class="comment-text">{{ comment.text }}</p>
        <div v-if="comment.files && comment.files.length > 0" class="comment-files">
          <div
            v-for="(file, fileIndex) in comment.files"
            :key="fileIndex"
            class="comment-file-item"
            @click="openFilePreview(fileIndex, comment.files)"
          >
            <i class="bi bi-file-earmark"></i>
            <span>{{ getFileName(file) }}</span>
          </div>
        </div>
      </div>
      <div v-if="message.comments.length > 2 && !showAllComment" class="show-more">
        <router-link :to="`/wall/message/${message.id}`">
          查看全部 {{ message.comments.length }} 条评论
        </router-link>
      </div>
    </div>

    <!-- 文件预览模态框 -->
    <FilePreviewModal
      ref="filePreviewModal"
      :files="previewFiles"
      :initial-index="previewIndex"
    />
  </div>
</template>

<script setup>
import { ref, nextTick, inject } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

import FilePreviewModal from './FilePreviewModal.vue'
import UserCardSimple from './UserCardSimple.vue'

import api from '../services/api'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const props = defineProps({
  message: {
    type: Object,
    required: true
  },
  showAllComment: {
    type: Boolean,
    default: false
  },
  commentContainerMaxHeight: {
    type: String,
    default: '200px'
  },
  publisherInfo :{
    type: Object,
    default: {
      "id": null,
      "nickname": "匿名用户"
    }
  }
})

//console.log(props.message)

const emit = defineEmits(['refresh'])
const Alert = inject('Alert')

const router = useRouter()

const showMenu = ref(false)
const showCommentForm = ref(false)
const commentText = ref('')
const menuBtn = ref(null)
const menu = ref(null)
const filePreviewModal = ref(null)
const previewFiles = ref([])
const previewIndex = ref(0)

const staticUrl = import.meta.env.VITE_STATIC_URL || '/static/'



const handleLike = async (messageId) => {

  try {
    const response = await api.likeMessage(messageId)

    if (response.data.success) {
      if(response.data.action === 'like') {
        props.message.liked = true
        props.message.likes = response.data.likes

      } else {
        props.message.liked = false
        props.message.likes = response.data.likes

      }
    } else {
      Alert.showCenterAlert('点赞失败: ' + (response.data.error || '未知错误'), 'error', "错误")
      console.log('点赞失败', response)
    }
  } catch (error) {
    Alert.showCenterAlert('点赞失败: ' + (error.response?.data?.error || '未知错误'), 'error', "错误")
    console.error('点赞失败:', error)
  }
}

const handleDislike = async (messageId) => {
  try {
    const response = await api.dislikeMessage(messageId)
    if (response.data.success) {
      if(response.data.action === 'dislike') {
        props.message.disliked = true
        props.message.dislikes = response.data.dislikes
      } else {
        props.message.disliked = false
        props.message.dislikes = response.data.dislikes
      }
    }
  } catch (error) {
    Alert.showCenterAlert('点踩失败: ' + (error.response?.data?.error || '未知错误'), 'error', "错误")
    console.error('点踩失败:', error)
  }
}

const handleComment = async (messageId, commentData) => {
  try {
    const response = await api.commentMessage(messageId, commentData)
    if (response.data.success) {
      props.message.comments.push(response.data.comment)
    } else {
      Alert.showCenterAlert('评论失败: ' + (response.data.error || '未知错误'), 'error', "错误")
    }
  } catch (error) {
    console.error('评论失败:', error)
    throw error
  }
}


const formatTime = (time) => {
  return dayjs().diff(dayjs(time), 'month')>2 ? time : dayjs(time).fromNow()
}

const handleClickTime = (event, time) => {
  event.target.textContent = event.target.textContent == time ? formatTime(time) : time
}
const getFileTinyUrl = (file) => {
  return staticUrl + 'tiny_files/' + file
}

const isImage = (file) => {
  const ext = file.split('.').pop().toLowerCase()
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)
}

const isVideo = (file) => {
  const ext = file.split('.').pop().toLowerCase()
  return ['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv'].includes(ext)
}

const isPdf = (file) => {
  const ext = file.split('.').pop().toLowerCase()
  return ext === 'pdf'
}

const isOfficeFile = (file) => {
  const ext = file.split('.').pop().toLowerCase()
  return ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)
}

const isArchiveFile = (file) => {
  const ext = file.split('.').pop().toLowerCase()
  return ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)
}

const getFileIcon = (file) => {
  const ext = file.split('.').pop().toLowerCase()
  
  const iconMap = {
    // 图片
    'jpg': 'bi bi-file-earmark-image',
    'jpeg': 'bi bi-file-earmark-image',
    'png': 'bi bi-file-earmark-image',
    'gif': 'bi bi-file-earmark-image',
    'webp': 'bi bi-file-earmark-image',
    // 视频
    'mp4': 'bi bi-file-earmark-play',
    'webm': 'bi bi-file-earmark-play',
    'mov': 'bi bi-file-earmark-play',
    'avi': 'bi bi-file-earmark-play',
    // 文档
    'pdf': 'bi bi-file-earmark-pdf',
    'doc': 'bi bi-file-earmark-word',
    'docx': 'bi bi-file-earmark-word',
    'xls': 'bi bi-file-earmark-excel',
    'xlsx': 'bi bi-file-earmark-excel',
    'ppt': 'bi bi-file-earmark-ppt',
    'pptx': 'bi bi-file-earmark-ppt',
    // 压缩包
    'zip': 'bi bi-file-earmark-zip',
    'rar': 'bi bi-file-earmark-zip',
    '7z': 'bi bi-file-earmark-zip',
    // 代码
    'js': 'bi bi-file-earmark-code',
    'py': 'bi bi-file-earmark-code',
    'java': 'bi bi-file-earmark-code',
    'html': 'bi bi-file-earmark-code',
    'css': 'bi bi-file-earmark-code',
    // 音频
    'mp3': 'bi bi-file-earmark-music',
    'wav': 'bi bi-file-earmark-music',
    'flac': 'bi bi-file-earmark-music'
  }
  
  return iconMap[ext] || 'bi bi-file-earmark'
}

const getFileTypeLabel = (file) => {
  const ext = file.split('.').pop().toUpperCase()
  
  const typeMap = {
    'JPG': '图片',
    'JPEG': '图片',
    'PNG': '图片',
    'GIF': 'GIF',
    'WEBP': '图片',
    'MP4': '视频',
    'WEBM': '视频',
    'MOV': '视频',
    'AVI': '视频',
    'PDF': 'PDF',
    'DOC': 'Word',
    'DOCX': 'Word',
    'XLS': 'Excel',
    'XLSX': 'Excel',
    'PPT': 'PPT',
    'PPTX': 'PPT',
    'ZIP': '压缩包',
    'RAR': '压缩包',
    '7Z': '压缩包'
  }
  
  return typeMap[ext] || ext
}

const getFileName = (file) => {
  return file.split('_').pop()
}

const toggleMenu = () => {
  showMenu.value = !showMenu.value
}

const closeMenu = () => {
  showMenu.value = false
}

const handleReport = () => {
  closeMenu()
  router.push(`/help/report/${props.message.id}`)
}

const handleRefresh = () => {
  closeMenu()
  emit('refresh', props.message.id)
}



const handleShare = () => {
  closeMenu()
  const url = window.location.origin + `/wall/message/${props.message.id}`
  navigator.clipboard.writeText(url).then(() => {
    Alert.showCenterAlert('链接已复制到剪贴板', 'success', "成功")
  }).catch(() => {
    Alert.showCenterAlert('复制失败，请手动复制链接', 'error', "错误")
  })
}

const toggleCommentForm = () => {
  showCommentForm.value = !showCommentForm.value
  if (showCommentForm.value) {
    nextTick(() => {
      const input = document.querySelector('.comment-input')
      if (input) input.focus()
    })
  }
}

const submitInlineComment = async () => {
  if (!commentText.value.trim()) return

  try {
    handleComment(props.message.id, {
      text: commentText.value,
      files: []
    })
    commentText.value = ''
    showCommentForm.value = false
  } catch (error) {
    console.error('评论失败:', error)
    Alert.showCenterAlert('评论失败: ' + (error.response?.data?.error || '未知错误'), 'error', "错误")
  }
}

const openFilePreview = (index, files = null) => {
  previewFiles.value = files || props.message.files || []
  previewIndex.value = index
  if (filePreviewModal.value) {
    filePreviewModal.value.open()
  }
}

// 点击外部关闭菜单
nextTick(() => {
  document.addEventListener('click', (e) => {
    if (showMenu.value && menuBtn.value && menu.value) {
      if (!menuBtn.value.contains(e.target) && !menu.value.contains(e.target)) {
        closeMenu()
      }
    }
  })
})
</script>

<style scoped>
:root {
  --primary-color: #6A0DAD;
  --primary-light: rgba(106, 13, 173, 0.1);
  --primary-dark: #5a0b91;
}

.message-card {
  background: var(--card-bg, white);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
}

.message-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.card-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color, #e0e0e0);
  display: flex;
  align-items: center;
  gap: 10px;
}

.message-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.message-id {
  font-weight: 600;
  color: var(--primary-color);
  font-size: 0.95rem;
}

.message-time {
  color: var(--text-secondary, #999);
  font-size: 0.875rem;
}

.card-actions {
  position: relative;
}

.action-menu-btn {
  background: none;
  border: none;
  color: var(--text-secondary, #666);
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-menu-btn:hover {
  background: var(--hover-bg, rgba(106, 13, 173, 0.05));
  color: var(--primary-color);
}

.action-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background: var(--card-bg, white);
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 120px;
  z-index: 1000;
  overflow: hidden;
}

.menu-item {
  width: 100%;
  padding: 10px 16px;
  background: none;
  border: none;
  color: var(--text-primary, #333);
  cursor: pointer;
  text-align: left;
  font-size: 0.9rem;
  transition: background 0.3s;
  display: flex;
  align-items: center;
}

.menu-item:hover {
  background: var(--hover-bg, rgba(106, 13, 173, 0.05));
}

.card-body {
  padding: 20px;
}

.message-text {
  margin: 0;
  line-height: 1.7;
  color: var(--text-primary, #333);
  white-space: pre-wrap;
  word-wrap: break-word;
  font-size: 1rem;
}

.message-files {
  margin-top: 16px;
}

.files-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
}

.file-item {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  aspect-ratio: 1;
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
  
  max-width: 100px;
}

.file-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.file-link {
  width: 100%;
  height: 100%;
  display: block;
}

.file-image-wrapper {
  overflow: hidden;
}

.file-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.file-item:hover .file-image {
  transform: scale(1.05);
}

.file-media-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-thumbnail {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--bg-color, #f5f5f5);
  color: var(--text-secondary, #666);
  border-radius: 8px;
  transition: all 0.3s;
  position: relative;
}

.file-thumbnail::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(106, 13, 173, 0.1) 0%, rgba(106, 13, 173, 0.05) 100%);
  opacity: 0;
  transition: opacity 0.3s;
}

.file-item:hover .file-thumbnail::before {
  opacity: 1;
}

.file-thumbnail i {
  font-size: 2.5rem;
  margin-bottom: 8px;
  z-index: 1;
  transition: transform 0.3s;
}

.file-item:hover .file-thumbnail i {
  transform: scale(1.1);
}

.file-type-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary, #666);
  text-align: center;
  z-index: 1;
}

/* 视频缩略图 */
.file-thumbnail {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #e94560;
}

.file-thumbnail i.bi-play-circle-fill {
  font-size: 3rem;
}

.file-thumbnail.video {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #e94560;
}

/* PDF 缩略图 */
.file-thumbnail.pdf {
  background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
  color: white;
}

.file-thumbnail.pdf i {
  font-size: 2.5rem;
}

/* Office 文件缩略图 */
.file-thumbnail.office {
  background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
  color: white;
}

.file-thumbnail.office i {
  font-size: 2.5rem;
}

/* 压缩包缩略图 */
.file-thumbnail.archive {
  background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%);
  color: white;
}

.file-thumbnail.archive i {
  font-size: 2.5rem;
}

/* 其他文件缩略图 */
.file-thumbnail.other {
  background: linear-gradient(135deg, #9E9E9E 0%, #757575 100%);
  color: white;
}

.file-thumbnail.other i {
  font-size: 2.5rem;
}

.message-tags {
  margin-top: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-badge {
  display: inline-block;
  padding: 4px 12px;
  background: var(--primary-light);
  color: var(--primary-color);
  border-radius: 15px;
  font-size: 0.875rem;
  text-decoration: none;
  transition: all 0.3s;
  font-weight: 500;
}

.tag-badge:hover {
  background: var(--primary-color);
  color: white;
}

.card-footer {
  padding: 12px 20px;
  border-top: 1px solid var(--border-color, #e0e0e0);
  display: flex;
  gap: 16px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: none;
  border: none;
  color: var(--text-secondary, #666);
  cursor: pointer;
  border-radius: 8px;
  font-size: 0.9rem;
  transition: all 0.3s;
}

.action-btn:hover {
  background: var(--primary-light);
  color: var(--primary-color);
}

.action-btn.active {
  background: var(--primary-color);
  color: white;
}

.action-btn.active i {
  color: white;
}

/* 内联评论表单 */
.inline-comment-form {
  padding: 16px 20px;
  background: var(--bg-color, #f5f5f5);
  border-top: 1px solid var(--border-color, #e0e0e0);
}

.comment-input {
  width: 100%;
  padding: 12px;
  border: 2px solid var(--border-color, #e0e0e0);
  border-radius: 8px;
  font-size: 0.95rem;
  resize: none;
  margin-bottom: 12px;
  transition: border-color 0.3s;
  background: var(--card-bg, white);
}

.comment-input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.comment-actions {
  display: flex;
  justify-content: flex-end;
}

.btn-submit {
  padding: 8px 20px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s;
}

.btn-submit:hover {
  background: var(--primary-dark);
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.message-comments {
  padding: 16px 20px;
  background: transparent;
  border-top: 1px solid var(--border-color);
  max-height: v-bind(commentContainerMaxHeight);
  overflow-y: scroll;

}

.comment {
  padding: 12px;
  background: var(--card-secondary-bg);
  border-radius: 8px;
  margin-bottom: 12px;
  border: 1px solid var(--border-color);
}

.comment:last-child {
  margin-bottom: 0;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.comment-id {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--primary-color);
}

.comment-time {
  font-size: 0.75rem;
  color: var(--text-secondary, #999);
}

.comment-text {
  margin: 0;
  line-height: 1.5;
  font-size: 0.9rem;
  color: var(--text-primary, #333);
  white-space: pre-wrap;
}

.comment-files {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.comment-file-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--bg-color, #f5f5f5);
  border-radius: 6px;
  color: var(--text-secondary, #666);
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.3s;
}

.comment-file-item:hover {
  background: var(--primary-light);
  color: var(--primary-color);
}

.show-more {
  text-align: center;
  margin-top: 12px;
}

.show-more a {
  color: var(--primary-color);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
}

.show-more a:hover {
  text-decoration: underline;
}

/* 响应式 */
@media (max-width: 768px) {
  .files-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
    gap: 8px;
  }


  .file-item {
    max-width: 50px;
  }

  .card-footer {
    gap: 12px;
  }

  .action-btn {
    padding: 6px 12px;
    font-size: 0.85rem;
  }
}

@media (max-width: 576px) {
  .card-header,
  .card-body,
  .card-footer,
  .message-comments,
  .inline-comment-form {
    padding: 14px 16px;
  }


  .message-files {
    margin-top: 12px;
  }

  .message-tags {
    margin-top: 12px;
  }
}
</style>