# 业务模块实现计划(系统管理 + 进销存真实页面)

> **For agentic workers:** 用 superpowers:subagent-driven-development 逐任务执行。步骤用 `- [ ]`。

**Goal:** 在已有地基上,建一套可复用 CRUD 内核,把「系统管理」与「进销存」两大模块的真实页面全部做出来(mock 后端),菜单点进去都是能用的增删改查页面,而非占位页。

**Architecture:** 数据逻辑收敛到一个 `useCrud` 组合式函数(列表/分页/搜索/增删改查),各实体页只写自己的表格列与表单字段。Mock 用一个通用「内存 CRUD 工厂」给每个资源生成 list/create/update/delete。路由用 `import.meta.glob` 把菜单 path 映射到 `src/views/<path>.vue` 真实组件,缺失则回退占位页。这样新增一个实体 = 加一段 mock seed + 一个薄页面 + 一条菜单。

**Tech Stack:** 沿用 Vue3 + Vite + TS + Pinia + Vue Router + axios + Ant Design Vue + vite-plugin-mock + Vitest。

---

## 接口约定(列表带分页/搜索)

- `GET /api/<resource>?page&pageSize&keyword` → `data: { list: T[], total: number }`
- `POST /api/<resource>` body=实体 → `data: 新实体`
- `PUT /api/<resource>/:id` body=部分字段 → `data: null`
- `DELETE /api/<resource>/:id` → `data: null`

资源清单:
- 系统管理:`/system/user`、`/system/role`、`/system/dept`、`/system/menu`
- 进销存:`/scm/goods`、`/scm/supplier`、`/scm/customer`、`/scm/warehouse`、`/scm/purchase`、`/scm/sale`、`/scm/stock`(只读)

---

## 文件结构(本计划新增/改动)

```
src/
├─ composables/useCrud.ts          # 可复用 CRUD 逻辑(TDD)
├─ router/pageMap.ts               # path -> 真实组件 解析(改 dynamic.ts 用它)
├─ views/
│  ├─ system/user.vue role.vue dept.vue menu.vue
│  └─ scm/goods.vue supplier.vue customer.vue warehouse.vue purchase.vue sale.vue stock.vue
mock/
├─ crud.ts                         # 通用内存 CRUD 工厂
├─ system.ts                       # 四个系统管理资源的 seed + 路由
├─ scm.ts                          # 进销存资源的 seed + 路由
└─ user.ts                         # 改:menus 补全两大模块菜单
```

---

### Task 1: 可复用 CRUD 内核 `useCrud`(TDD)

**Files:** Create `src/composables/useCrud.ts`, Test `src/composables/useCrud.spec.ts`

职责:给定资源路径,提供响应式 `list/total/loading/query`,以及 `fetchList/create/update/remove`,增删改后自动刷新列表。依赖 `@/utils/request`(其响应已解包为 data 本体)。

- [ ] **Step 1: 失败测试** `src/composables/useCrud.spec.ts`

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/utils/request', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

import request from '@/utils/request'
import { useCrud } from '@/composables/useCrud'

describe('useCrud', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetchList 写入 list 与 total', async () => {
    ;(request.get as any).mockResolvedValue({ list: [{ id: 1 }], total: 1 })
    const c = useCrud('/system/user')
    await c.fetchList()
    expect(request.get).toHaveBeenCalledWith('/system/user', { params: c.query.value })
    expect(c.list.value).toEqual([{ id: 1 }])
    expect(c.total.value).toBe(1)
  })

  it('create 后自动刷新列表', async () => {
    ;(request.post as any).mockResolvedValue({ id: 2 })
    ;(request.get as any).mockResolvedValue({ list: [], total: 0 })
    const c = useCrud('/system/user')
    await c.create({ username: 'x' })
    expect(request.post).toHaveBeenCalledWith('/system/user', { username: 'x' })
    expect(request.get).toHaveBeenCalled() // 刷新
  })

  it('remove 调 delete 并刷新', async () => {
    ;(request.delete as any).mockResolvedValue(null)
    ;(request.get as any).mockResolvedValue({ list: [], total: 0 })
    const c = useCrud('/system/user')
    await c.remove(5)
    expect(request.delete).toHaveBeenCalledWith('/system/user/5')
    expect(request.get).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: 运行确认失败** `npm test -- useCrud`
- [ ] **Step 3: 实现** `src/composables/useCrud.ts`

```ts
import { ref } from 'vue'
import request from '@/utils/request'

export interface PageResult<T> { list: T[]; total: number }

export function useCrud<T extends { id: number }>(resource: string) {
  const list = ref<T[]>([]) as { value: T[] }
  const total = ref(0)
  const loading = ref(false)
  const query = ref<Record<string, unknown>>({ page: 1, pageSize: 10 })

  async function fetchList() {
    loading.value = true
    try {
      const res = await request.get<unknown, PageResult<T>>(resource, { params: query.value })
      list.value = res.list
      total.value = res.total
    } finally {
      loading.value = false
    }
  }
  async function create(payload: Partial<T>) {
    await request.post(resource, payload)
    await fetchList()
  }
  async function update(id: number, payload: Partial<T>) {
    await request.put(`${resource}/${id}`, payload)
    await fetchList()
  }
  async function remove(id: number) {
    await request.delete(`${resource}/${id}`)
    await fetchList()
  }
  return { list, total, loading, query, fetchList, create, update, remove }
}
```
（如 `ref<T[]>` 的类型断言写法导致 vue-tsc 报错，用 `ref([]) as Ref<T[]>` 等最小改法，勿重构。）

- [ ] **Step 4: 运行确认通过** `npm test -- useCrud`
- [ ] **Step 5: 提交** `feat: useCrud 可复用 CRUD 组合式函数 + 单测`

---

### Task 2: 通用 mock CRUD 工厂

**Files:** Create `mock/crud.ts`

职责:给定资源路径与种子数据,生成支持 list(分页+keyword 模糊)/create/update/delete 的内存 mock。

- [ ] **Step 1: 实现** `mock/crud.ts`

```ts
import type { MockMethod } from 'vite-plugin-mock'

export function crudMock<T extends { id: number }>(resource: string, seed: T[]): MockMethod[] {
  let data: T[] = [...seed]
  let nextId = data.reduce((m, d) => Math.max(m, d.id), 0) + 1
  const base = `/api${resource}`
  const idOf = (url: string) => Number(url.split('?')[0].split('/').pop())
  return [
    {
      url: base,
      method: 'get',
      response: ({ query }: any) => {
        const page = Number(query.page || 1)
        const pageSize = Number(query.pageSize || 10)
        const kw = (query.keyword || '').trim()
        const filtered = kw ? data.filter((d) => JSON.stringify(d).includes(kw)) : data
        const start = (page - 1) * pageSize
        return { code: 0, message: 'ok', data: { list: filtered.slice(start, start + pageSize), total: filtered.length } }
      },
    },
    {
      url: base,
      method: 'post',
      response: ({ body }: any) => {
        const item = { ...body, id: nextId++ } as T
        data.unshift(item)
        return { code: 0, message: 'ok', data: item }
      },
    },
    {
      url: `${base}/:id`,
      method: 'put',
      response: ({ body, url }: any) => {
        const id = idOf(url)
        data = data.map((d) => (d.id === id ? { ...d, ...body } : d))
        return { code: 0, message: 'ok', data: null }
      },
    },
    {
      url: `${base}/:id`,
      method: 'delete',
      response: ({ url }: any) => {
        const id = idOf(url)
        data = data.filter((d) => d.id !== id)
        return { code: 0, message: 'ok', data: null }
      },
    },
  ]
}
```
（vite-plugin-mock v3 的 response 上下文若 `query`/`body`/`url` 字段名不同，按实际 API 最小调整并在报告里说明。）

- [ ] **Step 2: 验证** `npm run build` 通过
- [ ] **Step 3: 提交** `feat: 通用内存 CRUD mock 工厂`

---

### Task 3: 路由按路径映射真实组件

**Files:** Create `src/router/pageMap.ts`; Modify `src/router/dynamic.ts`

职责:把菜单 path(如 `/system/user`)映射到 `src/views/system/user.vue`,不存在则回退 `Home.vue`。

- [ ] **Step 1: 实现** `src/router/pageMap.ts`

```ts
const modules = import.meta.glob('@/views/**/*.vue')

export function resolvePage(path: string) {
  const key = `/src/views${path}.vue`
  return modules[key] ?? (() => import('@/views/Home.vue'))
}
```

- [ ] **Step 2: 改** `src/router/dynamic.ts` 用 `resolvePage(item.path)` 代替固定 `placeholder`：

```ts
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
```

- [ ] **Step 3: 验证** `npm test`(dynamic 测试仍过——它只断言 path 拍平,不关心 component)+ `npm run build`
- [ ] **Step 4: 提交** `feat: 动态路由按 path 映射真实页面组件`

---

### Task 4: 用户管理页(模板页)+ mock

**Files:** Create `src/views/system/user.vue`; Create `mock/system.ts`(本任务先放 user 资源,后续任务追加 role/dept/menu);Modify `mock/user.ts`(menus 不变,后续 Task 8 统一补)

实体 User:`{ id, username, nickname, status: 0|1, roleName }`。页面含:搜索框(keyword)、新增按钮、表格(用户名/昵称/角色/状态/操作)、新增编辑用 Modal 表单、删除用 Popconfirm。按钮用 `v-permission`(`user:add`/`user:edit`/`user:delete`)。

- [ ] **Step 1:** `mock/system.ts`

```ts
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
```

- [ ] **Step 2:** `src/views/system/user.vue`

```vue
<template>
  <div>
    <a-space class="toolbar">
      <a-input-search v-model:value="keyword" placeholder="搜索用户名/昵称" style="width: 240px" @search="onSearch" />
      <a-button type="primary" v-permission="'user:add'" @click="openCreate">新增</a-button>
    </a-space>

    <a-table :data-source="list" :loading="loading" row-key="id" :pagination="pagination" @change="onTableChange">
      <a-table-column title="用户名" data-index="username" />
      <a-table-column title="昵称" data-index="nickname" />
      <a-table-column title="角色" data-index="roleName" />
      <a-table-column title="状态">
        <template #default="{ record }">
          <a-tag :color="record.status ? 'green' : 'red'">{{ record.status ? '启用' : '停用' }}</a-tag>
        </template>
      </a-table-column>
      <a-table-column title="操作" width="160">
        <template #default="{ record }">
          <a-button type="link" size="small" v-permission="'user:edit'" @click="openEdit(record)">编辑</a-button>
          <a-popconfirm title="确认删除?" @confirm="onDelete(record.id)">
            <a-button type="link" size="small" danger v-permission="'user:delete'">删除</a-button>
          </a-popconfirm>
        </template>
      </a-table-column>
    </a-table>

    <a-modal v-model:open="modalOpen" :title="editing ? '编辑用户' : '新增用户'" @ok="onSubmit">
      <a-form :model="form" layout="vertical">
        <a-form-item label="用户名"><a-input v-model:value="form.username" /></a-form-item>
        <a-form-item label="昵称"><a-input v-model:value="form.nickname" /></a-form-item>
        <a-form-item label="角色"><a-input v-model:value="form.roleName" /></a-form-item>
        <a-form-item label="状态">
          <a-switch v-model:checked="statusBool" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { useCrud } from '@/composables/useCrud'

interface User { id: number; username: string; nickname: string; status: number; roleName: string }

const { list, loading, total, query, fetchList, create, update, remove } = useCrud<User>('/system/user')

const keyword = ref('')
const modalOpen = ref(false)
const editing = ref<User | null>(null)
const form = reactive<Partial<User>>({})
const statusBool = computed({
  get: () => form.status === 1,
  set: (v: boolean) => (form.status = v ? 1 : 0),
})

const pagination = computed(() => ({
  current: query.value.page as number,
  pageSize: query.value.pageSize as number,
  total: total.value,
  showSizeChanger: true,
}))

function onSearch() {
  query.value.keyword = keyword.value
  query.value.page = 1
  fetchList()
}
function onTableChange(p: any) {
  query.value.page = p.current
  query.value.pageSize = p.pageSize
  fetchList()
}
function openCreate() {
  editing.value = null
  Object.assign(form, { username: '', nickname: '', roleName: '', status: 1 })
  modalOpen.value = true
}
function openEdit(record: User) {
  editing.value = record
  Object.assign(form, record)
  modalOpen.value = true
}
async function onSubmit() {
  if (editing.value) await update(editing.value.id, { ...form })
  else await create({ ...form })
  message.success('保存成功')
  modalOpen.value = false
}
async function onDelete(id: number) {
  await remove(id)
  message.success('已删除')
}

onMounted(fetchList)
</script>

<style scoped>
.toolbar { margin-bottom: 16px; }
</style>
```

- [ ] **Step 3:** 在 `vite.config.ts` 无需改(mockPath 已是 `mock`,新增文件自动加载)。验证 `npm run build` + `npm test` 通过。
- [ ] **Step 4:** 手动确认(controller 负责):dev 起服务,`/system/user` 出现真实表格、可新增/编辑/删除/搜索。
- [ ] **Step 5:** 提交 `feat: 用户管理页(模板页)+ mock`

---

### Task 5–7: 系统管理其余页面(沿用模板页套路)

每个页面 = 一个 `src/views/system/<x>.vue` + 在 `mock/system.ts` 追加 `...crudMock('/system/<x>', seed)`。结构同用户管理,仅表格列/表单字段/权限码不同。

- [ ] **角色管理** `role.vue`，资源 `/system/role`，实体 `{ id, name, code, remark }`，权限码 `role:add/edit/delete`。
- [ ] **部门管理** `dept.vue`，资源 `/system/dept`，实体 `{ id, name, parentName, sort }`（MVP 用平铺表格即可，不强求树）。
- [ ] **菜单管理** `menu.vue`，资源 `/system/menu`，实体 `{ id, title, path, permission }`。
- [ ] 每加一个,`npm run build` + `npm test` 通过后提交。

---

### Task 8: 进销存基础资料页(商品/供应商/客户/仓库)

**Files:** Create `mock/scm.ts`；Create `src/views/scm/{goods,supplier,customer,warehouse}.vue`

同模板页套路,资源在 `/scm/*`。实体字段:
- **商品** goods `{ id, name, category, unit, spec, price }`
- **供应商** supplier `{ id, name, contact, phone }`
- **客户** customer `{ id, name, contact, phone }`
- **仓库** warehouse `{ id, name, location }`

`mock/scm.ts` 用 `crudMock` 各配 10–20 条 seed。每页 `npm run build`+`npm test` 通过后提交。

---

### Task 9: 进销存单据与库存(采购单/销售单/库存查询)

- **采购订单** `scm/purchase.vue`，资源 `/scm/purchase`，实体 `{ id, orderNo, supplierName, amount, status }`（MVP:主表 CRUD,明细行简化为金额字段,不做多行子表)。
- **销售订单** `scm/sale.vue`，资源 `/scm/sale`，实体 `{ id, orderNo, customerName, amount, status }`。
- **库存查询** `scm/stock.vue`，资源 `/scm/stock`，**只读**:仅搜索 + 表格 `{ id, goodsName, warehouseName, quantity }`,无新增/编辑/删除按钮。

mock seed 同上。每页验证后提交。

---

### Task 10: 补全菜单 + 端到端验证

**Files:** Modify `mock/user.ts`(menus)

- [ ] **Step 1:** 把 `mock/user.ts` 的 `menus` 扩为两大模块完整菜单 + `permissions` 补全所有按钮码:

```ts
const menus = [
  { name: 'home', path: '/home', title: '首页', icon: 'HomeOutlined' },
  { name: 'system', path: '/system', title: '系统管理', icon: 'SettingOutlined', children: [
    { name: 'user', path: '/system/user', title: '用户管理' },
    { name: 'role', path: '/system/role', title: '角色管理' },
    { name: 'dept', path: '/system/dept', title: '部门管理' },
    { name: 'menu', path: '/system/menu', title: '菜单管理' },
  ]},
  { name: 'scm', path: '/scm', title: '进销存', icon: 'ShopOutlined', children: [
    { name: 'goods', path: '/scm/goods', title: '商品管理' },
    { name: 'supplier', path: '/scm/supplier', title: '供应商' },
    { name: 'customer', path: '/scm/customer', title: '客户' },
    { name: 'warehouse', path: '/scm/warehouse', title: '仓库' },
    { name: 'purchase', path: '/scm/purchase', title: '采购订单' },
    { name: 'sale', path: '/scm/sale', title: '销售订单' },
    { name: 'stock', path: '/scm/stock', title: '库存查询' },
  ]},
]
```
`permissions` 加上 `role:edit role:delete` 等所有用到的码(admin 全给)。

- [ ] **Step 2:** `npm test`(7+ 仍过)+ `npm run build` 通过。
- [ ] **Step 3:** controller 端到端:登录后逐菜单点开,确认每页是真实 CRUD。
- [ ] **Step 4:** 里程碑提交。

---

## Self-Review

- 覆盖设计文档 5.1(系统管理:用户/角色/部门/菜单)与 5.2(进销存:商品/供应商/客户/仓库/采购/销售/库存)的页面层。
- 个人中心、采购/销售的多行明细子表、库存盘点/流水细化 → 留后续迭代(MVP 不做,YAGNI)。
- 复用核心:`useCrud` + `crudMock` + `resolvePage`,新增实体成本最小。
