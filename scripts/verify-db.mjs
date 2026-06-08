import initSqlJs from 'sql.js/dist/sql-wasm.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, '../public/private_chef.db')

if (!fs.existsSync(dbPath)) {
  console.error('错误: public/private_chef.db 不存在，请先执行 npm run init-db')
  process.exit(1)
}

const buffer = fs.readFileSync(dbPath)
const SQL = await initSqlJs()
const db = new SQL.Database(buffer)

const tables = ['users', 'foods', 'orders', 'session']
console.log(`文件: ${dbPath}`)
console.log(`大小: ${buffer.length} bytes\n`)

for (const table of tables) {
  const count = db.exec(`SELECT COUNT(*) as c FROM ${table}`)
  const n = count[0]?.values[0][0] ?? 0
  console.log(`  ${table}: ${n} 条记录`)
}

const admin = db.exec("SELECT username, role FROM users WHERE username = 'admin'")
if (admin[0]?.values[0]) {
  console.log(`\n管理员: ${admin[0].values[0][0]} (${admin[0].values[0][1]})`)
}

db.close()
console.log('\n数据库校验通过')
