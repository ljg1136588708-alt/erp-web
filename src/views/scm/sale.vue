<template>
  <div>
    <a-space class="toolbar">
      <a-input-search v-model:value="keyword" placeholder="搜索订单号/客户" style="width: 240px" @search="onSearch" />
      <a-button type="primary" v-permission="'sale:add'" @click="openCreate">新增</a-button>
    </a-space>

    <a-table :data-source="list" :loading="loading" row-key="id" :pagination="pagination" @change="onTableChange">
      <a-table-column title="订单号" data-index="orderNo" />
      <a-table-column title="客户" data-index="customerName" />
      <a-table-column title="仓库" data-index="warehouseName" />
      <a-table-column title="金额" data-index="amount" />
      <a-table-column title="状态">
        <template #default="{ record }">
          <a-tag :color="statusColor(record.status)">{{ record.status }}</a-tag>
        </template>
      </a-table-column>
      <a-table-column title="操作" width="240">
        <template #default="{ record }">
          <a-popconfirm v-if="record.status === '待审核'" title="确认审核通过?" @confirm="audit(record)">
            <a-button type="link" size="small" v-permission="'sale:audit'">审核</a-button>
          </a-popconfirm>
          <a-popconfirm v-if="record.status === '已审核'" title="确认发货出库?库存将扣减" @confirm="ship(record)">
            <a-button type="link" size="small" v-permission="'sale:audit'">发货</a-button>
          </a-popconfirm>
          <a-button type="link" size="small" v-permission="'sale:edit'" @click="openEdit(record)">编辑</a-button>
          <a-popconfirm title="确认删除?" @confirm="onDelete(record.id)">
            <a-button type="link" size="small" danger v-permission="'sale:delete'">删除</a-button>
          </a-popconfirm>
        </template>
      </a-table-column>
      <template #expandedRowRender="{ record }">
        <a-table :data-source="record.items || []" :pagination="false" size="small" :row-key="(_: OrderItem, i: number) => i">
          <a-table-column title="商品" data-index="goodsName" />
          <a-table-column title="数量" data-index="qty" />
          <a-table-column title="单价" data-index="price" />
          <a-table-column title="小计">
            <template #default="{ record: it }">{{ (it.qty || 0) * (it.price || 0) }}</template>
          </a-table-column>
        </a-table>
      </template>
    </a-table>

    <a-drawer v-model:open="drawerOpen" :title="editing ? '编辑销售订单' : '新增销售订单'" :width="640">
      <a-form :model="form" layout="vertical">
        <a-form-item label="订单号" required><a-input v-model:value="form.orderNo" /></a-form-item>
        <a-form-item label="客户" required><a-input v-model:value="form.customerName" /></a-form-item>
        <a-form-item label="仓库" required>
          <a-select v-model:value="form.warehouseId" :options="warehouseSelectOptions" placeholder="选择仓库" @change="onWarehouse" />
        </a-form-item>
        <a-form-item label="日期"><a-input v-model:value="form.date" placeholder="YYYY-MM-DD" /></a-form-item>
        <a-form-item label="明细">
          <OrderItemsEditor :items="form.items!" :goods="goodsOptions" />
        </a-form-item>
        <div class="amount">订单金额:￥{{ amount }}</div>
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
import OrderItemsEditor, { type OrderItem } from '@/components/OrderItemsEditor.vue'

interface Sale {
  id: number
  orderNo: string
  customerName: string
  warehouseId?: number
  warehouseName?: string
  date?: string
  amount: number
  status: string
  items?: OrderItem[]
}
interface GoodsOption { id: number; name: string; price: number; unit: string }
interface WhOption { id: number; name: string }

const { list, loading, total, query, fetchList, create, update, remove } = useCrud<Sale>('/scm/sale')

const keyword = ref('')
const drawerOpen = ref(false)
const editing = ref<Sale | null>(null)
const form = reactive<Partial<Sale>>({ items: [] })
const goodsOptions = ref<GoodsOption[]>([])
const whOptions = ref<WhOption[]>([])

const warehouseSelectOptions = computed(() => whOptions.value.map((w) => ({ value: w.id, label: w.name })))
const amount = computed(() => (form.items || []).reduce((s, it) => s + (it.qty || 0) * (it.price || 0), 0))

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
function onWarehouse(id: number) {
  form.warehouseName = whOptions.value.find((w) => w.id === id)?.name
}
function openCreate() {
  editing.value = null
  Object.assign(form, { orderNo: '', customerName: '', warehouseId: undefined, warehouseName: '', date: '', status: '待审核', items: [] })
  drawerOpen.value = true
}
function openEdit(record: Sale) {
  editing.value = record
  Object.assign(form, { ...record, items: (record.items || []).map((it) => ({ ...it })) })
  drawerOpen.value = true
}
async function onSubmit() {
  if (!form.orderNo || !form.customerName || !form.warehouseId) {
    message.warning('请填写订单号、客户、仓库')
    return
  }
  if (!form.items || form.items.length === 0) {
    message.warning('请至少添加一条明细')
    return
  }
  if (form.items.some((it) => !it.goodsId || !it.qty)) {
    message.warning('明细请选择商品并填写数量')
    return
  }
  const payload = {
    orderNo: form.orderNo,
    customerName: form.customerName,
    warehouseId: form.warehouseId,
    warehouseName: form.warehouseName,
    date: form.date,
    status: form.status,
    amount: amount.value,
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
async function audit(record: Sale) {
  await update(record.id, { status: '已审核' })
  message.success('已审核')
}
async function ship(record: Sale) {
  await request.post(`/scm/sale/${record.id}/ship`, {
    warehouseId: record.warehouseId,
    warehouseName: record.warehouseName,
    items: record.items || [],
  })
  await update(record.id, { status: '已出库' })
  message.success('发货成功,库存已扣减')
}

onMounted(async () => {
  fetchList()
  goodsOptions.value = await request.get<unknown, GoodsOption[]>('/scm/goods/options')
  whOptions.value = await request.get<unknown, WhOption[]>('/scm/warehouse/options')
})
</script>

<style scoped>
.toolbar { margin-bottom: 16px; }
.amount { text-align: right; font-weight: bold; font-size: 16px; margin-top: 8px; }
</style>
