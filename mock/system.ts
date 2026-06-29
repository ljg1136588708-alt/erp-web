import { crudMock } from './crud'

const users = Array.from({ length: 23 }, (_, i) => ({
  id: i + 1,
  username: i === 0 ? 'admin' : `user${i + 1}`,
  nickname: i === 0 ? '超级管理员' : `用户${i + 1}`,
  status: 1,
  roleName: i === 0 ? '管理员' : '普通用户',
}))

const roles = [
  { id: 1, name: '管理员', code: 'admin', remark: '系统超级管理员' },
  { id: 2, name: '普通用户', code: 'user', remark: '默认角色' },
  { id: 3, name: '采购员', code: 'buyer', remark: '负责采购' },
  { id: 4, name: '销售员', code: 'seller', remark: '负责销售' },
]
const depts = [
  { id: 1, name: '总公司', parentName: '-', sort: 1 },
  { id: 2, name: '采购部', parentName: '总公司', sort: 2 },
  { id: 3, name: '销售部', parentName: '总公司', sort: 3 },
  { id: 4, name: '财务部', parentName: '总公司', sort: 4 },
  { id: 5, name: '仓储部', parentName: '总公司', sort: 5 },
]
const menus = [
  { id: 1, title: '系统管理', path: '/system', permission: '' },
  { id: 2, title: '用户管理', path: '/system/user', permission: 'user:list' },
  { id: 3, title: '角色管理', path: '/system/role', permission: 'role:list' },
  { id: 4, title: '进销存', path: '/scm', permission: '' },
  { id: 5, title: '商品管理', path: '/scm/goods', permission: 'goods:list' },
]

export default [
  ...crudMock('/system/user', users),
  ...crudMock('/system/role', roles),
  ...crudMock('/system/dept', depts),
  ...crudMock('/system/menu', menus),
]
