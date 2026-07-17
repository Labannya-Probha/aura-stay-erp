const DB_NAME = "aura_stay_offline_db"
const DB_VERSION = 1

const STORES = [
  "sync_queue",
  "pos_orders",
  "reservations",
  "payments",
  "rooms",
  "settings",
]

export function openOfflineDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result

      STORES.forEach((store) => {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store, {
            keyPath: "id",
            autoIncrement: store === "sync_queue",
          })
        }
      })
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function dbPut(storeName, value) {
  const db = await openOfflineDb()

  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite")
    tx.objectStore(storeName).put(value)

    tx.oncomplete = () => resolve(value)
    tx.onerror = () => reject(tx.error)
  })
}

export async function dbGetAll(storeName) {
  const db = await openOfflineDb()

  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly")
    const request = tx.objectStore(storeName).getAll()

    request.onsuccess = () => resolve(request.result || [])
    request.onerror = () => reject(request.error)
  })
}

export async function dbDelete(storeName, id) {
  const db = await openOfflineDb()

  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite")
    tx.objectStore(storeName).delete(id)

    tx.oncomplete = () => resolve(true)
    tx.onerror = () => reject(tx.error)
  })
}