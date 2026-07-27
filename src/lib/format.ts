export function formatMoney(n: number, withSign = false): string {
  const abs = Math.abs(n)
  const str = abs.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (withSign) return n < 0 ? `-${str}` : `+${str}`
  return str
}

export function formatCompact(n: number): string {
  const abs = Math.abs(n)
  if (abs >= 10000) return (n / 10000).toFixed(1) + '万'
  return Math.round(n).toString()
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const m = d.getMonth() + 1
  const day = d.getDate()
  return `${m}月${day}日`
}

export function formatDateFull(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} 周${WEEKDAYS[d.getDay()]}`
}

export function monthKey(dateStr: string): string {
  return dateStr.slice(0, 7) // yyyy-mm
}

export function currentMonthKey(): string {
  return new Date().toISOString().slice(0, 7)
}

export function monthLabel(key: string): string {
  const [y, m] = key.split('-')
  return `${y}年${parseInt(m, 10)}月`
}

export function shortMonthLabel(key: string): string {
  const [, m] = key.split('-')
  return `${parseInt(m, 10)}月`
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

export function nowTimeStr(): string {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
