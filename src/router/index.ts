import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { generateRoutes } from './dynamic'

const staticRoutes: RouteRecordRaw[] = [
  { path: '/login', name: 'login', component: () => import('@/views/Login.vue') },
  {
    path: '/',
    name: 'layout',
    component: () => import('@/layouts/BasicLayout.vue'),
    children: [
      { path: '', redirect: '/home' },
      { path: 'home', name: 'home', component: () => import('@/views/Home.vue') },
    ],
  },
  { path: '/:pathMatch(.*)*', name: 'notfound', component: () => import('@/views/NotFound.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes: staticRoutes,
})

let dynamicAdded = false

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (to.path === '/login') return true
  if (!auth.token) return { path: '/login' }

  // 已登录但未拉用户信息 → 拉取并注入动态路由
  if (!auth.user) {
    const user = await auth.fetchUserInfo()
    if (!dynamicAdded && user) {
      for (const r of generateRoutes(user.menus)) {
        router.addRoute('layout', r) // 挂到 BasicLayout(name: 'layout')下
      }
      dynamicAdded = true
      return { ...to, replace: true } // 重新匹配新增路由
    }
  }
  return true
})

export default router
