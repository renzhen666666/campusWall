<template>
  <div class="message-detail-page">
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
      <MessageCard
      :message="message"
      :showAllComment="true"
      :commentContainerMaxHeight="'none'"
      />
    </div>




  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../services/api'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'
import MessageCard from '../components/MessageCard.vue'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const route = useRoute()
const router = useRouter()

const message = ref(null)
const loading = ref(true)



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

onMounted(() => {
  loadMessage()
})
</script>

<style scoped>
.message-detail-page {
  background-color: var(--bg-color);
  min-height: 100vh;
}

</style>