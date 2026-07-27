import type { Category, ParsedTx } from './types'

/**
 * 根据类目关键词规则，对一条解析后的交易进行自动归类。
 * 匹配优先级：商户名(commodity+counterparty) 命中 > 通用兜底 > 未分类。
 */
export function classifyTx(tx: ParsedTx, categories: Category[]): string {
  const haystack = `${tx.counterparty} ${tx.commodity} ${tx.note ?? ''}`.toLowerCase()
  const candidates = categories.filter((c) => c.type === 'both' || c.type === tx.type)

  // 命中关键词最多的类目胜出
  let best: { id: string; score: number } | null = null
  for (const cat of candidates) {
    let score = 0
    for (const kw of cat.keywords) {
      if (haystack.includes(kw.toLowerCase())) {
        score += kw.length // 长关键词权重更高
      }
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { id: cat.id, score }
    }
  }
  if (best) return best.id

  // 兜底：收入归工资，支出归转账
  const fallback = categories.find((c) => c.id === (tx.type === 'income' ? 'cat_salary' : 'cat_transfer'))
  return fallback?.id ?? 'cat_transfer'
}

export function categoryById(categories: Category[], id: string): Category | undefined {
  return categories.find((c) => c.id === id)
}
