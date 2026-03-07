<template>
  <div class="admin-page">
    <div class="container-fluid">
      <div class="row">
        <div class="col-md-3 col-lg-2 bg-dark text-white p-3">
          <div class="sidebar">
            <h4 class="mb-4">管理后台</h4>
            <ul class="nav flex-column">
              <li class="nav-item mb-2">
                <router-link to="/admin" class="nav-link text-white" :class="{ active: $route.path === '/admin' }">
                  <i class="bi bi-speedometer2 me-2"></i>仪表盘
                </router-link>
              </li>
              <li class="nav-item mb-2">
                <router-link to="/admin/wall" class="nav-link text-white" :class="{ active: $route.path === '/admin/wall' }">
                  <i class="bi bi-chat-quote me-2"></i>留言管理
                </router-link>
              </li>
              <li class="nav-item mb-2">
                <router-link to="/admin/notice" class="nav-link text-white" :class="{ active: $route.path === '/admin/notice' }">
                  <i class="bi bi-megaphone me-2"></i>公告管理
                </router-link>
              </li>
              <li class="nav-item mb-2">
                <router-link to="/admin/report" class="nav-link text-white" :class="{ active: $route.path === '/admin/report' }">
                  <i class="bi bi-flag me-2"></i>举报管理
                </router-link>
              </li>
              <li class="nav-item mb-2">
                <router-link to="/admin/log" class="nav-link text-white" :class="{ active: $route.path === '/admin/log' }">
                  <i class="bi bi-file-text me-2"></i>日志查看
                </router-link>
              </li>
              <li class="nav-item mb-2">
                <router-link to="/admin/error_log" class="nav-link text-white" :class="{ active: $route.path === '/admin/error_log' }">
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
            <h2 class="mb-4">欢迎, {{ username }}</h2>
            
            <!-- 快捷操作 -->
            <div class="row g-4 mb-4">
              <div class="col-md-3">
                <router-link to="/admin/wall" class="text-decoration-none">
                  <div class="card quick-card">
                    <div class="card-body text-center">
                      <i class="bi bi-chat-quote fs-1 text-primary"></i>
                      <h5 class="mt-2">留言管理</h5>
                      <small class="text-muted">审核和管理留言</small>
                    </div>
                  </div>
                </router-link>
              </div>
              <div class="col-md-3">
                <router-link to="/admin/notice" class="text-decoration-none">
                  <div class="card quick-card">
                    <div class="card-body text-center">
                      <i class="bi bi-megaphone fs-1 text-warning"></i>
                      <h5 class="mt-2">公告管理</h5>
                      <small class="text-muted">发布公告</small>
                    </div>
                  </div>
                </router-link>
              </div>
              <div class="col-md-3">
                <router-link to="/admin/report" class="text-decoration-none">
                  <div class="card quick-card">
                    <div class="card-body text-center">
                      <i class="bi bi-flag fs-1 text-danger"></i>
                      <h5 class="mt-2">举报管理</h5>
                      <small class="text-muted">处理用户举报</small>
                    </div>
                  </div>
                </router-link>
              </div>
              <div class="col-md-3">
                <router-link to="/admin/log" class="text-decoration-none">
                  <div class="card quick-card">
                    <div class="card-body text-center">
                      <i class="bi bi-file-text fs-1 text-info"></i>
                      <h5 class="mt-2">日志查看</h5>
                      <small class="text-muted">查看操作日志</small>
                    </div>
                  </div>
                </router-link>
              </div>
            </div>

            <!-- 统计数据 -->
            <h4 class="mb-3">数据统计</h4>
            <div class="row g-4">
              <div class="col-md-4">
                <div class="card stat-card">
                  <div class="card-body">
                    <div class="d-flex align-items-center">
                      <div class="stat-icon bg-primary">
                        <i class="bi bi-chat-dots"></i>
                      </div>
                      <div class="ms-3">
                        <h6 class="text-muted mb-1">总留言数</h6>
                        <h3 class="mb-0">{{ stats.totalMessages }}</h3>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="col-md-4">
                <div class="card stat-card">
                  <div class="card-body">
                    <div class="d-flex align-items-center">
                      <div class="stat-icon bg-success">
                        <i class="bi bi-calendar-check"></i>
                      </div>
                      <div class="ms-3">
                        <h6 class="text-muted mb-1">今日留言</h6>
                        <h3 class="mb-0">{{ stats.todayMessages }}</h3>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="col-md-4">
                <div class="card stat-card">
                  <div class="card-body">
                    <div class="d-flex align-items-center">
                      <div class="stat-icon bg-danger">
                        <i class="bi bi-flag"></i>
                      </div>
                      <div class="ms-3">
                        <h6 class="text-muted mb-1">待处理举报</h6>
                        <h3 class="mb-0">{{ stats.pendingReports }}</h3>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 最近操作日志 -->
            <h4 class="mt-4 mb-3">最近操作</h4>
            <div class="card">
              <div class="card-body">
                <div v-if="loadingLogs" class="text-center py-4">
                  <div class="spinner-border text-primary" role="status"></div>
                </div>
                <div v-else-if="recentLogs.length === 0" class="text-center text-muted py-4">
                  暂无操作记录
                </div>

                <div v-else class="table-responsive">
                  <table class="table table-hover mb-0 custom-log-table">
                    <thead>
                      <tr>
                        <th>时间</th>
                        <th>操作内容</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(log, index) in recentLogs" :key="index">
                        <td><small>{{ log.slice(0, 19) }}</small></td>
                        <td>{{ log.slice(20) }}</td>
                      </tr>
                    </tbody>
                  </table>
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../services/api'

const router = useRouter()

const username = ref(localStorage.getItem('admin_user') || '管理员')
const stats = ref({
  totalMessages: 0,
  todayMessages: 0,
  pendingReports: 0
})
const recentLogs = ref([])
const loadingLogs = ref(false)

const handleLogout = async () => {
  try {
    await api.adminLogout()
  } catch (error) {
    console.error('退出登录失败:', error)
  } finally {
    localStorage.removeItem('admin_user')
    localStorage.removeItem('admin_password')
    router.push('/admin/login')
  }
}

const loadStats = async () => {
  try {
    // 获取举报数量
    const reportRes = await api.adminGetReport()
    if (reportRes.data) {
      const reports = reportRes.data.reports || {}
      stats.value.pendingReports = Object.keys(reports).length
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

const loadRecentLogs = async () => {
  loadingLogs.value = true
  try {
    const res = await api.adminGetAdminLog()
    if (res.data && res.data.log_content) {
      // 只显示最近10条
      recentLogs.value = res.data.log_content.slice(-10).reverse()
    }
  } catch (error) {
    console.error('加载日志失败:', error)
  } finally {
    loadingLogs.value = false
  }
}

onMounted(() => {
  loadStats()
  loadRecentLogs()
})
</script>

<style scoped>
.admin-page {
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

.quick-card {
  border: none;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: all 0.3s;
  cursor: pointer;
}

.quick-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 15px rgba(0,0,0,0.15);
}

.stat-card {
  border: none;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
}

.stat-icon.bg-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.bg-success {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

.stat-icon.bg-danger {
  background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%);
}

.custom-log-table {
  background-color: transparent;
  border-collapse: collapse;
}

.custom-log-table th {
  background-color: var(--card-bg);
  color: var(--text-color);
  border: 1px solid var(--border-color);
  padding: 12px 15px;
  text-align: left;
}

.custom-log-table td {
  border: 1px solid var(--border-color);
  background-color: var(--card-bg);
  color: var(--text-color);
  padding: 10px 15px;
}

.custom-log-table tbody tr:nth-of-type(even) {
  background-color: var(--card-secondary-bg);
}

.custom-log-table tbody tr:hover {
  background-color: rgba(255,255,255,0.1);
  transition: background-color 0.3s ease;
}

</style>
