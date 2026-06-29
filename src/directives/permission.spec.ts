import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import permission from '@/directives/permission'

// v-permission removes the element from the DOM via its parentNode. A single-root
// component's root element is left unattached during `mounted` by @vue/test-utils,
// so the directive must sit on a non-root element to be observable. Real usage is
// always on nested buttons inside a page, so wrapping in a <div> matches reality.
const Comp = {
  template: `<div><button v-permission="'user:add'">新增</button></div>`,
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
