import { defineStore } from 'pinia'
import { queryAll, queryOne, execute } from '@/db'

export const useCategoryStore = defineStore('category', () => {
  function getCategories(type) {
    let sql = 'SELECT * FROM categories'
    const params = []
    if (type) {
      sql += ' WHERE type = ?'
      params.push(type)
    }
    sql += ' ORDER BY sort_order ASC, id ASC'
    return queryAll(sql, params)
  }

  function getCategoryById(id) {
    return queryOne('SELECT * FROM categories WHERE id = ?', [id])
  }

  function addCategory(name, type) {
    const existing = queryOne('SELECT id FROM categories WHERE name = ? AND type = ?', [name, type])
    if (existing) return { success: false, message: '该餐段下类别已存在', id: existing.id }
    const maxOrder = queryOne('SELECT MAX(sort_order) as max FROM categories WHERE type = ?', [type])
    const sortOrder = (maxOrder?.max ?? -1) + 1
    const id = execute('INSERT INTO categories (name, type, sort_order) VALUES (?, ?, ?)', [name, type, sortOrder])
    return { success: true, id }
  }

  function updateCategory(id, name) {
    const cat = getCategoryById(id)
    if (!cat) return { success: false, message: '类别不存在' }
    const existing = queryOne('SELECT id FROM categories WHERE name = ? AND type = ? AND id != ?', [name, cat.type, id])
    if (existing) return { success: false, message: '该餐段下类别已存在' }
    execute('UPDATE categories SET name = ? WHERE id = ?', [name, id])
    return { success: true }
  }

  function deleteCategory(id) {
    execute('UPDATE foods SET category_id = NULL WHERE category_id = ?', [id])
    execute('DELETE FROM categories WHERE id = ?', [id])
    return { success: true }
  }

  return {
    getCategories,
    getCategoryById,
    addCategory,
    updateCategory,
    deleteCategory
  }
})
