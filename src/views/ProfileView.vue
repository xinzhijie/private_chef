<template>
  <div class="profile-page">
    <el-card class="user-card">
      <div class="user-info">
        <el-avatar :size="64" style="background: #e6a23c; font-size: 24px">
          {{ auth.user?.username?.charAt(0) }}
        </el-avatar>
        <div class="user-detail">
          <h2>{{ auth.user?.username }}</h2>
          <el-tag :type="roleTagType">{{ roleLabel }}</el-tag>
        </div>
      </div>
      <el-descriptions :column="1" border style="margin-top: 20px">
        <el-descriptions-item label="用户ID">{{ auth.user?.id }}</el-descriptions-item>
        <el-descriptions-item label="角色">{{ roleLabel }}</el-descriptions-item>
        <el-descriptions-item label="点餐权限">
          <el-tag :type="auth.canOrder ? 'success' : 'info'" size="small">
            {{ auth.canOrder ? '可点餐' : '仅查看' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="管理权限">
          <el-tag :type="auth.isAdmin ? 'danger' : 'info'" size="small">
            {{ auth.isAdmin ? '可管理菜品' : '无管理权限' }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card v-if="auth.isAdmin" class="user-manage-card">
      <template #header>
        <div class="card-header">
          <span>用户管理</span>
          <el-button type="primary" size="small" @click="showCreateDialog = true">
            <el-icon><Plus /></el-icon>
            创建用户
          </el-button>
        </div>
      </template>
      <el-table :data="users" stripe>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="username" label="用户名" />
        <el-table-column label="角色" width="160">
          <template #default="{ row }">
            <el-select
              v-model="row.role"
              size="small"
              :disabled="row.id === auth.user?.id"
              @change="handleRoleChange(row)"
            >
              <el-option label="管理员" value="admin" />
              <el-option label="普通用户" value="user" />
              <el-option label="只读用户" value="viewer" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button
              type="danger"
              link
              :disabled="row.id === auth.user?.id"
              @click="handleDeleteUser(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showCreateDialog" title="创建用户" width="400px">
      <el-form ref="createFormRef" :model="createForm" :rules="createRules" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="createForm.username" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="createForm.password" type="password" show-password />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="createForm.role" style="width: 100%">
            <el-option label="管理员" value="admin" />
            <el-option label="普通用户" value="user" />
            <el-option label="只读用户" value="viewer" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreateUser">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { ROLE_LABELS } from '@/utils/constants'
import { ElMessage, ElMessageBox } from 'element-plus'

const auth = useAuthStore()

const users = ref([])
const showCreateDialog = ref(false)
const createFormRef = ref()

const createForm = reactive({
  username: '',
  password: '',
  role: 'user'
})

const createRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 4, message: '密码至少4位', trigger: 'blur' }
  ],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }]
}

const roleLabel = computed(() => ROLE_LABELS[auth.user?.role] || '')
const roleTagType = computed(() => {
  const map = { admin: 'danger', user: 'success', viewer: 'info' }
  return map[auth.user?.role] || 'info'
})

async function loadUsers() {
  users.value = await auth.getAllUsers()
}

async function handleRoleChange(row) {
  await auth.updateUserRole(row.id, row.role)
  ElMessage.success('角色已更新')
}

async function handleDeleteUser(row) {
  await ElMessageBox.confirm(`确定删除用户「${row.username}」吗？`, '删除确认', { type: 'warning' })
  const result = await auth.deleteUser(row.id)
  if (result.success) {
    ElMessage.success('用户已删除')
    await loadUsers()
  } else {
    ElMessage.error(result.message)
  }
}

async function handleCreateUser() {
  const valid = await createFormRef.value?.validate().catch(() => false)
  if (!valid) return
  const result = await auth.createUser(createForm.username, createForm.password, createForm.role)
  if (result.success) {
    ElMessage.success('用户创建成功')
    showCreateDialog.value = false
    createForm.username = ''
    createForm.password = ''
    createForm.role = 'user'
    await loadUsers()
  } else {
    ElMessage.error(result.message)
  }
}

onMounted(loadUsers)
</script>

<style scoped>
.profile-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.user-card,
.user-manage-card {
  border-radius: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-detail h2 {
  font-size: 20px;
  margin-bottom: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
