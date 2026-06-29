<template>
  <div>
    <a-space class="toolbar">
      <a-input-search v-model:value="keyword" placeholder="搜索角色名称/编码" style="width: 240px" @search="onSearch" />
      <a-button type="primary" v-permission="'role:add'" @click="openCreate">新增</a-button>
    </a-space>

    <a-table :data-source="list" :loading="loading" row-key="id" :pagination="pagination" @change="onTableChange">
      <a-table-column title="角色名称" data-index="name" />
      <a-table-column title="角色编码" data-index="code" />
      <a-table-column title="备注" data-index="remark" />
      <a-table-column title="操作" width="220">
        <template #default="{ record }">
          <a-button type="link" size="small" v-permission="'role:assign'" @click="openPerm(record)">分配权限</a-button>
          <a-button type="link" size="small" v-permission="'role:edit'" @click="openEdit(record)">编辑</a-button>
          <a-popconfirm title="确认删除?" @confirm="onDelete(record.id)">
            <a-button type="link" size="small" danger v-permission="'role:delete'">删除</a-button>
          </a-popconfirm>
        </template>
      </a-table-column>
    </a-table>

    <a-modal v-model:open="modalOpen" :title="editing ? '编辑角色' : '新增角色'" @ok="onSubmit">
      <a-form :model="form" layout="vertical">
        <a-form-item label="角色名称"><a-input v-model:value="form.name" /></a-form-item>
        <a-form-item label="角色编码"><a-input v-model:value="form.code" /></a-form-item>
        <a-form-item label="备注"><a-input v-model:value="form.remark" /></a-form-item>
      </a-form>
    </a-modal>

    <a-drawer v-model:open="permOpen" :title="`分配权限 - ${permRole?.name ?? ''}`" :width="320">
      <a-tree
        v-if="treeData.length"
        :tree-data="treeData"
        checkable
        :default-expand-all="true"
        v-model:checkedKeys="checkedKeys"
      />
      <template #extra>
        <a-space>
          <a-button @click="permOpen = false">取消</a-button>
          <a-button type="primary" @click="savePerm">保存</a-button>
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

interface Role { id: number; name: string; code: string; remark: string; permissions?: string[] }
interface PermItem { code: string; title: string }
interface PermGroup { module: string; perms: PermItem[] }

const { list, loading, total, query, fetchList, create, update, remove } = useCrud<Role>('/system/role')

const keyword = ref('')
const modalOpen = ref(false)
const editing = ref<Role | null>(null)
const form = reactive<Partial<Role>>({})

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
  Object.assign(form, { name: '', code: '', remark: '' })
  modalOpen.value = true
}
function openEdit(record: Role) {
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

const permOpen = ref(false)
const permRole = ref<Role | null>(null)
const treeData = ref<{ title: string; key: string; children: { title: string; key: string }[] }[]>([])
const checkedKeys = ref<string[]>([])
const allCodes = ref<string[]>([])

async function openPerm(record: Role) {
  permRole.value = record
  const groups = await request.get<unknown, PermGroup[]>('/system/permission/all')
  treeData.value = groups.map((g) => ({
    title: g.module,
    key: `group:${g.module}`,
    children: g.perms.map((p) => ({ title: p.title, key: p.code })),
  }))
  allCodes.value = groups.flatMap((g) => g.perms.map((p) => p.code))
  checkedKeys.value = (record.permissions ?? []).filter((c) => allCodes.value.includes(c))
  permOpen.value = true
}

async function savePerm() {
  if (!permRole.value) return
  const codes = checkedKeys.value.filter((k) => allCodes.value.includes(k)) // 滤掉分组父节点 key
  await update(permRole.value.id, { permissions: codes } as Partial<Role>)
  message.success('权限已保存')
  permOpen.value = false
}

onMounted(fetchList)
</script>

<style scoped>
.toolbar { margin-bottom: 16px; }
</style>
