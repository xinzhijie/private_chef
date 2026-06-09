import { defineStore } from 'pinia'
import { api } from '@/api/client'

export const useFoodStore = defineStore('food', () => {
  async function getFoods(type, onlyActive = false, categoryId = null) {
    return api.get('/foods', {
      type: type || undefined,
      onlyActive: onlyActive ? 'true' : undefined,
      categoryId: categoryId || undefined
    })
  }

  async function getFoodById(id) {
    return api.get(`/foods/${id}`)
  }

  async function addFood(food) {
    const data = await api.post('/foods', food)
    return data.id
  }

  async function updateFood(id, food) {
    await api.put(`/foods/${id}`, food)
  }

  async function toggleStatus(id) {
    const data = await api.patch(`/foods/${id}/status`)
    return data.status
  }

  async function deleteFood(id) {
    await api.del(`/foods/${id}`)
  }

  return {
    getFoods,
    getFoodById,
    addFood,
    updateFood,
    toggleStatus,
    deleteFood
  }
})
