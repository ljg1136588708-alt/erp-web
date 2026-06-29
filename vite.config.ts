import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteMockServe } from 'vite-plugin-mock'
import path from 'node:path'

export default defineConfig({
  plugins: [
    vue(),
    viteMockServe({ mockPath: 'mock', enable: true }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  // 绑定 IPv4,避免默认只监听 [::1] 导致 localhost(IPv4)访问不到
  server: { host: '127.0.0.1', port: 5173 },
})
