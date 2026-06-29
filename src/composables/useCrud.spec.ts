import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/utils/request', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
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
    expect(request.get).toHaveBeenCalled()
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
