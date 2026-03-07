<template>
  <div class="admin-wall-page">
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
                <router-link to="/admin/wall" class="nav-link text-white active">
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
              <h2>留言管理</h2>
              <div class="d-flex gap-2">
                <div class="form-check form-switch mt-2">
                  <input class="form-check-input" type="checkbox" v-model="showAll" @change="loadMessages" id="showAll">
                  <label class="form-check-label" for="showAll">显示全部</label>
                </div>
              </div>
            </div>

            <!-- 搜索栏 -->
            <div class="mb-4">
              <div class="input-group">
                <input type="text" class="form-control" v-model="searchQuery" placeholder="搜索留言内容..." @keyup.enter="loadMessages">
                <button class="btn btn-primary" @click="loadMessages">
                  <i class="bi bi-search"></i> 搜索
                </button>
              </div>
            </div>

            <!-- 留言列表 -->
            <div v-if="loading" class="text-center py-5">
              <div class="spinner-border text-primary" role="status"></div>
              <p class="mt-2 text-muted">加载中...</p>
            </div>

            <div v-else-if="messages.length === 0" class="text-center py-5 text-muted">
              <i class="bi bi-inbox fs-1"></i>
              <p class="mt-2">暂无留言</p>
            </div>

            <div v-else class="message-list">
              <div v-for="msg in messages" :key="msg.id" class="message-card card mb-3">
                <div class="card-body">
                  <div class="d-flex justify-content-between">
                    <div class="flex-grow-1">
                      <div class="d-flex align-items-center mb-2">
                        <span class="badge bg-secondary me-2">#{{ msg.id }}</span>
                        <small class="text-muted">{{ msg.time }}</small>
                        <span v-if="msg.is_approved" class="badge bg-success ms-2">已审核</span>
                      </div>
                      <p class="card-text mb-2">{{ msg.text }}</p>
                      <div v-if="msg.files && msg.files.length > 0" class="mb-2">
                        <span class="text-muted small">附件: </span>
                        <span v-for="file in msg.files.slice(0, 3)" :key="file" class="badge bg-light text-dark me-1">
                          {{ file.substring(0, 20) }}{{ file.length > 20 ? '...' : '' }}
                        </span>
                        <span v-if="msg.files.length > 3" class="text-muted small">+{{ msg.files.length - 3 }} 更多</span>
                      </div>
                      <div class="d-flex gap-3 text-muted small">
                        <span><i class="bi bi-heart"></i> {{ msg.likes || 0 }}</span>
                        <span><i class="bi bi-chat"></i> {{ msg.comment_count || (msg.comments ? msg.comments.length : 0) }}</span>
                      </div>
                    </div>
                    <div class="action-buttons ms-3">
                      <div class="btn-group-vertical">
                        <button class="btn btn-sm btn-outline-success" @click="approveMessage(msg.id)" :disabled="msg.is_approving">
                          <span v-if="msg.is_approving" class="spinner-border spinner-border-sm"></span>
                          <i v-else class="bi bi-check-lg"></i> 审核
                        </button>
                        <button class="btn btn-sm btn-outline-danger" @click="confirmDelete(msg)" :disabled="msg.is_deleting">
                          <span v-if="msg.is_deleting" class="spinner-border spinner-border-sm"></span>
                          <i v-else class="bi bi-trash"></i> 删除
                        </button>
                        <button class="btn btn-sm btn-outline-info" @click="viewDetail(msg)">
                          <i class="bi bi-eye"></i> 详情
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 分页 -->
            <nav v-if="totalPages > 1" class="mt-4">
              <ul class="pagination justify-content-center">
                <li class="page-item" :class="{ disabled: currentPage === 1 }">
                  <a class="page-link" href="#" @click.prevent="changePage(currentPage - 1)">上一页</a>
                </li>
                <li v-for="page in displayPages" :key="page" class="page-item" :class="{ active: page === currentPage }">
                  <a class="page-link" href="#" @click.prevent="changePage(page)">{{ page }}</a>
                </li>
                <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                  <a class="page-link" href="#" @click.prevent="changePage(currentPage + 1)">下一页</a>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </div>

    <!-- 详情模态框 -->
    <div class="modal fade" id="detailModal" tabindex="-1" ref="detailModal">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">留言详情 #{{ selectedMessage?.id }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body" v-if="selectedMessage">
            <pre>{{ selectedMessage }}</pre>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">关闭</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 删除确认模态框 -->
    <div class="modal fade" id="deleteModal" tabindex="-1" ref="deleteModal">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">确认删除</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <p>确定要删除这条留言吗？此操作不可恢复。</p>

            <pre>{{ messageToDelete }}</pre>

          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
            <button type="button" class="btn btn-danger" @click="deleteMessage" :disabled="isDeleting">
              <span v-if="isDeleting" class="spinner-border spinner-border-sm me-1"></span>
              确认删除
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

const messages = ref([])
const loading = ref(false)
const currentPage = ref(1)
const totalPages = ref(0)
const searchQuery = ref('')
const showAll = ref(false)
const approvedIds = ref([])

const selectedMessage = ref(null)
const messageToDelete = ref(null)
const isDeleting = ref(false)

const displayPages = computed(() => {
  const pages = []
  const start = Math.max(1, currentPage.value - 2)
  const end = Math.min(totalPages.value, currentPage.value + 2)
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})

const handleLogout = async () => {
  localStorage.removeItem('admin_user')
  localStorage.removeItem('admin_password')
  router.push('/admin/login')
}


const loadApprovedIds = async () => {
  try {
    const res = await api.adminGetApprovedIds()
    approvedIds.value = res.data || []
  } catch (error) {
    console.error('加载已审核ID失败:', error)
  }
}

const loadMessages = async () => {
  
  loading.value = true
  try {
    const res = await api.adminGetMessages({
      q: searchQuery.value,
      page: currentPage.value,
      show_all: showAll.value
    })
    if (res.data) {
      messages.value = res.data.messages.map(msg => ({
        ...msg,
        is_approved: approvedIds.value.includes(msg.id),
        is_approving: false,
        is_deleting: false
      }))
      totalPages.value = res.data.total_pages
    }
  } catch (error) {
    console.error('加载留言失败:', error)
  } finally {
    loading.value = false
  }
}

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    loadMessages()
  }
}

const approveMessage = async (messageId) => {
  const msg = messages.value.find(m => m.id === messageId)
  if (msg) {
    msg.is_approving = true
    try {
      const res = await api.adminApproveMessage(messageId)
      if (res.data && res.data.success) {
        if(res.data.action) {
          approvedIds.value.splice(approvedIds.value.indexOf(messageId), 1)
          msg.is_approved = false
        } else {
          msg.is_approved = true
          approvedIds.value.push(messageId)
        }
      } else {
        alert(res.data?.error || '审核失败')
      }
    } catch (error) {
      alert('审核失败: ' + error.message)
    } finally {
      msg.is_approving = false
    }
  }
}

const confirmDelete = (msg) => {
  messageToDelete.value = msg
  const modal = new bootstrap.Modal(document.getElementById('deleteModal'))
  modal.show()
}

const deleteMessage = async () => {
  if (!messageToDelete.value) return
  
  isDeleting.value = true
  try {
    const res = await api.adminDeleteMessage(messageToDelete.value.id)
    if (res.data && res.data.success) {
      messages.value = messages.value.filter(m => m.id !== messageToDelete.value.id)
      const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'))
      modal.hide()
      messageToDelete.value = null
    } else {
      alert(res.data?.error || '删除失败')
    }
  } catch (error) {
    alert('删除失败: ' + error.message)
  } finally {
    isDeleting.value = false
  }
}

const viewDetail = async (msg) => {
  try {
    const res = await api.adminGetMessage(msg.id)
    if (res.data) {
      selectedMessage.value = res.data
      const modal = new bootstrap.Modal(document.getElementById('detailModal'))
      modal.show()
    }
  } catch (error) {
    alert('获取详情失败: ' + error.message)
  }
}

const deleteComment = async (messageId, commentId) => {
  if (!confirm('确定要删除这条评论吗？')) return
  
  try {
    const res = await api.adminDeleteComment(messageId, commentId)
    if (res.data && res.data.success) {
      if (selectedMessage.value && selectedMessage.value.comments) {
        selectedMessage.value.comments = selectedMessage.value.comments.filter(c => c.id !== commentId)
      }
    } else {
      alert(res.data?.error || '删除评论失败')
    }
  } catch (error) {
    alert('删除评论失败: ' + error.message)
  }
}

onMounted(() => {        
  loadApprovedIds()
  loadMessages()
})
</script>

<style scoped>
.admin-wall-page {
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

.message-card {
  border: none;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  transition: all 0.3s;
}

.message-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.12);
}

.action-buttons .btn {
  min-width: 70px;
}

.comment-item {
  border-left: 3px solid #6A0DAD;
}
</style>
