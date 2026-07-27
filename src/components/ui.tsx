import type { ReactNode } from 'react'
import type { Category } from '@/lib/types'
import { formatMoney } from '@/lib/format'

export function PageHeader({ num, title, subtitle, action }: { num: string; title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-8 flex-wrap">
      <div>
        <div className="font-display italic text-sm text-gold tracking-widest mb-1">§ {num}</div>
        <h1 className="font-display text-3xl md:text-4xl tracking-tightest text-ink leading-none">{title}</h1>
        {subtitle && <p className="text-sm text-ink-muted mt-2">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function Amount({ value, type, sign = false, className = '' }: { value: number; type: 'income' | 'expense'; sign?: boolean; className?: string }) {
  const color = type === 'income' ? 'text-income' : 'text-expense'
  const prefix = sign ? (type === 'income' ? '+' : '−') : ''
  return <span className={`num ${color} ${className}`}>{prefix}{formatMoney(Math.abs(value))}</span>
}

export function CategoryTag({ category, size = 'sm' }: { category: Category | undefined; size?: 'sm' | 'xs' }) {
  if (!category) return <span className="chip">未分类</span>
  const sz = size === 'xs' ? 'text-[10px] px-1.5 py-0' : 'text-[11px]'
  return (
    <span className={`inline-flex items-center gap-1.5 ${sz} font-medium border border-ink/15 rounded-[2px] bg-paper-50`}
      style={{ borderLeft: `2px solid ${category.color}`, paddingLeft: 6 }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: category.color }} />
      {category.name}
    </span>
  )
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="font-display italic text-xs text-ink-muted tracking-widest uppercase">{children}</span>
      <span className="flex-1 h-px bg-ink/10" />
    </div>
  )
}

export function StatCard({ label, value, sub, tone = 'ink' }: { label: string; value: ReactNode; sub?: ReactNode; tone?: 'ink' | 'income' | 'expense' | 'gold' }) {
  const toneClass = {
    ink: 'text-ink',
    income: 'text-income',
    expense: 'text-expense',
    gold: 'text-gold',
  }[tone]
  return (
    <div className="card p-5">
      <div className="text-[10px] uppercase tracking-widest text-ink-faint mb-2">{label}</div>
      <div className={`num text-2xl md:text-3xl font-medium ${toneClass}`}>{value}</div>
      {sub && <div className="text-[11px] text-ink-muted mt-2">{sub}</div>}
    </div>
  )
}
