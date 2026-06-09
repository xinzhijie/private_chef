import express from 'express'
import cookieParser from 'cookie-parser'
import path from 'path'
import { fileURLToPath } from 'url'
import { initDb, execute, queryAll, queryOne, run } from './db.mjs'
import {
  clearAuthCookie,
  getAuthUser,
  isTokenExpired,
  setAuthCookie
} from './auth.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '..')
const PORT = Number(process.env.PORT) || 3000
const ROLES = { ADMIN: 'admin', USER: 'user', VIEWER: 'viewer' }

const app = express()
app.set('trust proxy', 1)
app.use(express.json({ limit: '10mb' }))
app.use(cookieParser())

function getToday() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getSessionUser(req) {
  return getAuthUser(req)
}

function requireAuth(req, res, next) {
  if (isTokenExpired(req)) {
    clearAuthCookie(res)
    return res.status(401).json({ success: false, message: '登录已过期', expired: true })
  }
  if (!getSessionUser(req)) {
    return res.status(401).json({ success: false, message: '未登录' })
  }
  next()
}

function requireAdmin(req, res, next) {
  if (isTokenExpired(req)) {
    clearAuthCookie(res)
    return res.status(401).json({ success: false, message: '登录已过期', expired: true })
  }
  const user = getSessionUser(req)
  if (!user) return res.status(401).json({ success: false, message: '未登录' })
  if (user.role !== ROLES.ADMIN) {
    return res.status(403).json({ success: false, message: '无权限' })
  }
  next()
}

function requireCanOrder(req, res, next) {
  if (isTokenExpired(req)) {
    clearAuthCookie(res)
    return res.status(401).json({ success: false, message: '登录已过期', expired: true })
  }
  const user = getSessionUser(req)
  if (!user) return res.status(401).json({ success: false, message: '未登录' })
  if (user.role === ROLES.VIEWER) {
    return res.status(403).json({ success: false, message: '只读用户无法点餐' })
  }
  next()
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.get('/api/auth/me', (req, res) => {
  if (isTokenExpired(req)) {
    clearAuthCookie(res)
    return res.status(401).json({ success: false, message: '登录已过期', expired: true, user: null })
  }
  const user = getSessionUser(req)
  if (!user) return res.json({ user: null })
  res.json({ user: { id: user.id, username: user.username, role: user.role } })
})

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {}
  const found = queryOne('SELECT * FROM users WHERE username = ? AND password = ?', [username, password])
  if (!found) return res.json({ success: false, message: '用户名或密码错误' })
  const user = { id: found.id, username: found.username, role: found.role }
  setAuthCookie(res, user)
  res.json({ success: true, user })
})

app.post('/api/auth/logout', (req, res) => {
  clearAuthCookie(res)
  res.json({ success: true })
})

app.post('/api/auth/register', (req, res) => {
  const { username, password } = req.body || {}
  if (!username || !password) {
    return res.json({ success: false, message: '用户名和密码不能为空' })
  }
  if (password.length < 4) {
    return res.json({ success: false, message: '密码至少4位' })
  }
  const existing = queryOne('SELECT id FROM users WHERE username = ?', [username])
  if (existing) return res.json({ success: false, message: '用户名已存在' })
  execute('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [
    username,
    password,
    ROLES.USER
  ])
  res.json({ success: true, message: '注册成功，请登录' })
})

app.get('/api/users', requireAdmin, (_req, res) => {
  res.json(queryAll('SELECT id, username, role FROM users ORDER BY id'))
})

app.post('/api/users', requireAdmin, (req, res) => {
  const { username, password, role } = req.body || {}
  const existing = queryOne('SELECT id FROM users WHERE username = ?', [username])
  if (existing) return res.json({ success: false, message: '用户名已存在' })
  execute('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, password, role])
  res.json({ success: true })
})

app.patch('/api/users/:id/role', requireAdmin, (req, res) => {
  const id = Number(req.params.id)
  const { role } = req.body || {}
  run('UPDATE users SET role = ? WHERE id = ?', [role, id])
  res.json({ success: true })
})

app.delete('/api/users/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id)
  const currentUser = getSessionUser(req)
  if (currentUser?.id === id) {
    return res.json({ success: false, message: '不能删除当前登录用户' })
  }
  run('DELETE FROM users WHERE id = ?', [id])
  res.json({ success: true })
})

app.get('/api/categories', requireAuth, (req, res) => {
  const { type } = req.query
  let sql = 'SELECT * FROM categories'
  const params = []
  if (type) {
    sql += ' WHERE type = ?'
    params.push(type)
  }
  sql += ' ORDER BY sort_order ASC, id ASC'
  res.json(queryAll(sql, params))
})

app.post('/api/categories', requireAdmin, (req, res) => {
  const { name, type } = req.body || {}
  const existing = queryOne('SELECT id FROM categories WHERE name = ? AND type = ?', [name, type])
  if (existing) {
    return res.json({ success: false, message: '该餐段下类别已存在', id: existing.id })
  }
  const maxOrder = queryOne('SELECT MAX(sort_order) as max FROM categories WHERE type = ?', [type])
  const sortOrder = (maxOrder?.max ?? -1) + 1
  const id = execute('INSERT INTO categories (name, type, sort_order) VALUES (?, ?, ?)', [
    name,
    type,
    sortOrder
  ])
  res.json({ success: true, id })
})

app.get('/api/foods', requireAuth, (req, res) => {
  const { type, onlyActive, categoryId } = req.query
  let sql = `SELECT f.*, c.name AS category_name
    FROM foods f
    LEFT JOIN categories c ON f.category_id = c.id`
  const params = []
  const conditions = []
  if (type) {
    if (type === 'all') {
      conditions.push('f.type = ?')
      params.push('all')
    } else {
      conditions.push('(f.type = ? OR f.type = ?)')
      params.push(type, 'all')
    }
  }
  if (onlyActive === 'true' || onlyActive === '1') {
    conditions.push('f.status = 1')
  }
  if (categoryId) {
    conditions.push('f.category_id = ?')
    params.push(Number(categoryId))
  }
  if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ')
  sql += ' ORDER BY c.sort_order ASC, f.create_time DESC'
  res.json(queryAll(sql, params))
})

app.get('/api/foods/:id', requireAuth, (req, res) => {
  const food = queryOne(
    `SELECT f.*, c.name AS category_name
     FROM foods f
     LEFT JOIN categories c ON f.category_id = c.id
     WHERE f.id = ?`,
    [Number(req.params.id)]
  )
  res.json(food)
})

app.post('/api/foods', requireAdmin, (req, res) => {
  const food = req.body || {}
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
  res.json({ id })
})

app.put('/api/foods/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id)
  const food = req.body || {}
  run(
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
  res.json({ success: true })
})

app.patch('/api/foods/:id/status', requireAdmin, (req, res) => {
  const id = Number(req.params.id)
  const food = queryOne('SELECT status FROM foods WHERE id = ?', [id])
  if (!food) return res.status(404).json({ success: false, message: '菜品不存在' })
  const newStatus = food.status === 1 ? 0 : 1
  run('UPDATE foods SET status = ? WHERE id = ?', [newStatus, id])
  res.json({ status: newStatus })
})

app.delete('/api/foods/:id', requireAdmin, (req, res) => {
  run('DELETE FROM foods WHERE id = ?', [Number(req.params.id)])
  res.json({ success: true })
})

app.get('/api/orders', requireAuth, (req, res) => {
  const { orderDate, type, userId } = req.query
  let sql = 'SELECT * FROM orders'
  const params = []
  const conditions = []
  if (orderDate) {
    conditions.push('order_date = ?')
    params.push(orderDate)
  }
  if (type) {
    conditions.push('type = ?')
    params.push(type)
  }
  if (userId) {
    conditions.push('user_id = ?')
    params.push(Number(userId))
  }
  if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ')
  sql += ` ORDER BY order_date ASC,
    CASE type WHEN 'breakfast' THEN 0 WHEN 'lunch' THEN 1 WHEN 'dinner' THEN 2 ELSE 3 END ASC,
    food_name ASC`
  res.json(queryAll(sql, params))
})

app.post('/api/orders/batch', requireCanOrder, (req, res) => {
  const user = getSessionUser(req)
  const { type, orderDate, items } = req.body || {}
  const date = orderDate || getToday()
  let count = 0
  for (const item of items || []) {
    const remark = item.remark?.trim() || ''
    for (let i = 0; i < item.quantity; i++) {
      execute(
        'INSERT INTO orders (user_id, food_id, food_name, username, type, order_date, remark) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [user.id, item.food.id, item.food.name, user.username, type, date, remark]
      )
      count++
    }
  }
  res.json({ count })
})

app.post('/api/orders', requireCanOrder, (req, res) => {
  const user = getSessionUser(req)
  const { foodId, foodName, type, orderDate, remark = '' } = req.body || {}
  const date = orderDate || getToday()
  if (date !== getToday()) {
    return res.json({ success: false, message: '只能修改当天的点餐记录' })
  }
  const id = execute(
    'INSERT INTO orders (user_id, food_id, food_name, username, type, order_date, remark) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [user.id, Number(foodId), foodName, user.username, type, date, remark || '']
  )
  res.json({ success: true, id })
})

app.delete('/api/orders/one', requireCanOrder, (req, res) => {
  const user = getSessionUser(req)
  const { foodId, type, orderDate, remark = '' } = req.body || {}
  if (orderDate !== getToday()) {
    return res.json({ success: false, message: '只能修改当天的点餐记录' })
  }
  const one = queryOne(
    `SELECT id FROM orders
     WHERE user_id = ? AND food_id = ? AND type = ? AND order_date = ? AND COALESCE(remark, '') = ?
     ORDER BY id DESC LIMIT 1`,
    [user.id, Number(foodId), type, orderDate, remark || '']
  )
  if (!one) return res.json({ success: false })
  run('DELETE FROM orders WHERE id = ?', [one.id])
  res.json({ success: true })
})

if (process.env.NODE_ENV === 'production' && process.env.SERVE_STATIC !== '0') {
  const distDir = path.join(rootDir, 'dist')
  app.use(express.static(distDir))
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'))
  })
}

await initDb()

app.listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}`)
  console.log(`Database: ${process.env.DB_PATH || path.join(rootDir, 'public', 'private_chef.db')}`)
})
