<template>
  <div class="help-form-page">
    <div class="container mt-4">
      <h1>{{ title }}</h1>
      <p>{{ description }}</p>

      <div class="card mt-4">
        <div class="card-body">
          <form @submit.prevent="handleSubmit">
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
              <label for="text" class="form-label">{{ placeholder }}</label>
              <textarea
                class="form-control"
                id="text"
                v-model="formData.text"
                rows="8"
                required
                :placeholder="placeholder"
              ></textarea>
            </div>
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              <span v-if="submitting" class="spinner-border spinner-border-sm me-2"></span>
              提交
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import api from '../services/api'

const router = useRouter()

const title = ref('反馈问题')
const description = ref('如果您发现了任何问题或有改进建议，请告诉我们。')
const placeholder = ref('您遇到了什么问题？')
const submitting = ref(false)

const Alert = inject('Alert')

const formData = ref({
  email: '',
  text: ''
})

onMounted(() => {
  const query = router.currentRoute.value.query
  if (query.ti) title.value = query.ti
  if (query.te) formData.value.text = query.te
  if (query.pl) placeholder.value = query.pl
  if (query.h1) description.value = query.h1
})

const handleSubmit = async () => {
  if (!formData.value.text.trim()) {
    Alert.showBelowAlert('text', '请填写内容', 'warning', "警告")
    return
  }

  submitting.value = true

  try {
    const res = await api.submitHelp({
      title: title.value,
      email: formData.value.email,
      text: formData.value.text
    })

    if(res?.data?.success) {
      router.push('/help/success')
    } else {
      Alert.showCenterAlert('提交失败: ' + (res.data.error || '未知错误'), 'error', "错误")
    }
  } catch (error) {
    console.error('提交失败:', error)
    Alert.showCenterAlert('提交失败: ' + (error.response?.data?.error || '未知错误'))
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.help-form-page {
  background-color: var(--bg-color);
  min-height: 100vh;
}

.card {
  border: none;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.form-control {
  border-radius: 8px;
  padding: 12px;
}

.btn-primary {
  background-color: #6A0DAD;
  border-color: #6A0DAD;
  padding: 10px 30px;
}

.btn-primary:hover {
  background-color: #5a0b91;
  border-color: #5a0b91;
}
</style>