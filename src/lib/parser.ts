import type { ParsedTx, Platform, TxType } from './types'

/**
 * 智能分割一行 CSV/TSV 字段，处理双引号包裹的字段（含逗号、转义引号）。
 */
function splitFields(line: string): string[] {
  const fields: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        cur += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',' || ch === '\t') {
        fields.push(cur.trim())
        cur = ''
      } else {
        cur += ch
      }
    }
  }
  fields.push(cur.trim())
  return fields
}

function detectPlatform(text: string): Platform {
  const head = text.slice(0, 600)
  if (/支付宝|alipay/i.test(head)) return 'alipay'
  if (/微信|wechat|微信支付/i.test(head)) return 'wechat'
  // 没有明显标记，按特征字段推断
  if (/交易创建时间|商家订单号/.test(text)) return 'alipay'
  if (/交易单号|当前状态/.test(text)) return 'wechat'
  return 'wechat'
}

function parseAmount(raw: string): number | null {
  if (!raw) return null
  const cleaned = raw.replace(/[¥￥$,\s]/g, '').replace(/[^0-9.\-]/g, '')
  const n = parseFloat(cleaned)
  return Number.isFinite(n) ? n : null
}

function parseType(raw: string): TxType | null {
  const s = raw.trim()
  if (/收入/.test(s)) return 'income'
  if (/支出/.test(s)) return 'expense'
  return null // 不计收支 / "/" 忽略
}

function parseDateTime(raw: string): { date: string; time?: string } | null {
  // 支持 2024-07-28 12:30:00 / 2024-07-28 12:30 / 2024/07/28 12:30
  const m = raw.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[ T]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/)
  if (!m) return null
  const [, y, mo, da, h, mi] = m
  const date = `${y}-${mo.padStart(2, '0')}-${da.padStart(2, '0')}`
  const time = h ? `${h.padStart(2, '0')}:${mi}` : undefined
  return { date, time }
}

/** 找到表头行的列索引映射 */
function findHeader(lines: string[]): { headerIdx: number; cols: Record<string, number> } | null {
  const markers = ['交易时间', '交易创建时间', '付款时间']
  for (let i = 0; i < Math.min(lines.length, 40); i++) {
    const cells = splitFields(lines[i])
    if (cells.length < 3) continue
    const joined = cells.join('|').toLowerCase()
    if (!markers.some((m) => cells.some((c) => c.includes(m)))) continue
    const cols: Record<string, number> = {}
    cells.forEach((c, idx) => {
      const lc = c.toLowerCase()
      if ('交易时间交易创建时间付款时间'.split('').some(() => c.includes('交易时间') || c.includes('交易创建时间') || c.includes('付款时间')) && cols.time === undefined) cols.time = idx
      if (c.includes('收/支') || c.includes('收支') || c === '收/支') cols.type = idx
      if (c.includes('交易对方') || c.includes('对方')) cols.counterparty = idx
      if (c.includes('商品') && cols.commodity === undefined) cols.commodity = idx
      if (c.includes('金额') || (c.includes('金额(元)')) || c.includes('金额（元）')) cols.amount = idx
      if (c.includes('支付方式') || c.includes('收/付款方式')) cols.method = idx
      if (c.includes('交易类型') && cols.ttype === undefined) cols.ttype = idx
      if (c.includes('商品名称') && cols.commodity === undefined) cols.commodity = idx
      void lc
    })
    return { headerIdx: i, cols }
  }
  return null
}

function rowToTx(cells: string[], cols: Record<string, number>, platform: Platform): ParsedTx | null {
  const timeRaw = cols.time !== undefined ? cells[cols.time] : ''
  const dt = parseDateTime(timeRaw)
  if (!dt) return null

  const amountRaw = cols.amount !== undefined ? cells[cols.amount] : ''
  const amount = parseAmount(amountRaw)
  if (amount === null || amount === 0) return null

  const typeRaw = cols.type !== undefined ? cells[cols.type] : ''
  const type = parseType(typeRaw)
  if (!type) return null

  const counterparty = cols.counterparty !== undefined ? cells[cols.counterparty] : ''
  const commodity = cols.commodity !== undefined ? cells[cols.commodity] : ''
  const method = cols.method !== undefined ? cells[cols.method] : ''

  return {
    date: dt.date,
    time: dt.time,
    type,
    amount: Math.abs(amount),
    counterparty: counterparty || commodity || '未知商户',
    commodity: commodity || counterparty,
    method: method || (platform === 'wechat' ? '微信' : '支付宝'),
    rawPlatform: platform,
  }
}

/** 正则兜底：从杂乱文本中提取交易行（含日期 + 金额） */
function regexFallback(text: string, platform: Platform): ParsedTx[] {
  const lines = text.split(/\r?\n/)
  const out: ParsedTx[] = []
  const dateAmtRe = /(\d{4}[-/]\d{1,2}[-/]\d{1,2})\D{0,12}(\d{1,2}:\d{2})?[\s\S]{0,60}?(¥|￥|\$)?\s*([0-9]+(?:[.,][0-9]{2}))/
  for (const line of lines) {
    if (!/\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(line)) continue
    const m = line.match(dateAmtRe)
    if (!m) continue
    const dt = parseDateTime(`${m[1]} ${m[2] ?? ''}`)
    if (!dt) continue
    const amount = parseAmount(m[4])
    if (amount === null || amount === 0) continue
    const type: TxType = /收入|收款|转入|工资/.test(line) ? 'income' : 'expense'
    // 提取商户：去掉日期金额后的中文片段
    const cleaned = line.replace(m[1], '').replace(m[4], '').replace(/[¥￥$\d:/\-\s]/g, ' ').trim()
    const counterparty = cleaned.split(/\s{2,}/)[0]?.slice(0, 24) || '未知商户'
    out.push({
      date: dt.date,
      time: dt.time,
      type,
      amount: Math.abs(amount),
      counterparty,
      commodity: counterparty,
      method: platform === 'wechat' ? '微信' : '支付宝',
      rawPlatform: platform,
    })
  }
  return out
}

export function parseBillText(text: string, platformHint?: Platform): ParsedTx[] {
  const clean = text.replace(/^\ufeff/, '').replace(/\r\n/g, '\n')
  const platform = platformHint ?? detectPlatform(clean)
  const lines = clean.split('\n').filter((l) => l.trim().length > 0)

  const header = findHeader(lines)
  const out: ParsedTx[] = []

  if (header) {
    for (let i = header.headerIdx + 1; i < lines.length; i++) {
      const cells = splitFields(lines[i])
      if (cells.length < 3) continue
      const tx = rowToTx(cells, header.cols, platform)
      if (tx) out.push(tx)
    }
  }

  if (out.length === 0) {
    return regexFallback(clean, platform)
  }
  return out
}

export async function parseCSVFile(file: File, platformHint?: Platform): Promise<ParsedTx[]> {
  const text = await file.text()
  return parseBillText(text, platformHint)
}
