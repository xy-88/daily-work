export type TxType = 'income' | 'expense'

export type Platform = 'wechat' | 'alipay' | 'manual'

export interface Category {
  id: string
  name: string
  color: string
  type: 'income' | 'expense' | 'both'
  keywords: string[]
  sortOrder: number
}

export interface Tx {
  id: string
  date: string // yyyy-mm-dd
  time?: string // HH:mm
  type: TxType
  amount: number
  counterparty: string
  commodity: string
  method: string
  platform: Platform
  categoryId: string
  note?: string
  updatedAt: number
}

export interface ParsedTx {
  date: string
  time?: string
  type: TxType
  amount: number
  counterparty: string
  commodity: string
  method: string
  rawPlatform: Platform
  categoryId?: string
  note?: string
}

export interface AccountMeta {
  id: string
  name: string
  syncToken: string
  lastSyncAt: number
  createdAt: number
}

export interface Prefs {
  currency: string
}

export interface SyncBundle {
  from: string
  exportedAt: number
  txs: Tx[]
  categories: Category[]
}
