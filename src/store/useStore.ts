import { create } from 'zustand'
import type { AccountMeta, Category, ParsedTx, Prefs, Tx } from '@/lib/types'
import {
  bulkPutCategories,
  bulkPutTx,
  ensureSeed,
  getMeta,
  listCategories,
  listTx,
  putCategory,
  putTx,
  removeCategory,
  removeTx,
  setMeta,
} from '@/lib/db'
import { classifyTx } from '@/lib/classify'
import { nowTimeStr, todayStr } from '@/lib/format'

interface StoreState {
  ready: boolean
  txs: Tx[]
  categories: Category[]
  account: AccountMeta | null
  prefs: Prefs

  init: () => Promise<void>
  reload: () => Promise<void>

  addTx: (input: Partial<Tx> & { type: Tx['type']; amount: number }) => Promise<Tx>
  updateTx: (id: string, patch: Partial<Tx>) => Promise<void>
  deleteTx: (id: string) => Promise<void>
  bulkImportParsed: (parsed: ParsedTx[]) => Promise<number>

  upsertCategory: (cat: Category) => Promise<void>
  deleteCategory: (id: string) => Promise<void>
  setAccount: (acc: AccountMeta) => Promise<void>
  setPrefs: (p: Partial<Prefs>) => Promise<void>
}

function newId(): string {
  return `tx_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

export const useStore = create<StoreState>((set, get) => ({
  ready: false,
  txs: [],
  categories: [],
  account: null,
  prefs: { currency: '¥' },

  init: async () => {
    await ensureSeed()
    await get().reload()
    set({ ready: true })
  },

  reload: async () => {
    const [txs, categories, account, prefs] = await Promise.all([
      listTx(),
      listCategories(),
      getMeta<AccountMeta>('account'),
      getMeta<Prefs>('prefs'),
    ])
    set({ txs, categories, account: account ?? null, prefs: prefs ?? { currency: '¥' } })
  },

  addTx: async (input) => {
    const tx: Tx = {
      id: input.id ?? newId(),
      date: input.date ?? todayStr(),
      time: input.time ?? nowTimeStr(),
      type: input.type,
      amount: Math.abs(input.amount),
      counterparty: input.counterparty ?? '',
      commodity: input.commodity ?? '',
      method: input.method ?? '手动',
      platform: input.platform ?? 'manual',
      categoryId: input.categoryId ?? get().categories.find((c) => c.type !== 'income')?.id ?? 'cat_transfer',
      note: input.note ?? '',
      updatedAt: Date.now(),
    }
    await putTx(tx)
    set((s) => ({ txs: [tx, ...s.txs] }))
    return tx
  },

  updateTx: async (id, patch) => {
    const existing = get().txs.find((t) => t.id === id)
    if (!existing) return
    const next: Tx = { ...existing, ...patch, updatedAt: Date.now() }
    await putTx(next)
    set((s) => ({ txs: s.txs.map((t) => (t.id === id ? next : t)) }))
  },

  deleteTx: async (id) => {
    await removeTx(id)
    set((s) => ({ txs: s.txs.filter((t) => t.id !== id) }))
  },

  bulkImportParsed: async (parsed) => {
    const categories = get().categories
    const txs: Tx[] = parsed.map((p) => ({
      id: newId(),
      date: p.date,
      time: p.time,
      type: p.type,
      amount: p.amount,
      counterparty: p.counterparty,
      commodity: p.commodity,
      method: p.method,
      platform: p.rawPlatform,
      categoryId: p.categoryId ?? classifyTx(p, categories),
      note: p.note ?? '',
      updatedAt: Date.now(),
    }))
    await bulkPutTx(txs)
    set((s) => ({ txs: [...txs, ...s.txs].sort((a, b) => (b.date + (b.time ?? '')).localeCompare(a.date + (a.time ?? ''))) }))
    return txs.length
  },

  upsertCategory: async (cat) => {
    await putCategory(cat)
    set((s) => {
      const exists = s.categories.some((c) => c.id === cat.id)
      const next = exists ? s.categories.map((c) => (c.id === cat.id ? cat : c)) : [...s.categories, cat]
      return { categories: next.sort((a, b) => a.sortOrder - b.sortOrder) }
    })
  },

  deleteCategory: async (id) => {
    await removeCategory(id)
    set((s) => ({ categories: s.categories.filter((c) => c.id !== id) }))
  },

  setAccount: async (acc) => {
    await setMeta('account', acc)
    set({ account: acc })
  },

  setPrefs: async (p) => {
    const next = { ...get().prefs, ...p }
    await setMeta('prefs', next)
    set({ prefs: next })
  },
}))
