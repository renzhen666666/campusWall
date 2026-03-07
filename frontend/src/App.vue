<template>
  <div id="app">
    <Layout />
    <AlertMessage ref="alertRef" />
  </div>
</template>

<script setup>
import Layout from './components/Layout.vue'

import { provide, ref, nextTick } from 'vue'
import AlertMessage from '@/components/AlertMessage.vue'

import { useHead } from '@unhead/vue'


const alertRef = ref(null)

provide('Alert', {
  showCenterAlert: async (msg, type, title, duration) => {
    if (!alertRef.value) {
      await nextTick()
    }
    alertRef.value.showCenterAlert(msg, type, title, duration)
  },
  showTopRightAlert: async (msg, type, title, duration) => {
    if (!alertRef.value) {
      await nextTick()
    }
    alertRef.value.showTopRightAlert(msg, type, title, duration)
  },
  showBottomRightAlert: async (msg, type, title, duration) => {
    if (!alertRef.value) {
      await nextTick()
    }
    alertRef.value.showBottomRightAlert(msg, type, title, duration)
  },
  showBelowAlert: async (id, msg, type, title, duration) => {
    if (!alertRef.value) {
      await nextTick()
    }
    alertRef.value.showBelowAlert(id, msg, type, title, duration)
  }
})
</script>

<style>
:root {
  --primary-color: #6A0DAD;
  --primary-light: rgba(106, 13, 173, 0.1);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.6;
  color: var(--text-primary);
  background-color: var(--bg-color);
  transition: background-color 0.3s, color 0.3s;
}

#app {
  min-height: 100vh;
}

.white-text {
  color: #ffffff;
}

.white {
  color: #ffffff;
}

/* 自定义滚动条 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(106, 13, 173, 0.3);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(106, 13, 173, 0.5);
}
</style>