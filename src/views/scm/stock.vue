<template>
  <div>
    <a-space class="toolbar">
      <a-input-search v-model:value="keyword" placeholder="搜索商品名称" style="width: 240px" @search="onSearch" />
    </a-space>

    <a-table :data-source="list" :loading="loading" row-key="id" :pagination="pagination" @change="onTableChange">
      <a-table-column title="商品" data-index="goodsName" />
      <a-table-column title="仓库" data-index="warehouseName" />
      <a-table-column title="库存数量" data-index="quantity" />
    </a-table>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useCrud } from '@/composables/useCrud'

interface Stock { id: number; goodsName: string; warehouseName: string; quantity: number }

const { list, loading, total, query, fetchList } = useCrud<Stock>('/scm/stock')

const keyword = ref('')

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

onMounted(fetchList)
</script>

<style scoped>
.toolbar { margin-bottom: 16px; }
</style>
