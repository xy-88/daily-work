import { useState } from 'react'
import { ChevronDown, Trash2, Check } from 'lucide-react'
import type { Category, Tx } from '@/lib/types'
import { Amount, CategoryTag } from './ui'
import { useStore } from '@/store/useStore'

export function TxItem({ tx, categories }: { tx: Tx; categories: Category[] }) {
  const [open, setOpen] = useState(false)
  const [catId, setCatId] = useState(tx.categoryId)
  const [note, setNote] = useState(tx.note ?? '')
  const updateTx = useStore((s) => s.updateTx)
  const deleteTx = useStore((s) => s.deleteTx)
  const cat = categories.find((c) => c.id === tx.categoryId)

  const save = async () => {
    await updateTx(tx.id, { categoryId: catId, note })
    setOpen(false)
  }

  return (
    <div className="border-b border-ink/5 last:border-0">
      <div className="flex items-center gap-3 py-3 group">
        <span className="w-1 h-9 rounded-full shrink-0" style={{ background: cat?.color ?? '#6B6357' }} />
        <button className="min-w-0 flex-1 flex flex-col items-start text-left" onClick={() => setOpen((v) => !v)}>
          <div className="flex items-center gap-2">
            <span className="text-sm text-ink truncate">{tx.counterparty || tx.commodity}</span>
            <CategoryTag category={cat} size="xs" />
          </div>
          <div className="text-[11px] text-ink-faint num">
            {tx.time ?? ''} · {tx.method} · {tx.platform === 'wechat' ? '微信' : tx.platform === 'alipay' ? '支付宝' : '手动'}
          </div>
          {tx.note && <div className="text-[11px] text-ink-muted italic mt-0.5">“{tx.note}”</div>}
        </button>
        <Amount value={tx.amount} type={tx.type} sign className="text-sm font-medium" />
        <ChevronDown className={`w-4 h-4 text-ink-faint transition-transform ${open ? 'rotate-180' : ''}`} />
      </div>

      {open && (
        <div className="pl-4 pr-2 pb-4 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-ink-faint">类目</label>
              <select className="field mt-1" value={catId} onChange={(e) => setCatId(e.target.value)}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-ink-faint">备注</label>
              <input className="field mt-1" value={note} onChange={(e) => setNote(e.target.value)} placeholder="添加备注" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-3">
            <button
              className="btn-ghost text-expense hover:bg-expense/10"
              onClick={async () => { await deleteTx(tx.id) }}
            >
              <Trash2 className="w-4 h-4" /> 删除
            </button>
            <button className="btn-primary" onClick={save}>
              <Check className="w-4 h-4" /> 保存
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
