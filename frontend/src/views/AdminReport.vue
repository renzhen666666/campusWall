<template>
  <div class="admin-report-page">
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
                <router-link to="/admin/report" class="nav-link text-white active">
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
            <div class="d-flex justify-content-between align-items-center mb-4">
              <h2>举报管理</h2>
              <button class="btn btn-outline-primary" @click="loadReports">
                <i class="bi bi-arrow-clockwise"></i> 刷新
              </button>
            </div>

            <!-- 统计卡片 -->
            <div class="row mb-4">
              <div class="col-md-4">
                <div class="card stat-card">
                  <div class="card-body text-center">
                    <h3 class="text-warning">{{ totalReports }}</h3>
                    <p class="text-muted mb-0">待处理举报</p>
                  </div>
                </div>
              </div>
              <div class="col-md-4">
                <div class="card stat-card">
                  <div class="card-body text-center">
                    <h3 class="text-info">{{ messageIds.length }}</h3>
                    <p class="text-muted mb-0">涉及留言</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- 举报列表 -->
            <div v-if="loading" class="text-center py-5">
              <div class="spinner-border text-primary" role="status"></div>
              <p class="mt-2 text-muted">加载中...</p>
            </div>

            <div v-else-if="messageIds.length === 0" class="text-center py-5 text-muted">
              <i class="bi bi-check-circle fs-1 text-success"></i>
              <p class="mt-2">暂无待处理的举报</p>
            </div>

            <div v-else class="report-list">
              <div v-for="messageId in messageIds" :key="messageId" class="report-card card mb-4">
                <div class="card-header d-flex justify-content-between align-items-center">
                  <h5 class="mb-0">
                    <span class="badge bg-danger me-2">留言 #{{ messageId }}</span>
                    <span class="badge bg-secondary">{{ reports[messageId]?.length || 0 }} 条举报</span>
                  </h5>
                  <div class="btn-group">
                    <button class="btn btn-sm btn-outline-primary" @click="viewMessage(messageId)">
                      <i class="bi bi-eye"></i> 查看留言
                    </button>
                    <button class="btn btn-sm btn-outline-danger" @click="deleteMessage(messageId)">
                      <i class="bi bi-trash"></i> 删除留言
                    </button>
                  </div>
                </div>
                <div class="card-body">
                  <div class="table-responsive">
                    <table class="table table-hover mb-0">
                      <thead>
                        <tr>
                          <th style="width: 50px">#</th>
                          <th style="width: 120px">举报类型</th>
                          <th>举报内容</th>
                          <th style="width: 150px">联系方式</th>
                          <th style="width: 180px">时间</th>
                          <th style="width: 100px">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(report, index) in reports[messageId]" :key="report.id">
                          <td>{{ index + 1 }}</td>
                          <td>
                            <span class="badge" :class="getCategoryClass(report.category)">
                              {{ report.category || '其他' }}
                            </span>
                          </td>
                          <td>{{ report.text }}</td>
                          <td>{{ report.email || '-' }}</td>
                          <td><small class="text-muted">{{ report.timestamp || '-' }}</small></td>
                          <td>
                            <button 
                              class="btn btn-sm btn-outline-success" 
                              @click="dismissReport(messageId, report.id)"
                              :disabled="report.is_dismissing"
                            >
                              <span v-if="report.is_dismissing" class="spinner-border spinner-border-sm"></span>
                              <i v-else class="bi bi-check"></i> 忽略
                            </button>
                          </td>
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

    <!-- 查看留言模态框 -->
    <div class="modal fade" id="messageModal" tabindex="-1" ref="messageModal">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">留言详情 #{{ selectedMessage?.id }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body" v-if="selectedMessage">
            <div class="mb-3">
              <strong>时间:</strong> {{ selectedMessage.time }}
            </div>
            <div class="mb-3">
              <strong>内容:</strong>
              <p class="mt-1 p-3 bg-light rounded">{{ selectedMessage.text }}</p>
            </div>
            <div v-if="selectedMessage.files && selectedMessage.files.length > 0" class="mb-3">
              <strong>附件:</strong>
              <div class="mt-2">
                <div v-for="file in selectedMessage.files" :key="file" class="badge bg-light text-dark me-1 mb-1">
                  {{ file }}
                </div>
              </div>
            </div>
            <div class="d-flex gap-2 text-muted">
              <span><i class="bi bi-heart"></i> {{ selectedMessage.likes || 0 }}</span>
              <span><i class="bi bi-chat"></i> {{ selectedMessage.comment_count || 0 }}</span>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">关闭</button>
            <button type="button" class="btn btn-danger" @click="deleteMessage(selectedMessage?.id)">
              <i class="bi bi-trash me-1"></i>删除此留言
            </button>
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
const messageIds = ref([])
const reports = ref({})
const selectedMessage = ref(null)

const totalReports = computed(() => {
  let count = 0
  for (const id of messageIds.value) {
    count += (reports.value[id]?.length || 0)
  }
  return count
})

const handleLogout = async () => {
  localStorage.removeItem('admin_user')
  localStorage.removeItem('admin_password')
  router.push('/admin/login')
}

const getCategoryClass = (category) => {
  const classes = {
    '垃圾广告': 'bg-danger',
    '不当内容': 'bg-warning text-dark',
    '骚扰辱骂': 'bg-orange',
    '虚假信息': 'bg-info',
    '其他': 'bg-secondary'
  }
  return classes[category] || 'bg-secondary'
}

const loadReports = async () => {
  loading.value = true
  try {
    const res = await api.adminGetReport()
    if (res.data) {
      messageIds.value = res.data.message_ids || []
      reports.value = res.data.reports || {}
    }
  } catch (error) {
    console.error('加载举报失败:', error)
  } finally {
    loading.value = false
  }
}

const viewMessage = async (messageId) => {
  try {
    const res = await api.adminGetMessage(messageId)
    if (res.data) {
      selectedMessage.value = res.data
      const modal = new bootstrap.Modal(document.getElementById('messageModal'))
      modal.show()
    }
  } catch (error) {
    alert('获取留言详情失败: ' + error.message)
  }
}

const dismissReport = async (messageId, reportId) => {
  const reportList = reports.value[messageId]
  const report = reportList?.find(r => r.id === reportId)
  if (report) {
    report.is_dismissing = true
    try {
      const res = await api.adminDeleteReport(messageId, reportId)
      if (res.data && res.data.success) {
        // 从列表中移除举报
        reports.value[messageId] = reports.value[messageId].filter(r => r.id !== reportId)
        // 如果没有举报了，从消息ID列表移除
        if (reports.value[messageId].length === 0) {
          delete reports.value[messageId]
          messageIds.value = messageIds.value.filter(id => id !== messageId)
        }
      } else {
        alert(res.data?.error || '操作失败')
      }
    } catch (error) {
      alert('操作失败: ' + error.message)
    } finally {
      if (report) report.is_dismissing = false
    }
  }
}

const deleteMessage = async (messageId) => {
  if (!confirm('确定要删除这条留言吗？这将同时关闭所有相关举报。')) return
  
  try {
    const res = await api.adminDeleteMessage(messageId)
    if (res.data && res.data.success) {
      // 从列表中移除
      delete reports.value[messageId]
      messageIds.value = messageIds.value.filter(id => id !== messageId)
      
      // 关闭模态框
      const modal = bootstrap.Modal.getInstance(document.getElementById('messageModal'))
      if (modal) modal.hide()
    } else {
      alert(res.data?.error || '删除失败')
    }
  } catch (error) {
    alert('删除失败: ' + error.message)
  }
}

onMounted(() => {
  loadReports()
})
</script>

<style scoped>
.admin-report-page {
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

.report-card {
  border: none;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  border-left: 4px solid #dc3545;
}

.bg-orange {
  background-color: #fd7e14 !important;
}
</style>
