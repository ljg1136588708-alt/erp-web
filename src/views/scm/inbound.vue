<template>
  <div>
    <a-space class="toolbar">
      <a-input-search v-model:value="keyword" placeholder="搜索入库单号" style="width: 240px" @search="onSearch" />
      <a-button type="primary" v-permission="'inbound:add'" @click="openCreate">新增</a-button>
    </a-space>

    <a-table :data-source="list" :loading="loading" row-key="id" :pagination="pagination" @change="onTableChange">
      <a-table-column title="入库单号" data-index="inboundNo" />
      <a-table-column title="来源采购单" data-index="sourceOrderNo" />
      <a-table-column title="仓库" data-index="warehouseName" />
      <a-table-column title="金额" data-index="amount" />
      <a-table-column title="日期" data-index="date" />
      <a-table-column title="操作" width="160">
        <template #default="{ record }">
          <a-button type="link" size="small" v-permission="'inbound:edit'" @click="openEdit(record)">编辑</a-button>
          <a-popconfirm title="确认删除?" @confirm="onDelete(record.id)">
            <a-button type="link" size="small" danger v-permission="'inbound:delete'">删除</a-button>
          </a-popconfirm>
        </template>
      </a-table-column>
    </a-table>

    <a-modal v-model:open="modalOpen" :title="editing ? '编辑入库单' : '新增入库单'" @ok="onSubmit">
      <a-form ref="formRef" :model="form" layout="vertical">
        <a-form-item label="入库单号" name="inboundNo" :rules="[{ required: true, message: '请输入入库单号' }]"><a-input v-model:value="form.inboundNo" /></a-form-item>
        <a-form-item label="来源采购单"><a-input v-model:value="form.sourceOrderNo" /></a-form-item>
        <a-form-item label="仓库" name="warehouseName" :rules="[{ required: true, message: '请输入仓库' }]"><a-input v-model:value="form.warehouseName" /></a-form-item>
        <a-form-item label="金额"><a-input-number v-model:value="form.amount" /></a-form-item>
        <a-form-item label="日期"><a-input v-model:value="form.date" /></a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { useCrud } from '@/composables/useCrud'

interface Inbound { id: number; inboundNo: string; sourceOrderNo: string; warehouseName: string; amount: number; date: string }

const { list, loading, total, query, fetchList, create, update, remove } = useCrud<Inbound>('/scm/inbound')

const keyword = ref('')
const modalOpen = ref(false)
const editing = ref<Inbound | null>(null)
const form = reactive<Partial<Inbound>>({})
const formRef = ref()

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
  Object.assign(form, { inboundNo: '', sourceOrderNo: '', warehouseName: '', amount: 0, date: '' })
  modalOpen.value = true
}
function openEdit(record: Inbound) {
  editing.value = record
  Object.assign(form, record)
  modalOpen.value = true
}
async function onSubmit() {
  try {
    await formRef.value?.validate()
  } catch {
    return // 校验不通过,保持弹窗打开
  }
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
