/** PRD 定义的 SQLite 表结构 + session 会话表 + categories 类别表 */
export const SCHEMA_SQL = [
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, type)
  )`,
  `CREATE TABLE IF NOT EXISTS foods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    image TEXT,
    type TEXT NOT NULL,
    category_id INTEGER,
    status INTEGER DEFAULT 1,
    material TEXT,
    remark TEXT,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    food_id INTEGER NOT NULL,
    food_name TEXT NOT NULL,
    username TEXT NOT NULL,
    type TEXT NOT NULL,
    order_date TEXT NOT NULL,
    remark TEXT DEFAULT '',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS session (
    user_id INTEGER
  )`
]

const DEFAULT_CATEGORIES = {
  breakfast: ['粥品', '蛋类', '饮品'],
  lunch: ['热菜', '汤品'],
  dinner: ['荤菜', '素菜', '汤品']
}

const SAMPLE_FOODS = [
  { name: '小米粥', type: 'breakfast', category: '粥品', material: '小米、红枣', remark: '小火慢熬，可加冰糖' },
  { name: '煎蛋', type: 'breakfast', category: '蛋类', material: '鸡蛋、油、盐', remark: '单面煎，蛋黄半熟' },
  { name: '豆浆', type: 'breakfast', category: '饮品', material: '黄豆、水', remark: '现磨豆浆，少糖' },
  { name: '番茄炒蛋', type: 'lunch', category: '热菜', material: '番茄2个、鸡蛋3个、葱花', remark: '先炒蛋盛出，再炒番茄' },
  { name: '青椒肉丝', type: 'lunch', category: '热菜', material: '猪肉、青椒、姜蒜', remark: '肉丝先腌制10分钟' },
  { name: '紫菜蛋花汤', type: 'lunch', category: '汤品', material: '紫菜、鸡蛋、虾皮', remark: '水开下紫菜，淋蛋花' },
  { name: '红烧肉', type: 'dinner', category: '荤菜', material: '五花肉、冰糖、生抽老抽', remark: '小火慢炖1小时' },
  { name: '清炒时蔬', type: 'dinner', category: '素菜', material: '当季蔬菜、蒜', remark: '大火快炒保持脆嫩' },
  { name: '冬瓜排骨汤', type: 'dinner', category: '汤品', material: '冬瓜、排骨、姜', remark: '排骨焯水后炖40分钟' }
]

export function applySchema(db) {
  for (const sql of SCHEMA_SQL) {
    db.run(sql)
  }
  migrateSchema(db)
}

/** 兼容旧库：补 categories 表、foods.category_id 字段 */
export function migrateSchema(db) {
  const cols = db.exec('PRAGMA table_info(foods)')
  const colNames = cols[0]?.values.map((row) => row[1]) || []
  if (!colNames.includes('category_id')) {
    db.run('ALTER TABLE foods ADD COLUMN category_id INTEGER')
  }

  const orderCols = db.exec('PRAGMA table_info(orders)')
  const orderColNames = orderCols[0]?.values.map((row) => row[1]) || []
  if (!orderColNames.includes('remark')) {
    db.run("ALTER TABLE orders ADD COLUMN remark TEXT DEFAULT ''")
  }
}

export function seedDefaultAdmin(db) {
  const result = db.exec('SELECT COUNT(*) as count FROM users')
  const count = result[0]?.values[0][0] || 0
  if (count === 0) {
    db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', ['admin', 'admin123', 'admin'])
  }
}

function getCategoryIdMap(db) {
  const rows = db.exec('SELECT id, name, type FROM categories')
  const map = new Map()
  for (const row of rows[0]?.values || []) {
    map.set(`${row[2]}:${row[1]}`, row[0])
  }
  return map
}

export function seedDefaultCategories(db) {
  const result = db.exec('SELECT COUNT(*) as count FROM categories')
  const count = result[0]?.values[0][0] || 0
  if (count > 0) return

  for (const [type, names] of Object.entries(DEFAULT_CATEGORIES)) {
    names.forEach((name, index) => {
      db.run('INSERT INTO categories (name, type, sort_order) VALUES (?, ?, ?)', [name, type, index])
    })
  }
}

export function seedSampleFoods(db) {
  seedDefaultCategories(db)

  const result = db.exec('SELECT COUNT(*) as count FROM foods')
  const count = result[0]?.values[0][0] || 0
  if (count > 0) {
    assignCategoriesToExistingFoods(db)
    return
  }

  const categoryMap = getCategoryIdMap(db)

  for (const food of SAMPLE_FOODS) {
    const categoryId = categoryMap.get(`${food.type}:${food.category}`) || null
    db.run(
      'INSERT INTO foods (name, type, category_id, status, material, remark) VALUES (?, ?, ?, 1, ?, ?)',
      [food.name, food.type, categoryId, food.material, food.remark]
    )
  }
}

/** 旧数据无 category_id 时按菜名匹配默认类别 */
function assignCategoriesToExistingFoods(db) {
  const categoryMap = getCategoryIdMap(db)
  for (const food of SAMPLE_FOODS) {
    const categoryId = categoryMap.get(`${food.type}:${food.category}`)
    if (!categoryId) continue
    db.run(
      'UPDATE foods SET category_id = ? WHERE name = ? AND type = ? AND category_id IS NULL',
      [categoryId, food.name, food.type]
    )
  }
}
