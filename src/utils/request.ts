import axios from 'axios'
import { message } from 'ant-design-vue'
import type { ApiResponse } from '@/types/api'

// 纯函数,便于单测
export function unwrap<T>(res: ApiResponse<T>): T {
  if (res.code !== 0) {
    message.error(res.message || '请求失败')
    throw new Error(res.message || '请求失败')
  }
  return res.data
}

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
})

request.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

request.interceptors.response.use(
  (response) => unwrap(response.data) as never,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    message.error(error.message || '网络错误')
    return Promise.reject(error)
  },
)

export default request
