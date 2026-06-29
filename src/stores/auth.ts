import { defineStore } from 'pinia'
import request from '@/utils/request'
import type { UserInfo } from '@/types/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    user: null as UserInfo | null,
  }),
  getters: {
    hasPermission: (state) => (code: string) =>
      state.user?.permissions.includes(code) ?? false,
  },
  actions: {
    setToken(token: string) {
      this.token = token
      localStorage.setItem('token', token)
    },
    async login(username: string, password: string) {
      const data = await request.post<unknown, { token: string }>('/login', { username, password })
      this.setToken(data.token)
    },
    async fetchUserInfo() {
      this.user = await request.get<unknown, UserInfo>('/user/info')
      return this.user
    },
    logout() {
      this.token = ''
      this.user = null
      localStorage.removeItem('token')
    },
  },
})
