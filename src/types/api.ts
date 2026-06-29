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
