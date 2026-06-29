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
