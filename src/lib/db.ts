import type { AccountMeta, Category, Prefs, Tx } from './types'
import { DEFAULT_CATEGORIES } from './seed'

const DB_NAME = 'ledger-db'
const DB_VERSION = 2
const STORES = ['transactions', 'categories', 'meta'] as const
type StoreName = (typeof STORES)[number]

let dbPromise: Promise<IDBDatabase> | null = null

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      for (const name of STORES) {
        if (!db.objectStoreNames.contains(name)) db.createObjectStore(name)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

function withStore<T>(
  store: StoreName,
  mode: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest,
): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(store, mode)
        const s = t.objectStore(store)
        const req = fn(s)
        req.onsuccess = () => resolve(req.result as T)
        req.onerror = () => reject(req.error)
      }),
  )
}

/* ---------------- transactions ---------------- */
export async function listTx(): Promise<Tx[]> {
  const all = await withStore<Tx[]>('transactions', 'readonly', (s) => s.getAll())
  return (all ?? [])
    .filter((x): x is Tx => Boolean(x))
    .sort((a, b) => (b.date + (b.time ?? '')).localeCompare(a.date + (a.time ?? '')))
}

export async function getTx(id: string): Promise<Tx | undefined> {
  return withStore<Tx | undefined>('transactions', 'readonly', (s) => s.get(id))
}

export async function putTx(tx: Tx): Promise<void> {
  await withStore('transactions', 'readwrite', (s) => s.put(tx, tx.id))
}

export async function bulkPutTx(txs: Tx[]): Promise<void> {
  const db = await openDB()
  await new Promise<void>((resolve, reject) => {
    const t = db.transaction('transactions', 'readwrite')
    const s = t.objectStore('transactions')
    for (const tx of txs) s.put(tx, tx.id)
    t.oncomplete = () => resolve()
    t.onerror = () => reject(t.error)
  })
}

export async function removeTx(id: string): Promise<void> {
  await withStore('transactions', 'readwrite', (s) => s.delete(id))
}

/* ---------------- categories ---------------- */
export async function listCategories(): Promise<Category[]> {
  const all = await withStore<Category[]>('categories', 'readonly', (s) => s.getAll())
  return (all ?? []).filter((x): x is Category => Boolean(x)).sort((a, b) => a.sortOrder - b.sortOrder)
}

export async function putCategory(cat: Category): Promise<void> {
  await withStore('categories', 'readwrite', (s) => s.put(cat, cat.id))
}

export async function removeCategory(id: string): Promise<void> {
  await withStore('categories', 'readwrite', (s) => s.delete(id))
}

export async function bulkPutCategories(cats: Category[]): Promise<void> {
  const db = await openDB()
  await new Promise<void>((resolve, reject) => {
    const t = db.transaction('categories', 'readwrite')
    const s = t.objectStore('categories')
    for (const c of cats) s.put(c, c.id)
    t.oncomplete = () => resolve()
    t.onerror = () => reject(t.error)
  })
}

/* ---------------- meta ---------------- */
export async function getMeta<T>(key: string): Promise<T | undefined> {
  return withStore<T | undefined>('meta', 'readonly', (s) => s.get(key))
}

export async function setMeta(key: string, value: unknown): Promise<void> {
  await withStore('meta', 'readwrite', (s) => s.put(value, key))
}

export async function delMeta(key: string): Promise<void> {
  await withStore('meta', 'readwrite', (s) => s.delete(key))
}

/* ---------------- init / utilities ---------------- */
export function makeToken(): string {
  const bytes = new Uint8Array(12)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** 首次初始化：写入默认类目 */
export async function ensureSeed(): Promise<void> {
  const seeded = await getMeta<boolean>('seeded')
  if (seeded) return
  await bulkPutCategories(DEFAULT_CATEGORIES)
  const account: AccountMeta = {
    id: `acc_${Date.now().toString(36)}`,
    name: '我的账簿',
    syncToken: makeToken(),
    lastSyncAt: 0,
    createdAt: Date.now(),
  }
  await setMeta('account', account)
  await setMeta('prefs', { currency: '¥' } as Prefs)
  await setMeta('seeded', true)
}

export async function clearAll(): Promise<void> {
  const db = await openDB()
  await new Promise<void>((resolve, reject) => {
    const t = db.transaction([...STORES], 'readwrite')
    for (const name of STORES) t.objectStore(name).clear()
    t.oncomplete = () => resolve()
    t.onerror = () => reject(t.error)
  })
}
