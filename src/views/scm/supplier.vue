<template>
  <div>
    <a-space class="toolbar">
      <a-input-search v-model:value="keyword" placeholder="搜索供应商名称" style="width: 240px" @search="onSearch" />
      <a-button type="primary" v-permission="'supplier:add'" @click="openCreate">新增</a-button>
    </a-space>

    <a-table :data-source="list" :loading="loading" row-key="id" :pagination="pagination" @change="onTableChange">
      <a-table-column title="供应商名称" data-index="name" />
      <a-table-column title="联系人" data-index="contact" />
      <a-table-column title="电话" data-index="phone" />
      <a-table-column title="操作" width="160">
        <template #default="{ record }">
          <a-button type="link" size="small" v-permission="'supplier:edit'" @click="openEdit(record)">编辑</a-button>
          <a-popconfirm title="确认删除?" @confirm="onDelete(record.id)">
            <a-button type="link" size="small" danger v-permission="'supplier:delete'">删除</a-button>
          </a-popconfirm>
        </template>
      </a-table-column>
    </a-table>

    <a-modal v-model:open="modalOpen" :title="editing ? '编辑供应商' : '新增供应商'" @ok="onSubmit">
      <a-form ref="formRef" :model="form" layout="vertical">
        <a-form-item label="供应商名称" name="name" :rules="[{ required: true, message: '请输入供应商名称' }]"><a-input v-model:value="form.name" /></a-form-item>
        <a-form-item label="联系人"><a-input v-model:value="form.contact" /></a-form-item>
        <a-form-item label="电话"><a-input v-model:value="form.phone" /></a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { useCrud } from '@/composables/useCrud'

interface Supplier { id: number; name: string; contact: string; phone: string }

const { list, loading, total, query, fetchList, create, update, remove } = useCrud<Supplier>('/scm/supplier')

const keyword = ref('')
const modalOpen = ref(false)
const editing = ref<Supplier | null>(null)
const form = reactive<Partial<Supplier>>({})
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
  Object.assign(form, { name: '', contact: '', phone: '' })
  modalOpen.value = true
}
function openEdit(record: Supplier) {
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
