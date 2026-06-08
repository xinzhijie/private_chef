import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import fs from 'fs'
import path from 'path'
import initSqlJs from 'sql.js/dist/sql-wasm.js'
import { applySchema, seedDefaultAdmin, seedSampleFoods } from './src/db/schema.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, 'public', 'private_chef.db')

async function ensureDb() {
  if (fs.existsSync(dbPath)) return

  const SQL = await initSqlJs()
  const db = new SQL.Database()

  applySchema(db)
  seedDefaultAdmin(db)
  seedSampleFoods(db)

  fs.mkdirSync(path.dirname(dbPath), { recursive: true })
  fs.writeFileSync(dbPath, Buffer.from(db.export()))
  db.close()
  console.log('已自动生�? public/private_chef.db')
}

/** 修复 sql.js CommonJS 模块�? ESM default 导出 */
function sqlJsPlugin() {
  return {
    name: 'sqljs-fix',
    transform(code, id) {
      if (id.includes('sql.js/dist/sql-asm.js') || id.includes('sql.js/dist/sql-wasm.js')) {
        return {
          code: `${code}\nexport { initSqlJs as default };`,
          map: null
        }
      }
    }
  }
}

await ensureDb()

export default defineConfig({
  plugins: [vue(), sqlJsPlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  optimizeDeps: {
    include: ['sql.js/dist/sql-asm.js'],
    needsInterop: ['sql.js/dist/sql-asm.js']
  }
})
