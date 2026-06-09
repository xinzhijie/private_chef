import { defineStore } from 'pinia'
import { reactive } from 'vue'

export const useCartStore = defineStore('cart', () => {
  const carts = reactive({
    breakfast: {},
    lunch: {},
    dinner: {}
  })

  function getItems(mealType) {
    return Object.values(carts[mealType] || {})
  }

  function getQuantity(mealType, foodId) {
    return carts[mealType]?.[foodId]?.quantity || 0
  }

  function getTotalCount(mealType) {
    return getItems(mealType).reduce((sum, item) => sum + item.quantity, 0)
  }

  function addItem(mealType, food) {
    const cart = carts[mealType]
    if (!cart[food.id]) {
      cart[food.id] = { food, quantity: 0, remark: '' }
    }
    cart[food.id].quantity++
  }

  function setRemark(mealType, foodId, remark) {
    const cart = carts[mealType]
    if (cart[foodId]) {
      cart[foodId].remark = remark
    }
  }

  function removeItem(mealType, foodId) {
    const cart = carts[mealType]
    if (!cart[foodId]) return
    cart[foodId].quantity--
    if (cart[foodId].quantity <= 0) {
      delete cart[foodId]
    }
  }

  function clearCart(mealType) {
    carts[mealType] = {}
  }

  return {
    carts,
    getItems,
    getQuantity,
    getTotalCount,
    addItem,
    setRemark,
    removeItem,
    clearCart
  }
})
