import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { PageHeader, SectionLabel, Amount } from '@/components/ui'
import { DonutChart, TrendChart, HBars, CompareBars } from '@/components/charts'
import { categoryBreakdown, monthSummary, topMerchants, trend } from '@/lib/stats'
import { currentMonthKey, formatMoney, monthLabel } from '@/lib/format'

export default function Analytics() {
  const txs = useStore((s) => s.txs)
  const categories = useStore((s) => s.categories)

  const [monthKeyStr, setMonthKeyStr] = useState(currentMonthKey())
  const [breakdownType, setBreakdownType] = useState<'expense' | 'income'>('expense')

  const shiftMonth = (delta: number) => {
    const [y, m] = monthKeyStr.split('-').map(Number)
    const d = new Date(y, m - 1 + delta, 1)
    setMonthKeyStr(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  const summary = useMemo(() => monthSummary(txs, monthKeyStr), [txs, monthKeyStr])
  const slices = useMemo(() => categoryBreakdown(txs, categories, breakdownType, monthKeyStr), [txs, categories, breakdownType, monthKeyStr])
  const merchants = useMemo(() => topMerchants(txs, 'expense', 8, monthKeyStr), [txs, monthKeyStr])
  const trendPoints = useMemo(() => trend(txs, 12), [txs])

  const compareRows = useMemo(() => {
    const [y, m] = monthKeyStr.split('-').map(Number)
    const prev = new Date(y, m - 2, 1)
    const prevKey = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`
    const cur = categoryBreakdown(txs, categories, 'expense', monthKeyStr)
    const prevMap = new Map(categoryBreakdown(txs, categories, 'expense', prevKey).map((s) => [s.categoryId, s.amount]))
    return cur.slice(0, 6).map((s) => ({
      name: s.category?.name ?? '未分类',
      color: s.category?.color ?? '#6B6357',
      a: s.amount,
      b: prevMap.get(s.categoryId) ?? 0,
    }))
  }, [txs, categories, monthKeyStr])

  return (
    <div className="max-w-ledger mx-auto px-5 md:px-10 py-8 md:py-12">
      <PageHeader
        num="Ⅳ · 统计"
        title="数据分析"
        subtitle="类目占比、趋势与对比"
      />

      {/* Month selector */}
      <div className="flex items-center gap-4 mb-8">
        <button className="btn-ghost p-1.5" onClick={() => shiftMonth(-1)}><ChevronLeft className="w-4 h-4" /></button>
        <span className="font-display text-xl text-ink min-w-[120px] text-center">{monthLabel(monthKeyStr)}</span>
        <button className="btn-ghost p-1.5" onClick={() => shiftMonth(1)}><ChevronRight className="w-4 h-4" /></button>
        {monthKeyStr !== currentMonthKey() && (
          <button className="btn-ghost text-xs" onClick={() => setMonthKeyStr(currentMonthKey())}>回到本月</button>
        )}
      </div>

      {/* Month summary strip */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card p-4">
          <div className="text-[10px] uppercase tracking-widest text-ink-faint">收入</div>
          <div className="num text-2xl text-income mt-1">+{formatMoney(summary.income)}</div>
        </div>
        <div className="card p-4">
          <div className="text-[10px] uppercase tracking-widest text-ink-faint">支出</div>
          <div className="num text-2xl text-expense mt-1">−{formatMoney(summary.expense)}</div>
        </div>
        <div className="card p-4">
          <div className="text-[10px] uppercase tracking-widest text-ink-faint">结余</div>
          <div className={`num text-2xl mt-1 ${summary.net >= 0 ? 'text-ink' : 'text-expense'}`}>{summary.net >= 0 ? '+' : '−'}{formatMoney(Math.abs(summary.net))}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Category breakdown */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <SectionLabel>类目占比</SectionLabel>
            <div className="flex border border-ink/15 rounded-[2px] overflow-hidden text-[11px]">
              <button className={`px-2 py-1 ${breakdownType === 'expense' ? 'bg-ink text-paper' : 'text-ink-muted'}`} onClick={() => setBreakdownType('expense')}>支出</button>
              <button className={`px-2 py-1 ${breakdownType === 'income' ? 'bg-ink text-paper' : 'text-ink-muted'}`} onClick={() => setBreakdownType('income')}>收入</button>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <DonutChart slices={slices} size={180} />
            <div className="flex-1 w-full space-y-2">
              {slices.slice(0, 6).map((s) => (
                <div key={s.categoryId} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.category?.color ?? '#6B6357' }} />
                  <span className="text-sm text-ink flex-1 truncate">{s.category?.name ?? '未分类'}</span>
                  <span className="num text-xs text-ink-muted">{s.percent.toFixed(1)}%</span>
                  <span className="num text-sm text-ink w-20 text-right">{formatMoney(s.amount)}</span>
                </div>
              ))}
              {slices.length === 0 && <div className="text-sm text-ink-faint text-center py-6">本月无数据</div>}
            </div>
          </div>
        </div>

        {/* Top merchants */}
        <div className="card p-6">
          <SectionLabel>支出 Top 商户</SectionLabel>
          {merchants.length > 0 ? (
            <HBars items={merchants} colorFn={(i) => categories[i]?.color ?? '#1C1917'} />
          ) : (
            <div className="text-sm text-ink-faint text-center py-10">本月无支出记录</div>
          )}
        </div>
      </div>

      {/* Trend */}
      <div className="card p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <SectionLabel>十二月趋势</SectionLabel>
          <div className="flex items-center gap-4 text-[11px] text-ink-muted">
            <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 bg-income rounded-full" />收入</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 bg-expense rounded-full" />支出</span>
          </div>
        </div>
        <TrendChart points={trendPoints} height={200} />
      </div>

      {/* Month comparison */}
      <div className="card p-6">
        <SectionLabel>与上月对比 <span className="text-ink-faint normal-case tracking-normal">（上 / 实色为当月，浅为上月）</span></SectionLabel>
        {compareRows.length > 0 ? (
          <CompareBars rows={compareRows} />
        ) : (
          <div className="text-sm text-ink-faint text-center py-10">无对比数据</div>
        )}
      </div>
    </div>
  )
}
