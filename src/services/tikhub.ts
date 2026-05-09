import { Video, AppId, Creator, ScriptBreakdown, AppConfig } from '../types'
import { authHeaders } from './auth'

function apiFetch(url: string, init?: RequestInit) {
  return fetch(url, {
    ...init,
    headers: {
      ...authHeaders(),
      ...(init?.headers || {}),
    },
  })
}

export interface VideoCache {
  videos: Video[]
  syncedAt: string
}

export interface VideoScriptDraft {
  script?: string
  hookType?: Video['hookType']
  transcriptText?: string
  transcriptStatus?: Video['transcriptStatus']
  breakdown?: ScriptBreakdown | null
  aiStatus?: Video['aiStatus']
  analysisSource?: Video['analysisSource']
  inferredFrom?: string
}

export interface SyncResult {
  appId: AppId
  total: number
  videos: Video[]
  errors?: { keyword: string; error: string }[]
}

export interface BatchSyncResult {
  total: number
  byApp: Record<AppId, number>
  videos: Video[]
  errors?: { appId: string; error: string }[]
}

export type MonitoredCreator = Creator & { source: 'local'; updatedAt: string }
export interface HiddenCreator {
  username: string
  hiddenAt: string
}

export interface HealthStatus {
  ok: boolean
  keyConfigured: boolean
  aiConfigured?: boolean
  asrAvailable?: boolean
  tools?: {
    ytDlpAvailable?: boolean
    ffmpegAvailable?: boolean
  }
}

export async function getApps(): Promise<AppConfig[]> {
  const res = await apiFetch('/api/apps')
  if (!res.ok) throw new Error(`Load apps failed: HTTP ${res.status}`)
  const data = await res.json()
  return data.apps || []
}

export async function createApp(app: {
  id: string
  name: string
  color: string
  bgColor: string
  borderColor: string
  keywords: string[]
}): Promise<AppConfig> {
  const res = await apiFetch('/api/apps', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(app),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    throw new Error(err.error || 'Create app failed')
  }
  const data = await res.json()
  return data.app
}

export async function removeApp(id: string): Promise<void> {
  const res = await apiFetch(`/api/apps/${encodeURIComponent(id)}`, { method: 'DELETE' })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    throw new Error(err.error || 'Delete app failed')
  }
}

function videoTime(video: Video) {
  const time = new Date(video.publishedAt).getTime()
  return Number.isFinite(time) ? time : 0
}

export function sortVideosByNewest(videos: Video[]): Video[] {
  return [...videos].sort((a, b) => videoTime(b) - videoTime(a))
}

function syncedAtFromMeta(meta: any): string {
  return meta?.last_sync_at?.value || new Date().toISOString()
}

export async function getStoredVideos(): Promise<VideoCache> {
  const res = await apiFetch('/api/videos')
  if (!res.ok) throw new Error(`Load videos failed: HTTP ${res.status}`)
  const data = await res.json()
  return {
    videos: sortVideosByNewest(data.videos || []),
    syncedAt: syncedAtFromMeta(data.meta),
  }
}

export async function syncApp(appId: AppId, count = 20): Promise<SyncResult> {
  const res = await apiFetch(`/api/sync/${appId}?count=${count}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    throw new Error(err.error || `Sync failed for ${appId}`)
  }
  const data = await res.json()
  return { ...data, videos: sortVideosByNewest(data.videos || []) }
}

export async function syncAll(): Promise<BatchSyncResult> {
  const res = await apiFetch('/api/sync')
  if (!res.ok) {
    throw new Error(`Batch sync failed: HTTP ${res.status}`)
  }
  const data = await res.json()
  return { ...data, videos: sortVideosByNewest(data.videos || []) }
}

export async function syncAndCacheVideos(): Promise<VideoCache> {
  const result = await syncAll()
  return { videos: sortVideosByNewest(result.videos), syncedAt: new Date().toISOString() }
}

export async function loadVideoScripts(): Promise<Record<string, VideoScriptDraft>> {
  const res = await apiFetch('/api/video-scripts')
  if (!res.ok) throw new Error(`Load scripts failed: HTTP ${res.status}`)
  const data = await res.json()
  const entries = (data.scripts || []).map((row: any) => [
    row.video_id || row.videoId,
    {
      script: row.script || '',
      hookType: row.hook_type || row.hookType || undefined,
      transcriptText: row.transcript_text || row.transcriptText || '',
      transcriptStatus: row.transcript_status || row.transcriptStatus || undefined,
      breakdown: row.breakdown_json ? JSON.parse(row.breakdown_json) : row.breakdown || null,
      aiStatus: row.ai_status || row.aiStatus || undefined,
      analysisSource: row.analysis_source || row.analysisSource || undefined,
      inferredFrom: row.inferred_from || row.inferredFrom || '',
    },
  ])
  return Object.fromEntries(entries)
}

export async function saveVideoScript(videoId: string, draft: VideoScriptDraft) {
  const res = await apiFetch(`/api/video-scripts/${encodeURIComponent(videoId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(draft),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    throw new Error(err.error || 'Save script failed')
  }
  return res.json()
}

export async function applySavedScripts(videos: Video[]): Promise<Video[]> {
  const scripts = await loadVideoScripts()
  return videos.map(video => {
    const draft = scripts[video.id]
    if (!draft) return video
    return {
      ...video,
      script: draft.script,
      hookType: draft.hookType,
      transcriptText: draft.transcriptText,
      transcriptStatus: draft.transcriptStatus,
      breakdown: draft.breakdown,
      aiStatus: draft.aiStatus,
      analysisSource: draft.analysisSource,
      inferredFrom: draft.inferredFrom,
    }
  })
}

export async function analyzeVideoScript(videoId: string): Promise<Video> {
  const res = await apiFetch(`/api/videos/${encodeURIComponent(videoId)}/analyze-script`, { method: 'POST' })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    throw new Error(err.error || 'Analyze script failed')
  }
  const data = await res.json()
  return data.video
}

export async function getMonitoredCreators(): Promise<MonitoredCreator[]> {
  const res = await apiFetch('/api/monitored-creators')
  if (!res.ok) throw new Error(`Load monitored creators failed: HTTP ${res.status}`)
  const data = await res.json()
  return data.creators || []
}

export async function getHiddenCreators(): Promise<HiddenCreator[]> {
  const res = await apiFetch('/api/hidden-creators')
  if (!res.ok) throw new Error(`Load hidden creators failed: HTTP ${res.status}`)
  const data = await res.json()
  return data.creators || []
}

export async function saveMonitoredCreator(username: string, apps: AppId[]): Promise<MonitoredCreator> {
  const res = await apiFetch('/api/monitored-creators', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, apps }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    throw new Error(err.error || 'Save monitored creator failed')
  }
  const data = await res.json()
  return data.creator
}

export async function deleteMonitoredCreator(username: string) {
  const res = await apiFetch(`/api/monitored-creators/${encodeURIComponent(username)}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`Delete monitored creator failed: HTTP ${res.status}`)
}

export async function deleteCreator(username: string) {
  const res = await apiFetch(`/api/creators/${encodeURIComponent(username)}`, { method: 'DELETE' })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    throw new Error(err.error || `Delete creator failed: HTTP ${res.status}`)
  }
}

export async function getHealth(): Promise<HealthStatus> {
  const res = await apiFetch('/api/health')
  if (!res.ok) throw new Error(`Health check failed: HTTP ${res.status}`)
  return res.json()
}

export async function checkHealth(): Promise<boolean> {
  try {
    const data = await getHealth()
    return data.ok && data.keyConfigured
  } catch {
    return false
  }
}

export function parseTikTokUsername(input: string): string {
  const trimmed = input.trim()
  const urlMatch = trimmed.match(/tiktok\.com\/@([^/?#\s]+)/i)
  const raw = urlMatch ? urlMatch[1] : trimmed
  return raw.replace(/^@/, '').split(/[/?#\s]/)[0]
}

export async function fetchCreator(username: string): Promise<Creator> {
  const parsed = parseTikTokUsername(username)
  if (!parsed) throw new Error('请输入 TikTok 账号')

  const res = await apiFetch(`/api/creator/${encodeURIComponent(parsed)}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    throw new Error(err.error || `Fetch creator failed: HTTP ${res.status}`)
  }

  const data = await res.json()
  return data.creator
}

export interface ViralVideosResponse {
  total: number
  videos: Video[]
}

export interface WeeklyReport {
  weekStart: string
  weekEnd: string
  viralCount: number
  topVideos: Video[]
  byApp: Record<string, number>
}

export async function getViralVideos(since?: string): Promise<ViralVideosResponse> {
  const url = since ? `/api/viral-videos?since=${encodeURIComponent(since)}` : '/api/viral-videos'
  const res = await apiFetch(url)
  if (!res.ok) throw new Error(`Get viral videos failed: HTTP ${res.status}`)
  return res.json()
}

export async function getWeeklyReport(): Promise<WeeklyReport> {
  const res = await apiFetch('/api/weekly-report')
  if (!res.ok) throw new Error(`Get weekly report failed: HTTP ${res.status}`)
  return res.json()
}
