import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { LayoutDashboard, ListOrdered, ScanLine, BarChart3, Settings as SettingsIcon, BookOpen } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { formatMoney } from '@/lib/format'
import { monthSummary } from '@/lib/stats'
import { currentMonthKey } from '@/lib/format'

const NAV = [
  { to: '/', label: '概览', num: 'Ⅰ', icon: LayoutDashboard, end: true },
  { to: '/entries', label: '流水', num: 'Ⅱ', icon: ListOrdered, end: false },
  { to: '/import', label: '导入', num: 'Ⅲ', icon: ScanLine, end: false },
  { to: '/analytics', label: '统计', num: 'Ⅳ', icon: BarChart3, end: false },
  { to: '/settings', label: '设置', num: 'Ⅴ', icon: SettingsIcon, end: false },
]

export default function Layout() {
  const account = useStore((s) => s.account)
  const txs = useStore((s) => s.txs)
  const location = useLocation()

  const monthKeyStr = currentMonthKey()
  const summary = monthSummary(txs, monthKeyStr)

  return (
    <div className="min-h-screen flex relative z-10">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-ink/10 bg-paper-50/60 backdrop-blur-sm sticky top-0 h-screen">
        <div className="px-6 pt-7 pb-5">
          <div className="flex items-baseline gap-2">
            <BookOpen className="w-4 h-4 text-gold" strokeWidth={1.5} />
            <span className="font-display text-2xl tracking-tightest text-ink">账簿</span>
          </div>
          <div className="font-display italic text-[11px] text-ink-faint mt-0.5 tracking-widest">LEDGER · MMXXVI</div>
        </div>

        <div className="px-4">
          <div className="rule" />
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
            >
              <span className="font-display italic text-xs text-ink-faint w-4 text-center">§{item.num}</span>
              <item.icon className="w-4 h-4" strokeWidth={1.5} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-ink/10">
          <div className="text-[10px] uppercase tracking-widest text-ink-faint mb-1">本月结余</div>
          <div className={`num text-lg font-medium ${summary.net >= 0 ? 'text-income' : 'text-expense'}`}>
            {summary.net >= 0 ? '+' : '−'}{formatMoney(Math.abs(summary.net))}
          </div>
          <div className="text-[11px] text-ink-muted mt-2 truncate">{account?.name ?? '我的账簿'}</div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center justify-between px-5 py-3 border-b border-ink/10 bg-paper-50/80 backdrop-blur sticky top-0 z-20">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-xl text-ink">账簿</span>
            <span className="font-display italic text-[10px] text-ink-faint">LEDGER</span>
          </div>
          <span className="num text-sm text-ink-muted">
            {summary.net >= 0 ? '+' : '−'}{formatMoney(Math.abs(summary.net))}
          </span>
        </header>

        <div key={location.pathname} className="animate-fade-in">
          <Outlet />
        </div>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 flex border-t border-ink/15 bg-paper-50/95 backdrop-blur">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] ${isActive ? 'text-ink' : 'text-ink-faint'}`
              }
            >
              <item.icon className="w-5 h-5" strokeWidth={1.5} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="lg:hidden h-14" />
      </main>
    </div>
  )
}
