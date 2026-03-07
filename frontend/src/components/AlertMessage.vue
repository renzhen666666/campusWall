<template>
  <div>
    <!-- 中央警告 -->
    <transition name="alert-center">
      <div v-if="centerAlert.show" class="alert-center" :class="`alert-${centerAlert.type}`">
        <div class="alert-content">
          <i :class="getIcon(centerAlert.type)" class="alert-icon"></i>
          <div class="alert-message">
            <h4 v-if="centerAlert.title" class="alert-title">{{ centerAlert.title }}</h4>
            <p class="alert-text">{{ centerAlert.message }}</p>
          </div>
          <button class="alert-close" @click="hideCenterAlert">
            <i class="bi bi-x"></i>
          </button>
        </div>
      </div>
    </transition>

    <!-- 右上角警告 -->
    <transition name="alert-corner">
      <div v-if="topRightAlert.show" class="alert-corner alert-top-right" :class="`alert-${topRightAlert.type}`">
        <div class="alert-content">
          <i :class="getIcon(topRightAlert.type)" class="alert-icon"></i>
          <div class="alert-message">
            <h4 v-if="topRightAlert.title" class="alert-title">{{ topRightAlert.title }}</h4>
            <p class="alert-text">{{ topRightAlert.message }}</p>
          </div>
          <button class="alert-close" @click="hideTopRightAlert">
            <i class="bi bi-x"></i>
          </button>
        </div>
      </div>
    </transition>

    <!-- 右下角警告 -->
    <transition name="alert-corner">
      <div v-if="bottomRightAlert.show" class="alert-corner alert-bottom-right" :class="`alert-${bottomRightAlert.type}`">
        <div class="alert-content">
          <i :class="getIcon(bottomRightAlert.type)" class="alert-icon"></i>
          <div class="alert-message">
            <h4 v-if="bottomRightAlert.title" class="alert-title">{{ bottomRightAlert.title }}</h4>
            <p class="alert-text">{{ bottomRightAlert.message }}</p>
          </div>
          <button class="alert-close" @click="hideBottomRightAlert">
            <i class="bi bi-x"></i>
          </button>
        </div>
      </div>
    </transition>

    <!-- 指定元素下方警告 -->
    <transition name="alert-below">
      <div v-if="belowAlert.show" class="alert-below" :class="`alert-${belowAlert.type}`" :style="belowAlert.position">
        <div class="alert-content">
          <i :class="getIcon(belowAlert.type)" class="alert-icon"></i>
          <div class="alert-message">
            <h4 v-if="belowAlert.title" class="alert-title">{{ belowAlert.title }}</h4>
            <p class="alert-text">{{ belowAlert.message }}</p>
          </div>
          <button class="alert-close" @click="hideBelowAlert">
            <i class="bi bi-x"></i>
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const centerAlert = ref({
  show: false,
  type: 'info',
  title: '',
  message: ''
})

const topRightAlert = ref({
  show: false,
  type: 'info',
  title: '',
  message: ''
})

const bottomRightAlert = ref({
  show: false,
  type: 'info',
  title: '',
  message: ''
})

const belowAlert = ref({
  show: false,
  type: 'info',
  title: '',
  message: '',
  position: {}
})

const getIcon = (type) => {
  const icons = {
    success: 'bi-check-circle-fill',
    error: 'bi-x-circle-fill',
    warning: 'bi-exclamation-triangle-fill',
    info: 'bi-info-circle-fill'
  }
  return icons[type] || icons.info
}

// 中央警告
const showCenterAlert = (message, type = 'info', title = '', duration = 3000) => {
  centerAlert.value = {
    show: true,
    type,
    title,
    message
  }

  if (duration > 0) {
    setTimeout(() => {
      hideCenterAlert()
    }, duration)
  }
}

const hideCenterAlert = () => {
  centerAlert.value.show = false
}

// 右上角警告
const showTopRightAlert = (message, type = 'info', title = '', duration = 3000) => {
  topRightAlert.value = {
    show: true,
    type,
    title,
    message
  }

  if (duration > 0) {
    setTimeout(() => {
      hideTopRightAlert()
    }, duration)
  }
}

const hideTopRightAlert = () => {
  topRightAlert.value.show = false
}

// 右下角警告
const showBottomRightAlert = (message, type = 'info', title = '', duration = 3000) => {
  bottomRightAlert.value = {
    show: true,
    type,
    title,
    message
  }

  if (duration > 0) {
    setTimeout(() => {
      hideBottomRightAlert()
    }, duration)
  }
}

const hideBottomRightAlert = () => {
  bottomRightAlert.value.show = false
}

// 指定元素下方警告
const showBelowAlert = (elementId, message, type = 'info', title = '', duration = 3000) => {
  const element = document.getElementById(elementId)
  if (!element) {
    console.error(`Element with id "${elementId}" not found`)
    return
  }

  const rect = element.getBoundingClientRect()
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft

  belowAlert.value = {
    show: true,
    type,
    title,
    message,
    position: {
      top: `${rect.bottom + scrollTop + 10}px`,
      left: `${rect.left + scrollLeft}px`
    }
  }

  if (duration > 0) {
    setTimeout(() => {
      hideBelowAlert()
    }, duration)
  }
}

const hideBelowAlert = () => {
  belowAlert.value.show = false
}

// 导出方法供外部使用
defineExpose({
  showCenterAlert,
  showTopRightAlert,  
  showBottomRightAlert,
  showBelowAlert,

  hideCenterAlert,
  hideTopRightAlert,
  hideBottomRightAlert,
  hideBelowAlert
})
</script>

<style scoped>
/* 中央警告 */
.alert-center {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 9999;
  min-width: 320px;
  max-width: 500px;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

/* 角落警告 */
.alert-corner {
  position: fixed;
  z-index: 9999;
  min-width: 300px;
  max-width: 400px;
  padding: 16px 20px;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.alert-top-right {
  top: 20px;
  right: 20px;
}

.alert-bottom-right {
  bottom: 20px;
  right: 20px;
}

/* 元素下方警告 */
.alert-below {
  position: fixed;
  z-index: 9998;
  min-width: 280px;
  max-width: 400px;
  padding: 14px 18px;
  border-radius: 10px;
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

/* 警告类型样式 */
.alert-success {
  background: rgba(40, 167, 69, 0.95);
  color: white;
  border: 1px solid rgba(40, 167, 69, 0.3);
}

.alert-error {
  background: rgba(220, 53, 69, 0.95);
  color: white;
  border: 1px solid rgba(220, 53, 69, 0.3);
}

.alert-warning {
  background: rgba(255, 193, 7, 0.95);
  color: #333;
  border: 1px solid rgba(255, 193, 7, 0.3);
}

.alert-info {
  background: var(--primary-dark);
  color: white;
  border: 1px solid var(--border-color);
}

/* 警告内容 */
.alert-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.alert-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
  margin-top: 2px;
}

.alert-message {
  flex: 1;
}

.alert-title {
  margin: 0 0 4px 0;
  font-size: 1rem;
  font-weight: 600;
}

.alert-text {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.4;
}

.alert-close {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 4px;
  opacity: 0.7;
  transition: opacity 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.alert-close:hover {
  opacity: 1;
}

/* 动画 */
.alert-center-enter-active,
.alert-center-leave-active {
  transition: all 0.3s ease;
}

.alert-center-enter-from,
.alert-center-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.9);
}

.alert-corner-enter-active,
.alert-corner-leave-active {
  transition: all 0.3s ease;
}

.alert-corner-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.alert-corner-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.alert-below-enter-active,
.alert-below-leave-active {
  transition: all 0.3s ease;
}

.alert-below-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.alert-below-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 响应式 */
@media (max-width: 768px) {
  .alert-center {
    min-width: 280px;
    max-width: 90vw;
  }

  .alert-corner {
    min-width: 260px;
    max-width: 90vw;
  }

  .alert-top-right {
    top: 10px;
    right: 10px;
    left: 10px;
  }

  .alert-bottom-right {
    bottom: 10px;
    right: 10px;
    left: 10px;
  }

  .alert-below {
    min-width: 240px;
    max-width: 80vw;
  }
}
</style>