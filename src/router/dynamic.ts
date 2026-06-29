import type { RouteRecordRaw } from 'vue-router'
import type { MenuItem } from '@/types/api'

// MVP:所有业务页暂用 Home 占位,后续计划逐个替换为真实组件
const placeholder = () => import('@/views/Home.vue')

export function generateRoutes(menus: MenuItem[]): RouteRecordRaw[] {
  const routes: RouteRecordRaw[] = []
  const walk = (items: MenuItem[]) => {
    for (const item of items) {
      if (item.children?.length) {
        walk(item.children)
      } else {
        routes.push({ path: item.path, name: item.name, component: placeholder })
      }
    }
  }
  walk(menus)
  return routes
}
