import type { MockMethod } from 'vite-plugin-mock'
import { crudMock } from './crud'

const users = Array.from({ length: 23 }, (_, i) => ({
  id: i + 1,
  username: i === 0 ? 'admin' : `user${i + 1}`,
  nickname: i === 0 ? '超级管理员' : `用户${i + 1}`,
  status: 1,
  roleName: i === 0 ? '管理员' : '普通用户',
}))

const allPermCodes = [
  'user:add', 'user:edit', 'user:delete', 'user:reset',
  'role:add', 'role:edit', 'role:delete', 'role:assign',
  'dept:add', 'dept:edit', 'dept:delete',
  'menu:add', 'menu:edit', 'menu:delete',
  'goods:add', 'goods:edit', 'goods:delete',
  'supplier:add', 'supplier:edit', 'supplier:delete',
  'customer:add', 'customer:edit', 'customer:delete',
  'warehouse:add', 'warehouse:edit', 'warehouse:delete',
  'purchase:add', 'purchase:edit', 'purchase:delete', 'purchase:audit',
  'sale:add', 'sale:edit', 'sale:delete', 'sale:audit',
]

const roles = [
  { id: 1, name: '管理员', code: 'admin', remark: '系统超级管理员', permissions: allPermCodes },
  { id: 2, name: '普通用户', code: 'user', remark: '默认角色', permissions: ['user:add', 'user:edit'] },
  { id: 3, name: '采购员', code: 'buyer', remark: '负责采购', permissions: ['purchase:add', 'purchase:edit', 'purchase:audit'] },
  { id: 4, name: '销售员', code: 'seller', remark: '负责销售', permissions: ['sale:add', 'sale:edit', 'sale:audit'] },
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

const permissionGroups = [
  { module: '用户管理', perms: [{ code: 'user:add', title: '新增' }, { code: 'user:edit', title: '编辑' }, { code: 'user:delete', title: '删除' }, { code: 'user:reset', title: '重置密码' }] },
  { module: '角色管理', perms: [{ code: 'role:add', title: '新增' }, { code: 'role:edit', title: '编辑' }, { code: 'role:delete', title: '删除' }, { code: 'role:assign', title: '分配权限' }] },
  { module: '部门管理', perms: [{ code: 'dept:add', title: '新增' }, { code: 'dept:edit', title: '编辑' }, { code: 'dept:delete', title: '删除' }] },
  { module: '菜单管理', perms: [{ code: 'menu:add', title: '新增' }, { code: 'menu:edit', title: '编辑' }, { code: 'menu:delete', title: '删除' }] },
  { module: '商品管理', perms: [{ code: 'goods:add', title: '新增' }, { code: 'goods:edit', title: '编辑' }, { code: 'goods:delete', title: '删除' }] },
  { module: '供应商', perms: [{ code: 'supplier:add', title: '新增' }, { code: 'supplier:edit', title: '编辑' }, { code: 'supplier:delete', title: '删除' }] },
  { module: '客户', perms: [{ code: 'customer:add', title: '新增' }, { code: 'customer:edit', title: '编辑' }, { code: 'customer:delete', title: '删除' }] },
  { module: '仓库', perms: [{ code: 'warehouse:add', title: '新增' }, { code: 'warehouse:edit', title: '编辑' }, { code: 'warehouse:delete', title: '删除' }] },
  { module: '采购订单', perms: [{ code: 'purchase:add', title: '新增' }, { code: 'purchase:edit', title: '编辑' }, { code: 'purchase:delete', title: '删除' }, { code: 'purchase:audit', title: '审核/收货' }] },
  { module: '销售订单', perms: [{ code: 'sale:add', title: '新增' }, { code: 'sale:edit', title: '编辑' }, { code: 'sale:delete', title: '删除' }, { code: 'sale:audit', title: '审核/发货' }] },
]

export default [
  ...crudMock('/system/user', users),
  ...crudMock('/system/role', roles),
  ...crudMock('/system/dept', depts),
  ...crudMock('/system/menu', menus),
  {
    url: '/api/system/permission/all',
    method: 'get',
    response: () => ({ code: 0, message: 'ok', data: permissionGroups }),
  },
] as MockMethod[]
