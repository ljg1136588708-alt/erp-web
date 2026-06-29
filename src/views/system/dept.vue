<template>
  <div>
    <a-space class="toolbar">
      <a-button type="primary" v-permission="'dept:add'" @click="openCreate">新增</a-button>
    </a-space>

    <a-table :data-source="treeList" :loading="loading" row-key="id" :pagination="false">
      <a-table-column title="部门名称" data-index="name" />
      <a-table-column title="排序" data-index="sort" width="120" />
      <a-table-column title="操作" width="160">
        <template #default="{ record }">
          <a-button type="link" size="small" v-permission="'dept:edit'" @click="openEdit(record)">编辑</a-button>
          <a-popconfirm title="确认删除?" @confirm="onDelete(record.id)">
            <a-button type="link" size="small" danger v-permission="'dept:delete'">删除</a-button>
          </a-popconfirm>
        </template>
      </a-table-column>
    </a-table>

    <a-modal v-model:open="modalOpen" :title="editing ? '编辑部门' : '新增部门'" @ok="onSubmit">
      <a-form :model="form" layout="vertical">
        <a-form-item label="部门名称"><a-input v-model:value="form.name" /></a-form-item>
        <a-form-item label="上级部门">
          <a-select v-model:value="form.parentId" :options="parentOptions" />
        </a-form-item>
        <a-form-item label="排序"><a-input-number v-model:value="form.sort" /></a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { useCrud } from '@/composables/useCrud'

interface Dept { id: number; name: string; parentId: number; sort: number; children?: Dept[] }

const { list, loading, query, fetchList, create, update, remove } = useCrud<Dept>('/system/dept')

const modalOpen = ref(false)
const editing = ref<Dept | null>(null)
const form = reactive<Partial<Dept>>({})

// 部门量小,拉全量(不分页)再在前端构建树
query.value.pageSize = 1000

const treeList = computed(() => buildTree(list.value))
const parentOptions = computed(() => [
  { value: 0, label: '无(顶级部门)' },
  ...list.value.map((d) => ({ value: d.id, label: d.name })),
])

function buildTree(flat: Dept[]): Dept[] {
  const map = new Map<number, Dept>()
  flat.forEach((d) => map.set(d.id, { ...d, children: [] }))
  const roots: Dept[] = []
  map.forEach((node) => {
    const parent = map.get(node.parentId)
    if (parent) parent.children!.push(node)
    else roots.push(node)
  })
  // 清掉空 children,避免出现无意义的展开箭头
  map.forEach((node) => {
    if (node.children && node.children.length === 0) delete node.children
  })
  return roots
}

function openCreate() {
  editing.value = null
  Object.assign(form, { name: '', parentId: 0, sort: 1 })
  modalOpen.value = true
}
function openEdit(record: Dept) {
  editing.value = record
  Object.assign(form, { name: record.name, parentId: record.parentId, sort: record.sort })
  modalOpen.value = true
}
async function onSubmit() {
  const payload = { name: form.name, parentId: form.parentId, sort: form.sort }
  if (editing.value) await update(editing.value.id, payload)
  else await create(payload)
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
