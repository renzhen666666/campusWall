<template>
  <div class="admin-notice-page">
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
                <router-link to="/admin/notice" class="nav-link text-white active">
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
                <router-link to="/admin/error_log" class="nav-link text-white">
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
            <h2 class="mb-4">公告管理</h2>

            <!-- 发布新公告 -->
            <div class="card mb-4">
              <div class="card-header">
                <h5 class="mb-0"><i class="bi bi-plus-circle me-2"></i>发布新公告</h5>
              </div>
              <div class="card-body">
                <form @submit.prevent="submitNotice">
                  <div class="mb-3">
                    <label class="form-label">公告内容</label>
                    <textarea 
                      class="form-control" 
                      v-model="noticeContent" 
                      rows="5" 
                      placeholder="请输入公告内容..."
                      required
                    ></textarea>
                  </div>
                  <div class="d-flex justify-content-end">
                    <button type="submit" class="btn btn-primary" :disabled="submitting">
                      <span v-if="submitting" class="spinner-border spinner-border-sm me-2"></span>
                      <i v-else class="bi bi-send me-2"></i>
                      发布公告
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <!-- 公告列表 -->
            <div class="card">
              <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0"><i class="bi bi-list me-2"></i>历史公告</h5>
                <button class="btn btn-sm btn-outline-primary" @click="loadNotices">
                  <i class="bi bi-arrow-clockwise"></i> 刷新
                </button>
              </div>
              <div class="card-body">
                <div v-if="loading" class="text-center py-4">
                  <div class="spinner-border text-primary" role="status"></div>
                </div>
                <div v-else-if="notices.length === 0" class="text-center text-muted py-4">
                  <i class="bi bi-inbox fs-1"></i>
                  <p class="mt-2">暂无公告</p>
                </div>
                <div v-else class="notice-list">
                  <div v-for="(notice, index) in notices" :key="index" class="notice-item card mb-3">
                    <div class="card-body">
                      <div class="d-flex justify-content-between">
                        <div>
                          <div class="d-flex align-items-center mb-2">
                            <span class="badge bg-primary me-2">{{ notice.user }}</span>
                            <small class="text-muted">{{ notice.timestamp }}</small>
                          </div>
                          <p class="mb-0">{{ notice.content }}</p>
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
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../services/api'

const router = useRouter()

const noticeContent = ref('')
const submitting = ref(false)
const loading = ref(false)
const notices = ref([])

const handleLogout = async () => {
  localStorage.removeItem('admin_user')
  localStorage.removeItem('admin_password')
  router.push('/admin/login')
}

const submitNotice = async () => {
  if (!noticeContent.value.trim()) return
  
  submitting.value = true
  try {
    const res = await api.adminPostNotice(noticeContent.value)
    if (res.data) {
      alert('公告发布成功！')
      noticeContent.value = ''
      loadNotices()
    }
  } catch (error) {
    alert('发布失败: ' + error.message)
  } finally {
    submitting.value = false
  }
}

const loadNotices = async () => {
  loading.value = true
  try {
    const res = await api.getNotice()
    if (res.data && res.data.notices) {
      notices.value = res.data.notices.reverse()
    }
  } catch (error) {
    console.error('加载公告失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadNotices()
})
</script>

<style scoped>
.admin-notice-page {
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

.notice-item {
  border: none;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  border-left: 4px solid #6A0DAD;
}
</style>
