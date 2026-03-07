<template>
<div class="form-container">
  <p class="title">{{ isLogin ? '登录' : '注册' }}</p>
  <form class="form">
    <div class="row g-4">
      <div class="input-group col-12" v-if="!isLogin">
        <label for="email">邮箱</label>
        <input 
            type="email" 
            name="email" 
            id="email" 
            v-model="formData.email"
            placeholder="请输入邮箱"
        >
      </div>
      
      <div class="input-group col-12" v-if="isLogin">
      <label for="loginUsername">邮箱</label>
      <input 
          type="text" 
          name="loginUsername" 
          id="loginUsername" 
          v-model="formData.loginUsername"
          placeholder="请输入邮箱"
      >
      </div>
      
      <div class="input-group col-12">
      <label for="password">请输入密码</label>
      <input 
          type="password" 
          name="password" 
          id="password" 
          v-model="formData.password"
          placeholder="密码"
      >
      <div class="forgot" v-if="isLogin">
          <a rel="noopener noreferrer" href="#">忘记密码 ?</a>
      </div>
      </div>
      
      <div class="input-group col-12" v-if="!isLogin">
      <label for="confirmPassword">确认密码</label>
      <input 
          type="password" 
          name="confirmPassword" 
          id="confirmPassword" 
          v-model="formData.confirmPassword"
          placeholder="请再次输入密码"
      >
      </div>
      
      <div class="col-12">
        <button class="submit-btn" @click.prevent="handleLogin" v-if="isLogin">
        登录
        </button>
        <button class="submit-btn" @click.prevent="handleRegister" v-else>
        注册
        </button>
      </div>
    </div>
  </form>
  
  <!-- 社交登录部分（仅登录时显示） -->
  <div class="social-message">
    <div class="line"></div>
    <p class="message">或者</p>
    <div class="line"></div>
  </div>

  <div class="social-icons">
    <button aria-label="Log in with GitHub" class="icon">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" class="w-5 h-5 fill-current">
        <path d="M16 0.396c-8.839 0-16 7.167-16 16 0 7.073 4.584 13.068 10.937 15.183 0.803 0.151 1.093-0.344 1.093-0.772 0-0.38-0.009-1.385-0.015-2.719-4.453 0.964-5.391-2.151-5.391-2.151-0.729-1.844-1.781-2.339-1.781-2.339-1.448-0.989 0.115-0.968 0.115-0.968 1.604 0.109 2.448 1.645 2.448 1.645 1.427 2.448 3.744 1.74 4.661 1.328 0.14-1.031 0.557-1.74 1.011-2.135-3.552-0.401-7.287-1.776-7.287-7.907 0-1.751 0.62-3.177 1.645-4.297-0.177-0.401-0.719-2.031 0.141-4.235 0 0 1.339-0.427 4.4 1.641 1.281-0.355 2.641-0.532 4-0.541 1.36 0.009 2.719 0.187 4 0.541 3.043-2.068 4.381-1.641 4.381-1.641 0.859 2.204 0.317 3.833 0.161 4.235 1.015 1.12 1.635 2.547 1.635 4.297 0 6.145-3.74 7.5-7.296 7.891 0.556 0.479 1.077 1.464 1.077 2.959 0 2.14-0.020 3.864-0.020 4.385 0 0.416 0.28 0.916 1.104 0.755 6.4-2.093 10.979-8.093 10.979-15.156 0-8.833-7.161-16-16-16z"></path>
      </svg>
    </button>
  </div>
  
  <p class="signup">
    {{ isLogin ? '没有账号？' : '已有账号？' }}
    <a rel="noopener noreferrer" class="signup" @click="toggleForm">
      {{ isLogin ? '注册' : '登录' }}
    </a>
  </p>
</div>
</template>

<script setup>
import { ref, reactive, inject } from 'vue'

const Alert = inject('Alert')

// 控制当前显示的是登录还是注册表单
const isLogin = ref(true)

// 表单数据
const formData = reactive({
  email: '',
  username: '',
  loginUsername: '',
  password: '',
  confirmPassword: ''
})

const toggleForm = () => {
  isLogin.value = !isLogin.value

  Object.keys(formData).forEach(key => {
    formData[key] = ''
  })
}

const isEmail = (email) => {
  return /\S+@\S+\.\S+/.test(email)
}

const handleLogin = () => {
  console.log('执行登录:', {
    username: formData.loginUsername,
    password: formData.password
  })
}

const handleRegister = () => {
  if (formData.password !== formData.confirmPassword) {
    Alert.showCenterAlert('两次输入的密码不一致', 'danger')
    return
  }
  
  if (!isEmail(formData.email)) {
    Alert.showCenterAlert('请输入正确的邮箱格式', 'danger')
    return
  }
  
  console.log('执行注册:', {
    email: formData.email,
    username: formData.username,
    password: formData.password
  })
}
</script>

<style scoped>
.form-container {
  width: 320px;
  border-radius: 0.75rem;
  background-color: var(--card-bg, white);
  padding: 2rem;
  color: var(--text-primary);
}

.title {
  text-align: center;
  font-size: 1.5rem;
  line-height: 2rem;
  font-weight: 700;
}

.form {
  margin-top: 1.5rem;
  
}

.input-group {
  margin-top: 0.25rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
}

.input-group label {
  display: block;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.input-group input {
  width: 100%;
  border-radius: 0.375rem;
  border: 1px solid var(--bg-color);
  outline: 0;
  background-color: var(--bg-color);
  padding: 0.75rem 1rem;
  color: var(--text-primary);
}

.input-group input:focus {
  border-color: var(--primary-dark);
}

.forgot {
  display: flex;
  justify-content: flex-end;
  font-size: 0.75rem;
  line-height: 1rem;
  color: var(--text-secondary);
  margin: 8px 0 14px 0;
}

.forgot a,.signup a {
  color: var(--text-primary);
  text-decoration: none;
  font-size: 14px;
}

.forgot a:hover, .signup a:hover {
  text-decoration: underline var(--primary-dark);
}

.submit-btn {
  display: block;
  width: 100%;
  background-color: var(--primary-dark);
  padding: 0.75rem;
  text-align: center;
  color: #f5f5f5;
  border: none;
  border-radius: 0.375rem;
  font-weight: 600;
}

.submit-btn:hover {
  transform: scale(1.05);
}

.social-message {
  display: flex;
  align-items: center;
  padding-top: 1rem;
}

.line {
  height: 1px;
  flex: 1 1 0%;
  background-color: var(--border-color);
}

.social-message .message {
  padding-left: 0.75rem;
  padding-right: 0.75rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: var(--text-secondary);
}

.social-icons {
  display: flex;
  justify-content: center;
}

.social-icons .icon {
  border-radius: 0.125rem;
  padding: 0.75rem;
  border: none;
  background-color: transparent;
  margin-left: 8px;
}

.social-icons .icon svg {
  height: 1.25rem;
  width: 1.25rem;
  fill: var(--text-primary);
}

.signup {
  text-align: center;
  font-size: 0.75rem;
  line-height: 1rem;
  color: var(--text-secondary);
}
</style>
