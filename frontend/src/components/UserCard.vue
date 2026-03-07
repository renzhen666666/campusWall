<template>
  <div class="user-card">
    <div class="card-header">
      <div class="avatar-section">
        <img
          :src="userTools.getAvatarUrl(user.id)"
          :alt="user.nickname"
          class="avatar"
          @error="userTools.handleAvatarError"
        >
      </div>
      <div class="user-info">
        <h3 class="nickname">{{ user.nickname }}</h3>
        <p class="description">{{ user.description || '这个人很懒，什么都没写' }}</p>
        <div class="user-meta">
          <span v-if="user.gender" class="gender-badge" :class="userTools.getGenderClass(user.gender)">
            <i :class="userTools.getGenderIcon(user.gender)"></i>
            {{ userTools.getGenderText(user.gender) }}
          </span>
          <span v-if="user.birthday" class="birthday">
            <i class="bi bi-cake2"></i>
            {{ userTools.formatBirthday(user.birthday) }}
          </span>
        </div>
      </div>
    </div>

    <div class="card-body">
      <div class="stats-section">
        <div class="stat-item">
          <span class="stat-number">{{ user.following?.length || 0 }}</span>
          <span class="stat-label">关注</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">{{ user.followers?.length || 0 }}</span>
          <span class="stat-label">粉丝</span>
        </div>
      </div>

      <div v-if="user.email || user.phone" class="contact-section">
        <div v-if="user.email" class="contact-item">
          <i class="bi bi-envelope"></i>
          <span>{{ user.email }}</span>
        </div>
        <div v-if="user.phone" class="contact-item">
          <i class="bi bi-telephone"></i>
          <span>{{ user.phone }}</span>
        </div>
      </div>
    </div>

    <div class="card-footer">
      <button class="btn-follow" :class="{ 'following': isFollowing }" @click="toggleFollow">
        <i class="bi" :class="isFollowing ? 'bi-person-check-fill' : 'bi-person-plus'"></i>
        {{ isFollowing ? '已关注' : '关注' }}
      </button>
      <button class="btn-profile" @click="goToProfile">
        <i class="bi bi-person"></i>
        查看主页
      </button>
    </div>
  </div>
</template>

<script setup>
import userTools from '../utils/userPage'
import { inject } from 'vue'

const Alert = inject('Alert')

const props = defineProps({
  user: {
    type: Object,
    required: true,
    validator: (value) => {
      return value.id && value.nickname
    }
  },
  isFollowing: {
    type: Boolean,
    default: false
  }
})

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


</script>

<style scoped>
.user-card {
  background: var(--card-bg, white);
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: all 0.3s ease;
  border: 1px solid var(--border-color, #e0e0e0);
}

.user-card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.card-header {
  padding: 24px;
  display: flex;
  gap: 20px;
  background: linear-gradient(135deg, var(--primary-light) 0%, transparent 100%);
}

.avatar-section {
  flex-shrink: 0;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid var(--card-bg, white);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background-color: #f5f5f5;

  padding: 5px;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.nickname {
  margin: 0 0 8px 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary, #333);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.description {
  margin: 0 0 12px 0;
  font-size: 0.95rem;
  color: var(--text-secondary, #666);
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.user-meta {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.gender-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.gender-badge.male {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  color: #1976d2;
}

.gender-badge.female {
  background: linear-gradient(135deg, #fce4ec 0%, #f8bbd9 100%);
  color: #c2185b;
}

.birthday {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.85rem;
  color: var(--text-secondary, #666);
}

.card-body {
  padding: 0 24px 20px 24px;
}

.stats-section {
  display: flex;
  justify-content: center;
  gap: 40px;
  padding: 16px 0;
  border-bottom: 1px solid var(--border-color, #e0e0e0);
  margin-bottom: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary-color, #6A0DAD);
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary, #666);
}

.contact-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: var(--text-secondary, #666);
}

.contact-item i {
  color: var(--primary-color, #6A0DAD);
  font-size: 1rem;
}

.card-footer {
  padding: 16px 24px;
  display: flex;
  gap: 12px;
  border-top: 1px solid var(--border-color, #e0e0e0);
}

.btn-follow,
.btn-profile {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.3s ease;
}

.btn-follow {
  background: var(--primary-color, #6A0DAD);
  color: white;
}

.btn-follow:hover {
  background: var(--primary-dark, #5a0b91);
  transform: translateY(-1px);
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

.btn-profile {
  background: var(--bg-color, #f5f5f5);
  color: var(--text-primary, #333);
  border: 1px solid var(--border-color, #e0e0e0);
}

.btn-profile:hover {
  background: var(--primary-light);
  color: var(--primary-color, #6A0DAD);
  border-color: var(--primary-color, #6A0DAD);
}

/* 响应式 */
@media (max-width: 768px) {
  .card-header {
    padding: 20px;
    gap: 16px;
  }

  .avatar {
    width: 64px;
    height: 64px;
  }

  .nickname {
    font-size: 1.1rem;
  }

  .description {
    font-size: 0.9rem;
  }

  .stats-section {
    gap: 32px;
  }

  .stat-number {
    font-size: 1.3rem;
  }

  .card-footer {
    padding: 12px 20px;
  }

  .btn-follow,
  .btn-profile {
    padding: 8px 12px;
    font-size: 0.9rem;
  }
}

@media (max-width: 576px) {
  .card-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .user-meta {
    justify-content: center;
  }

  .contact-section {
    align-items: center;
  }

  .card-footer {
    padding: 12px 16px;
  }
}
</style>