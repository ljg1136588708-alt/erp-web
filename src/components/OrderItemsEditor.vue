<template>
  <div>
    <a-button type="dashed" block style="margin-bottom: 8px" @click="addRow">+ 添加明细</a-button>
    <a-table :data-source="items" :pagination="false" size="small" :row-key="(_: OrderItem, i: number) => i">
      <a-table-column title="商品" width="160">
        <template #default="{ record }">
          <a-select
            v-model:value="record.goodsId"
            :options="goodsSelectOptions"
            style="width: 100%"
            placeholder="选择商品"
            @change="(v: number) => onPick(record, v)"
          />
        </template>
      </a-table-column>
      <a-table-column title="数量" width="100">
        <template #default="{ record }">
          <a-input-number v-model:value="record.qty" :min="1" style="width: 100%" />
        </template>
      </a-table-column>
      <a-table-column title="单价" width="100">
        <template #default="{ record }">
          <a-input-number v-model:value="record.price" :min="0" style="width: 100%" />
        </template>
      </a-table-column>
      <a-table-column title="小计" width="90">
        <template #default="{ record }">{{ (record.qty || 0) * (record.price || 0) }}</template>
      </a-table-column>
      <a-table-column title="" width="44">
        <template #default="{ index }">
          <a-button type="link" danger size="small" @click="removeRow(index)">删</a-button>
        </template>
      </a-table-column>
    </a-table>
    <div class="total">合计:￥{{ total }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface OrderItem {
  goodsId?: number
  goodsName?: string
  qty?: number
  price?: number
}
interface GoodsOption { id: number; name: string; price: number; unit: string }

// items 为父组件持有的响应式数组,本组件就地增删改;父组件据此算合计
const props = defineProps<{ items: OrderItem[]; goods: GoodsOption[] }>()

const goodsSelectOptions = computed(() => props.goods.map((g) => ({ value: g.id, label: g.name })))
const total = computed(() => props.items.reduce((s, it) => s + (it.qty || 0) * (it.price || 0), 0))

function addRow() {
  props.items.push({ goodsId: undefined, goodsName: '', qty: 1, price: 0 })
}
function removeRow(index: number) {
  props.items.splice(index, 1)
}
function onPick(record: OrderItem, goodsId: number) {
  const g = props.goods.find((x) => x.id === goodsId)
  if (g) {
    record.goodsName = g.name
    record.price = g.price
  }
}
</script>

<style scoped>
.total { text-align: right; margin-top: 8px; font-weight: bold; }
</style>
