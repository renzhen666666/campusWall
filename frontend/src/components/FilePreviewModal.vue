<template>
  <Modal
    :visible="visible"
    :show-close="true"
    :close-on-overlay-click="true"
    :close-on-escape="true"
    @close="close"
    @update:visible="handleVisibleUpdate"
  >
    <!-- 左箭头 -->
    <button
      v-if="files.length > 1"
      class="nav-btn prev-btn"
      :class="{ disabled: currentIndex === 0 }"
      @click="prevFile"
      aria-label="上一个"
    >
      <i class="bi bi-chevron-left"></i>
    </button>

    <!-- 媒体容器 -->
    <div class="media-container">
      <!-- 图片 -->
      <img
        v-if="currentFileType === 'image'"
        :src="currentFileUrl"
        :alt="currentFileName"
        class="modal-image"
      >

      <!-- 视频 -->
      <video
        v-else-if="currentFileType === 'video'"
        :src="currentFileUrl"
        class="modal-video"
        controls
        autoplay
        loop
        ref="videoRef"
      ></video>

      <!-- PDF - 使用原生PDF查看器 -->
      <iframe
        v-else-if="currentFileType === 'pdf'"
        :src="currentFileUrl"
        class="modal-iframe"
        type="application/pdf"
      ></iframe>

      <!-- Office文档 - 使用微软在线预览 -->
      <iframe
        v-else-if="isOfficeFile(currentFile)"
        :src="getOfficeViewerUrl(currentFileUrl)"
        class="modal-iframe"
      ></iframe>

      <!-- 其他文件 - 显示文件信息 -->
      <div v-else class="file-info-container">
        <div class="file-icon-large">
          <i :class="getFileIcon(currentFile)"></i>
        </div>
        <h3 class="file-name">{{ currentFileName }}</h3>
        <button class="btn-download" @click="downloadFile">
          <i class="bi bi-download me-2"></i>下载文件
        </button>
      </div>
    </div>

    <!-- 右箭头 -->
    <button
      v-if="files.length > 1"
      class="nav-btn next-btn"
      :class="{ disabled: currentIndex === files.length - 1 }"
      @click="nextFile"
      aria-label="下一个"
    >
      <i class="bi bi-chevron-right"></i>
    </button>

    <!-- 底部信息栏 -->
    <template v-if="currentFileType !== 'other'" #footer>
      <div class="modal-info-bar">
        <div class="modal-text-group">
          <div class="modal-title">{{ currentFileName }}</div>
        </div>
        <div class="modal-counter">
          {{ currentIndex + 1 }} / {{ files.length }}
        </div>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import Modal from './Modal.vue'

const props = defineProps({
  files: {
    type: Array,
    default: () => []
  },
  initialIndex: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['close'])

const visible = ref(false)
const currentIndex = ref(0)
const videoRef = ref(null)

const staticUrl = import.meta.env.VITE_STATIC_URL || '/static/'

const currentFile = computed(() => {
  return props.files[currentIndex.value] || ''
})

const currentFileName = computed(() => {
  return currentFile.value.split('_').pop()
})

const currentFileUrl = computed(() => {
  return staticUrl + 'uploads/' + currentFile.value
})

const currentFileType = computed(() => {
  return getFileType(currentFile.value)
})

// 打开模态框
const open = () => {
  currentIndex.value = props.initialIndex
  visible.value = true
}

// 关闭模态框
const close = () => {
  if (videoRef.value) {
    videoRef.value.pause()
  }
  visible.value = false

  emit('close')
}

// 处理 visible 更新
const handleVisibleUpdate = (newVal) => {
  visible.value = newVal
  if (!newVal) {
    emit('close')
  }
}

// 切换到上一个文件
const prevFile = () => {
  if (currentIndex.value > 0) {
    pauseCurrentVideo()
    currentIndex.value--
  }
}

// 切换到下一个文件
const nextFile = () => {
  if (currentIndex.value < props.files.length - 1) {
    pauseCurrentVideo()
    currentIndex.value++
  }
}

// 暂停当前视频
const pauseCurrentVideo = () => {
  if (videoRef.value) {
    videoRef.value.pause()
  }
}

// 下载文件
const downloadFile = () => {
  const link = document.createElement('a')
  link.href = currentFileUrl.value
  link.download = currentFileName.value
  link.target = '_blank'
  link.click()
}

// 获取文件类型
const getFileType = (file) => {
  if (!file) return 'other'
  const ext = file.split('.').pop().toLowerCase()
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) {
    return 'image'
  } else if (['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv'].includes(ext)) {
    return 'video'
  } else if (ext === 'pdf') {
    return 'pdf'
  } else if (isOfficeFile({ ext })) {
    return 'office'
  } else {
    return 'other'
  }
}

// 判断是否为Office文档
const isOfficeFile = (file) => {
  const ext = typeof file === 'string' ? file.split('.').pop().toLowerCase() : file.ext
  return ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)
}

// 获取Office在线预览URL
const getOfficeViewerUrl = (fileUrl) => {
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`
}

// 获取文件图标
const getFileIcon = (file) => {
  if (!file) return 'bi bi-file-earmark'
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

// 键盘事件处理
const handleKeyDown = (e) => {
  if (!visible.value) return
  
  switch (e.key) {
    case 'ArrowLeft':
      prevFile()
      break
    case 'ArrowRight':
      nextFile()
      break
  }
}

// 监听索引变化,自动暂停视频
watch(() => [props.files, props.initialIndex],
  ([newFiles, newIndex]) => {
    if (visible.value) {
      // 如果模态框已经打开，更新当前索引
      currentIndex.value = Math.min(newIndex, newFiles.length - 1)
    }
  },
  { deep: true }
)

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
  close()
})

// 暴露方法给父组件
defineExpose({
  open,
  close
})
</script>

<style scoped>
:root {
  --primary-color: #6A0DAD;
  --primary-light: rgba(106, 13, 173, 0.1);
  --transition-speed: 0.3s;
}

/* 媒体容器 */
.media-container {
  width: 100%;
  height: auto;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #000;
  border-radius: 16px 16px 0 0;
  overflow: hidden;
  position: relative;
}

/* 图片 */
.modal-image {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  display: block;
}

/* 视频 */
.modal-video {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  outline: none;
  display: block;
}

/* iframe (PDF, Office文档) */
.modal-iframe {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}

/* 文件信息容器 */
.file-info-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;
  color: white;
  width: 100%;
  height: 100%;
}

.file-icon-large {
  font-size: 6rem;
  margin-bottom: 24px;
  opacity: 0.9;
}

.file-name {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 12px;
  max-width: 600px;
  word-break: break-all;
}

.file-meta {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 32px;
}

.btn-download {
  padding: 14px 32px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-download:hover {
  background: var(--primary-dark);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(106, 13, 173, 0.4);
}

/* 导航按钮 */
.nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 52px;
  height: 52px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  color: white;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  z-index: 15;
  backdrop-filter: blur(4px);
}

.nav-btn:hover:not(.disabled) {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-50%) scale(1.1);
}

.nav-btn.disabled {
  opacity: 0;
  pointer-events: none;
  cursor: default;
}

.prev-btn {
  left: 24px;
}

.next-btn {
  right: 24px;
}

/* 底部信息栏 */
.modal-info-bar {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 16px 24px;
  border-radius: 0 0 16px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-text-group {
  flex: 1;
  min-width: 0;
}

.modal-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #111;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.modal-desc {
  font-size: 0.9rem;
  color: #666;
  margin-top: 4px;
}

.modal-counter {
  font-size: 0.9rem;
  color: #888;
  margin-left: 20px;
  white-space: nowrap;
  background: rgba(0, 0, 0, 0.05);
  padding: 6px 12px;
  border-radius: 8px;
}

</style>