import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

describe('auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('设置用户信息后 hasPermission 正确判断', () => {
    const store = useAuthStore()
    store.user = {
      id: 1, username: 'a', nickname: 'A', roles: [],
      permissions: ['user:add'], menus: [],
    }
    expect(store.hasPermission('user:add')).toBe(true)
    expect(store.hasPermission('user:delete')).toBe(false)
  })

  it('logout 清空 token 与用户', () => {
    const store = useAuthStore()
    store.setToken('t')
    store.logout()
    expect(store.token).toBe('')
    expect(store.user).toBeNull()
    expect(localStorage.getItem('token')).toBeNull()
  })
})
