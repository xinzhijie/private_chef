import initSqlJs from 'sql.js/dist/sql-wasm.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { applySchema, seedDefaultAdmin, seedSampleFoods } from '../src/db/schema.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outPath = path.join(__dirname, '../public/private_chef.db')
const force = process.argv.includes('--force')

if (fs.existsSync(outPath) && !force) {
  console.log(`数据库已存在: ${outPath}`)
  console.log('如需重建请执行: npm run init-db -- --force')
  process.exit(0)
}

const SQL = await initSqlJs()
const db = new SQL.Database()

applySchema(db)
seedDefaultAdmin(db)
seedSampleFoods(db)

const dir = path.dirname(outPath)
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true })
}

const buffer = Buffer.from(db.export())
fs.writeFileSync(outPath, buffer)

console.log(`已生成: ${outPath}`)
console.log(`文件大小: ${buffer.length} bytes`)
console.log('默认管理员: admin / admin123')
console.log('示例菜品: 9 道（早/中/晚各 3 道）')

db.close()
