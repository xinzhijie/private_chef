const IDB_NAME = 'private_chef'
const IDB_STORE = 'files'
export const DB_FILE_NAME = 'private_chef.db'

function openIdb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, 1)
    request.onupgradeneeded = () => {
      request.result.createObjectStore(IDB_STORE)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function loadDbFile() {
  const idb = await openIdb()
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(IDB_STORE, 'readonly')
    const req = tx.objectStore(IDB_STORE).get(DB_FILE_NAME)
    req.onsuccess = () => resolve(req.result || null)
    req.onerror = () => reject(req.error)
  })
}

export async function saveDbFile(buffer) {
  const idb = await openIdb()
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(IDB_STORE, 'readwrite')
    tx.objectStore(IDB_STORE).put(buffer, DB_FILE_NAME)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/** 兼容旧版 localStorage 存储，迁移到 IndexedDB 后删除 */
export async function migrateFromLocalStorage() {
  const raw = localStorage.getItem('private_chef_db')
  if (!raw) return null
  const buffer = new Uint8Array(JSON.parse(raw))
  await saveDbFile(buffer)
  localStorage.removeItem('private_chef_db')
  localStorage.removeItem('private_chef_user')
  return buffer
}
