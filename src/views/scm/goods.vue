<template>
  <div>
    <a-space class="toolbar">
      <a-input-search v-model:value="keyword" placeholder="搜索商品名称" style="width: 240px" @search="onSearch" />
      <a-button type="primary" v-permission="'goods:add'" @click="openCreate">新增</a-button>
    </a-space>

    <a-table :data-source="list" :loading="loading" row-key="id" :pagination="pagination" @change="onTableChange">
      <a-table-column title="商品名称" data-index="name" />
      <a-table-column title="分类" data-index="category" />
      <a-table-column title="单位" data-index="unit" />
      <a-table-column title="规格" data-index="spec" />
      <a-table-column title="单价" data-index="price" />
      <a-table-column title="操作" width="160">
        <template #default="{ record }">
          <a-button type="link" size="small" v-permission="'goods:edit'" @click="openEdit(record)">编辑</a-button>
          <a-popconfirm title="确认删除?" @confirm="onDelete(record.id)">
            <a-button type="link" size="small" danger v-permission="'goods:delete'">删除</a-button>
          </a-popconfirm>
        </template>
      </a-table-column>
    </a-table>

    <a-modal v-model:open="modalOpen" :title="editing ? '编辑商品' : '新增商品'" @ok="onSubmit">
      <a-form ref="formRef" :model="form" layout="vertical">
        <a-form-item label="商品名称" name="name" :rules="[{ required: true, message: '请输入商品名称' }]"><a-input v-model:value="form.name" /></a-form-item>
        <a-form-item label="分类"><a-input v-model:value="form.category" /></a-form-item>
        <a-form-item label="单位"><a-input v-model:value="form.unit" /></a-form-item>
        <a-form-item label="规格"><a-input v-model:value="form.spec" /></a-form-item>
        <a-form-item label="单价"><a-input-number v-model:value="form.price" /></a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { useCrud } from '@/composables/useCrud'

interface Goods { id: number; name: string; category: string; unit: string; spec: string; price: number }

const { list, loading, total, query, fetchList, create, update, remove } = useCrud<Goods>('/scm/goods')

const keyword = ref('')
const modalOpen = ref(false)
const editing = ref<Goods | null>(null)
const form = reactive<Partial<Goods>>({})
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
  Object.assign(form, { name: '', category: '', unit: '', spec: '', price: 0 })
  modalOpen.value = true
}
function openEdit(record: Goods) {
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
