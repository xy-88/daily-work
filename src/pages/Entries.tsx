import { useMemo, useState } from 'react'
import { Search, Plus, Filter } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { PageHeader, SectionLabel, Amount } from '@/components/ui'
import { TxItem } from '@/components/TxItem'
import { formatDateFull } from '@/lib/format'
import type { Platform, TxType } from '@/lib/types'

export default function Entries() {
  const txs = useStore((s) => s.txs)
  const categories = useStore((s) => s.categories)
  const addTx = useStore((s) => s.addTx)

  const [q, setQ] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState<'' | TxType>('')
  const [platformFilter, setPlatformFilter] = useState<'' | Platform>('')
  const [showFilters, setShowFilters] = useState(false)

  // quick add
  const [adding, setAdding] = useState(false)
  const [aType, setAType] = useState<TxType>('expense')
  const [aAmount, setAAmount] = useState('')
  const [aCounterparty, setACounterparty] = useState('')
  const [aCat, setACat] = useState('')

  const filtered = useMemo(() => {
    return txs.filter((t) => {
      if (q && !`${t.counterparty} ${t.commodity} ${t.note ?? ''}`.toLowerCase().includes(q.toLowerCase())) return false
      if (catFilter && t.categoryId !== catFilter) return false
      if (typeFilter && t.type !== typeFilter) return false
      if (platformFilter && t.platform !== platformFilter) return false
      return true
    })
  }, [txs, q, catFilter, typeFilter, platformFilter])

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>()
    for (const t of filtered) {
      const arr = map.get(t.date) ?? []
      arr.push(t)
      map.set(t.date, arr)
    }
    return Array.from(map.entries())
  }, [filtered])

  const submitAdd = async () => {
    const amt = parseFloat(aAmount)
    if (!amt || !aCounterparty) return
    await addTx({
      type: aType,
      amount: amt,
      counterparty: aCounterparty,
      categoryId: aCat || undefined,
      platform: 'manual',
      method: '手动',
    })
    setAdding(false)
    setAAmount('')
    setACounterparty('')
    setACat('')
    setAType('expense')
  }

  return (
    <div className="max-w-ledger mx-auto px-5 md:px-10 py-8 md:py-12">
      <PageHeader
        num="Ⅱ · 流水"
        title="交易流水"
        subtitle={`共 ${filtered.length} 笔记录`}
        action={
          <button className="btn-primary" onClick={() => setAdding((v) => !v)}>
            <Plus className="w-4 h-4" /> {adding ? '取消' : '快速记账'}
          </button>
        }
      />

      {/* Quick add */}
      {adding && (
        <div className="card p-5 mb-6 animate-fade-up">
          <div className="grid grid-cols-1 md:grid-cols-[120px_1fr_1fr_1fr_auto] gap-3 items-end">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-ink-faint">类型</label>
              <div className="flex mt-1 border border-ink/15 rounded-[2px] overflow-hidden">
                <button className={`flex-1 py-2 text-xs ${aType === 'expense' ? 'bg-expense text-paper' : 'text-ink-muted'}`} onClick={() => setAType('expense')}>支出</button>
                <button className={`flex-1 py-2 text-xs ${aType === 'income' ? 'bg-income text-paper' : 'text-ink-muted'}`} onClick={() => setAType('income')}>收入</button>
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-ink-faint">金额</label>
              <input className="field mt-1 num" inputMode="decimal" placeholder="0.00" value={aAmount} onChange={(e) => setAAmount(e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-ink-faint">商户/说明</label>
              <input className="field mt-1" placeholder="如 美团外卖" value={aCounterparty} onChange={(e) => setACounterparty(e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-ink-faint">类目</label>
              <select className="field mt-1" value={aCat} onChange={(e) => setACat(e.target.value)}>
                <option value="">自动归类</option>
                {categories.filter((c) => c.type === 'both' || c.type === aType).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <button className="btn-primary" onClick={submitAdd}>记一笔</button>
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
          <input className="field pl-9" placeholder="搜索商户、商品、备注" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <button className={`btn-outline ${showFilters ? 'bg-ink text-paper' : ''}`} onClick={() => setShowFilters((v) => !v)}>
          <Filter className="w-4 h-4" /> 筛选
        </button>
      </div>

      {showFilters && (
        <div className="card p-4 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fade-up">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-ink-faint">类目</label>
            <select className="field mt-1" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
              <option value="">全部类目</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-ink-faint">收支</label>
            <select className="field mt-1" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as '' | TxType)}>
              <option value="">全部</option>
              <option value="expense">支出</option>
              <option value="income">收入</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-ink-faint">来源</label>
            <select className="field mt-1" value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value as '' | Platform)}>
              <option value="">全部</option>
              <option value="wechat">微信</option>
              <option value="alipay">支付宝</option>
              <option value="manual">手动</option>
            </select>
          </div>
        </div>
      )}

      {/* Grouped list */}
      <div className="card p-6">
        {grouped.length === 0 && (
          <div className="py-16 text-center text-sm text-ink-faint">没有匹配的记录</div>
        )}
        {grouped.map(([date, items]) => {
          const dayNet = items.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0)
          return (
            <div key={date} className="mb-6 last:mb-0">
              <div className="flex items-baseline justify-between mb-2">
                <span className="font-display italic text-sm text-ink-muted">{formatDateFull(date)}</span>
                <span className="num text-[11px] text-ink-faint">
                  日计 <Amount value={dayNet} type={dayNet >= 0 ? 'income' : 'expense'} sign />
                </span>
              </div>
              <SectionLabel>
                <span className="num">{items.length}</span> 笔
              </SectionLabel>
              <div>
                {items.map((t) => <TxItem key={t.id} tx={t} categories={categories} />)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
