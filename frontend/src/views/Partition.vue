<template>
  <div class="partition-page">
    <div class="container mt-4">
      <h1 v-if="tag">#{{ tag }}</h1>
      <h1 v-else>分区</h1>

      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">加载中...</span>
        </div>
      </div>
      <div v-else-if="messages.length === 0" class="alert alert-info">
        {{ tag ? `暂无 #${tag} 的留言` : '暂无留言' }}
      </div>
      <div v-else class="mt-4">
        <div class="message-box">
          <MessageCard
            v-for="message in messages"
            :key="message.id"
            :message="message"
            @like="handleLike"
            @dislike="handleDislike"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import api from '../services/api'
import MessageCard from '../components/MessageCard.vue'

const route = useRoute()

const tag = ref('')
const messages = ref([])
const loading = ref(true)

const loadMessages = async () => {
  loading.value = true
  tag.value = route.params.tag || ''

  try {
    if (tag.value) {
      const response = await api.getPartitionMessages(tag.value)
      if (response.data.success) {
        const messageIds = response.data.data || []
        if (messageIds.length > 0) {
          const allMessages = await api.getMessages({
            s: 'newest',
            w: '',
            f: 'all',
            start: 0,
            end: 1000
          })
          if (allMessages.data) {
            messages.value = allMessages.data.data.filter(m => messageIds.includes(m.id))
          }
        }
      }
    }
  } catch (error) {
    console.error('加载留言失败:', error)
  } finally {
    loading.value = false
  }
}

const handleLike = async (messageId) => {
  try {
    const response = await api.likeMessage(messageId)
    if (response.data.success) {
      const message = messages.value.find(m => m.id === messageId)
      if (message) {
        message.likes = response.data.likes
        message.liked = response.data.action === 'like' ? 1 : 0
      }
    }
  } catch (error) {
    console.error('点赞失败:', error)
  }
}

const handleDislike = async (messageId) => {
  try {
    const response = await api.dislikeMessage(messageId)
    if (response.data.success) {
      const message = messages.value.find(m => m.id === messageId)
      if (message) {
        message.dislikes = response.data.action === 'dislike' ? message.dislikes + 1 : message.dislikes - 1
        message.disliked = response.data.action === 'dislike' ? 1 : 0
      }
    }
  } catch (error) {
    console.error('点踩失败:', error)
  }
}

onMounted(() => {
  loadMessages()
})

watch(() => route.params.tag, () => {
  loadMessages()
})
</script>

<style scoped>
.partition-page {
  background-color: transparent;
  min-height: 100vh;
}

.message-box {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
</style>