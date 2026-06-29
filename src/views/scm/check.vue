<template>
  <div>
    <a-space class="toolbar">
      <a-input-search v-model:value="keyword" placeholder="搜索盘点单号" style="width: 240px" @search="onSearch" />
      <a-button type="primary" v-permission="'check:add'" @click="openCreate">新增</a-button>
    </a-space>

    <a-table :data-source="list" :loading="loading" row-key="id" :pagination="pagination" @change="onTableChange">
      <a-table-column title="盘点单号" data-index="checkNo" />
      <a-table-column title="仓库" data-index="warehouseName" />
      <a-table-column title="状态">
        <template #default="{ record }">
          <a-tag :color="statusColor(record.status)">{{ record.status }}</a-tag>
        </template>
      </a-table-column>
      <a-table-column title="日期" data-index="date" />
      <a-table-column title="操作" width="160">
        <template #default="{ record }">
          <a-button type="link" size="small" v-permission="'check:edit'" @click="openEdit(record)">编辑</a-button>
          <a-popconfirm title="确认删除?" @confirm="onDelete(record.id)">
            <a-button type="link" size="small" danger v-permission="'check:delete'">删除</a-button>
          </a-popconfirm>
        </template>
      </a-table-column>
    </a-table>

    <a-modal v-model:open="modalOpen" :title="editing ? '编辑盘点单' : '新增盘点单'" @ok="onSubmit">
      <a-form :model="form" layout="vertical">
        <a-form-item label="盘点单号"><a-input v-model:value="form.checkNo" /></a-form-item>
        <a-form-item label="仓库"><a-input v-model:value="form.warehouseName" /></a-form-item>
        <a-form-item label="状态">
          <a-select v-model:value="form.status">
            <a-select-option value="进行中">进行中</a-select-option>
            <a-select-option value="已完成">已完成</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="日期"><a-input v-model:value="form.date" /></a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { useCrud } from '@/composables/useCrud'

interface Check { id: number; checkNo: string; warehouseName: string; status: string; date: string }

const { list, loading, total, query, fetchList, create, update, remove } = useCrud<Check>('/scm/check')

const keyword = ref('')
const modalOpen = ref(false)
const editing = ref<Check | null>(null)
const form = reactive<Partial<Check>>({})

function statusColor(s: string) {
  return ({ '进行中': 'blue', '已完成': 'green' } as Record<string, string>)[s] ?? 'default'
}

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
  Object.assign(form, { checkNo: '', warehouseName: '', status: '进行中', date: '' })
  modalOpen.value = true
}
function openEdit(record: Check) {
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
