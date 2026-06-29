import { crudMock } from './crud'

const users = Array.from({ length: 23 }, (_, i) => ({
  id: i + 1,
  username: i === 0 ? 'admin' : `user${i + 1}`,
  nickname: i === 0 ? '超级管理员' : `用户${i + 1}`,
  status: 1,
  roleName: i === 0 ? '管理员' : '普通用户',
}))

export default [
  ...crudMock('/system/user', users),
]
