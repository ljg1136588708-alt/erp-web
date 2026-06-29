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
        // 跳过已存在的同名路由(如静态 home 与菜单 home),避免重复注册告警
        if (r.name && !router.hasRoute(r.name)) router.addRoute('layout', r)
      }
      dynamicAdded = true
      return { ...to, replace: true } // 重新匹配新增路由
    }
  }
  return true
})

export default router
