<template>
  <div class="apps-page">
    <div class="container mt-4">

      <div class="row g-4">

        <section class="col-12">
          <h1>应用广场</h1>
          <p class="text-muted">探索各种有趣的应用</p>

          <div v-if="loading" class="text-center py-5">
            <div class="spinner-border" role="status">
              <span class="visually-hidden">加载中...</span>
            </div>
          </div>
          <div v-else-if="apps.length === 0" class="alert alert-info">
            暂无应用
          </div>
          <div v-else class="row g-4 mt-2">
            <div v-for="(app, index) in apps" :key="index" class="col-md-6 col-lg-4">
              <div class="card h-100">
                <div class="card-body">
                  <div class="app-icon mb-3">
                    <img :src="getAppIcon(app)" :alt="app.name" class="app-icon-img">
                  </div>
                  <h5 class="card-title">{{ app.name }}</h5>
                  <p class="card-text">{{ app.description }}</p>
                  <a :href="app.url" target="_blank" class="btn btn-primary" v-if="app.url">
                    <i class="bi bi-box-arrow-up-right me-1"></i>打开应用
                  </a>
                  <button class="btn btn-primary" v-else @click="openApp(app)">
                    <i class="bi bi-play-circle me-1"></i>打开应用
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="col-12">
          <div class="text-center">
            <h2>更多应用 ?</h2>
          </div>
        </section>

        <section class="col-12">
          <div class="card mt-4">
            <div class="card-body">

              <h4 class="card-title mb-3">提交你的网站？</h4>
              <small class="card-text mb-1">你制作了有趣的网站或Web应用？快来分享给龙高同学们使用吧！</small>

              <div class="row">
                <div class="col-md-6 mb-3">
                  <div class="d-flex">
                    <div class="me-3">
                      <span class="badge bg-primary rounded-pill">1</span>
                    </div>
                    <div>
                      <h5>准备你的作品</h5>
                      <p class="mb-0">确保你的网站可以正常访问，并且内容符合校园规范。</p>
                    </div>
                  </div>
                </div>
                <div class="col-md-6 mb-3">
                  <div class="d-flex">
                    <div class="me-3">
                      <span class="badge bg-primary rounded-pill">2</span>
                    </div>
                    <div>
                      <h5>提交申请</h5>
                      <p class="mb-0">发送邮件至 <a href="mailto:w-rz@outlook.com">w-rz@outlook.com</a>，附上作品链接。</p>
                    </div>
                  </div>
                </div>
                <div class="col-md-6 mb-3">
                  <div class="d-flex">
                    <div class="me-3">
                      <span class="badge bg-primary rounded-pill">3</span>
                    </div>  
                    <div>
                      <h5>展示与分享</h5>
                      <p class="mb-0">审核通过后，你的作品将展示在应用广场供同学们使用。</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../services/api'

const apps = ref([])
const loading = ref(true)

const staticUrl = import.meta.env.VITE_STATIC_URL || '/static/'

const loadApps = async () => {
  try {
    const response = await api.getApps()
    if (response.data.success) {
      apps.value = response.data.apps || []
    }
  } catch (error) {
    console.error('加载应用失败:', error)
  } finally {
    loading.value = false
  }
}

const getAppIcon = (app) => {
  if (app.icon) {
    return staticUrl + 'apps/cloud/' + app.id + '/' + app.icon
  } else if(app.iconUrl) {
    return app.iconUrl
  }
  return '/vite.svg'
}

const openApp = (app) => {
  if (app.path) {
    window.open(app.path, '_blank')
  }
}

onMounted(() => {
  loadApps()
})
</script>

<style scoped>
.apps-page {
  background-color: var(--bg-color);
  min-height: 100vh;
}




.card {
  border: none;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.app-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto;
  border-radius: 15px;
  overflow: hidden;
}

.app-icon-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-title {
  color: #6A0DAD;
  font-weight: 600;
}

.app-meta {
  display: flex;
  gap: 10px;
}

.btn-primary {
  background-color: #6A0DAD;
  border-color: #6A0DAD;
  width: 100%;
}

.btn-primary:hover {
  background-color: #5a0b91;
  border-color: #5a0b91;
}

.badge{
  color:#fff;
}
</style>