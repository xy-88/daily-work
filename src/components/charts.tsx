import { useMemo } from 'react'
import type { CategorySlice, DayHeat, TrendPoint } from '@/lib/stats'
import { formatCompact, formatMoney, shortMonthLabel } from '@/lib/format'

/* ---------- Donut ---------- */
export function DonutChart({ slices, size = 200 }: { slices: CategorySlice[]; size?: number }) {
  const total = slices.reduce((s, x) => s + x.amount, 0)
  const r = size / 2 - 14
  const c = 2 * Math.PI * r
  let offset = 0
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(28,25,23,0.06)" strokeWidth={14} />
        {slices.map((s, i) => {
          const frac = total > 0 ? s.amount / total : 0
          const len = frac * c
          const seg = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={(s.category?.color ?? '#6B6357')}
              strokeWidth={14}
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
              style={{ transition: 'stroke-dasharray 0.8s ease' }}
            />
          )
          offset += len
          return seg
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-[10px] uppercase tracking-widest text-ink-faint">合计</div>
        <div className="num text-xl font-medium text-ink">{formatMoney(total)}</div>
      </div>
    </div>
  )
}

/* ---------- Trend line (income vs expense) ---------- */
export function TrendChart({ points, height = 180 }: { points: TrendPoint[]; height?: number }) {
  const w = 600
  const pad = { l: 8, r: 8, t: 16, b: 24 }
  const max = Math.max(...points.map((p) => Math.max(p.income, p.expense)), 1)
  const innerW = w - pad.l - pad.r
  const innerH = height - pad.t - pad.b
  const x = (i: number) => pad.l + (i / Math.max(points.length - 1, 1)) * innerW
  const y = (v: number) => pad.t + innerH - (v / max) * innerH

  const path = (key: 'income' | 'expense') =>
    points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(p[key])}`).join(' ')
  const area = (key: 'income' | 'expense') =>
    `${path(key)} L${x(points.length - 1)},${pad.t + innerH} L${x(0)},${pad.t + innerH} Z`

  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" preserveAspectRatio="none" style={{ height }}>
      <defs>
        <linearGradient id="gInc" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2F5D3A" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#2F5D3A" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9B2C2C" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#9B2C2C" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map((g) => (
        <line key={g} x1={pad.l} x2={w - pad.r} y1={pad.t + innerH * (1 - g)} y2={pad.t + innerH * (1 - g)} stroke="rgba(28,25,23,0.06)" strokeWidth={1} />
      ))}
      <path d={area('expense')} fill="url(#gExp)" />
      <path d={area('income')} fill="url(#gInc)" />
      <path d={path('expense')} fill="none" stroke="#9B2C2C" strokeWidth={1.5} />
      <path d={path('income')} fill="none" stroke="#2F5D3A" strokeWidth={1.5} />
      {points.map((p, i) => (
        <g key={p.key}>
          <circle cx={x(i)} cy={y(p.expense)} r={2.5} fill="#9B2C2C" />
          <circle cx={x(i)} cy={y(p.income)} r={2.5} fill="#2F5D3A" />
          <text x={x(i)} y={height - 6} textAnchor="middle" className="fill-ink-faint" fontSize={9} fontFamily="JetBrains Mono">
            {shortMonthLabel(p.key)}
          </text>
        </g>
      ))}
    </svg>
  )
}

/* ---------- Mini bar (monthly overview) ---------- */
export function MiniBars({ points, height = 70 }: { points: TrendPoint[]; height?: number }) {
  const max = Math.max(...points.map((p) => Math.max(p.income, p.expense)), 1)
  return (
    <div className="flex items-end gap-1.5" style={{ height }}>
      {points.map((p) => (
        <div key={p.key} className="flex-1 flex flex-col items-center gap-1 group">
          <div className="flex items-end gap-0.5 w-full justify-center" style={{ height: height - 14 }}>
            <div
              className="w-1.5 bg-income/80 rounded-t-[1px] origin-bottom animate-grow-y"
              style={{ height: `${(p.income / max) * 100}%`, animationDelay: '0.1s' }}
              title={`收入 ${formatMoney(p.income)}`}
            />
            <div
              className="w-1.5 bg-expense/80 rounded-t-[1px] origin-bottom animate-grow-y"
              style={{ height: `${(p.expense / max) * 100}%`, animationDelay: '0.2s' }}
              title={`支出 ${formatMoney(p.expense)}`}
            />
          </div>
          <span className="text-[9px] text-ink-faint num">{shortMonthLabel(p.key)}</span>
        </div>
      ))}
    </div>
  )
}

/* ---------- Heatmap (month daily) ---------- */
export function Heatmap({ days }: { days: DayHeat[] }) {
  // 按周排列：从当月1号的星期开始
  const firstDow = new Date(days[0].date + 'T00:00:00').getDay()
  const cells: (DayHeat | null)[] = [...Array(firstDow).fill(null), ...days]
  const weekLabels = ['日', '一', '二', '三', '四', '五', '六']
  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekLabels.map((w) => (
          <div key={w} className="text-[9px] text-ink-faint text-center">{w}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => (
          <div
            key={i}
            className="aspect-square rounded-[2px] flex items-center justify-center text-[9px] num group relative"
            style={{
              background: d ? `rgba(155,44,44,${0.08 + d.intensity * 0.85})` : 'transparent',
              color: d && d.intensity > 0.5 ? '#FBF8F1' : '#6B6357',
            }}
            title={d ? `${d.date} · ${formatMoney(d.amount)}` : ''}
          >
            {d?.day}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------- Horizontal bars (category / merchant) ---------- */
export function HBars({ items, colorFn }: { items: { name: string; amount: number; count?: number }[]; colorFn?: (i: number) => string }) {
  const max = Math.max(...items.map((i) => i.amount), 1)
  return (
    <div className="space-y-2.5">
      {items.map((it, i) => (
        <div key={it.name} className="group">
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-sm text-ink truncate pr-2">{it.name}</span>
            <span className="num text-sm text-ink-muted shrink-0">{formatMoney(it.amount)}</span>
          </div>
          <div className="h-1.5 bg-ink/5 rounded-[1px] overflow-hidden">
            <div
              className="h-full rounded-[1px] origin-left animate-grow-y"
              style={{
                width: `${(it.amount / max) * 100}%`,
                background: colorFn ? colorFn(i) : '#1C1917',
                transformOrigin: 'left',
                animationName: 'fadeIn',
                animationDuration: '0.6s',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

/* ---------- Compare bars (month vs last month by category) ---------- */
export function CompareBars({ rows }: { rows: { name: string; color: string; a: number; b: number }[] }) {
  const max = useMemo(() => Math.max(...rows.flatMap((r) => [r.a, r.b]), 1), [rows])
  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.name} className="grid grid-cols-[80px_1fr_auto] items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-ink">
            <span className="w-2 h-2 rounded-full" style={{ background: r.color }} />
            {r.name}
          </div>
          <div className="flex flex-col gap-1">
            <div className="h-2 bg-ink/5 rounded-[1px] overflow-hidden">
              <div className="h-full rounded-[1px]" style={{ width: `${(r.a / max) * 100}%`, background: r.color }} />
            </div>
            <div className="h-2 bg-ink/5 rounded-[1px] overflow-hidden">
              <div className="h-full rounded-[1px] opacity-50" style={{ width: `${(r.b / max) * 100}%`, background: r.color }} />
            </div>
          </div>
          <div className="num text-xs text-ink-muted text-right w-20">
            {formatCompact(r.a)}
            <span className="text-ink-faint"> / {formatCompact(r.b)}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
