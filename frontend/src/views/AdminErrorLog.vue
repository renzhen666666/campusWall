<template>
  <div class="admin-error-log-page">
    <div class="container-fluid">
      <div class="row">
        <div class="col-md-3 col-lg-2 bg-dark text-white p-3">
          <div class="sidebar">
            <h4 class="mb-4">管理后台</h4>
            <ul class="nav flex-column">
              <li class="nav-item mb-2">
                <router-link to="/admin" class="nav-link text-white">
                  <i class="bi bi-speedometer2 me-2"></i>仪表盘
                </router-link>
              </li>
              <li class="nav-item mb-2">
                <router-link to="/admin/wall" class="nav-link text-white">
                  <i class="bi bi-chat-quote me-2"></i>留言管理
                </router-link>
              </li>
              <li class="nav-item mb-2">
                <router-link to="/admin/notice" class="nav-link text-white">
                  <i class="bi bi-megaphone me-2"></i>公告管理
                </router-link>
              </li>
              <li class="nav-item mb-2">
                <router-link to="/admin/report" class="nav-link text-white">
                  <i class="bi bi-flag me-2"></i>举报管理
                </router-link>
              </li>
              <li class="nav-item mb-2">
                <router-link to="/admin/log" class="nav-link text-white">
                  <i class="bi bi-file-text me-2"></i>日志查看
                </router-link>
              </li>
              <li class="nav-item mb-2">
                <router-link to="/admin/error_log" class="nav-link text-white active">
                  <i class="bi bi-exclamation-triangle me-2"></i>错误日志
                </router-link>
              </li>
            </ul>
            <hr class="my-4">
            <button class="btn btn-outline-light w-100" @click="handleLogout">
              <i class="bi bi-box-arrow-right me-2"></i>退出登录
            </button>
          </div>
        </div>
        <div class="col-md-9 col-lg-10 p-4">
          <div class="admin-content">
            <div class="d-flex justify-content-between align-items-center mb-4">
              <h2>错误日志</h2>
              <div class="d-flex gap-2">
                <div class="input-group" style="width: 300px;">
                  <input 
                    type="text" 
                    class="form-control" 
                    v-model="searchQuery" 
                    placeholder="搜索错误..."
                    @keyup.enter="loadLogs"
                  >
                  <button class="btn btn-primary" @click="loadLogs">
                    <i class="bi bi-search"></i>
                  </button>
                </div>
                <button class="btn btn-outline-primary" @click="loadLogs">
                  <i class="bi bi-arrow-clockwise"></i> 刷新
                </button>
              </div>
            </div>

            <!-- 统计卡片 -->
            <div class="row mb-4">
              <div class="col-md-3">
                <div class="card stat-card">
                  <div class="card-body text-center">
                    <h3 class="text-danger">{{ logs.length }}</h3>
                    <p class="text-muted mb-0">错误日志数</p>
                  </div>
                </div>
              </div>
              <div class="col-md-3">
                <div class="card stat-card">
                  <div class="card-body text-center">
                    <h3 class="text-warning">{{ todayErrors }}</h3>
                    <p class="text-muted mb-0">今日错误</p>
                  </div>
                </div>
              </div>
              <div class="col-md-3">
                <div class="card stat-card">
                  <div class="card-body text-center">
                    <h3 class="text-info">{{ httpErrors }}</h3>
                    <p class="text-muted mb-0">HTTP错误</p>
                  </div>
                </div>
              </div>
              <div class="col-md-3">
                <div class="card stat-card">
                  <div class="card-body text-center">
                    <h3 class="text-secondary">{{ systemErrors }}</h3>
                    <p class="text-muted mb-0">系统错误</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- 日志列表 -->
            <div class="card">
              <div class="card-body p-0">
                <div v-if="loading" class="text-center py-5">
                  <div class="spinner-border text-primary" role="status"></div>
                  <p class="mt-2 text-muted">加载中...</p>
                </div>
                <div v-else-if="logs.length === 0" class="text-center py-5 text-muted">
                  <i class="bi bi-check-circle fs-1 text-success"></i>
                  <p class="mt-2">暂无错误日志</p>
                </div>
                <div v-else class="log-container">
                  <div v-for="(log, index) in logs" :key="index" class="log-item">
                    <div class="log-index">{{ index + 1 }}</div>
                    <div class="log-content-wrapper">
                      <div class="log-content">{{ log }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../services/api'

const router = useRouter()

const loading = ref(false)
const logs = ref([])
const searchQuery = ref('')

const todayErrors = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return logs.value.filter(log => log.includes(today)).length
})

const httpErrors = computed(() => {
  return logs.value.filter(log => 
    log.includes('HTTP') || 
    log.includes('404') || 
    log.includes('500') || 
    log.includes('403')
  ).length
})

const systemErrors = computed(() => {
  return logs.value.filter(log => 
    log.includes('Error') || 
    log.includes('Exception') || 
    log.includes('Traceback')
  ).length
})

const handleLogout = async () => {
  localStorage.removeItem('admin_user')
  localStorage.removeItem('admin_password')
  router.push('/admin/login')
}

const loadLogs = async () => {
  loading.value = true
  try {
    const res = await api.adminGetLog(searchQuery.value)
    if (res.data) {
      logs.value = res.data.log_content || []
    }
  } catch (error) {
    console.error('加载错误日志失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadLogs()
})
</script>

<style scoped>
.admin-error-log-page {
  background-color: var(--bg-color);
  min-height: 100vh;
}

.sidebar {
  position: sticky;
  top: 0;
}

.nav-link {
  padding: 10px 15px;
  border-radius: 5px;
  transition: all 0.3s;
}

.nav-link:hover {
  background-color: rgba(255,255,255,0.1);
}

.nav-link.active {
  background-color: #6A0DAD;
}

.admin-content {
  background: var(--card-bg);
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.stat-card {
  border: none;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.log-container {
  max-height: 600px;
  overflow-y: auto;
}

.log-item {
  display: flex;
  padding: 12px 20px;
  border-bottom: 1px solid #eee;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
}

.log-item:hover {
  background-color: #fff8f8;
}

.log-item:last-child {
  border-bottom: none;
}

.log-index {
  color: #dc3545;
  min-width: 40px;
  margin-right: 15px;
  font-weight: bold;
}

.log-content-wrapper {
  flex: 1;
  overflow-x: auto;
}

.log-content {
  color: #333;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
