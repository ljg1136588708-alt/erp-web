import type { RouteRecordRaw } from 'vue-router'
import type { MenuItem } from '@/types/api'
import { resolvePage } from './pageMap'

export function generateRoutes(menus: MenuItem[]): RouteRecordRaw[] {
  const routes: RouteRecordRaw[] = []
  const walk = (items: MenuItem[]) => {
    for (const item of items) {
      if (item.children?.length) {
        walk(item.children)
      } else {
        routes.push({ path: item.path, name: item.name, component: resolvePage(item.path) })
      }
    }
  }
  walk(menus)
  return routes
}
