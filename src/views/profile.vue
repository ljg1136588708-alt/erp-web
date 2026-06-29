<template>
  <div>
    <a-card title="个人信息" style="margin-bottom: 16px">
      <a-descriptions :column="1">
        <a-descriptions-item label="用户名">{{ auth.user?.username }}</a-descriptions-item>
        <a-descriptions-item label="昵称">{{ auth.user?.nickname }}</a-descriptions-item>
        <a-descriptions-item label="角色">{{ auth.user?.roles?.join('、') }}</a-descriptions-item>
      </a-descriptions>
    </a-card>

    <a-card title="修改密码" style="max-width: 480px">
      <a-form :model="form" layout="vertical" @finish="onSubmit">
        <a-form-item label="原密码" name="oldPassword" :rules="[{ required: true, message: '请输入原密码' }]">
          <a-input-password v-model:value="form.oldPassword" />
        </a-form-item>
        <a-form-item label="新密码" name="newPassword" :rules="[{ required: true, message: '请输入新密码' }]">
          <a-input-password v-model:value="form.newPassword" />
        </a-form-item>
        <a-button type="primary" html-type="submit" :loading="loading">保存</a-button>
      </a-form>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { useAuthStore } from '@/stores/auth'
import request from '@/utils/request'

const auth = useAuthStore()
const loading = ref(false)
const form = reactive({ oldPassword: '', newPassword: '' })

async function onSubmit() {
  loading.value = true
  try {
    await request.post('/user/change-password', { ...form })
    message.success('密码修改成功')
    form.oldPassword = ''
    form.newPassword = ''
  } finally {
    loading.value = false
  }
}
</script>
