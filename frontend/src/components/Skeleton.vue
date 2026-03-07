<template>
  <div v-if="!contentStr || contentStr === ''" :class="['skeleton', `skeleton-${type}`]" :style="customStyle">
    <slot v-if="type === 'text' || type === 'line'" />
  </div>
  <div v-else :style="customStyle">
    <slot>{{ contentStr }}</slot>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  type: {
    type: String,
    default: 'rect', // 可选值: rect, circle, text, line, avatar, button, image, card
    validator: (value) => [
      'rect', 'circle', 'text', 'line', 
      'avatar', 'button', 'image', 'card', 
      'nickname', 'description', 'meta-item',
      'stat-number', 'stat-label', 'detail-label', 
      'detail-value', 'content-line', 'content-line-half',
      'name', 'name-short', 'desc', 'time', 'icon'
    ].includes(value)
  },
  width: {
    type: [String, Number],
    default: null
  },
  height: {
    type: [String, Number],
    default: null
  },
  borderRadius: {
    type: String,
    default: null
  },
  content: {
    type: [String, Number, Boolean],
    required: false,
    default: ''
  }
});

const contentStr = computed(() => {
  if (props.content === undefined || props.content === null) {
    return '';
  }
  return String(props.content);
});

const customStyle = computed(() => {
  let style = {};
  
  if (props.width) {
    style.width = typeof props.width === 'number' ? props.width + 'px' : props.width;
  }
  
  if (props.height) {
    style.height = typeof props.height === 'number' ? props.height + 'px' : props.height;
  }
  
  if (props.borderRadius) {
    style.borderRadius = props.borderRadius;
  }
  
  return style;
});
</script>

<style scoped>
.skeleton {
  background: linear-gradient(90deg, var(--card-secondary-bg, #f0f0f0) 25%, var(--card-bg, #e0e0e0) 50%, var(--card-secondary-bg, #f0f0f0) 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  display: inline-block;
  vertical-align: middle;
}

@keyframes loading {
  0% {
    background-position-x: 50%;
  }
  100% {
    background-position-x: -150%;
  }
}

/* 基础形状 */
.skeleton-rect {
  border-radius: 4px;
}

.skeleton-circle {
  border-radius: 50%;
  width: 40px;
  height: 40px;
}

/* 特定类型尺寸 */
.skeleton-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 4px solid var(--card-bg, white);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.skeleton-avatar-large {
  width: 60px;
  height: 60px;
  border-radius: 50%;
}

.skeleton-avatar-small {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.skeleton-nickname {
  width: 150px;
  height: 28px;
  margin: 0 0 8px 0;
}

.skeleton-description {
  width: 200px;
  height: 20px;
  margin: 0 0 12px 0;
}

.skeleton-meta-item {
  width: 120px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
}

.skeleton-button {
  width: 120px;
  height: 40px;
  border-radius: 8px;
}

.skeleton-stat-number {
  width: 60px;
  height: 30px;
  font-size: 1.75rem;
  font-weight: 700;
}

.skeleton-stat-label {
  width: 40px;
  height: 18px;
  font-size: 0.9rem;
}

.skeleton-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.skeleton-detail-label {
  width: 40px;
  height: 16px;
  font-size: 0.85rem;
  font-weight: 500;
  margin-bottom: 4px;
}

.skeleton-detail-value {
  width: 120px;
  height: 18px;
  font-size: 1rem;
  font-weight: 500;
}

.skeleton-content-line {
  width: 100%;
  height: 18px;
}

.skeleton-content-line-half {
  width: 50%;
  height: 18px;
}

.skeleton-name {
  width: 100px;
  height: 20px;
}

.skeleton-name-short {
  width: 70px;
  height: 20px;
}

.skeleton-desc {
  width: 150px;
  height: 16px;
}

.skeleton-time {
  width: 80px;
  height: 14px;
}

/* 文本类型 */
.skeleton-text {
  width: 100%;
  height: 16px;
  border-radius: 4px;
}

.skeleton-line {
  width: 100%;
  height: 16px;
  border-radius: 4px;
  margin-bottom: 8px;
}

.skeleton-line:last-child {
  margin-bottom: 0;
}

/* 卡片类型 */
.skeleton-card {
  width: 100%;
  height: 120px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid var(--border-color, #e0e0e0);
}
</style>