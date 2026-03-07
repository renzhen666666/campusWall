<template>
  <div class="user-profile">
    <div class="profile-container">
      <!-- 个人信息头部 -->
      <div class="profile-header">
        <div class="cover-photo">
          <div class="cover-pattern"></div>
        </div>
        
        <div class="profile-info">
          <div class="avatar-section">
            <img
              v-if="!loading"
              :src="userTools.getAvatarUrl(user.id)"
              :alt="user.nickname"
              class="avatar"
              @error="userTools.handleAvatarError"
            >
            <Skeleton v-else type="avatar" />
            <span v-if="!loading && user.gender" class="gender-badge" :class="userTools.getGenderClass(user.gender)">
              <i :class="userTools.getGenderIcon(user.gender)"></i>
            </span>
          </div>
          
          <div class="user-details">
            <h1 class="nickname">
              <Skeleton type="nickname" :content="!loading ? user.nickname : ''" />
            </h1>
            <p class="description">
              <Skeleton :content="!loading ? (user.description || '这个人很懒，什么都没写') : ''" />
            </p>
            
            <div class="meta-info">
              <span v-if="!loading && user.gender" class="meta-item">
                <i class="bi bi-gender-ambiguous"></i>
                {{ userTools.getGenderText(user.gender) }}
              </span>
              <span v-if="!loading && user.birthday" class="meta-item">
                <i class="bi bi-cake2"></i>
                {{ userTools.formatBirthday(user.birthday) }}
              </span>
              <Skeleton v-if="loading" type="meta-item" />
              <Skeleton v-if="loading" type="meta-item" />
            </div>
          </div>

          <div class="profile-actions">
            <button 
              v-if="!loading && !isCurrentUser" 
              class="btn-follow" 
              :class="{ 'following': isFollowing }"
              @click="toggleFollow"
            >
              <i class="bi" :class="isFollowing ? 'bi-person-check-fill' : 'bi-person-plus-fill'"></i>
              {{ isFollowing ? '已关注' : '关注' }}
            </button>
            <Skeleton v-else-if="loading" type="button" />
            <button v-if="!loading && isCurrentUser" class="btn-edit">
              <i class="bi bi-pencil-square"></i>
              编辑资料
            </button>
            <button v-if="!loading" class="btn-share" @click="shareProfile">
              <i class="bi bi-share"></i>
              分享
            </button>
          </div>
        </div>
      </div>

      <!-- 统计数据 -->
      <div class="stats-section">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="bi bi-person-plus"></i>
          </div>
          <div class="stat-content">
            <span class="stat-number">
              <Skeleton :content="!loading ? (user.following?.length || 0) : ''" />
            </span>
            <span class="stat-label">
              <Skeleton type="stat-label" :content="!loading ? '关注' : ''" />
            </span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="bi bi-people"></i>
          </div>
          <div class="stat-content">
            <span class="stat-number">
              <Skeleton :content="!loading ? (user.followers?.length || 0) : ''" />
            </span>
            <span class="stat-label">
              <Skeleton type="stat-label" :content="!loading ? '粉丝' : ''" />
            </span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="bi bi-chat-dots"></i>
          </div>
          <div class="stat-content">
            <span class="stat-number">
              <Skeleton :content="!loading ? totalMessages : ''" />
            </span>
            <span class="stat-label">
              <Skeleton type="stat-label" :content="!loading ? '留言' : ''" />
            </span>
          </div>
        </div>
      </div>

      <!-- 详细信息 -->
      <div class="details-section">
        <h2 class="section-title">个人信息</h2>
        <div class="details-grid">
          <div v-if="!loading && user.email" class="detail-item">
            <div class="detail-icon">
              <i class="bi bi-envelope"></i>
            </div>
            <div class="detail-content">
              <span class="detail-label">邮箱</span>
              <span class="detail-value">{{ user.email }}</span>
            </div>
          </div>
          <div v-else-if="loading" class="detail-item">
            <Skeleton type="icon" />
            <div class="detail-content">
              <Skeleton type="detail-label" />
              <Skeleton type="detail-value" />
            </div>
          </div>
          <div v-if="!loading && user.phone" class="detail-item">
            <div class="detail-icon">
              <i class="bi bi-telephone"></i>
            </div>
            <div class="detail-content">
              <span class="detail-label">电话</span>
              <span class="detail-value">{{ user.phone }}</span>
            </div>
          </div>
          <div v-else-if="loading && user.phone" class="detail-item">
            <Skeleton type="icon" />
            <div class="detail-content">
              <Skeleton type="detail-label" />
              <Skeleton type="detail-value" />
            </div>
          </div>
          <div v-if="!loading && user.birthday" class="detail-item">
            <div class="detail-icon">
              <i class="bi bi-calendar-event"></i>
            </div>
            <div class="detail-content">
              <span class="detail-label">生日</span>
              <span class="detail-value">{{ user.birthday }}</span>
            </div>
          </div>
          <div v-else-if="loading && user.birthday" class="detail-item">
            <Skeleton type="icon" />
            <div class="detail-content">
              <Skeleton type="detail-label" />
              <Skeleton type="detail-value" />
            </div>
          </div>
        </div>
      </div>

      <!-- 关注/粉丝列表 -->
      <div class="social-section">
        <div class="social-tabs">
          <button 
            class="tab-btn" 
            :class="{ 'active': activeTab === 'following' }"
            @click="activeTab = 'following'"
          >
            <i class="bi bi-person-plus"></i>
            关注 {{ user.following?.length || 0 }}
          </button>
          <button 
            class="tab-btn" 
            :class="{ 'active': activeTab === 'followers' }"
            @click="activeTab = 'followers'"
          >
            <i class="bi bi-people"></i>
            粉丝 {{ user.followers?.length || 0 }}
          </button>
        </div>

        <div class="social-content">
          <div v-if="!loading && activeTab === 'following' && user.following?.length > 0" class="users-grid">
            <UserCardMini
              v-for="userId in user.following"
              :key="userId"
              :user="userTools.getUserById(userId)"
              :is-following="false"
              @follow="userTools.handleFollow(userId)"
              @unfollow="userTools.handleUnfollow(userId)"
            />
          </div>
          <div v-else-if="!loading && activeTab === 'followers' && user.followers?.length > 0" class="users-grid">
            <UserCardMini
              v-for="userId in user.followers"
              :key="userId"
              :user="userTools.getUserById(userId)"
              :is-following="false"
              @follow="userTools.handleFollow(userId)"
              @unfollow="userTools.handleUnfollow(userId)"
            />
          </div>
          <div v-else-if="loading" class="loading-users-grid">
            <div class="skeleton-user-card" v-for="i in 3" :key="'skeleton-'+i">
              <Skeleton type="avatar-large" />
              <div class="skeleton-info">
                <Skeleton type="name" />
                <Skeleton type="desc" />
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <i class="bi bi-inbox"></i>
            <p>{{ activeTab === 'following' ? '还没有关注任何人' : '还没有粉丝' }}</p>
          </div>
        </div>
      </div>

      <!-- 用户的留言 -->
      <div class="messages-section">
        <h2 class="section-title">
          <i class="bi bi-chat-dots"></i>
          用户的留言
        </h2>
        <div v-if="!loading && userMessages.length > 0" class="messages-list">
          <MessageCard
            v-for="message in userMessages"
            :key="message.id"
            :message="message"
            @like="handleLike"
            @dislike="handleDislike"
            @comment="handleComment"
          />
        </div>
        <div v-else-if="!loading && userMessages.length === 0" class="empty-state">
          <i class="bi bi-chat-square-text"></i>
          <p>还没有发布任何留言</p>
        </div>
        <div v-else class="messages-list">
          <div class="skeleton-message-card" v-for="i in 3" :key="'msg-skeleton-'+i">
            <div class="skeleton-message-header">
              <Skeleton type="avatar-small" />
              <div class="skeleton-info">
                <Skeleton type="name-short" />
                <Skeleton type="time" />
              </div>
            </div>
            <div class="skeleton-message-content">
              <Skeleton type="content-line" />
              <Skeleton type="content-line" />
              <Skeleton type="content-line-half" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, defineProps } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import dayjs from 'dayjs'
import UserCardMini from '../components/UserCardMini.vue'
import MessageCard from '../components/MessageCard.vue'
import Skeleton from '../components/Skeleton.vue'
import userTools from '../utils/userPage'

const props = defineProps({
  userId: {
    type: [String, Number],
    required: true
  },
  user: {
    type: Object,
    default: {
      id: null,
      nickname: '匿名用户'
    }
  }
})

const loading = ref(true)

const route = useRoute()
const router = useRouter()

const isFollowing = ref(false)
const isCurrentUser = ref(false)
const activeTab = ref('following')
const userMessages = ref([])
const totalMessages = ref(0)

const staticUrl = import.meta.env.VITE_STATIC_URL || '/static/'

const toggleFollow = () => {
  if (props.isFollowing) {
    if(props.user.id) {
      userTools.unfollow(props.user.id)
    }
  } else {
    if(props.user.id) {
      userTools.follow(props.user.id)
    }
  }
}

const shareProfile = () => {
  const url = window.location.href
  navigator.clipboard.writeText(url).then(() => {
    alert('链接已复制到剪贴板')
  }).catch(() => {
    alert('复制失败，请手动复制链接')
  })
}

const handleLike = (messageId) => {
  console.log('点赞:', messageId)
}

const handleDislike = (messageId) => {
  console.log('点踩:', messageId)
}

const handleComment = (messageId, comment) => {
  console.log('评论:', messageId, comment)
}

const fetchUserProfile = async () => {
  const res = await userTools.getUserById(props.userId) || {} 
  if(res.success) {
    props.user = res.data
  } else {
    console.error('获取用户信息失败:', res.message)
    props.user = {}
  }
  loading.value = false
}

const fetchUserMessages = async () => {
  try {
    const userId = route.params.id
    const response = await axios.get(`/api/user/${userId}/messages`)
    userMessages.value = response.data.messages || []
    totalMessages.value = response.data.total || 0
  } catch (error) {
    console.error('获取用户留言失败:', error)
    userMessages.value = []
    totalMessages.value = 0
  }
}

onMounted(() => {
  fetchUserProfile()
  fetchUserMessages()
})
</script>

<style scoped>
.user-profile {
  min-height: 100vh;
  background: var(--bg-color, #f5f5f5);
  padding: 20px 0;
}

.profile-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 20px;
}

/* 个人信息头部 */
.profile-header {
  background: var(--card-bg, white);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 20px;
}

.cover-photo {
  height: 200px;
  background: linear-gradient(135deg, var(--primary-color, #6A0DAD) 0%, var(--primary-dark, #5a0b91) 100%);
  position: relative;
  overflow: hidden;
}

.cover-pattern {
  position: absolute;
  inset: 0;
  background-image: 
    radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
}

.profile-info {
  padding: 0 32px 32px 32px;
  display: flex;
  gap: 24px;
  margin-top: -60px;
  position: relative;
}

.avatar-section {
  position: relative;
  flex-shrink: 0;
}

.avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid var(--card-bg, white);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  background-color: #f5f5f5;
}

.gender-badge {
  position: absolute;
  bottom: 8px;
  right: 8px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid var(--card-bg, white);
  font-size: 1rem;
}

.gender-badge.male {
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
  color: white;
}

.gender-badge.female {
  background: linear-gradient(135deg, #c2185b 0%, #ad1457 100%);
  color: white;
}

.user-details {
  flex: 1;
  padding-top: 64px;
}

.nickname {
  margin: 0 0 8px 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary, #333);
}

.description {
  margin: 0 0 12px 0;
  font-size: 1rem;
  color: var(--text-secondary, #666);
  line-height: 1.6;
}

.meta-info {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  color: var(--text-secondary, #666);
}

.meta-item i {
  color: var(--primary-color, #6A0DAD);
}

.profile-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 64px;
}

.btn-follow,
.btn-edit,
.btn-share {
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.btn-follow {
  background: var(--primary-color, #6A0DAD);
  color: white;
}

.btn-follow:hover {
  background: var(--primary-dark, #5a0b91);
  transform: translateY(-2px);
}

.btn-follow.following {
  background: var(--bg-color, #f5f5f5);
  color: var(--text-secondary, #666);
  border: 1px solid var(--border-color, #e0e0e0);
}

.btn-follow.following:hover {
  background: #ffebee;
  color: #c62828;
  border-color: #ffcdd2;
}

.btn-edit {
  background: var(--bg-color, #f5f5f5);
  color: var(--text-primary, #333);
  border: 1px solid var(--border-color, #e0e0e0);
}

.btn-edit:hover {
  background: var(--primary-light);
  color: var(--primary-color, #6A0DAD);
  border-color: var(--primary-color, #6A0DAD);
}

.btn-share {
  background: transparent;
  color: var(--text-secondary, #666);
  border: 1px solid var(--border-color, #e0e0e0);
}

.btn-share:hover {
  background: var(--primary-light);
  color: var(--primary-color, #6A0DAD);
  border-color: var(--primary-color, #6A0DAD);
}

/* 统计数据 */
.stats-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  background: var(--card-bg, white);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid var(--border-color, #e0e0e0);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--primary-color, #6A0DAD) 0%, var(--primary-dark, #5a0b91) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-number {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary, #333);
}

.stat-label {
  font-size: 0.9rem;
  color: var(--text-secondary, #666);
}

/* 详细信息 */
.details-section {
  background: var(--card-bg, white);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid var(--border-color, #e0e0e0);
}

.section-title {
  margin: 0 0 20px 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary, #333);
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title i {
  color: var(--primary-color, #6A0DAD);
}

.details-grid {
  display: grid;
  gap: 16px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: var(--bg-color, #f5f5f5);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.detail-item:hover {
  background: var(--primary-light);
}

.detail-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--primary-color, #6A0DAD) 0%, var(--primary-dark, #5a0b91) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-label {
  font-size: 0.85rem;
  color: var(--text-secondary, #666);
  font-weight: 500;
}

.detail-value {
  font-size: 1rem;
  color: var(--text-primary, #333);
  font-weight: 500;
}

/* 关注/粉丝列表 */
.social-section {
  background: var(--card-bg, white);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid var(--border-color, #e0e0e0);
}

.social-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  border-bottom: 2px solid var(--border-color, #e0e0e0);
}

.tab-btn {
  padding: 12px 24px;
  background: none;
  border: none;
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--text-secondary, #666);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  position: relative;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
}

.tab-btn:hover {
  color: var(--primary-color, #6A0DAD);
}

.tab-btn.active {
  color: var(--primary-color, #6A0DAD);
  border-bottom-color: var(--primary-color, #6A0DAD);
}

.tab-btn.active i {
  color: var(--primary-color, #6A0DAD);
}

.social-content {
  min-height: 200px;
}

.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
}

/* 用户的留言 */
.messages-section {
  background: var(--card-bg, white);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid var(--border-color, #e0e0e0);
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: var(--text-secondary, #666);
}

.empty-state i {
  font-size: 4rem;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state p {
  font-size: 1rem;
  margin: 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .profile-container {
    padding: 0 16px;
  }

  .profile-header {
    border-radius: 12px;
  }

  .cover-photo {
    height: 150px;
  }

  .profile-info {
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 0 20px 24px 20px;
    margin-top: -50px;
    gap: 16px;
  }

  .avatar {
    width: 100px;
    height: 100px;
  }

  .user-details {
    padding-top: 0;
    width: 100%;
  }

  .nickname {
    font-size: 1.5rem;
  }

  .meta-info {
    justify-content: center;
  }

  .profile-actions {
    flex-direction: row;
    width: 100%;
    padding-top: 0;
  }

  .btn-follow,
  .btn-edit,
  .btn-share {
    flex: 1;
    padding: 8px 16px;
    font-size: 0.9rem;
  }

  .stats-section {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .stat-card {
    padding: 16px;
  }

  .stat-number {
    font-size: 1.5rem;
  }

  .details-section,
  .social-section,
  .messages-section {
    padding: 20px;
    border-radius: 12px;
  }

  .users-grid {
    grid-template-columns: 1fr;
  }

  .section-title {
    font-size: 1.1rem;
  }
}

@media (max-width: 576px) {
  .profile-container {
    padding: 0 12px;
  }

  .cover-photo {
    height: 120px;
  }

  .profile-info {
    padding: 0 16px 20px 16px;
  }

  .avatar {
    width: 80px;
    height: 80px;
  }

  .nickname {
    font-size: 1.25rem;
  }

  .description {
    font-size: 0.9rem;
  }

  .profile-actions {
    flex-direction: column;
  }

  .btn-follow,
  .btn-edit,
  .btn-share {
    width: 100%;
  }

  .details-section,
  .social-section,
  .messages-section {
    padding: 16px;
  }

  .detail-item {
    padding: 12px;
  }

  .detail-icon {
    width: 40px;
    height: 40px;
    font-size: 1rem;
  }
}
</style>