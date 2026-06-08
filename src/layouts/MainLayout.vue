<template>
  <el-container class="main-layout">
    <el-header class="header">
      <div class="header-left">
        <el-icon :size="24" color="#e6a23c"><Food /></el-icon>
        <span class="logo">家庭点菜</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        mode="horizontal"
        :ellipsis="false"
        router
        class="nav-menu"
      >
        <el-menu-item index="/">点餐</el-menu-item>
        <el-menu-item index="/records">点餐记录</el-menu-item>
        <el-menu-item v-if="auth.isAdmin" index="/admin/foods">菜品管理</el-menu-item>
        <el-menu-item index="/profile">个人中心</el-menu-item>
      </el-menu>
      <div class="header-right">
        <span class="username">{{ auth.user?.username }}</span>
        <el-tag size="small" :type="roleTagType">{{ roleLabel }}</el-tag>
        <el-button type="danger" link @click="handleLogout">退出</el-button>
      </div>
    </el-header>
    <el-main class="main-content">
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ROLE_LABELS } from '@/utils/constants'
import { ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const activeMenu = computed(() => route.path)
const roleLabel = computed(() => ROLE_LABELS[auth.user?.role] || '')
const roleTagType = computed(() => {
  const map = { admin: 'danger', user: 'success', viewer: 'info' }
  return map[auth.user?.role] || 'info'
})

async function handleLogout() {
  await ElMessageBox.confirm('确定要退出登录吗？', '提示', { type: 'warning' })
  auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.main-layout {
  min-height: 100vh;
}

.header {
  display: flex;
  align-items: center;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  padding: 0 20px;
  height: 60px;
  gap: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.logo {
  font-size: 18px;
  font-weight: 600;
  color: #e6a23c;
  white-space: nowrap;
}

.nav-menu {
  flex: 1;
  border-bottom: none;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.username {
  font-size: 14px;
  color: #606266;
}

.main-content {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

@media (max-width: 768px) {
  .header {
    flex-wrap: wrap;
    height: auto;
    padding: 10px;
    gap: 8px;
  }

  .nav-menu {
    width: 100%;
    order: 3;
  }

  .header-right {
    margin-left: auto;
  }

  .username {
    display: none;
  }
}
</style>
