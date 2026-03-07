<template>
  <div class="report-page">
    <div class="container mt-4" v-if="loading">
      <div class="text-center py-5">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">加载中...</span>
        </div>
      </div>
    </div>
    <div class="container mt-4" v-else-if="message">
      <div class="row">
        <div class="col-12">
          <router-link to="/wall" class="btn btn-outline-secondary mb-3">
            <i class="bi bi-arrow-left me-1"></i>返回
          </router-link>
        </div>
      </div>

      <div class="card mb-4">
        <message-card-mini :message="message" />
      </div>

      <div class="card">
        <div class="card-body">
          <h3>举报此内容</h3>
          <form @submit.prevent="handleSubmit">
            <div class="mb-3">
              <label for="category" class="form-label">举报类型</label>
              <select class="form-select" id="category" v-model="formData.category" required>
                <option value="">请选择举报类型</option>
                <option value="spam">垃圾信息</option>
                <option value="abuse">恶意行为</option>
                <option value="other">其他</option>
              </select>
            </div>
            <div class="mb-3">
              <label for="email" class="form-label">邮箱（可选）</label>
              <input
                type="email"
                class="form-control"
                id="email"
                v-model="formData.email"
                placeholder="如果您希望收到回复，请填写邮箱"
              >
            </div>
            <div class="mb-3">
              <label for="text" class="form-label">举报原因</label>
              <textarea
                class="form-control"
                id="text"
                v-model="formData.text"
                rows="6"
                required
                placeholder="请详细说明举报原因"
              ></textarea>
            </div>
            <button type="submit" class="btn btn-danger" :disabled="submitting">
              <span v-if="submitting" class="spinner-border spinner-border-sm me-2"></span>
              提交举报
            </button>
          </form>
        </div>
      </div>
    </div>
    <div class="container mt-4" v-else>
      <div class="alert alert-warning">
        消息不存在或已被删除
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../services/api'

import MessageCardMini from '../components/MessageCardMini.vue'

const route = useRoute()
const router = useRouter()

const message = ref(null)
const loading = ref(true)
const submitting = ref(false)

const formData = ref({
  category: '',
  email: '',
  text: ''
})

const loadMessage = async () => {
  try {
    const response = await api.getMessageDetail(route.params.id)
    if (response.data.success) {
      message.value = response.data.message
    }
  } catch (error) {
    console.error('加载消息失败:', error)
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  if (!formData.value.text.trim()) {
    alert('请填写举报原因')
    return
  }

  submitting.value = true

  try {
    await api.submitReport(message.value.id, formData.value)
    router.push('/help/success')
  } catch (error) {
    console.error('举报失败:', error)
    alert('举报失败: ' + (error.response?.data?.error || '未知错误'))
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadMessage()
})
</script>

<style scoped>
.report-page {
  background-color: var(--bg-color);
  min-height: 100vh;
}

.card {
  border: none;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.form-control,
.form-select {
  border-radius: 8px;
  padding: 12px;
}

.btn-danger {
  padding: 10px 30px;
}
</style>