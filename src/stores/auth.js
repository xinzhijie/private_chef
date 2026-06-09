import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/api/client'
import { ROLES } from '@/utils/constants'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  let sessionReady = null

  const isLoggedIn = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === ROLES.ADMIN)
  const isViewer = computed(() => user.value?.role === ROLES.VIEWER)
  const canOrder = computed(() => user.value && !isViewer.value)

  function clearSession() {
    user.value = null
  }

  async function loadSession() {
    try {
      const data = await api.get('/auth/me', undefined, { skipAuthRedirect: true })
      user.value = data.user || null
    } catch {
      user.value = null
    }
  }

  async function initSession() {
    if (!sessionReady) {
      sessionReady = loadSession().catch(() => {
        user.value = null
      })
    }
    await sessionReady
  }

  async function login(username, password) {
    const result = await api.post('/auth/login', { username, password })
    if (!result.success) return result
    user.value = result.user
    sessionReady = Promise.resolve()
    return { success: true }
  }

  async function register(username, password) {
    return api.post('/auth/register', { username, password })
  }

  async function logout() {
    try {
      await api.post('/auth/logout')
    } finally {
      clearSession()
      sessionReady = Promise.resolve()
    }
  }

  async function getAllUsers() {
    return api.get('/users')
  }

  async function createUser(username, password, role) {
    return api.post('/users', { username, password, role })
  }

  async function updateUserRole(id, role) {
    const result = await api.patch(`/users/${id}/role`, { role })
    if (user.value?.id === id) {
      user.value.role = role
    }
    return result
  }

  async function deleteUser(id) {
    return api.del(`/users/${id}`)
  }

  return {
    user,
    isLoggedIn,
    isAdmin,
    isViewer,
    canOrder,
    clearSession,
    initSession,
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
