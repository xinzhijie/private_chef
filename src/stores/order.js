import { defineStore } from 'pinia'
import { queryAll, queryOne, execute, run } from '@/db'
import { getToday } from '@/utils/constants'

export const useOrderStore = defineStore('order', () => {
  function placeOrder(user, food, type, orderDate) {
    const date = orderDate || getToday()
    return execute(
      'INSERT INTO orders (user_id, food_id, food_name, username, type, order_date) VALUES (?, ?, ?, ?, ?, ?)',
      [user.id, food.id, food.name, user.username, type, date]
    )
  }

  function getOrders(filters = {}) {
    let sql = 'SELECT * FROM orders'
    const params = []
    const conditions = []
    if (filters.orderDate) {
      conditions.push('order_date = ?')
      params.push(filters.orderDate)
    }
    if (filters.type) {
      conditions.push('type = ?')
      params.push(filters.type)
    }
    if (filters.userId) {
      conditions.push('user_id = ?')
      params.push(filters.userId)
    }
    if (conditions.length) {
      sql += ' WHERE ' + conditions.join(' AND ')
    }
    sql += ' ORDER BY create_time DESC'
    return queryAll(sql, params)
  }

  function getTodayOrders(type, orderDate) {
    return getOrders({ type, orderDate: orderDate || getToday() })
  }

  function placeOrders(user, items, type, orderDate) {
    const date = orderDate || getToday()
    let count = 0
    for (const item of items) {
      for (let i = 0; i < item.quantity; i++) {
        execute(
          'INSERT INTO orders (user_id, food_id, food_name, username, type, order_date) VALUES (?, ?, ?, ?, ?, ?)',
          [user.id, item.food.id, item.food.name, user.username, type, date]
        )
        count++
      }
    }
    return count
  }

  function addMyOrder(user, foodId, foodName, type, orderDate) {
    return execute(
      'INSERT INTO orders (user_id, food_id, food_name, username, type, order_date) VALUES (?, ?, ?, ?, ?, ?)',
      [user.id, Number(foodId), foodName, user.username, type, orderDate]
    )
  }

  function removeMyOrder(userId, foodId, type, orderDate) {
    const uid = Number(userId)
    const fid = Number(foodId)
    const one = queryOne(
      'SELECT id FROM orders WHERE user_id = ? AND food_id = ? AND type = ? AND order_date = ? ORDER BY id DESC LIMIT 1',
      [uid, fid, type, orderDate]
    )
    if (!one) return false
    run('DELETE FROM orders WHERE id = ?', [one.id])
    return true
  }

  return {
    placeOrder,
    placeOrders,
    addMyOrder,
    removeMyOrder,
    getOrders,
    getTodayOrders
  }
})
