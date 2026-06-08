import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { queryOne, queryAll, execute, setSession, getSessionUser } from '@/db'
import { ROLES } from '@/utils/constants'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)

  const isLoggedIn = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === ROLES.ADMIN)
  const isViewer = computed(() => user.value?.role === ROLES.VIEWER)
  const canOrder = computed(() => user.value && !isViewer.value)

  /** 从 SQLite session 表恢复登录状态 */
  function loadSession() {
    const found = getSessionUser()
    if (found) {
      user.value = { id: found.id, username: found.username, role: found.role }
    }
  }

  function login(username, password) {
    const found = queryOne('SELECT * FROM users WHERE username = ? AND password = ?', [username, password])
    if (!found) return { success: false, message: '用户名或密码错误' }
    user.value = { id: found.id, username: found.username, role: found.role }
    setSession(found.id)
    return { success: true }
  }

  function register(username, password) {
    const existing = queryOne('SELECT id FROM users WHERE username = ?', [username])
    if (existing) return { success: false, message: '用户名已存在' }
    if (!username || !password) return { success: false, message: '用户名和密码不能为空' }
    if (password.length < 4) return { success: false, message: '密码至少4位' }
    execute('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, password, ROLES.USER])
    return { success: true, message: '注册成功，请登录' }
  }

  function logout() {
    user.value = null
    setSession(null)
  }

  function getAllUsers() {
    return queryAll('SELECT id, username, role FROM users ORDER BY id')
  }

  function createUser(username, password, role) {
    const existing = queryOne('SELECT id FROM users WHERE username = ?', [username])
    if (existing) return { success: false, message: '用户名已存在' }
    execute('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, password, role])
    return { success: true }
  }

  function updateUserRole(id, role) {
    execute('UPDATE users SET role = ? WHERE id = ?', [role, id])
    if (user.value?.id === id) {
      user.value.role = role
    }
    return { success: true }
  }

  function deleteUser(id) {
    if (user.value?.id === id) return { success: false, message: '不能删除当前登录用户' }
    execute('DELETE FROM users WHERE id = ?', [id])
    return { success: true }
  }

  return {
    user,
    isLoggedIn,
    isAdmin,
    isViewer,
    canOrder,
    loadSession,
    login,
    register,
    logout,
    getAllUsers,
    createUser,
    updateUserRole,
    deleteUser
  }
})
