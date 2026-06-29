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
