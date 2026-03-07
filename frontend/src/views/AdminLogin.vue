<template>
  <div class="admin-login-page">
    <div class="container">
      <div class="row justify-content-center align-items-center" style="min-height: 100vh;">
        <div class="col-md-6 col-lg-4">
          <div class="card">
            <div class="card-body p-5">
              <div class="text-center mb-4">
                <h2>管理员登录</h2>
                <p class="text-muted">请输入管理员账号和密码</p>
              </div>
              <form @submit.prevent="handleLogin">
                <div class="mb-3">
                  <label for="username" class="form-label">用户名</label>
                  <input
                    type="text"
                    class="form-control"
                    id="username"
                    v-model="formData.username"
                    required
                    placeholder="请输入用户名"
                  >
                </div>
                <div class="mb-3">
                  <label for="password" class="form-label">密码</label>
                  <input
                    type="password"
                    class="form-control"
                    id="password"
                    v-model="formData.password"
                    required
                    placeholder="请输入密码"
                  >
                </div>
                <div v-if="error" class="alert alert-danger mb-3">
                  {{ error }}
                </div>
                <button type="submit" class="btn btn-primary w-100" :disabled="loading">
                  <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                  登录
                </button>
              </form>
              <div class="text-center mt-3">
                <router-link to="/" class="text-decoration-none">
                  <i class="bi bi-arrow-left me-1"></i>返回首页
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '../services/api'

const router = useRouter()

const formData = ref({
  username: '',
  password: ''
})

const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await api.adminLogin(formData.value)
    if (response.status === 200) {
      if(response.data.success){
        console.log('登录成功')
        localStorage.setItem('admin_user', formData.value.username)
        localStorage.setItem('admin_password', formData.value.password)
        router.push('/admin')
      } else {
        error.value = response.data.message
      }
    }
  } catch (err) {
    error.value = '用户名或密码错误'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.admin-login-page {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

.card {
  border: none;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}

.form-control {
  border-radius: 8px;
  padding: 12px;
}

.btn-primary {
  background-color: #6A0DAD;
  border-color: #6A0DAD;
  padding: 12px;
}

.btn-primary:hover {
  background-color: #5a0b91;
  border-color: #5a0b91;
}
</style>