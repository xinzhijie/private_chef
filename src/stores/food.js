import { defineStore } from 'pinia'
import { queryAll, queryOne, execute } from '@/db'

export const useFoodStore = defineStore('food', () => {
  function getFoods(type, onlyActive = false, categoryId = null) {
    let sql = `SELECT f.*, c.name AS category_name
      FROM foods f
      LEFT JOIN categories c ON f.category_id = c.id`
    const params = []
    const conditions = []
    if (type) {
      conditions.push('f.type = ?')
      params.push(type)
    }
    if (onlyActive) {
      conditions.push('f.status = 1')
    }
    if (categoryId) {
      conditions.push('f.category_id = ?')
      params.push(categoryId)
    }
    if (conditions.length) {
      sql += ' WHERE ' + conditions.join(' AND ')
    }
    sql += ' ORDER BY c.sort_order ASC, f.create_time DESC'
    return queryAll(sql, params)
  }

  function getFoodById(id) {
    return queryOne(
      `SELECT f.*, c.name AS category_name
       FROM foods f
       LEFT JOIN categories c ON f.category_id = c.id
       WHERE f.id = ?`,
      [id]
    )
  }

  function addFood(food) {
    const id = execute(
      'INSERT INTO foods (name, image, type, category_id, status, material, remark) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        food.name,
        food.image || '',
        food.type,
        food.category_id || null,
        food.status ?? 1,
        food.material || '',
        food.remark || ''
      ]
    )
    return id
  }

  function updateFood(id, food) {
    execute(
      'UPDATE foods SET name = ?, image = ?, type = ?, category_id = ?, status = ?, material = ?, remark = ? WHERE id = ?',
      [
        food.name,
        food.image || '',
        food.type,
        food.category_id || null,
        food.status,
        food.material || '',
        food.remark || '',
        id
      ]
    )
  }

  function toggleStatus(id) {
    const food = getFoodById(id)
    if (!food) return
    const newStatus = food.status === 1 ? 0 : 1
    execute('UPDATE foods SET status = ? WHERE id = ?', [newStatus, id])
    return newStatus
  }

  function deleteFood(id) {
    execute('DELETE FROM foods WHERE id = ?', [id])
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
