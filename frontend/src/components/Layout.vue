<template>
  <div :class="['app-layout', theme]">
    <!-- 页面加载动画 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">加载中...</span>
        </div>
        <p class="loading-text">加载中...</p>
      </div>
    </div>

    <!-- 顶部导航栏 -->
    <div class="top-navbar">
      <div class="navbar-content">
        <div class="navbar-left">
          <button class="sidebar-toggle" @click="toggleSidebar" v-if="isMobile">
            <i class="bi bi-list"></i>
          </button>
          <div class="logo">
            <i class="bi bi-house-door me-2"></i>
            <span>龙*高校园墙</span>
          </div>
        </div>

        <div class="navbar-right">
          <button class="theme-toggle" @click="toggleTheme" :title="theme === 'light' ? '切换到深色模式' : '切换到浅色模式'">
            <i class="bi" :class="theme === 'light' ? 'bi-moon-stars' : 'bi-sun'"></i>
          </button>
          <button v-if="showPublishButton" @click="handlePublishClick" class="btn-publish">
            <i class="bi bi-pencil-square me-1"></i>
            我要发贴
          </button>
        </div>
      </div>
    </div>

    <!-- 左侧边栏 -->
    <div class="sidebar" :class="{ 'sidebar-open': sidebarOpen, 'sidebar-mobile': isMobile }">
      <div class="sidebar-content">
        <nav class="sidebar-nav">
          <router-link
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="nav-item"
            :class="{ 'nav-active': isActive(item.path) }"
            @click="handleNavClick"
          >
            <i :class="item.icon"></i>
            <span>{{ item.label }}</span>
          </router-link>
        </nav>
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="main-content" :class="{ 'sidebar-open': sidebarOpen && !isMobile }">
      <div class="content-wrapper">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </div>

    <!-- 遮罩层（移动端） -->
    <div v-if="isMobile && sidebarOpen" class="sidebar-overlay" @click="toggleSidebar"></div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const theme = ref(localStorage.getItem('theme') || 'light')
const sidebarOpen = ref(false)
const isMobile = ref(window.innerWidth < 992)
const shouldOpenPublishModal = ref(false)

const navItems = [
  { path: '/', label: '首页', icon: 'bi bi-house' },
  { path: '/wall', label: '校园墙', icon: 'bi bi-chat-quote' },
  { path: '/apps', label: '应用广场', icon: 'bi bi-grid' },
  { path: '/help', label: '帮助', icon: 'bi bi-question-circle' }
  /*
  { path: '/p', label: '分区', icon: 'bi bi-tag' },
  { path: '/admin', label: '管理后台', icon: 'bi bi-gear', requiresAuth: true }
   */
]

const currentPageTitle = computed(() => {
  const titles = {
    '/': '首页',
    '/wall': '校园墙',
    '/apps': '应用广场',
    '/help': '帮助中心',
    '/p': '分区',
    '/admin': '管理后台'
  }
  for (const [path, title] of Object.entries(titles)) {
    if (route.path.startsWith(path)) {
      return title
    }
  }
  return '龙高校园墙'
})

const showPublishButton = computed(() => {
  return route.path !== '/wall'
})

const isActive = (path) => {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

const toggleTheme = () => {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
  localStorage.setItem('theme', theme.value)
  document.documentElement.setAttribute('data-theme', theme.value)
}

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

const handleNavClick = () => {
  if (isMobile.value) {
    sidebarOpen.value = false
  }
}

const handlePublishClick = () => {
  if (route.path !== '/wall') {
    shouldOpenPublishModal.value = true
    router.push('/wall')
  } else {
    // 触发全局事件，通知 Wall 组件打开模态框
    const event = new CustomEvent('open-publish-modal')
    window.dispatchEvent(event)
  }
}

const handleResize = () => {
  isMobile.value = window.innerWidth < 992
  if (!isMobile.value) {
    sidebarOpen.value = true
  }
}

watch(() => route.path, (newPath) => {
  if (newPath === '/wall' && shouldOpenPublishModal.value) {
    setTimeout(() => {
      const event = new CustomEvent('open-publish-modal')
      window.dispatchEvent(event)
      shouldOpenPublishModal.value = false
    }, 100)
  }
})

onMounted(() => {
  document.documentElement.setAttribute('data-theme', theme.value)
  sidebarOpen.value = !isMobile.value

  setTimeout(() => {
    loading.value = false
  }, 500)

  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

watch(theme, (newTheme) => {
  document.documentElement.setAttribute('data-theme', newTheme)
})
</script>

<style scoped>
:root {
  --primary-color: #6A0DAD;
  --primary-light: rgba(106, 13, 173, 0.1);
  --sidebar-width: 250px;
  --navbar-height: 64px;
  --content-max-width: 1200px;
}

[data-theme="light"] {
  --bg-color: #f5f5f5;
  --card-bg: #ffffff;
  --text-primary: #333333;
  --text-secondary: #666666;
  --border-color: #e0e0e0;
  --sidebar-bg: #ffffff;
  --navbar-bg: #ffffff;
}

[data-theme="dark"] {
  --bg-color: #1a1a1a;
  --card-bg: #2d2d2d;
  --text-primary: #ffffff;
  --text-secondary: #cccccc;
  --border-color: #404040;
  --sidebar-bg: rgba(255, 255, 255, 0);
  --navbar-bg: #2d2d2d;
}

.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-color);
  color: var(--text-primary);
  transition: background-color 0.3s, color 0.3s;
}

/* 加载动画 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--bg-color);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.3s ease-in;
}

.loading-spinner {
  text-align: center;
}

.loading-text {
  margin-top: 1rem;
  color: var(--text-secondary);
  font-size: 1.1rem;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 顶部导航栏 */
.top-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--navbar-height);
  border-bottom: 1px solid var(--border-color);
  z-index: 1000;
  transition: background-color 0.3s, border-color 0.3s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0);
  backdrop-filter: blur(10px); 
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.navbar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 20px;
  max-width: var(--content-max-width);
  margin: 0 auto;
}

.navbar-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.sidebar-toggle {
  background: none;
  border: none;
  color: var(--text-primary);
  font-size: 1.5rem;
  cursor: pointer;
  padding: 8px;
  transition: color 0.3s;
}

.sidebar-toggle:hover {
  color: var(--primary-color);
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--primary-color);
}

.navbar-center {
  flex: 1;
  text-align: center;
}

.page-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-primary);
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.theme-toggle {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 1.25rem;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.3s;
}

.theme-toggle:hover {
  background-color: var(--primary-light);
  color: var(--primary-color);
}

.btn-publish {
  background-color: var(--primary-color);
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(106, 13, 173, 0.3);
}

.btn-publish:hover {
  background-color: #5a0b91;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(106, 13, 173, 0.4);
}

/* 左侧边栏 */
.sidebar {
  position: fixed;
  top: var(--navbar-height);
  left: 0;
  bottom: 0;
  width: var(--sidebar-width);
  background-color: var(--sidebar-bg);
  border-right: 1px solid var(--border-color);
  transition: all 0.3s ease-in-out;
  z-index: 999;
  overflow-y: auto;
}

.sidebar.sidebar-mobile {
  transform: translateX(-100%);
}

.sidebar.sidebar-mobile.sidebar-open {
  transform: translateX(0);
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
}

.sidebar-content {
  padding: 20px 0;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 24px;
  color: var(--text-secondary);
  text-decoration: none;
  border-radius: 8px;
  margin: 0 12px;
  transition: all 0.3s;
  font-size: 0.95rem;
}

.nav-item:hover {
  background-color: var(--primary-light);
  color: var(--primary-color);
}

.nav-item.nav-active {
  background-color: var(--primary-color);
  color: white;
}

.nav-item i {
  font-size: 1.1rem;
  width: 20px;
  text-align: center;
}

/* 主内容区域 */
.main-content {
  margin-top: var(--navbar-height);
  margin-left: 0;
  min-height: calc(100vh - var(--navbar-height));
  transition: margin-left 0.3s ease-in-out;
}

.main-content.sidebar-open {
  margin-left: var(--sidebar-width);
}

.content-wrapper {
  padding: 24px;
  max-width: var(--content-max-width);
  margin: 0 auto;
}

/* 遮罩层 */
.sidebar-overlay {
  position: fixed;
  top: var(--navbar-height);
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 998;
  animation: fadeIn 0.3s ease-in;
}

/* 页面切换动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 响应式设计 */
@media (min-width: 992px) {
  .sidebar {
    transform: translateX(0) !important;
  }
}

@media (max-width: 991px) {
  .navbar-center {
    display: none;
  }

  .content-wrapper {
    padding: 16px;
  }
}

@media (max-width: 576px) {
  .navbar-content {
    padding: 0 15px;
  }

  .logo span {
    display: none;
  }

  .logo i {
    font-size: 1.5rem;
  }

  .btn-publish {
    padding: 6px 12px;
    font-size: 0.9rem;
  }

  .btn-publish span {
    display: none;
  }
}
</style>