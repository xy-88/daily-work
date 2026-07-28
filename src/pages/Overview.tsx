import { Link } from 'react-router-dom'
import { ArrowUpRight, ArrowDownRight, Plus } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { PageHeader, StatCard, SectionLabel, Amount, CategoryTag } from '@/components/ui'
import { MiniBars, Heatmap } from '@/components/charts'
import { monthHeatmap, monthSummary, trend } from '@/lib/stats'
import { currentMonthKey, formatMoney, monthLabel } from '@/lib/format'
import { useMemo } from 'react'

export default function Overview() {
  const txs = useStore((s) => s.txs)
  const categories = useStore((s) => s.categories)

  const monthKeyStr = currentMonthKey()
  const summary = useMemo(() => monthSummary(txs, monthKeyStr), [txs, monthKeyStr])
  const prevKey = useMemo(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 1)
    return d.toISOString().slice(0, 7)
  }, [])
  const prevSummary = useMemo(() => monthSummary(txs, prevKey), [txs, prevKey])

  const trendPoints = useMemo(() => trend(txs, 6), [txs])
  const heat = useMemo(() => monthHeatmap(txs, monthKeyStr), [txs, monthKeyStr])
  const recent = useMemo(() => txs.slice(0, 8), [txs])

  const expenseDelta = prevSummary.expense > 0 ? ((summary.expense - prevSummary.expense) / prevSummary.expense) * 100 : 0
  const incomeDelta = prevSummary.income > 0 ? ((summary.income - prevSummary.income) / prevSummary.income) * 100 : 0

  return (
    <div className="max-w-ledger mx-auto px-5 md:px-10 py-8 md:py-12">
      <PageHeader
        num="Ⅰ · 概览"
        title="财务概览"
        subtitle={`${monthLabel(monthKeyStr)} · 共 ${summary.count} 笔记录`}
        action={
          <Link to="/ledger/import" className="btn-primary">
            <Plus className="w-4 h-4" strokeWidth={2} /> 导入账单
          </Link>
        }
      />

      {/* Net worth cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard
          label="本月收入"
          value={`+${formatMoney(summary.income)}`}
          tone="income"
          sub={
            <span className="inline-flex items-center gap-1">
              {incomeDelta >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              较上月 {Math.abs(incomeDelta).toFixed(1)}%
            </span>
          }
        />
        <StatCard
          label="本月支出"
          value={`−${formatMoney(summary.expense)}`}
          tone="expense"
          sub={
            <span className="inline-flex items-center gap-1">
              {expenseDelta >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              较上月 {Math.abs(expenseDelta).toFixed(1)}%
            </span>
          }
        />
        <StatCard
          label="本月结余"
          value={`${summary.net >= 0 ? '+' : '−'}${formatMoney(Math.abs(summary.net))}`}
          tone={summary.net >= 0 ? 'ink' : 'expense'}
          sub={`储蓄率 ${summary.income > 0 ? ((summary.net / summary.income) * 100).toFixed(0) : 0}%`}
        />
        <StatCard
          label="累计记账"
          value={txs.length}
          tone="gold"
          sub={`共 ${categories.length} 个类目`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {/* Recent transactions */}
        <div className="lg:col-span-2 card p-6">
          <SectionLabel>近期流水</SectionLabel>
          <div className="divide-y divide-ink/5">
            {recent.map((t) => {
              const cat = categories.find((c) => c.id === t.categoryId)
              return (
                <div key={t.id} className="flex items-center gap-3 py-3 group">
                  <span className="w-1 h-8 rounded-full shrink-0" style={{ background: cat?.color ?? '#6B6357' }} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-ink truncate">{t.counterparty || t.commodity}</span>
                      <CategoryTag category={cat} size="xs" />
                    </div>
                    <div className="text-[11px] text-ink-faint num">{t.date} {t.time ?? ''} · {t.method}</div>
                  </div>
                  <Amount value={t.amount} type={t.type} sign className="text-sm font-medium" />
                </div>
              )
            })}
            {recent.length === 0 && (
              <div className="py-10 text-center text-sm text-ink-faint">暂无记录，去导入账单开始记账吧</div>
            )}
          </div>
          <Link to="/ledger/entries" className="mt-4 inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink font-display italic">
            查看全部流水 →
          </Link>
        </div>

        {/* Monthly trend */}
        <div className="card p-6">
          <SectionLabel>六月趋势</SectionLabel>
          <MiniBars points={trendPoints} height={96} />
          <div className="flex items-center gap-4 mt-4 text-[11px] text-ink-muted">
            <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 bg-income/80 rounded-sm" />收入</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 bg-expense/80 rounded-sm" />支出</span>
          </div>
          <div className="rule my-5" />
          <SectionLabel>当月热力</SectionLabel>
          <Heatmap days={heat} />
        </div>
      </div>
    </div>
  )
}
