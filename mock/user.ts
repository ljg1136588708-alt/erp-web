import type { MockMethod } from 'vite-plugin-mock'

const menus = [
  { name: 'home', path: '/home', title: '首页', icon: 'HomeOutlined' },
  {
    name: 'system', path: '/system', title: '系统管理', icon: 'SettingOutlined',
    children: [
      { name: 'user', path: '/system/user', title: '用户管理' },
      { name: 'role', path: '/system/role', title: '角色管理' },
    ],
  },
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
        permissions: ['user:add', 'user:edit', 'user:delete', 'role:add'],
        menus,
      },
    }),
  },
] as MockMethod[]
