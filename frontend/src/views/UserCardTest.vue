<template>
  <div class="user-card-test">
    <div class="container py-5">
      <h1 class="text-center mb-5">用户卡片组件测试</h1>

      <!-- 测试用户数据 -->
      <div class="alert alert-info">
        <h5>测试用户数据：</h5>
        <pre>{{ JSON.stringify(testUser, null, 2) }}</pre>
      </div>

      <!-- 1. UserCard.vue - 完整用户卡片 -->
      <section class="mb-5">
        <h2 class="mb-3">1. UserCard.vue - 完整用户卡片</h2>
        <div class="row">
          <div class="col-md-6">
            <div class="card">
              <div class="card-body">
                <UserCard :user="testUser" />
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="card">
              <div class="card-body">
                <UserCard :user="testUser2" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 2. UserCardMini.vue - 小用户卡片 -->
      <section class="mb-5">
        <h2 class="mb-3">2. UserCardMini.vue - 小用户卡片</h2>
        <div class="row">
          <div class="col-md-6">
            <div class="card">
              <div class="card-body">
                <UserCardMini :user="testUser"  />
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="card">
              <div class="card-body">
                <UserCardMini :user="testUser2"  />
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 3. UserCardSimple.vue - 极简用户信息卡片 -->
      <section class="mb-5">
        <h2 class="mb-3">3. UserCardSimple.vue - 极简用户信息卡片</h2>
        <div class="card">
          <div class="card-body">
            <div class="d-flex gap-3 flex-wrap">
              <UserCardSimple :userId="0" />
            </div>
          </div>
        </div>
      </section>

      <!-- 4. UserProfile.vue - 用户个人页面 -->
      <section class="mb-5">
        <h2 class="mb-3">4. UserProfile.vue - 用户个人页面</h2>
        <div class="alert alert-warning">
          <h5>点击下方按钮测试路由跳转：</h5>
          <div class="d-flex gap-2 flex-wrap">
            <router-link :to="`/user/${testUser.id}`" class="btn btn-primary">
              <i class="bi bi-person"></i> 查看用户 {{ testUser.id }} 的主页
            </router-link>
            <router-link :to="`/user/${testUser2.id}`" class="btn btn-primary">
              <i class="bi bi-person"></i> 查看用户 {{ testUser2.id }} 的主页
            </router-link>
          </div>
        </div>
        <div class="alert alert-secondary">
          <h5>直接嵌入测试：</h5>
          <UserProfile :user-id="testUser.id" />
        </div>
      </section>

      <!-- 操作日志 -->
      <section class="mb-5">
        <h2 class="mb-3">操作日志</h2>
        <div class="card">
          <div class="card-body">
            <ul id="action-log" class="list-unstyled mb-0"></ul>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import UserCard from '../components/UserCard.vue'
import UserCardMini from '../components/UserCardMini.vue'
import UserCardSimple from '../components/UserCardSimple.vue'
import UserProfile from './UserProfile.vue'

const router = useRouter()

// 测试用户数据
const testUser = ref({
  id: 123412335,
  nickname: '测试用户A',
  following: [123412335, 123412336],
  followers: [123412335, 123412336, 123412337],
  description: '这是一个测试用户的个人描述，用于展示用户卡片组件的功能。',
  gender: 1,
  birthday: '1999-01-01',
  email: 'test@example.com',
  phone: '13800138000'
})

const testUser2 = ref({
  id: 567890123,
  nickname: '测试用户B',
  following: [123412335],
  followers: [123412335, 567890123],
  description: '另一个测试用户，用于展示组件的通用性和样式一致性。',
  gender: 2,
  birthday: '2000-05-15',
  email: 'user2@example.com',
  phone: '13900139000'
})

const testUser3 = ref({
  id: 111222333,
  nickname: '用户C'
})

const testUser4 = ref({
  id: 444555666,
  nickname: '用户D'
})

const testUser5 = ref({
  id: 777888999,
  nickname: '用户E'
})

// 添加操作日志
function addLog(message) {
  const logContainer = document.getElementById('action-log')
  if (logContainer) {
    const logItem = document.createElement('li')
    logItem.innerHTML = `<span class="badge bg-secondary">${new Date().toLocaleTimeString()}</span> ${message}`
    logItem.className = 'mb-2'
    logContainer.insertBefore(logItem, logContainer.firstChild)
  }
}


</script>

<style scoped>
.user-card-test {
  min-height: 100vh;
  background-color: var(--bg-color);
}

section {
  scroll-margin-top: 20px;
}

pre {
  background-color: var(--pre-bg-color);
  padding: 1rem;
  border-radius: 0.375rem;
  max-height: 300px;
  overflow-y: auto;
}
</style>