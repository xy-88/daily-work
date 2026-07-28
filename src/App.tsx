import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import Layout from '@/components/Layout'
import Overview from '@/pages/Overview'
import Entries from '@/pages/Entries'
import Import from '@/pages/Import'
import Analytics from '@/pages/Analytics'
import Settings from '@/pages/Settings'
import StockDashboard from '@/pages/StockDashboard'

export default function App() {
  const ready = useStore((s) => s.ready)
  const init = useStore((s) => s.init)

  useEffect(() => {
    init()
  }, [init])

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="text-center">
          <div className="font-display italic text-2xl text-ink mb-3">账簿</div>
          <div className="flex gap-1 justify-center">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className="w-1 h-1 bg-ink/40 rounded-full animate-fade-in"
                style={{ animationDelay: `${i * 120}ms` }}
              />
            ))}
          </div>
          <div className="text-[11px] text-ink-faint mt-3 tracking-widest uppercase">Loading Ledger</div>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Ledger module */}
        <Route path="/ledger" element={<Overview />} />
        <Route path="/ledger/entries" element={<Entries />} />
        <Route path="/ledger/import" element={<Import />} />
        <Route path="/ledger/analytics" element={<Analytics />} />
        <Route path="/ledger/settings" element={<Settings />} />

        {/* Stock module */}
        <Route path="/stock" element={<StockDashboard />} />
      </Route>

      {/* Redirects */}
      <Route path="/" element={<Navigate to="/ledger" replace />} />
      <Route path="/entries" element={<Navigate to="/ledger/entries" replace />} />
      <Route path="/import" element={<Navigate to="/ledger/import" replace />} />
      <Route path="/analytics" element={<Navigate to="/ledger/analytics" replace />} />
      <Route path="/settings" element={<Navigate to="/ledger/settings" replace />} />
      <Route path="*" element={<Navigate to="/ledger" replace />} />
    </Routes>
  )
}
