import initSqlJs from 'sql.js/dist/sql-wasm.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { applySchema, seedDefaultAdmin, seedSampleFoods } from '../src/db/schema.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '..')

export const DB_PATH = process.env.DB_PATH || path.join(rootDir, 'public', 'private_chef.db')

let db = null

function saveDbFile() {
  if (!db) return
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
  fs.writeFileSync(DB_PATH, Buffer.from(db.export()))
}

export async function initDb() {
  if (db) return db

  const SQL = await initSqlJs()
  const buffer = fs.existsSync(DB_PATH) ? fs.readFileSync(DB_PATH) : null
  db = buffer ? new SQL.Database(buffer) : new SQL.Database()

  applySchema(db)
  seedDefaultAdmin(db)
  seedSampleFoods(db)
  saveDbFile()

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
  saveDbFile()
  const result = db.exec('SELECT last_insert_rowid() as id')
  return Number(result[0]?.values[0][0] || 0)
}

export function run(sql, params = []) {
  db.run(sql, params)
  saveDbFile()
}
