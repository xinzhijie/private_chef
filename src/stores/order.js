import { defineStore } from 'pinia'
import { api } from '@/api/client'
import { getToday } from '@/utils/constants'

export const useOrderStore = defineStore('order', () => {
  async function getOrders(filters = {}) {
    return api.get('/orders', {
      orderDate: filters.orderDate,
      type: filters.type,
      userId: filters.userId
    })
  }

  async function getTodayOrders(type, orderDate) {
    return getOrders({ type, orderDate: orderDate || getToday() })
  }

  async function placeOrders(user, items, type, orderDate) {
    const data = await api.post('/orders/batch', {
      type,
      orderDate: orderDate || getToday(),
      items
    })
    return data.count
  }

  async function addMyOrder(user, foodId, foodName, type, orderDate, remark = '') {
    if (orderDate !== getToday()) return false
    const data = await api.post('/orders', { foodId, foodName, type, orderDate, remark })
    return data.success
  }

  async function removeMyOrder(userId, foodId, type, orderDate, remark = '') {
    if (orderDate !== getToday()) return false
    const data = await api.del('/orders/one', { foodId, type, orderDate, remark })
    return data.success
  }

  return {
    placeOrders,
    addMyOrder,
    removeMyOrder,
    getOrders,
    getTodayOrders
  }
})
