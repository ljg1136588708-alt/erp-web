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
