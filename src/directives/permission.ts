import type { Directive } from 'vue'
import { useAuthStore } from '@/stores/auth'

const permission: Directive<HTMLElement, string> = {
  mounted(el, binding) {
    const auth = useAuthStore()
    if (!auth.hasPermission(binding.value)) {
      el.parentNode?.removeChild(el)
    }
  },
}

export default permission
