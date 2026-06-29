import { ref } from 'vue'
import type { Ref } from 'vue'
import request from '@/utils/request'

export interface PageResult<T> { list: T[]; total: number }

export function useCrud<T extends { id: number }>(resource: string) {
  const list = ref([]) as Ref<T[]>
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
