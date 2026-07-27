import { useMemo, useState } from 'react'
import { Upload, ClipboardPaste, Sparkles, Check, FileText, Wand2 } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { PageHeader, SectionLabel, Amount, CategoryTag } from '@/components/ui'
import { parseBillText, parseCSVFile } from '@/lib/parser'
import { classifyTx } from '@/lib/classify'
import type { ParsedTx, Platform } from '@/lib/types'

const SAMPLE_WECHAT = `微信支付账单明细
微信支付账单明细,,,,,,,
交易时间,交易类型,交易对方,商品,收/支,金额(元),支付方式,当前状态,交易单号,商户单号,备注
2026-07-28 12:30:00,商户消费,美团外卖,午餐黄焖鸡,支出,¥38.50,零钱,支付成功,4200,1188,
2026-07-28 09:15:00,商户消费,青桔骑行,共享单车月卡,支出,¥6.00,零钱,支付成功,4201,1189,
2026-07-27 20:42:00,商户消费,星巴克,拿铁大杯,支出,¥36.00,零钱,支付成功,4202,1190,
2026-07-27 18:00:00,转账,张三,AA晚餐退款,收入,¥128.00,零钱,支付成功,4203,1191,
2026-07-26 11:05:00,商户消费,滴滴出行,快车去公司,支出,¥24.80,零钱,支付成功,4204,1192,`

const SAMPLE_ALIPAY = `支付宝交易记录明细查询
--------------------------------------------------------------------------------
支付宝交易记录明细列表
交易号,商家订单号,交易创建时间,付款时间,最近修改时间,交易来源地,类型,交易对方,商品名称,金额（元）,收/支,交易状态,备注
20261,2266,2026-07-28 13:20:00,2026-07-28 13:20:00,2026-07-28 13:20:00,美团外卖,即时到账交易,美团外卖,麻辣香锅,42.00,支出,交易成功,
20261,2267,2026-07-28 10:00:00,2026-07-28 10:00:00,2026-07-28 10:00:00,某科技公司,转账,某科技公司,7月工资,15800.00,收入,交易成功,
20261,2268,2026-07-27 19:30:00,2026-07-27 19:30:00,2026-07-27 19:30:00,海底捞火锅,即时到账交易,海底捞火锅,双人套餐,268.00,支出,交易成功,
20261,2269,2026-07-27 15:20:00,2026-07-27 15:20:00,2026-07-27 15:20:00,屈臣氏,即时到账交易,屈臣氏,护肤套装,199.00,支出,交易成功,`

export default function Import() {
  const categories = useStore((s) => s.categories)
  const bulkImport = useStore((s) => s.bulkImportParsed)

  const [platform, setPlatform] = useState<'auto' | Platform>('auto')
  const [text, setText] = useState('')
  const [parsed, setParsed] = useState<ParsedTx[]>([])
  const [catOverrides, setCatOverrides] = useState<Record<number, string>>({})
  const [done, setDone] = useState<{ added: number } | null>(null)
  const [parsing, setParsing] = useState(false)

  const handleParse = (raw?: string) => {
    setParsing(true)
    const src = raw ?? text
    setTimeout(() => {
      const result = parseBillText(src, platform === 'auto' ? undefined : platform)
      setParsed(result)
      setCatOverrides({})
      setDone(null)
      setParsing(false)
    }, 200)
  }

  const handleFile = async (file: File) => {
    const result = await parseCSVFile(file, platform === 'auto' ? undefined : platform)
    setParsed(result)
    setCatOverrides({})
    setDone(null)
  }

  const effectiveParsed = useMemo(() => {
    return parsed.map((p, i) => ({
      ...p,
      categoryId: catOverrides[i] ?? p.categoryId ?? classifyTx(p, categories),
    }))
  }, [parsed, catOverrides, categories])

  const stats = useMemo(() => {
    const inc = effectiveParsed.filter((p) => p.type === 'income').reduce((s, p) => s + p.amount, 0)
    const exp = effectiveParsed.filter((p) => p.type === 'expense').reduce((s, p) => s + p.amount, 0)
    return { inc, exp, count: effectiveParsed.length }
  }, [effectiveParsed])

  const confirmImport = async () => {
    const n = await bulkImport(effectiveParsed)
    setDone({ added: n })
    setParsed([])
    setText('')
  }

  const loadSample = (which: 'wechat' | 'alipay') => {
    const sample = which === 'wechat' ? SAMPLE_WECHAT : SAMPLE_ALIPAY
    setText(sample)
    setPlatform(which)
    handleParse(sample)
  }

  return (
    <div className="max-w-ledger mx-auto px-5 md:px-10 py-8 md:py-12">
      <PageHeader
        num="Ⅲ · 导入"
        title="账单识别"
        subtitle="粘贴微信/支付宝账单文本，或上传 CSV，自动解析归类"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Input panel */}
        <div className="card p-6">
          <SectionLabel>输入来源</SectionLabel>

          <div className="flex gap-2 mb-4">
            <button
              className={`btn-outline flex-1 ${platform === 'auto' ? 'bg-ink text-paper' : ''}`}
              onClick={() => setPlatform('auto')}
            >自动识别</button>
            <button
              className={`btn-outline flex-1 ${platform === 'wechat' ? 'bg-ink text-paper' : ''}`}
              onClick={() => setPlatform('wechat')}
            >微信</button>
            <button
              className={`btn-outline flex-1 ${platform === 'alipay' ? 'bg-ink text-paper' : ''}`}
              onClick={() => setPlatform('alipay')}
            >支付宝</button>
          </div>

          <textarea
            className="field font-mono text-xs min-h-[200px] resize-y leading-relaxed"
            placeholder={'在此粘贴账单文本…\n支持微信/支付宝导出的账单明细（CSV 或制表符分隔）'}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <button className="btn-primary" onClick={() => handleParse()} disabled={!text.trim() || parsing}>
              <Sparkles className="w-4 h-4" /> {parsing ? '识别中…' : '开始识别'}
            </button>
            <label className="btn-outline cursor-pointer">
              <Upload className="w-4 h-4" /> 上传 CSV
              <input
                type="file"
                accept=".csv,.txt,text/csv,text/plain"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.currentTarget.value = '' }}
              />
            </label>
          </div>

          <div className="rule my-5" />
          <SectionLabel>没有账单？试试样例</SectionLabel>
          <div className="flex gap-2">
            <button className="btn-ghost text-xs" onClick={() => loadSample('wechat')}>
              <ClipboardPaste className="w-3.5 h-3.5" /> 微信样例
            </button>
            <button className="btn-ghost text-xs" onClick={() => loadSample('alipay')}>
              <ClipboardPaste className="w-3.5 h-3.5" /> 支付宝样例
            </button>
          </div>
        </div>

        {/* Stats / result panel */}
        <div className="card p-6">
          <SectionLabel>识别概览</SectionLabel>
          {done ? (
            <div className="py-10 text-center animate-fade-up">
              <div className="w-12 h-12 mx-auto rounded-full bg-income/10 flex items-center justify-center mb-3">
                <Check className="w-6 h-6 text-income" />
              </div>
              <div className="font-display text-2xl text-ink">已导入 {done.added} 笔</div>
              <p className="text-sm text-ink-muted mt-2">可在流水与统计页查看</p>
              <button className="btn-outline mt-5" onClick={() => setDone(null)}>继续导入</button>
            </div>
          ) : parsed.length === 0 ? (
            <div className="py-10 text-center">
              <FileText className="w-8 h-8 text-ink-faint mx-auto mb-3" strokeWidth={1.2} />
              <p className="text-sm text-ink-muted">识别结果将在此显示</p>
              <p className="text-[11px] text-ink-faint mt-1">支持金额、日期、商户、收/支类型与自动归类</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="border border-ink/10 rounded-[2px] p-3">
                  <div className="text-[10px] uppercase text-ink-faint">识别笔数</div>
                  <div className="num text-xl text-ink mt-1">{stats.count}</div>
                </div>
                <div className="border border-ink/10 rounded-[2px] p-3">
                  <div className="text-[10px] uppercase text-ink-faint">收入</div>
                  <div className="num text-xl text-income mt-1">+{stats.inc.toFixed(2)}</div>
                </div>
                <div className="border border-ink/10 rounded-[2px] p-3">
                  <div className="text-[10px] uppercase text-ink-faint">支出</div>
                  <div className="num text-xl text-expense mt-1">−{stats.exp.toFixed(2)}</div>
                </div>
              </div>
              <button className="btn-primary w-full" onClick={confirmImport}>
                <Wand2 className="w-4 h-4" /> 确认导入 {stats.count} 笔
              </button>
            </>
          )}
        </div>
      </div>

      {/* Preview table */}
      {effectiveParsed.length > 0 && !done && (
        <div className="card p-6 animate-fade-up">
          <SectionLabel>识别预览（可逐条修正类目）</SectionLabel>
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-ink-faint border-b border-ink/10">
                  <th className="py-2 px-2 font-normal">日期</th>
                  <th className="py-2 px-2 font-normal">商户 / 商品</th>
                  <th className="py-2 px-2 font-normal">类型</th>
                  <th className="py-2 px-2 font-normal text-right">金额</th>
                  <th className="py-2 px-2 font-normal">来源</th>
                  <th className="py-2 px-2 font-normal">归类</th>
                </tr>
              </thead>
              <tbody>
                {effectiveParsed.map((p, i) => (
                  <tr key={i} className="border-b border-ink/5 hover:bg-ink/[0.02]">
                    <td className="py-2.5 px-2 num text-xs text-ink-muted">{p.date}<br /><span className="text-ink-faint">{p.time}</span></td>
                    <td className="py-2.5 px-2">
                      <div className="text-ink">{p.counterparty}</div>
                      <div className="text-[11px] text-ink-faint">{p.commodity}</div>
                    </td>
                    <td className="py-2.5 px-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-[2px] ${p.type === 'income' ? 'bg-income/10 text-income' : 'bg-expense/10 text-expense'}`}>
                        {p.type === 'income' ? '收入' : '支出'}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      <Amount value={p.amount} type={p.type} sign className="font-medium" />
                    </td>
                    <td className="py-2.5 px-2 text-[11px] text-ink-muted">
                      {p.rawPlatform === 'wechat' ? '微信' : p.rawPlatform === 'alipay' ? '支付宝' : '手动'}
                    </td>
                    <td className="py-2.5 px-2">
                      <select
                        className="field py-1 text-xs min-w-[90px]"
                        value={p.categoryId ?? ''}
                        onChange={(e) => setCatOverrides((o) => ({ ...o, [i]: e.target.value }))}
                      >
                        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <CategoryTag category={categories.find((c) => c.id === p.categoryId)} size="xs" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-end">
            <button className="btn-primary" onClick={confirmImport}>
              <Check className="w-4 h-4" /> 确认导入全部
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
