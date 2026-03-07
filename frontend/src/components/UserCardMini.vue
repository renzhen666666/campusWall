<template>
  <div class="user-card-mini" @click="goToProfile">
    <div class="avatar-wrapper">
      <img
        v-if="!loading"
        :src="userTools.getAvatarUrl(user.id)"
        :alt="user.nickname"
        class="avatar"
        @error="userTools.handleAvatarError"
      >
      <Skeleton v-else type="avatar" />
    </div>
    
    <div class="user-info">
      <Skeleton type="nickname" :content="!loading ? user.nickname : ''" />
      <p class="description">
        <Skeleton :content="!loading ? (user.description || '这个人很懒，什么都没写') : ''" />
      </p>
      <div class="stats">
        <span class="stat">
          <i class="bi bi-person-plus"></i>
          {{ user.following?.length || 0 }}
        </span>
        <span class="stat">
          <i class="bi bi-people"></i>
          {{ user.followers?.length || 0 }}
        </span>
      </div>
    </div>

    <button 
      class="btn-follow" 
      :class="{ 'following': isFollowing }"
      @click.stop="toggleFollow"
    >
      <i class="bi" :class="isFollowing ? 'bi-check-lg' : 'bi-plus-lg'"></i>
    </button>
  </div>
</template>

<script setup>
import userTools from '../utils/userPage'
import Skeleton from '../components/Skeleton.vue'
import { onMounted, ref, inject } from 'vue'

let loading = ref(true)

const Alert = inject('Alert')

const props = defineProps({
  user: {
    type: Object,
    required: false,
    validator: (value) => {
      return value.id && value.nickname
    }
  },
  isFollowing: {
    type: Boolean,
    default: false
  },
  userId: {
    type: Number,
    required: true
  },
  
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

const getUserInfo = async () => {
  const res = await userTools.getUserById(props.userId) || {} 
  if(res.success) {
    props.user = res.data
  } else {
    Alert.showCenterAlert('获取用户信息失败:' + res.message, 'error', "失败")
    props.user = {}
  }
  loading.value = false
}


onMounted(() => {
  if(props.user) {
    loading.value = false
  } else {
    getUserInfo()
  }

})

</script>

<style scoped>
.user-card-mini {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--card-bg, white);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid var(--border-color, #e0e0e0);
}

.user-card-mini:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
  border-color: var(--primary-color, #6A0DAD);
}

.avatar-wrapper {
  position: relative;
  flex-shrink: 0;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--card-bg, white);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  background-color: #f5f5f5;

  padding: 5px;
}

.gender-indicator {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--card-bg, white);
  font-size: 0.65rem;
}

.gender-indicator.male {
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
  color: white;
}

.gender-indicator.female {
  background: linear-gradient(135deg, #c2185b 0%, #ad1457 100%);
  color: white;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.nickname {
  margin: 0 0 4px 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary, #333);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.description {
  margin: 0 0 6px 0;
  font-size: 0.8rem;
  color: var(--text-secondary, #666);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stats {
  display: flex;
  gap: 12px;
  font-size: 0.75rem;
  color: var(--text-secondary, #666);
}

.stat {
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat i {
  font-size: 0.85rem;
  color: var(--primary-color, #6A0DAD);
}

.btn-follow {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: var(--primary-color, #6A0DAD);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  padding: 0;
}

.btn-follow:hover {
  background: var(--primary-dark, #5a0b91);
  transform: scale(1.1);
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

/* 响应式 */
@media (max-width: 768px) {
  .user-card-mini {
    padding: 10px 14px;
    gap: 10px;
  }

  .avatar {
    width: 42px;
    height: 42px;
  }

  .nickname {
    font-size: 0.95rem;
  }

  .description {
    font-size: 0.75rem;
  }

  .btn-follow {
    width: 32px;
    height: 32px;
  }
}
</style>