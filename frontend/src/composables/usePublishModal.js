import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

export function usePublishModal(publishModalRef) {
  const router = useRouter()
  const route = useRoute()
  const shouldOpenModal = ref(false)

  const openPublishModal = () => {
    if (route.path !== '/wall') {
      shouldOpenModal.value = true
      router.push('/wall')
    } else {
      const modal = new window.bootstrap.Modal(publishModalRef.value)
      modal.show()
    }
  }

  watch(() => route.path, (newPath) => {
    if (newPath === '/wall' && shouldOpenModal.value) {
      setTimeout(() => {
        if (publishModalRef.value) {
          const modal = new window.bootstrap.Modal(publishModalRef.value)
          modal.show()
        }
        shouldOpenModal.value = false
      }, 100)
    }
  })

  return {
    openPublishModal,
    shouldOpenModal
  }
}