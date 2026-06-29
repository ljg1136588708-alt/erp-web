import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import App from './App.vue'
import permission from '@/directives/permission'

const app = createApp(App)
app.use(createPinia())
app.use(Antd)
app.directive('permission', permission)
app.mount('#app')
