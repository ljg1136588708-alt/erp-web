<template>
  <div>
    <a-space class="toolbar">
      <a-input-search v-model:value="keyword" placeholder="搜索订单号/客户" style="width: 240px" @search="onSearch" />
      <a-button type="primary" v-permission="'sale:add'" @click="openCreate">新增</a-button>
    </a-space>

    <a-table :data-source="list" :loading="loading" row-key="id" :pagination="pagination" @change="onTableChange">
      <a-table-column title="订单号" data-index="orderNo" />
      <a-table-column title="客户" data-index="customerName" />
      <a-table-column title="金额" data-index="amount" />
      <a-table-column title="状态">
        <template #default="{ record }">
          <a-tag :color="statusColor(record.status)">{{ record.status }}</a-tag>
        </template>
      </a-table-column>
      <a-table-column title="操作" width="160">
        <template #default="{ record }">
          <a-button type="link" size="small" v-permission="'sale:edit'" @click="openEdit(record)">编辑</a-button>
          <a-popconfirm title="确认删除?" @confirm="onDelete(record.id)">
            <a-button type="link" size="small" danger v-permission="'sale:delete'">删除</a-button>
          </a-popconfirm>
        </template>
      </a-table-column>
    </a-table>

    <a-modal v-model:open="modalOpen" :title="editing ? '编辑销售订单' : '新增销售订单'" @ok="onSubmit">
      <a-form :model="form" layout="vertical">
        <a-form-item label="订单号"><a-input v-model:value="form.orderNo" /></a-form-item>
        <a-form-item label="客户"><a-input v-model:value="form.customerName" /></a-form-item>
        <a-form-item label="金额"><a-input-number v-model:value="form.amount" /></a-form-item>
        <a-form-item label="状态">
          <a-select v-model:value="form.status">
            <a-select-option value="待审核">待审核</a-select-option>
            <a-select-option value="已审核">已审核</a-select-option>
            <a-select-option value="已出库">已出库</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { useCrud } from '@/composables/useCrud'

interface Sale { id: number; orderNo: string; customerName: string; amount: number; status: string }

const { list, loading, total, query, fetchList, create, update, remove } = useCrud<Sale>('/scm/sale')

const keyword = ref('')
const modalOpen = ref(false)
const editing = ref<Sale | null>(null)
const form = reactive<Partial<Sale>>({})

function statusColor(s: string) {
  return ({ '待审核': 'orange', '已审核': 'blue', '已出库': 'green' } as Record<string, string>)[s] ?? 'default'
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
  Object.assign(form, { orderNo: '', customerName: '', amount: 0, status: '待审核' })
  modalOpen.value = true
}
function openEdit(record: Sale) {
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
