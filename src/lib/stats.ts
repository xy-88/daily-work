import type { Category, Tx } from './types'
import { monthKey } from './format'

export interface MonthSummary {
  income: number
  expense: number
  net: number
  count: number
}

export function monthSummary(txs: Tx[], key: string): MonthSummary {
  let income = 0
  let expense = 0
  let count = 0
  for (const t of txs) {
    if (monthKey(t.date) !== key) continue
    if (t.type === 'income') income += t.amount
    else expense += t.amount
    count++
  }
  return { income, expense, net: income - expense, count }
}

export interface CategorySlice {
  category: Category | undefined
  categoryId: string
  amount: number
  count: number
  percent: number
}

export function categoryBreakdown(txs: Tx[], categories: Category[], type: 'income' | 'expense', monthKeyStr?: string): CategorySlice[] {
  const filtered = txs.filter((t) => t.type === type && (!monthKeyStr || monthKey(t.date) === monthKeyStr))
  const total = filtered.reduce((s, t) => s + t.amount, 0)
  const map = new Map<string, { amount: number; count: number }>()
  for (const t of filtered) {
    const e = map.get(t.categoryId) ?? { amount: 0, count: 0 }
    e.amount += t.amount
    e.count++
    map.set(t.categoryId, e)
  }
  return Array.from(map.entries())
    .map(([categoryId, v]) => ({
      categoryId,
      category: categories.find((c) => c.id === categoryId),
      amount: v.amount,
      count: v.count,
      percent: total > 0 ? (v.amount / total) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
}

export interface TrendPoint {
  key: string
  income: number
  expense: number
  net: number
}

export function trend(txs: Tx[], months: number): TrendPoint[] {
  const now = new Date()
  const points: TrendPoint[] = []
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const s = monthSummary(txs, key)
    points.push({ key, ...s })
  }
  return points
}

export interface MerchantStat {
  name: string
  amount: number
  count: number
}

export function topMerchants(txs: Tx[], type: 'income' | 'expense', limit = 8, monthKeyStr?: string): MerchantStat[] {
  const filtered = txs.filter((t) => t.type === type && (!monthKeyStr || monthKey(t.date) === monthKeyStr))
  const map = new Map<string, { amount: number; count: number }>()
  for (const t of filtered) {
    const name = t.counterparty || t.commodity
    const e = map.get(name) ?? { amount: 0, count: 0 }
    e.amount += t.amount
    e.count++
    map.set(name, e)
  }
  return Array.from(map.entries())
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit)
}

export interface DayHeat {
  day: number
  date: string
  amount: number
  intensity: number // 0..1
}

/** 当月每日支出热力 */
export function monthHeatmap(txs: Tx[], key: string): DayHeat[] {
  const [y, m] = key.split('-').map(Number)
  const daysInMonth = new Date(y, m, 0).getDate()
  const amounts = new Array(daysInMonth + 1).fill(0)
  for (const t of txs) {
    if (t.type !== 'expense' || monthKey(t.date) !== key) continue
    const day = parseInt(t.date.slice(8, 10), 10)
    amounts[day] += t.amount
  }
  const max = Math.max(...amounts.slice(1), 1)
  const out: DayHeat[] = []
  for (let day = 1; day <= daysInMonth; day++) {
    out.push({
      day,
      date: `${key}-${String(day).padStart(2, '0')}`,
      amount: amounts[day],
      intensity: amounts[day] / max,
    })
  }
  return out
}

/** 最近 N 天每日支出 */
export function dailyExpenseSeries(txs: Tx[], days: number): { date: string; amount: number }[] {
  const out: { date: string; amount: number }[] = []
  const today = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const ds = d.toISOString().slice(0, 10)
    const amount = txs.filter((t) => t.type === 'expense' && t.date === ds).reduce((s, t) => s + t.amount, 0)
    out.push({ date: ds, amount })
  }
  return out
}
