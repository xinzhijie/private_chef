import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

/** 修复 sql.js CommonJS 模块的 ESM default 导出（init-db 脚本仍需要） */
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

export default defineConfig({
  plugins: [vue(), sqlJsPlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})
