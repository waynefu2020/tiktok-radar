export interface FeishuConfig {
  appId: string
  appSecret: string
  wikiUrl: string
  autoSyncEnabled?: boolean
}

export async function getFeishuConfig(): Promise<{ appId: string; wikiUrl: string; configured: boolean; autoSyncEnabled: boolean }> {
  const res = await fetch('/api/feishu/config')
  if (!res.ok) throw new Error(`Load config failed: HTTP ${res.status}`)
  return res.json()
}

export async function saveFeishuConfig(config: FeishuConfig) {
  const res = await fetch('/api/feishu/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    throw new Error(err.error || 'Save config failed')
  }
  return res.json()
}

export async function getFeishuFields(): Promise<{ name: string; type: number; field_id: string }[]> {
  const res = await fetch('/api/feishu/fields')
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    throw new Error(err.error || 'Fetch fields failed')
  }
  const data = await res.json()
  return data.fields || []
}
