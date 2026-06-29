# 系统管理地基(脚手架 + 登录 + 权限基座)Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 搭出可运行的 ERP-Web 前端地基:能登录、有中后台布局、菜单与路由由后端权限数据动态生成、支持按钮级权限,后端未就绪时全程走 Mock。

**Architecture:** Vite + Vue3 + TS 单页应用。axios 统一封装(env 注入 baseURL、token 注入请求头、响应解包与错误提示)。Pinia 管理登录态与用户权限。路由分「静态路由(登录/布局/404)」与「动态路由(登录后按用户 menus 生成)」。`vite-plugin-mock` 提供登录 / 用户信息 / 菜单 假接口,后端就绪后改环境变量即可切真实地址。

**Tech Stack:** Vue 3, Vite, TypeScript, Pinia, Vue Router, axios, Ant Design Vue, vite-plugin-mock, Vitest。

---

## 接口约定(本计划 Mock 实现,后端按此对接)

统一响应包:`{ "code": 0, "message": "ok", "data": <T> }`,`code === 0` 为成功。

- `POST /api/login` 请求 `{ username, password }` → `data: { token }`
- `GET /api/user/info`(带 token)→ `data: { id, username, nickname, roles, permissions, menus }`
  - `permissions: string[]` 按钮权限码,如 `["user:add","user:delete"]`
  - `menus: MenuItem[]`,`MenuItem = { name, path, title, icon?, children? }`

## 文件结构

```
erp-web/
├─ .env.development            # VITE_API_BASE_URL, VITE_USE_MOCK
├─ index.html
├─ vite.config.ts             # alias、AntD、mock 插件
├─ vitest.config.ts
├─ tsconfig.json
├─ package.json
├─ mock/
│  └─ user.ts                 # 登录/用户信息 mock
└─ src/
   ├─ main.ts                 # 挂载 Vue + AntD + Pinia + Router + 指令
   ├─ App.vue
   ├─ types/
   │  └─ api.ts               # ApiResponse、UserInfo、MenuItem 类型
   ├─ utils/
   │  └─ request.ts           # axios 封装
   ├─ stores/
   │  └─ auth.ts              # Pinia 登录态/权限
   ├─ router/
   │  ├─ index.ts             # 路由实例 + 守卫
   │  └─ dynamic.ts           # 由 menus 生成动态路由
   ├─ directives/
   │  └─ permission.ts        # v-permission 按钮权限指令
   ├─ layouts/
   │  └─ BasicLayout.vue      # Sider + Header + content
   └─ views/
      ├─ Login.vue
      ├─ Home.vue             # 登录后默认页(占位)
      └─ NotFound.vue
```

---

### Task 1: 初始化项目脚手架与依赖

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsconfig.node.json`, `index.html`, `vite.config.ts`, `src/main.ts`, `src/App.vue`, `src/vite-env.d.ts`

- [ ] **Step 1: 用脚手架生成基础工程**

在 `E:/admin/ceshi/erp-web` 下运行(目录已是 git 仓库,生成到当前目录):

```bash
npm create vite@latest . -- --template vue-ts
```

若提示目录非空,选择忽略已有文件(保留 `.git`、`docs/`)。

- [ ] **Step 2: 安装运行时与开发依赖**

```bash
npm install vue-router@4 pinia axios ant-design-vue
npm install -D vite-plugin-mock mockjs vitest @vue/test-utils jsdom @types/node
```

- [ ] **Step 3: 配置 `vite.config.ts`(alias + mock 插件)**

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteMockServe } from 'vite-plugin-mock'
import path from 'node:path'

export default defineConfig({
  plugins: [
    vue(),
    viteMockServe({ mockPath: 'mock', enable: true }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
})
```

- [ ] **Step 4: `tsconfig.json` 增加 `@` 路径映射**

在 `compilerOptions` 中加入:

```json
"baseUrl": ".",
"paths": { "@/*": ["src/*"] }
```

- [ ] **Step 5: 配置 `src/main.ts` 挂载 AntD + Pinia + Router(Router/Pinia 在后续 Task 创建,先留最小可运行版本)**

```ts
import { createApp } from 'vue'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import App from './App.vue'

const app = createApp(App)
app.use(Antd)
app.mount('#app')
```

- [ ] **Step 6: 运行验证脚手架可启动**

Run: `npm run dev`
Expected: 终端输出本地地址,浏览器打开无报错(显示 Vite 默认页或空 App)。确认后 Ctrl+C 停止。

- [ ] **Step 7: 提交**

```bash
git add -A
git commit -m "chore: 初始化 Vue3+Vite+TS 脚手架与核心依赖"
```

---

### Task 2: 环境变量与 API 类型定义

**Files:**
- Create: `.env.development`, `src/types/api.ts`

- [ ] **Step 1: 创建 `.env.development`**

```
VITE_API_BASE_URL=/api
VITE_USE_MOCK=true
```

- [ ] **Step 2: 在 `src/vite-env.d.ts` 声明环境变量类型**

追加:

```ts
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_USE_MOCK: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

- [ ] **Step 3: 创建 `src/types/api.ts`**

```ts
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

export interface MenuItem {
  name: string
  path: string
  title: string
  icon?: string
  children?: MenuItem[]
}

export interface UserInfo {
  id: number
  username: string
  nickname: string
  roles: string[]
  permissions: string[]
  menus: MenuItem[]
}
```

- [ ] **Step 4: 提交**

```bash
git add -A
git commit -m "feat: 环境变量与 API 类型定义"
```

---

### Task 3: axios 统一封装(含单测)

**Files:**
- Create: `src/utils/request.ts`
- Test: `src/utils/request.spec.ts`
- Create: `vitest.config.ts`

封装职责:baseURL 取自 env;请求拦截注入 `Authorization` 头;响应拦截解包 `data`,`code !== 0` 走错误提示并 reject;401 跳登录。

- [ ] **Step 1: 配置 `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'

export default defineConfig({
  plugins: [vue()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  test: { environment: 'jsdom', globals: true },
})
```

在 `package.json` 的 `scripts` 加:`"test": "vitest run"`。

- [ ] **Step 2: 写失败测试 `src/utils/request.spec.ts`**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

// 模拟 message,避免依赖真实 AntD 弹窗
vi.mock('ant-design-vue', () => ({ message: { error: vi.fn() } }))

describe('request response 解包', () => {
  beforeEach(() => localStorage.clear())

  it('code===0 时返回 data 本体', async () => {
    const { unwrap } = await import('@/utils/request')
    const result = unwrap({ code: 0, message: 'ok', data: { id: 1 } })
    expect(result).toEqual({ id: 1 })
  })

  it('code!==0 时抛错并提示', async () => {
    const { unwrap } = await import('@/utils/request')
    expect(() => unwrap({ code: 1, message: '出错了', data: null })).toThrow('出错了')
  })
})
```

- [ ] **Step 3: 运行测试确认失败**

Run: `npm test -- request`
Expected: FAIL —— `unwrap` 未定义 / 模块不存在。

- [ ] **Step 4: 实现 `src/utils/request.ts`**

```ts
import axios from 'axios'
import { message } from 'ant-design-vue'
import type { ApiResponse } from '@/types/api'

// 纯函数,便于单测
export function unwrap<T>(res: ApiResponse<T>): T {
  if (res.code !== 0) {
    message.error(res.message || '请求失败')
    throw new Error(res.message || '请求失败')
  }
  return res.data
}

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
})

request.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

request.interceptors.response.use(
  (response) => unwrap(response.data),
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    message.error(error.message || '网络错误')
    return Promise.reject(error)
  },
)

export default request
```

- [ ] **Step 5: 运行测试确认通过**

Run: `npm test -- request`
Expected: PASS(两条用例)。

- [ ] **Step 6: 提交**

```bash
git add -A
git commit -m "feat: axios 统一封装(token 注入/响应解包/401 处理)+ 单测"
```

---

### Task 4: Mock 接口(登录 / 用户信息)

**Files:**
- Create: `mock/user.ts`

- [ ] **Step 1: 创建 `mock/user.ts`**

```ts
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
```

- [ ] **Step 2: 提交**

```bash
git add -A
git commit -m "feat: 登录与用户信息 mock 接口"
```

---

### Task 5: Pinia auth store(含单测)

**Files:**
- Create: `src/stores/auth.ts`
- Test: `src/stores/auth.spec.ts`
- Modify: `src/main.ts`(注册 Pinia)

store 职责:持有 token(localStorage 持久化)与 UserInfo;`login` 调登录接口存 token;`fetchUserInfo` 拉取并存用户信息;`logout` 清空;`hasPermission(code)` 判断按钮权限。

- [ ] **Step 1: 写失败测试 `src/stores/auth.spec.ts`**

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

describe('auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('设置用户信息后 hasPermission 正确判断', () => {
    const store = useAuthStore()
    store.user = {
      id: 1, username: 'a', nickname: 'A', roles: [],
      permissions: ['user:add'], menus: [],
    }
    expect(store.hasPermission('user:add')).toBe(true)
    expect(store.hasPermission('user:delete')).toBe(false)
  })

  it('logout 清空 token 与用户', () => {
    const store = useAuthStore()
    store.setToken('t')
    store.logout()
    expect(store.token).toBe('')
    expect(store.user).toBeNull()
    expect(localStorage.getItem('token')).toBeNull()
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- auth`
Expected: FAIL —— store 不存在。

- [ ] **Step 3: 实现 `src/stores/auth.ts`**

```ts
import { defineStore } from 'pinia'
import request from '@/utils/request'
import type { UserInfo } from '@/types/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    user: null as UserInfo | null,
  }),
  getters: {
    hasPermission: (state) => (code: string) =>
      state.user?.permissions.includes(code) ?? false,
  },
  actions: {
    setToken(token: string) {
      this.token = token
      localStorage.setItem('token', token)
    },
    async login(username: string, password: string) {
      const data = await request.post<unknown, { token: string }>('/login', { username, password })
      this.setToken(data.token)
    },
    async fetchUserInfo() {
      this.user = await request.get<unknown, UserInfo>('/user/info')
      return this.user
    },
    logout() {
      this.token = ''
      this.user = null
      localStorage.removeItem('token')
    },
  },
})
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test -- auth`
Expected: PASS(两条用例)。

- [ ] **Step 5: 在 `src/main.ts` 注册 Pinia**

```ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import App from './App.vue'

const app = createApp(App)
app.use(createPinia())
app.use(Antd)
app.mount('#app')
```

- [ ] **Step 6: 提交**

```bash
git add -A
git commit -m "feat: Pinia auth store(登录态/用户信息/按钮权限)+ 单测"
```

---

### Task 6: 按钮权限指令 v-permission(含单测)

**Files:**
- Create: `src/directives/permission.ts`
- Test: `src/directives/permission.spec.ts`
- Modify: `src/main.ts`(注册指令)

指令职责:`v-permission="'user:add'"`,无权限时从 DOM 移除该元素。

- [ ] **Step 1: 写失败测试 `src/directives/permission.spec.ts`**

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import permission from '@/directives/permission'

const Comp = {
  template: `<button v-permission="'user:add'">新增</button>`,
}

describe('v-permission', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('有权限时保留元素', () => {
    const store = useAuthStore()
    store.user = { id: 1, username: 'a', nickname: 'A', roles: [], permissions: ['user:add'], menus: [] }
    const wrapper = mount(Comp, { global: { directives: { permission } } })
    expect(wrapper.find('button').exists()).toBe(true)
  })

  it('无权限时移除元素', () => {
    const store = useAuthStore()
    store.user = { id: 1, username: 'a', nickname: 'A', roles: [], permissions: [], menus: [] }
    const wrapper = mount(Comp, { global: { directives: { permission } } })
    expect(wrapper.find('button').exists()).toBe(false)
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- permission`
Expected: FAIL —— 指令不存在。

- [ ] **Step 3: 实现 `src/directives/permission.ts`**

```ts
import type { Directive } from 'vue'
import { useAuthStore } from '@/stores/auth'

const permission: Directive<HTMLElement, string> = {
  mounted(el, binding) {
    const auth = useAuthStore()
    if (!auth.hasPermission(binding.value)) {
      el.parentNode?.removeChild(el)
    }
  },
}

export default permission
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test -- permission`
Expected: PASS(两条用例)。

- [ ] **Step 5: 在 `src/main.ts` 注册指令**

在 `app.mount` 前加:

```ts
import permission from '@/directives/permission'
app.directive('permission', permission)
```

- [ ] **Step 6: 提交**

```bash
git add -A
git commit -m "feat: v-permission 按钮权限指令 + 单测"
```

---

### Task 7: 页面占位组件(Login / Home / NotFound / Layout)

**Files:**
- Create: `src/views/Login.vue`, `src/views/Home.vue`, `src/views/NotFound.vue`, `src/layouts/BasicLayout.vue`

- [ ] **Step 1: 创建 `src/views/Login.vue`**

```vue
<template>
  <div class="login-wrap">
    <a-card title="ERP 系统登录" class="login-card">
      <a-form :model="form" @finish="onSubmit">
        <a-form-item name="username" :rules="[{ required: true, message: '请输入用户名' }]">
          <a-input v-model:value="form.username" placeholder="用户名 (admin)" />
        </a-form-item>
        <a-form-item name="password" :rules="[{ required: true, message: '请输入密码' }]">
          <a-input-password v-model:value="form.password" placeholder="密码 (123456)" />
        </a-form-item>
        <a-button type="primary" html-type="submit" block :loading="loading">登录</a-button>
      </a-form>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { useAuthStore } from '@/stores/auth'

const form = reactive({ username: 'admin', password: '123456' })
const loading = ref(false)
const router = useRouter()
const auth = useAuthStore()

async function onSubmit() {
  loading.value = true
  try {
    await auth.login(form.username, form.password)
    message.success('登录成功')
    router.push('/')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-wrap { height: 100vh; display: flex; align-items: center; justify-content: center; background: #f0f2f5; }
.login-card { width: 360px; }
</style>
```

- [ ] **Step 2: 创建 `src/views/Home.vue`**

```vue
<template>
  <a-result status="success" title="登录成功" :sub-title="`欢迎,${auth.user?.nickname ?? ''}`" />
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
const auth = useAuthStore()
</script>
```

- [ ] **Step 3: 创建 `src/views/NotFound.vue`**

```vue
<template>
  <a-result status="404" title="404" sub-title="页面不存在" />
</template>
```

- [ ] **Step 4: 创建 `src/layouts/BasicLayout.vue`(Sider 动态菜单 + Header + content)**

```vue
<template>
  <a-layout style="min-height: 100vh">
    <a-layout-sider v-model:collapsed="collapsed" collapsible>
      <div class="logo">ERP</div>
      <a-menu theme="dark" mode="inline" :selected-keys="[route.path]" @click="onMenuClick">
        <template v-for="m in auth.user?.menus ?? []" :key="m.path">
          <a-sub-menu v-if="m.children?.length" :key="m.path">
            <template #title>{{ m.title }}</template>
            <a-menu-item v-for="c in m.children" :key="c.path">{{ c.title }}</a-menu-item>
          </a-sub-menu>
          <a-menu-item v-else :key="m.path">{{ m.title }}</a-menu-item>
        </template>
      </a-menu>
    </a-layout-sider>
    <a-layout>
      <a-layout-header class="header">
        <a-dropdown>
          <span>{{ auth.user?.nickname }}</span>
          <template #overlay>
            <a-menu>
              <a-menu-item @click="onLogout">退出登录</a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </a-layout-header>
      <a-layout-content class="content">
        <router-view />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const collapsed = ref(false)
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

function onMenuClick({ key }: { key: string }) {
  router.push(key)
}
function onLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.logo { height: 32px; margin: 16px; color: #fff; font-weight: bold; text-align: center; }
.header { background: #fff; padding: 0 24px; text-align: right; }
.content { margin: 16px; padding: 16px; background: #fff; }
</style>
```

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "feat: 登录/首页/404 页面与中后台布局框架"
```

---

### Task 8: 路由与动态路由生成

**Files:**
- Create: `src/router/dynamic.ts`, `src/router/index.ts`
- Test: `src/router/dynamic.spec.ts`
- Modify: `src/main.ts`(注册 router)、`src/App.vue`(改为 `<router-view />`)

动态路由职责:把后端 `menus` 拍平成「挂在 BasicLayout 下的子路由」,每个 leaf 的 `path` 对应一个 view。MVP 阶段尚无各业务页面组件,统一映射到占位组件 `Home.vue`,后续计划替换为真实页面。

- [ ] **Step 1: 写失败测试 `src/router/dynamic.spec.ts`**

```ts
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
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- dynamic`
Expected: FAIL —— `generateRoutes` 不存在。

- [ ] **Step 3: 实现 `src/router/dynamic.ts`**

```ts
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
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test -- dynamic`
Expected: PASS。

- [ ] **Step 5: 实现 `src/router/index.ts`(静态路由 + 守卫 + 动态路由注入)**

```ts
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
    await auth.fetchUserInfo()
    if (!dynamicAdded && auth.user) {
      for (const r of generateRoutes(auth.user.menus)) {
        router.addRoute('layout', r) // 挂到 BasicLayout(name: 'layout')下
      }
      dynamicAdded = true
      return { ...to, replace: true } // 重新匹配新增路由
    }
  }
  return true
})

export default router
```

- [ ] **Step 6: 修改 `src/App.vue` 为路由出口**

```vue
<template>
  <router-view />
</template>
```

- [ ] **Step 7: 在 `src/main.ts` 注册 router**

完整 `main.ts`:

```ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import App from './App.vue'
import router from '@/router'
import permission from '@/directives/permission'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(Antd)
app.directive('permission', permission)
app.mount('#app')
```

- [ ] **Step 8: 全部单测通过**

Run: `npm test`
Expected: PASS(request / auth / permission / dynamic 全绿)。

- [ ] **Step 9: 提交**

```bash
git add -A
git commit -m "feat: 路由守卫与按权限动态生成路由"
```

---

### Task 9: 端到端手动验证

**Files:** 无(纯验证)

- [ ] **Step 1: 启动**

Run: `npm run dev`

- [ ] **Step 2: 验证登录流**

1. 访问根路径 → 应被守卫重定向到 `/login`。
2. 用 `admin / 123456` 登录 → 跳转 `/home`,显示"欢迎,超级管理员"。
3. 左侧菜单出现"首页""系统管理(用户管理/角色管理)",由 mock 的 menus 动态生成。
4. 点击"系统管理 → 用户管理" → 内容区切换(暂为占位页),URL 为 `/system/user`。
5. 点右上角昵称 → 退出 → 回到 `/login`,token 已清除。
6. 用错误密码登录 → 提示"用户名或密码错误"。

- [ ] **Step 3: 构建验证**

Run: `npm run build`
Expected: 构建成功无类型错误。

- [ ] **Step 4: 标记里程碑提交(若上述均通过)**

```bash
git commit --allow-empty -m "chore: 系统管理地基里程碑验证通过"
```

---

## Self-Review 记录

- **Spec 覆盖**:本计划覆盖设计文档第 3(技术栈)、4(Mock 对接)、6(布局与交互、动态菜单)节,以及第 5.1 中的「登录/登出 + 权限基座(动态菜单/按钮权限)」。5.1 的用户/角色/菜单/部门 CRUD 与个人中心页面属下一份计划(复用本地基),设计文档落地顺序①允许拆分,无遗漏。
- **占位符扫描**:无 TBD/TODO;业务页用 `Home.vue` 占位为有意为之,Task 8 已说明后续替换。
- **类型一致性**:`UserInfo`/`MenuItem`/`ApiResponse` 在 Task 2 定义,Task 3/5/6/8 引用一致;`generateRoutes`、`hasPermission`、`setToken`、`fetchUserInfo`、`logout` 命名前后一致。
- **已知坑**:Task 8 的 `addRoute('layout', r)` 依赖布局路由的 `name: 'layout'`,二者已在同一 Task 内对齐。
