import type { Category, SyncBundle, Tx } from './types'
import { bulkPutCategories, bulkPutTx, getMeta, getTx, listCategories, listTx, setMeta } from './db'
import type { AccountMeta } from './types'

/** 导出当前全部数据为同步串码（base64 编码的 JSON） */
export async function exportSyncBundle(): Promise<string> {
  const [txs, categories, account] = await Promise.all([
    listTx(),
    listCategories(),
    getMeta<AccountMeta>('account'),
  ])
  const bundle: SyncBundle = {
    from: account?.id ?? 'unknown',
    exportedAt: Date.now(),
    txs,
    categories,
  }
  const json = JSON.stringify(bundle)
  return 'LEDGER1:' + btoa(unescape(encodeURIComponent(json)))
}

/** 解析同步串码（不合并） */
export function decodeSyncBundle(token: string): SyncBundle {
  const raw = token.startsWith('LEDGER1:') ? token.slice(8) : token
  const json = decodeURIComponent(escape(atob(raw.trim())))
  return JSON.parse(json) as SyncBundle
}

/** 合并对端发来的同步串码：last-write-wins，按 updatedAt 比较 */
export async function mergeSyncBundle(token: string): Promise<{ added: number; updated: number; cats: number }> {
  const bundle = decodeSyncBundle(token)
  let added = 0
  let updated = 0

  // 合并交易
  for (const incoming of bundle.txs) {
    const existing = await getExistingTx(incoming.id)
    if (!existing) {
      added++
    } else if (incoming.updatedAt > existing.updatedAt) {
      updated++
    } else {
      continue // 本地更新，跳过
    }
    await bulkPutTx([incoming])
  }

  // 合并类目（直接覆盖，类目变更较少）
  await bulkPutCategories(bundle.categories)

  // 更新同步时间
  const account = await getMeta<AccountMeta>('account')
  if (account) {
    account.lastSyncAt = Date.now()
    await setMeta('account', account)
  }

  return { added, updated, cats: bundle.categories.length }
}

async function getExistingTx(id: string): Promise<Tx | undefined> {
  return getTx(id)
}

/** 校验串码是否合法 */
export function isValidBundle(token: string): boolean {
  try {
    decodeSyncBundle(token)
    return true
  } catch {
    return false
  }
}

/** 配对同步令牌：将本端 account.syncToken 设为对端令牌，建立配对 */
export async function pairWithToken(token: string): Promise<void> {
  const account = await getMeta<AccountMeta>('account')
  if (account) {
    account.syncToken = token
    await setMeta('account', account)
  }
}

/** 全量导出为可下载 JSON（备份） */
export async function exportBackupJSON(): Promise<string> {
  const [txs, categories, account, prefs] = await Promise.all([
    listTx(),
    listCategories(),
    getMeta<AccountMeta>('account'),
    getMeta('prefs'),
  ])
  return JSON.stringify({ txs, categories, account, prefs, exportedAt: Date.now() }, null, 2)
}

/** 从备份 JSON 恢复（全量覆盖） */
export async function importBackupJSON(json: string): Promise<void> {
  const data = JSON.parse(json)
  if (Array.isArray(data.categories)) await bulkPutCategories(data.categories as Category[])
  if (Array.isArray(data.txs)) await bulkPutTx(data.txs as Tx[])
  if (data.account) await setMeta('account', data.account)
  if (data.prefs) await setMeta('prefs', data.prefs)
}
