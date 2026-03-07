<template>
  <div class="user-card-simple" @click="goToProfile">

    <div class="avater-wrapper">
      <img
        v-if="!loading"
        :src="userTools.getAvatarUrl(user.id || 0)"
        :alt="user.nickname || '用户'"
        class="avatar"
        @error="userTools.handleAvatarError"
      >
      <Skeleton v-else type="avatar" :width="32" :height="32" />
      <span v-if="!loading && user.gender" class="gender-badge" :class="userTools.getGenderClass(user.gender)">
        <i :class="userTools.getGenderIcon(user.gender)"></i>
      </span>
    </div>

    <span class="nickname">
      <Skeleton type="nickname" :content="!loading&&user.nickname ? user.nickname : ''" />
    </span>
    <button 
      class="btn-follow" 
      :class="{ 'following': isFollowing }"
      @click.stop="toggleFollow"
      v-if="userId>10"
    >
      <i class="bi" :class="isFollowing ? 'bi-check-lg' : 'bi-plus-lg'"></i>
  </button>
  </div>

</template>

<script setup>
import userTools from '../utils/userPage'
import { defineProps, inject, onMounted, ref } from 'vue'
import Skeleton from './Skeleton.vue'

const Alert = inject('Alert')
const loading = ref(true)


const props = defineProps({
  user: {
    type: Object,
    required: false,
    default: {
      id: null,
      nickname: '匿名用户'
    }
  },
  userId: {
    type: Number,
    required: true
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
.user-card-simple {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: var(--card-bg, white);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid var(--border-color, #e0e0e0);
}

.user-card-simple:hover {
  background: var(--hover-bg, rgba(106, 13, 173, 0.05));
  border-color: var(--primary-color, #6A0DAD);
  transform: translateY(-1px);
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  background-color: #f5f5f5;
  flex-shrink: 0;

  padding: 5px;
}

.nickname {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-primary, #333);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

.btn-follow {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
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
  margin: 5px;
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
  .avatar {
    width: 28px;
    height: 28px;
  }

  .nickname {
    font-size: 0.85rem;
    max-width: 100px;
  }
}
</style>