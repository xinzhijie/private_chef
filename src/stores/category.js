import { defineStore } from 'pinia'
import { api } from '@/api/client'

export const useCategoryStore = defineStore('category', () => {
  async function getCategories(type) {
    return api.get('/categories', type ? { type } : undefined)
  }

  async function addCategory(name, type) {
    return api.post('/categories', { name, type })
  }

  return {
    getCategories,
    addCategory
  }
})
