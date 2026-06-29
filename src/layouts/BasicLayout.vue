<template>
  <a-layout style="min-height: 100vh">
    <a-layout-sider v-model:collapsed="collapsed" collapsible>
      <div class="logo">ERP</div>
      <a-menu theme="dark" mode="inline" :selected-keys="[route.path]" @click="onMenuClick">
        <template v-for="m in auth.user?.menus ?? []" :key="m.path">
          <a-sub-menu v-if="m.children?.length" :key="m.path">
            <template #title>{{ m.title }}</template>
            <a-menu-item v-for="c in m.children" :key="c.path">{{ c.title }}</a-menu-item>
          </a-sub-menu>
          <a-menu-item v-else :key="m.path">{{ m.title }}</a-menu-item>
        </template>
      </a-menu>
    </a-layout-sider>
    <a-layout>
      <a-layout-header class="header">
        <a-dropdown>
          <span>{{ auth.user?.nickname }}</span>
          <template #overlay>
            <a-menu>
              <a-menu-item @click="onLogout">退出登录</a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </a-layout-header>
      <a-layout-content class="content">
        <router-view />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const collapsed = ref(false)
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

function onMenuClick({ key }: { key: string }) {
  router.push(key)
}
function onLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.logo { height: 32px; margin: 16px; color: #fff; font-weight: bold; text-align: center; }
.header { background: #fff; padding: 0 24px; text-align: right; }
.content { margin: 16px; padding: 16px; background: #fff; }
</style>
