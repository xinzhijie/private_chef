let SQL = null
let initPromise = null

export function loadSqlJs() {
  if (SQL) return Promise.resolve(SQL)
  if (initPromise) return initPromise

  // 浏览器使用 sql-asm.js，纯 JS 实现，无需加载 .wasm 文件
  initPromise = import('sql.js/dist/sql-asm.js')
    .then((mod) => {
      const init = mod.default ?? mod
      return init()
    })
    .then((instance) => {
      SQL = instance
      return SQL
    })

  return initPromise
}
