<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="modal-overlay"
      @click="handleOverlayClick"
    >
      <div class="modal-content-wrapper" @click.stop>
        <!-- 关闭按钮 -->
        <button 
          v-if="showClose"
          class="modal-close-btn" 
          @click="close" 
          :aria-label="closeLabel"
        >
          <i class="bi bi-x-lg"></i>
        </button>

        <!-- 插槽：自定义内容 -->
        <div class="modal-body">
          <slot></slot>
        </div>

        <!-- 底部信息栏（可选） -->
        <div v-if="showFooter" class="modal-footer">
          <slot name="footer"></slot>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  showClose: {
    type: Boolean,
    default: true
  },
  closeLabel: {
    type: String,
    default: '关闭'
  },
  showFooter: {
    type: Boolean,
    default: false
  },
  closeOnOverlayClick: {
    type: Boolean,
    default: true
  },
  closeOnEscape: {
    type: Boolean,
    default: true
  },
  maxWidth: {
    type: String,
    default: '98vw'
  },
  maxHeight: {
    type: String,
    default: '80vh'
  }
})

const emit = defineEmits(['close', 'update:visible'])

const bodyOverflow = ref('')

// 监听 visible 变化
watch(() => props.visible, (newVal) => {
  if (newVal) {
    bodyOverflow.value = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = bodyOverflow.value
  }
})

// 关闭模态框
const close = () => {
  emit('close')
  emit('update:visible', false)
}

// 点击遮罩层关闭
const handleOverlayClick = () => {
  if (props.closeOnOverlayClick) {
    close()
  }
}

// 键盘事件处理
const handleKeyDown = (e) => {
  if (!props.visible) return
  
  if (props.closeOnEscape && e.key === 'Escape') {
    close()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
  if (props.visible) {
    document.body.style.overflow = bodyOverflow.value
  }
})

// 暴露方法给父组件
defineExpose({
  close
})
</script>

<style scoped>
:root {
  --modal-overlay-color: rgba(0, 0, 0, 0.85);
  --glass-bg: rgba(255, 255, 255, 0.05);
  --glass-border: rgba(255, 255, 255, 0.15);
}

/* 遮罩层 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9999;
  background-color: var(--modal-overlay-color);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  
  display: flex;
  justify-content: center;
  align-items: center;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 模态框内容 */
.modal-content-wrapper {
  position: relative;
  width: auto;
  height: auto;
  max-width: 95%;
  max-height: 95%;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes scaleIn {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

/* 模态框主体 */
.modal-body {

  display: flex;
  flex-direction: column;
  overflow-y: auto;

  max-width: v-bind('maxWidth');
  max-height: v-bind('maxHeight');
  height: auto;
}

/* 模态框底部 */
.modal-footer {
  background: var(--glass-bg);
  backdrop-filter: blur(10px);
  padding: 16px 24px;
  border-radius: 0 0 16px 16px;
}

/* 关闭按钮 */
.modal-close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 44px;
  height: 44px;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  color: white;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  z-index: 20;
}

.modal-close-btn:hover {
  background: rgba(0, 0, 0, 0.8);
  border-color: rgba(255, 255, 255, 0.4);
  transform: rotate(90deg);
}

/* 响应式 */
@media (max-width: 768px) {
  .modal-content-wrapper {
    max-width: 100%;
    max-height: 100%;

    border: none;
  }

  .modal-footer {
    border-radius: 0;
    padding: 12px 16px;
  }

  .modal-close-btn {
    top: 12px;
    right: 12px;
    width: 36px;
    height: 36px;
    font-size: 18px;
  }
}
</style>