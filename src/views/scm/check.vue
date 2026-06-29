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
      <a-table-column title="操作" width="200">
        <template #default="{ record }">
          <a-popconfirm v-if="record.status === '进行中'" title="确认完成盘点?将按实盘数调整库存" @confirm="finish(record)">
            <a-button type="link" size="small" v-permission="'check:edit'">完成</a-button>
          </a-popconfirm>
          <a-button type="link" size="small" v-permission="'check:edit'" @click="openEdit(record)">编辑</a-button>
          <a-popconfirm title="确认删除?" @confirm="onDelete(record.id)">
            <a-button type="link" size="small" danger v-permission="'check:delete'">删除</a-button>
          </a-popconfirm>
        </template>
      </a-table-column>
      <template #expandedRowRender="{ record }">
        <a-table :data-source="record.items || []" :pagination="false" size="small" :row-key="(_: CheckItem, i: number) => i">
          <a-table-column title="商品" data-index="goodsName" />
          <a-table-column title="账面数" data-index="systemQty" />
          <a-table-column title="实盘数" data-index="actualQty" />
          <a-table-column title="差异">
            <template #default="{ record: it }">
              <span :style="{ color: it.actualQty - it.systemQty === 0 ? '' : 'red' }">{{ it.actualQty - it.systemQty }}</span>
            </template>
          </a-table-column>
        </a-table>
      </template>
    </a-table>

    <a-drawer v-model:open="drawerOpen" :title="editing ? '编辑盘点单' : '新增盘点单'" :width="640">
      <a-form :model="form" layout="vertical">
        <a-form-item label="盘点单号" required><a-input v-model:value="form.checkNo" /></a-form-item>
        <a-form-item label="仓库" required>
          <a-select v-model:value="form.warehouseId" :options="warehouseSelectOptions" placeholder="选择仓库后自动带出账面库存" @change="onWarehouse" />
        </a-form-item>
        <a-form-item label="日期"><a-input v-model:value="form.date" placeholder="YYYY-MM-DD" /></a-form-item>
        <a-form-item label="盘点明细(录入实盘数)">
          <a-table :data-source="form.items" :pagination="false" size="small" :row-key="(_: CheckItem, i: number) => i">
            <a-table-column title="商品" data-index="goodsName" />
            <a-table-column title="账面数" data-index="systemQty" width="90" />
            <a-table-column title="实盘数" width="120">
              <template #default="{ record }">
                <a-input-number v-model:value="record.actualQty" :min="0" style="width: 100%" />
              </template>
            </a-table-column>
            <a-table-column title="差异" width="80">
              <template #default="{ record }">
                <span :style="{ color: record.actualQty - record.systemQty === 0 ? '' : 'red' }">{{ record.actualQty - record.systemQty }}</span>
              </template>
            </a-table-column>
          </a-table>
        </a-form-item>
      </a-form>
      <template #extra>
        <a-space>
          <a-button @click="drawerOpen = false">取消</a-button>
          <a-button type="primary" @click="onSubmit">保存</a-button>
        </a-space>
      </template>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { useCrud } from '@/composables/useCrud'
import request from '@/utils/request'

interface CheckItem { goodsId: number; goodsName: string; systemQty: number; actualQty: number }
interface Check {
  id: number; checkNo: string
  warehouseId?: number; warehouseName?: string
  status: string; date?: string; items?: CheckItem[]
}
interface Stock { id: number; goodsId: number; goodsName: string; warehouseId: number; warehouseName: string; quantity: number }
interface WhOption { id: number; name: string }

const { list, loading, total, query, fetchList, create, update, remove } = useCrud<Check>('/scm/check')

const keyword = ref('')
const drawerOpen = ref(false)
const editing = ref<Check | null>(null)
const form = reactive<Partial<Check>>({ items: [] })
const whOptions = ref<WhOption[]>([])
const stockAll = ref<Stock[]>([])

const warehouseSelectOptions = computed(() => whOptions.value.map((w) => ({ value: w.id, label: w.name })))

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
async function loadStock() {
  stockAll.value = await request.get<unknown, { list: Stock[] }>('/scm/stock', { params: { page: 1, pageSize: 1000 } }).then((r) => r.list)
}
function onWarehouse(id: number) {
  form.warehouseName = whOptions.value.find((w) => w.id === id)?.name
  // 带出该仓库的账面库存作为盘点明细,实盘数默认等于账面数
  form.items = stockAll.value
    .filter((s) => s.warehouseId === id)
    .map((s) => ({ goodsId: s.goodsId, goodsName: s.goodsName, systemQty: s.quantity, actualQty: s.quantity }))
}
function openCreate() {
  editing.value = null
  Object.assign(form, { checkNo: '', warehouseId: undefined, warehouseName: '', status: '进行中', date: '', items: [] })
  drawerOpen.value = true
}
function openEdit(record: Check) {
  editing.value = record
  Object.assign(form, { ...record, items: (record.items || []).map((it) => ({ ...it })) })
  drawerOpen.value = true
}
async function onSubmit() {
  if (!form.checkNo || !form.warehouseId) {
    message.warning('请填写盘点单号并选择仓库')
    return
  }
  const payload = {
    checkNo: form.checkNo,
    warehouseId: form.warehouseId,
    warehouseName: form.warehouseName,
    status: form.status,
    date: form.date,
    items: form.items,
  }
  if (editing.value) await update(editing.value.id, payload)
  else await create(payload)
  message.success('保存成功')
  drawerOpen.value = false
}
async function onDelete(id: number) {
  await remove(id)
  message.success('已删除')
}
async function finish(record: Check) {
  await request.post(`/scm/check/${record.id}/finish`, {
    warehouseId: record.warehouseId,
    items: record.items || [],
  })
  await update(record.id, { status: '已完成' })
  await loadStock()
  message.success('盘点完成,库存已按实盘数调整')
}

onMounted(async () => {
  fetchList()
  whOptions.value = await request.get<unknown, WhOption[]>('/scm/warehouse/options')
  await loadStock()
})
</script>

<style scoped>
.toolbar { margin-bottom: 16px; }
</style>
