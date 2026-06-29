import { describe, it, expect } from 'vitest'
import { generateRoutes } from '@/router/dynamic'
import type { MenuItem } from '@/types/api'

const menus: MenuItem[] = [
  { name: 'home', path: '/home', title: '首页' },
  { name: 'system', path: '/system', title: '系统管理', children: [
    { name: 'user', path: '/system/user', title: '用户管理' },
  ] },
]

describe('generateRoutes', () => {
  it('把菜单拍平成叶子路由', () => {
    const routes = generateRoutes(menus)
    const paths = routes.map((r) => r.path)
    expect(paths).toContain('/home')
    expect(paths).toContain('/system/user')
    expect(paths).not.toContain('/system') // 父级仅分组,不生成页面路由
  })
})
