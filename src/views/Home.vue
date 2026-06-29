<template>
  <a-result status="success" title="登录成功" :sub-title="`欢迎,${auth.user?.nickname ?? ''}`" />
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
const auth = useAuthStore()
</script>
