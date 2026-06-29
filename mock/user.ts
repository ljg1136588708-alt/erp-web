import type { MockMethod } from 'vite-plugin-mock'

const menus = [
  { name: 'home', path: '/home', title: '首页', icon: 'HomeOutlined' },
  {
    name: 'system', path: '/system', title: '系统管理', icon: 'SettingOutlined',
    children: [
      { name: 'user', path: '/system/user', title: '用户管理' },
      { name: 'role', path: '/system/role', title: '角色管理' },
      { name: 'dept', path: '/system/dept', title: '部门管理' },
      { name: 'menu', path: '/system/menu', title: '菜单管理' },
    ],
  },
  {
    name: 'scm', path: '/scm', title: '进销存', icon: 'ShopOutlined',
    children: [
      { name: 'goods', path: '/scm/goods', title: '商品管理' },
      { name: 'supplier', path: '/scm/supplier', title: '供应商' },
      { name: 'customer', path: '/scm/customer', title: '客户' },
      { name: 'warehouse', path: '/scm/warehouse', title: '仓库' },
      { name: 'purchase', path: '/scm/purchase', title: '采购订单' },
      { name: 'sale', path: '/scm/sale', title: '销售订单' },
      { name: 'stock', path: '/scm/stock', title: '库存查询' },
    ],
  },
]

// admin 拥有全部按钮权限
const permissions = [
  'user:add', 'user:edit', 'user:delete',
  'role:add', 'role:edit', 'role:delete',
  'dept:add', 'dept:edit', 'dept:delete',
  'menu:add', 'menu:edit', 'menu:delete',
  'goods:add', 'goods:edit', 'goods:delete',
  'supplier:add', 'supplier:edit', 'supplier:delete',
  'customer:add', 'customer:edit', 'customer:delete',
  'warehouse:add', 'warehouse:edit', 'warehouse:delete',
  'purchase:add', 'purchase:edit', 'purchase:delete',
  'sale:add', 'sale:edit', 'sale:delete',
]

export default [
  {
    url: '/api/login',
    method: 'post',
    response: ({ body }: any) => {
      if (body.username === 'admin' && body.password === '123456') {
        return { code: 0, message: 'ok', data: { token: 'mock-token-admin' } }
      }
      return { code: 1, message: '用户名或密码错误', data: null }
    },
  },
  {
    url: '/api/user/change-password',
    method: 'post',
    response: () => ({ code: 0, message: 'ok', data: null }),
  },
  {
    url: '/api/user/info',
    method: 'get',
    response: () => ({
      code: 0,
      message: 'ok',
      data: {
        id: 1,
        username: 'admin',
        nickname: '超级管理员',
        roles: ['admin'],
        permissions,
        menus,
      },
    }),
  },
] as MockMethod[]
