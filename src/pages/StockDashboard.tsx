import { TrendingUp, Briefcase, Receipt, Bell, BarChart3 } from 'lucide-react'
import { PageHeader, SectionLabel } from '@/components/ui'

const FEATURES = [
  { icon: Briefcase, label: '持仓管理', desc: '查看持仓明细与成本' },
  { icon: Receipt, label: '交易记录', desc: '记录买卖与分红' },
  { icon: BarChart3, label: '收益分析', desc: '收益率与走势分析' },
  { icon: Bell, label: '行情提醒', desc: '自选股价格提醒' },
]

export default function StockDashboard() {
  return (
    <div className="max-w-ledger mx-auto px-5 md:px-10 py-8 md:py-12">
      <PageHeader
        num="Ⅰ · 总览"
        title="股票总览"
        subtitle="投资组合管理"
      />

      {/* Coming soon hero */}
      <div className="card p-10 mb-8 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center mb-6">
          <TrendingUp className="w-10 h-10 text-gold" strokeWidth={1.2} />
        </div>
        <h2 className="font-display text-2xl text-ink mb-2">即将上线</h2>
        <p className="text-sm text-ink-muted max-w-md">
          股票模块正在精心打造中，届时将支持持仓管理、交易记录、收益分析等完整功能。
        </p>
      </div>

      {/* Planned features */}
      <SectionLabel>规划功能</SectionLabel>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {FEATURES.map((f) => (
          <div
            key={f.label}
            className="card p-5 opacity-50 cursor-default select-none"
          >
            <f.icon className="w-6 h-6 text-ink-muted mb-3" strokeWidth={1.5} />
            <div className="text-sm font-medium text-ink mb-1">{f.label}</div>
            <div className="text-[11px] text-ink-faint">{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
