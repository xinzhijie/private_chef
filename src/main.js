import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import { setUnauthorizedHandler } from './api/client'

async function bootstrap() {
  const app = createApp(App)
  const pinia = createPinia()

  app.use(pinia)
  app.use(router)
  app.use(ElementPlus, { locale: zhCn })

  for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
  }

  const auth = useAuthStore()

  setUnauthorizedHandler(() => {
    auth.clearSession()
    if (router.currentRoute.value.name !== 'Login') {
      router.push({
        name: 'Login',
        query: { redirect: router.currentRoute.value.fullPath }
      })
    }
  })

  await auth.initSession()

  app.mount('#app')
}

bootstrap()
