<template>
  <div class="home-page">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-content">
        <div class="hero-text">
          <h1 class="hero-title">欢迎来到</h1>
          <h2 class="hero-subtitle">龙 * 高级中学</h2>
          <h3 class="hero-subtitle-light">校园墙</h3>
          <div class="run-time">
            <span class="run-time-label">本站已运行</span>
            <span class="run-time-value">{{ runTime.days }}</span>天
            <span class="run-time-value">{{ runTime.hours }}</span>小时
            <span class="run-time-value">{{ runTime.minutes }}</span>分钟
            <span class="run-time-value">{{ runTime.seconds }}</span>秒
          </div>
          <router-link to="/wall" class="hero-button">
            <i class="bi bi-arrow-right-circle me-2"></i>
            前往龙高校园墙
          </router-link>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="features-section">
      <div class="section-header">
        <h2>功能特色</h2>
        <p>让校园墙再次伟大!</p>
      </div>
      <div class="features-grid g-4">

          <div class="feature-card">
            <div class="feature-icon">
              <i class="bi bi-speedometer2"></i>
            </div>
            <h3>即刻发表</h3>
            <p>只需一步，轻松完成发言！无需等待，快速分享你的心声。</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">
              <i class="bi bi-heart-fill"></i>
            </div>
            <h3>互动交流</h3>
            <p>点赞、评论、分享，与同学们实时互动，畅所欲言。</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">
              <i class="bi bi-cloud-upload"></i>
            </div>
            <h3>多媒体支持</h3>
            <p>支持图片、视频、音频等多种格式，让你的表达更生动。</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">
              <i class="bi bi-shield-check"></i>
            </div>
            <h3>安全可靠</h3>
            <p>完善的管理系统，确保平台安全，营造良好的交流环境。</p>
          </div>
        </div>
    </section>

    <!-- Quick Post Section -->
    <section class="quick-post-section">
      <div class="section-header">
        <h2>快速留言</h2>
        <p>发出你的第一条消息</p>
      </div>
      <div class="quick-post-card">
        <form @submit.prevent="handleQuickSubmit">
          <textarea
            v-model="quickText"
            class="quick-post-input"
            placeholder="想说什么就说什么..."
            rows="4"
          ></textarea>
          <button type="submit" class="btn-submit">
            <i class="bi bi-send me-2"></i>
            发布留言
          </button>
        </form>
      </div>
    </section>

    <!-- Hot Messages Section -->
    <section class="hot-messages-section">
      <div class="section-header">
        <h2>热门留言</h2>
        <p>看看大家在讨论什么</p>
      </div>
      <div v-if="loading" class="loading-state">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">加载中...</span>
        </div>
      </div>
      <div v-else-if="hotMessages.length === 0" class="empty-state">
        <i class="bi bi-inbox"></i>
        <p>暂无热门留言</p>
      </div>
      <div v-else class="hot-messages-grid">
        <div v-for="message in hotMessages" :key="message.id" class="message-card">
          <router-link :to="`/wall/message/${message.id}`" class="message-link">
            <p class="message-text">{{ message.text }}</p>
            <div class="message-footer">
              <span class="message-time">{{ formatTime(message.timestamp) }}</span>
              <div class="message-stats">
                <span><i class="bi bi-hand-thumbs-up"></i> {{ message.likes }}</span>
                <span><i class="bi bi-chat"></i> {{ message.comments?.length || 0 }}</span>
              </div>
            </div>
          </router-link>
        </div>
      </div>
    </section>

    <!-- About Section -->
    <section class="about-section">
      <div class="about-content">
        <h2>关于本站</h2>
        <p>本站由龙高一名学生搭建，旨在为同学们提供一个快捷自由表达的平台。</p>
        <div class="about-links">
          <a href="https://github.com/renzhen666666/campusWall" target="_blank" rel="noopener">
            <i class="bi bi-github"></i>
            GitHub
          </a>
          <a href="mailto:w-rz@outlook.com">
            <i class="bi bi-envelope"></i>
            联系站长
          </a>
        </div>
      </div>
    </section>

    <!-- Notice Modal -->
    <div class="modal fade" id="noticeModal" tabindex="-1" aria-labelledby="noticeModalLabel" aria-hidden="true" ref="noticeModal">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="noticeModalLabel">
              <i class="bi bi-megaphone me-2"></i>公告
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div v-if="noticeContent" v-html="noticeContent"></div>
            <div v-else class="text-muted">暂无公告</div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-primary" data-bs-dismiss="modal">知道了</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Modal } from 'bootstrap'
import api from '../services/api'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const runTime = ref({
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0
})

const hotMessages = ref([])
const loading = ref(true)
const quickText = ref('')
const noticeContent = ref('')
const noticeModal = ref(null)

let runTimeInterval = null

const updateRunTime = () => {
  const startDate = new Date(2025,7,21,13,37,11);
  const now = new Date()
  const diff = now - startDate
  runTime.value.days = Math.floor(diff / (1000 * 60 * 60 * 24))
  runTime.value.hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  runTime.value.minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  runTime.value.seconds = Math.floor((diff % (1000 * 60)) / 1000)
}

const loadHotMessages = async () => {
  try {
    const response = await api.getHotMessages()
    if (response.data.success) {
      hotMessages.value = response.data.messages || []
    }
  } catch (error) {
    console.error('加载热门留言失败:', error)
  } finally {
    loading.value = false
  }
}

const handleQuickSubmit = async () => {
  if (!quickText.value.trim()) {
    alert('请输入内容')
    return
  }
  try {
    await api.submitMessage({
      text: quickText.value,
      tags: [],
      filenames: []
    })
    quickText.value = ''
    alert('提交成功!')
    loadHotMessages()
  } catch (error) {
    console.error('提交失败:', error)
    alert('提交失败: ' + (error.response?.data?.error || '未知错误'))
  }
}

const loadNotice = async () => {
  try {
    const response = await api.getNotice()
    if (response.data.success) {
      noticeContent.value = response.data.content
    }
  } catch (error) {
    console.error('加载公告失败:', error)
  }
}

const showNoticeModal = () => {
  const today = new Date()
  const month = today.getFullYear() + '-' + (today.getMonth() + 1)
  const hasVisited = localStorage.getItem('hasVisitedWall' + month)
  if (!hasVisited && noticeContent.value && noticeModal.value) {
    const modal = new Modal(noticeModal.value)
    modal.show()
    localStorage.setItem('hasVisitedWall' + month, 'true')
  }
}

const formatTime = (time) => {
  return dayjs(time).fromNow()
}

onMounted(() => {
  updateRunTime()
  runTimeInterval = setInterval(updateRunTime, 1000)
  loadHotMessages()
  loadNotice()
  showNoticeModal()
})

onUnmounted(() => {
  if (runTimeInterval) {
    clearInterval(runTimeInterval)
  }
})
</script>

<style scoped>
.home-page {
  width: 100%;
  gap:10px;
}

:root {
  --primary-color: #6A0DAD;
  --primary-light: rgba(106, 13, 173, 0.1);
  --primary-dark: #5a0b91;
}

/* Hero Section */
.hero-section {
  background: linear-gradient(45deg, var(--primary-color),var(--primary-dark));
  padding: 80px 0;
  text-align: center;
  color: white;

  display: flex;
  flex-direction: column;
  align-items: center;
}

.hero-content {
  max-width: 800px;
  margin: 0 auto;
}

.hero-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.hero-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.hero-subtitle {
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.hero-subtitle-light {
  font-size: 1.75rem;
  font-weight: 400;
  margin-bottom: 2rem;
}

.run-time {
  font-size: 1.1rem;
  margin-bottom: 2rem;
  padding: 15px 25px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50px;
  display: inline-block;
  backdrop-filter: blur(10px);
}

.run-time-label {
  margin-right: 10px;
}

.run-time-value {
  font-weight: 700;
  color: #ffd700;
  margin: 0 5px;
}

.hero-button {
  display: inline-flex;
  align-items: center;
  padding: 15px 40px;
  background: white;
  color: var(--primary-color);
  text-decoration: none;
  border-radius: 50px;
  font-size: 1.1rem;
  font-weight: 600;
  transition: all 0.3s;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.hero-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

/* Sections */
section {
  padding: 60px 0;
  border-radius: 16px;
}

.section-header {
  text-align: center;
  margin-bottom: 40px;
}

.section-header h2 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--primary-color);
  margin-bottom: 0.5rem;
}

.section-header p {
  color: #666;
  font-size: 1.1rem;
}

/* Features Section */
.features-section {
  background: transparent;
}

.features-grid {
  display:flex;
  flex-wrap: wrap;
  justify-content: space-between;

  gap: 30px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}


.feature-card {
  background: var(--card-bg);
  border-radius: 15px;
  text-align: center;
  transition: all 0.3s;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);

  padding: 15px 5px;
  max-width: 200px;
}


.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(106, 13, 173, 0.15);
}

.feature-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 10px;
  background: var(--primary-light);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: var(--primary-color);
}

.feature-card h3 {
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 15px;
  color: var(--text-primary);
}

.feature-card p {
  color: var(--text-secondary);
  line-height: 1.6;
}

/* Quick Post Section */
.quick-post-section {
  background: transparent;
}

.quick-post-card {
  max-width: 800px;
  margin: 0 auto;
  background: var(--card-bg, #f5f5f5);
  padding: 40px;
  border-radius: 15px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.quick-post-input {
  width: 100%;
  padding: 15px;
  border: 2px solid var(--border-color, #e0e0e0);
  border-radius: 10px;
  font-size: 1rem;
  resize: none;
  margin-bottom: 20px;
  transition: border-color 0.3s;
}

.quick-post-input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.btn-submit {
  width: 100%;
  padding: 15px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-submit:hover {
  background: var(--primary-dark);
  transform: translateY(-2px);
}

/* Hot Messages Section */
.hot-messages-section {
  background: var(--bg-color, #f5f5f5);
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 60px 0;
  color: #999;
}

.empty-state i {
  font-size: 4rem;
  display: block;
  margin-bottom: 20px;
}

.hot-messages-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.message-card {
  background: var(--card-bg);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
}

.message-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.message-link {
  display: block;
  padding: 20px;
  text-decoration: none;
  color: inherit;
}

.message-text {
  margin: 0 0 15px;
  color: var(--text-primary);
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.message-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.message-time {
  font-size: 0.875rem;
  color: #999;
}

.message-stats {
  display: flex;
  gap: 15px;
  font-size: 0.875rem;
  color: #666;
}

.message-stats i {
  margin-right: 5px;
}

/* About Section */
.about-section {
  background: var(--primary-color);
  color: white;
  text-align: center;
}

.about-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
}

.about-content h2 {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 20px;
}

.about-content > p {
  font-size: 1.1rem;
  line-height: 1.8;
  margin-bottom: 30px;
}

.about-links {
  display: flex;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
}

.about-links a {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 25px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  text-decoration: none;
  border-radius: 50px;
  transition: all 0.3s;
  backdrop-filter: blur(10px);
}

.about-links a:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

/* Modal */
.modal-content {
  border-radius: 15px;
  border: none;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.modal-header {
  background: var(--primary-light);
  border-bottom: 1px solid rgba(106, 13, 173, 0.1);
}

.modal-title {
  color: var(--primary-color);
  font-weight: 600;
}

.btn-primary {
  background: var(--primary-color);
  border-color: var(--primary-color);
}

.btn-primary:hover {
  background: var(--primary-dark);
  border-color: var(--primary-dark);
}

/* Responsive */
@media (max-width: 400px) {
  section {
    border-radius: 25px;
  }
  .hero-section {
    height: auto;
    padding-top: 50px;
    padding-bottom: 50px;
  }
  .hero-content {
    row-gap: 15px;
  }
  .hero-text {
    row-gap: 5px;
  }
  .features-grid {
    row-gap: 10px;
    padding: 0 10px;
  }
  .feature-card {
    width: 45%;
  }
}


@media (max-width: 768px) {
  .hero-title {
    font-size: 2rem;
  }

  .hero-subtitle {
    font-size: 1.5rem;
  }

  .hero-subtitle-light {
    font-size: 1.25rem;
  }

  .run-time {
    font-size: 0.9rem;
    padding: 10px 15px;
  }

  .hero-button {
    padding: 12px 30px;
    font-size: 1rem;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .hot-messages-grid {
    grid-template-columns: 1fr;
  }

  .about-links {
    flex-direction: column;
    align-items: center;
  }
  .feature-card {
    width: 45%;
  }
}




@media (min-width: 993px) {
  section {
    border-radius: 16px;
  }
}
</style>