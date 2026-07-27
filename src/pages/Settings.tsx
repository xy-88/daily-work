import { useState } from 'react'
import { Copy, Check, Download, Upload, RefreshCw, Plus, Trash2, Pencil, Link2, ArrowLeftRight } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { PageHeader, SectionLabel } from '@/components/ui'
import { exportBackupJSON, importBackupJSON, exportSyncBundle, mergeSyncBundle, isValidBundle, pairWithToken } from '@/lib/sync'
import { clearAll } from '@/lib/db'
import type { Category } from '@/lib/types'

export default function Settings() {
  const account = useStore((s) => s.account)
  const categories = useStore((s) => s.categories)
  const txs = useStore((s) => s.txs)
  const upsertCategory = useStore((s) => s.upsertCategory)
  const deleteCategory = useStore((s) => s.deleteCategory)
  const setAccount = useStore((s) => s.setAccount)
  const reload = useStore((s) => s.reload)

  const [copied, setCopied] = useState(false)
  const [bundleOut, setBundleOut] = useState('')
  const [bundleIn, setBundleIn] = useState('')
  const [syncMsg, setSyncMsg] = useState('')
  const [pairToken, setPairToken] = useState('')

  const [editing, setEditing] = useState<Category | null>(null)
  const [newCat, setNewCat] = useState({ name: '', color: '#1C1917', keywords: '', type: 'expense' as Category['type'] })

  const copyToken = async () => {
    if (!account) return
    await navigator.clipboard.writeText(account.syncToken)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const genBundle = async () => {
    const b = await exportSyncBundle()
    setBundleOut(b)
  }

  const doMerge = async () => {
    if (!isValidBundle(bundleIn)) {
      setSyncMsg('✗ 串码格式无效')
      return
    }
    try {
      const r = await mergeSyncBundle(bundleIn)
      setSyncMsg(`✓ 同步完成：新增 ${r.added}，更新 ${r.updated}，类目 ${r.cats}`)
      await reload()
    } catch {
      setSyncMsg('✗ 合并失败')
    }
  }

  const doPair = async () => {
    if (!account || !pairToken.trim()) return
    await pairWithToken(pairToken.trim())
    await reload()
    setPairToken('')
    setSyncMsg('✓ 已配对同步令牌')
  }

  const downloadBackup = async () => {
    const json = await exportBackupJSON()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ledger-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const restoreBackup = async (file: File) => {
    const text = await file.text()
    await importBackupJSON(text)
    await reload()
    setSyncMsg('✓ 已从备份恢复')
  }

  const resetAll = async () => {
    if (!confirm('确定清空全部数据？此操作不可恢复。')) return
    await clearAll()
    await reload()
  }

  const saveCategory = async () => {
    if (!editing) return
    await upsertCategory({
      ...editing,
      keywords: editing.keywords.filter(Boolean),
    })
    setEditing(null)
  }

  const addCategory = async () => {
    if (!newCat.name) return
    const id = `cat_${Date.now().toString(36)}`
    await upsertCategory({
      id,
      name: newCat.name,
      color: newCat.color,
      type: newCat.type,
      keywords: newCat.keywords.split(/[,，\s]+/).filter(Boolean),
      sortOrder: categories.length + 1,
    })
    setNewCat({ name: '', color: '#1C1917', keywords: '', type: 'expense' })
  }

  return (
    <div className="max-w-ledger mx-auto px-5 md:px-10 py-8 md:py-12">
      <PageHeader num="Ⅴ · 设置" title="账簿设置" subtitle="账户、同步、类目与备份" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account */}
        <div className="card p-6">
          <SectionLabel>账户</SectionLabel>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-ink-faint">账簿名称</label>
              <input
                className="field mt-1"
                value={account?.name ?? ''}
                onChange={(e) => account && setAccount({ ...account, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-ink-faint">同步令牌</label>
              <div className="flex gap-2 mt-1">
                <input className="field num text-xs" readOnly value={account?.syncToken ?? ''} />
                <button className="btn-outline shrink-0" onClick={copyToken}>
                  {copied ? <Check className="w-4 h-4 text-income" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-ink-faint mt-1">在新设备输入此令牌完成配对</p>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-ink-faint">配对令牌</label>
              <div className="flex gap-2 mt-1">
                <input className="field text-xs" placeholder="粘贴对端令牌…" value={pairToken} onChange={(e) => setPairToken(e.target.value)} />
                <button className="btn-outline shrink-0" onClick={doPair} disabled={!pairToken.trim()}>
                  <Link2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sync */}
        <div className="card p-6">
          <SectionLabel>多端同步</SectionLabel>
          <p className="text-[11px] text-ink-muted mb-3">导出同步串码 → 在另一台设备粘贴合并。按时间戳合并（后写覆盖）。</p>
          <div className="flex gap-2 mb-3">
            <button className="btn-outline flex-1" onClick={genBundle}>
              <ArrowLeftRight className="w-4 h-4" /> 生成同步串码
            </button>
          </div>
          {bundleOut && (
            <textarea readOnly className="field font-mono text-[10px] min-h-[80px] resize-none mt-2" value={bundleOut} />
          )}
          <div className="rule my-4" />
          <label className="text-[10px] uppercase tracking-widest text-ink-faint">导入同步串码</label>
          <textarea
            className="field font-mono text-[10px] min-h-[80px] resize-none mt-1"
            placeholder="粘贴对端生成的同步串码…"
            value={bundleIn}
            onChange={(e) => setBundleIn(e.target.value)}
          />
          <button className="btn-primary w-full mt-2" onClick={doMerge} disabled={!bundleIn.trim()}>
            <RefreshCw className="w-4 h-4" /> 合并到本端
          </button>
          {syncMsg && <div className="text-xs text-ink-muted mt-2 animate-fade-in">{syncMsg}</div>}
          {account && account.lastSyncAt > 0 && (
            <div className="text-[11px] text-ink-faint mt-2 num">最近同步：{new Date(account.lastSyncAt).toLocaleString('zh-CN')}</div>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="card p-6 mt-6">
        <SectionLabel>类目管理（{categories.length}）</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
          {categories.map((c) => (
            <div key={c.id} className="border border-ink/10 rounded-[2px] p-3 flex items-center gap-3 group">
              <span className="w-3 h-3 rounded-full shrink-0" style={{ background: c.color }} />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-ink flex items-center gap-2">
                  {c.name}
                  <span className="text-[9px] uppercase text-ink-faint border border-ink/15 px-1 rounded-[2px]">{c.type}</span>
                </div>
                <div className="text-[11px] text-ink-faint truncate">{c.keywords.join(' · ') || '无关键词'}</div>
              </div>
              <button className="btn-ghost p-1.5" onClick={() => setEditing({ ...c })}><Pencil className="w-3.5 h-3.5" /></button>
              <button className="btn-ghost p-1.5 text-expense" onClick={() => deleteCategory(c.id)}><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>

        {editing && (
          <div className="border border-gold/30 bg-gold/5 rounded-[2px] p-4 mb-5 animate-fade-up">
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_80px_120px] gap-3">
              <div>
                <label className="text-[10px] uppercase text-ink-faint">名称</label>
                <input className="field mt-1" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div>
                <label className="text-[10px] uppercase text-ink-faint">颜色</label>
                <input type="color" className="w-full h-9 mt-1 border border-ink/15 rounded-[2px] bg-transparent" value={editing.color} onChange={(e) => setEditing({ ...editing, color: e.target.value })} />
              </div>
              <div>
                <label className="text-[10px] uppercase text-ink-faint">类型</label>
                <select className="field mt-1" value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value as Category['type'] })}>
                  <option value="expense">支出</option>
                  <option value="income">收入</option>
                  <option value="both">收支</option>
                </select>
              </div>
            </div>
            <div className="mt-3">
              <label className="text-[10px] uppercase text-ink-faint">关键词（逗号分隔）</label>
              <input className="field mt-1" value={editing.keywords.join(', ')} onChange={(e) => setEditing({ ...editing, keywords: e.target.value.split(/[,，]/).map((s) => s.trim()).filter(Boolean) })} />
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <button className="btn-ghost" onClick={() => setEditing(null)}>取消</button>
              <button className="btn-primary" onClick={saveCategory}>保存</button>
            </div>
          </div>
        )}

        {/* New category */}
        <div className="border border-dashed border-ink/15 rounded-[2px] p-4">
          <div className="text-xs text-ink-muted mb-3 flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> 新增类目</div>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_80px_120px_1fr_auto] gap-3 items-end">
            <div>
              <label className="text-[10px] uppercase text-ink-faint">名称</label>
              <input className="field mt-1" value={newCat.name} onChange={(e) => setNewCat({ ...newCat, name: e.target.value })} />
            </div>
            <div>
              <label className="text-[10px] uppercase text-ink-faint">颜色</label>
              <input type="color" className="w-full h-9 mt-1 border border-ink/15 rounded-[2px] bg-transparent" value={newCat.color} onChange={(e) => setNewCat({ ...newCat, color: e.target.value })} />
            </div>
            <div>
              <label className="text-[10px] uppercase text-ink-faint">类型</label>
              <select className="field mt-1" value={newCat.type} onChange={(e) => setNewCat({ ...newCat, type: e.target.value as Category['type'] })}>
                <option value="expense">支出</option>
                <option value="income">收入</option>
                <option value="both">收支</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase text-ink-faint">关键词</label>
              <input className="field mt-1" placeholder="美团, 饿了么" value={newCat.keywords} onChange={(e) => setNewCat({ ...newCat, keywords: e.target.value })} />
            </div>
            <button className="btn-primary" onClick={addCategory}>添加</button>
          </div>
        </div>
      </div>

      {/* Backup */}
      <div className="card p-6 mt-6">
        <SectionLabel>数据备份</SectionLabel>
        <div className="flex flex-wrap gap-3">
          <button className="btn-outline" onClick={downloadBackup}>
            <Download className="w-4 h-4" /> 导出 JSON 备份
          </button>
          <label className="btn-outline cursor-pointer">
            <Upload className="w-4 h-4" /> 从备份恢复
            <input type="file" accept=".json,application/json" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) restoreBackup(f); e.currentTarget.value = '' }} />
          </label>
          <button className="btn-ghost text-expense" onClick={resetAll}>
            <Trash2 className="w-4 h-4" /> 清空全部数据
          </button>
        </div>
        <div className="text-[11px] text-ink-faint mt-3 num">
          当前共 {txs.length} 笔交易 · {categories.length} 个类目
        </div>
        {syncMsg && <div className="text-xs text-ink-muted mt-2">{syncMsg}</div>}
      </div>
    </div>
  )
}
