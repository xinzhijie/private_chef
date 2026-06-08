import { loadSqlJs } from './loadSqlJs'
import { loadDbFile, saveDbFile, migrateFromLocalStorage } from './storage'
import { applySchema, seedDefaultAdmin, seedSampleFoods } from './schema'

let db = null

function saveDb() {
  if (!db) return
  const data = db.export()
  saveDbFile(new Uint8Array(data)).catch((err) => console.error('SQLite 保存失败:', err))
}

/** 首次启动从 public/private_chef.db 加载初始数据库 */
async function loadBundledDb() {
  try {
    const res = await fetch('/private_chef.db')
    if (!res.ok) return null
    return new Uint8Array(await res.arrayBuffer())
  } catch {
    return null
  }
}

export async function initDatabase() {
  if (db) return db

  const SQL = await loadSqlJs()

  let buffer = await loadDbFile()
  if (!buffer) {
    buffer = await migrateFromLocalStorage()
  }
  if (!buffer) {
    buffer = await loadBundledDb()
  }

  db = buffer ? new SQL.Database(buffer) : new SQL.Database()

  applySchema(db)
  seedDefaultAdmin(db)
  seedSampleFoods(db)
  await saveDbFile(new Uint8Array(db.export()))

  return db
}

export function getDb() {
  return db
}

export function queryAll(sql, params = []) {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  const rows = []
  while (stmt.step()) {
    rows.push(stmt.getAsObject())
  }
  stmt.free()
  return rows
}

export function queryOne(sql, params = []) {
  const rows = queryAll(sql, params)
  return rows[0] || null
}

export function execute(sql, params = []) {
  db.run(sql, params)
  saveDb()
  const result = db.exec('SELECT last_insert_rowid() as id')
  return result[0]?.values[0][0] || null
}

/** 登录会话写入 SQLite session 表 */
export function setSession(userId) {
  db.run('DELETE FROM session')
  if (userId) {
    db.run('INSERT INTO session (user_id) VALUES (?)', [userId])
  }
  saveDb()
}

/** 从 SQLite session 表读取当前登录用户 */
export function getSessionUser() {
  const session = queryOne('SELECT user_id FROM session LIMIT 1')
  if (!session?.user_id) return null
  return queryOne('SELECT id, username, role FROM users WHERE id = ?', [session.user_id])
}
