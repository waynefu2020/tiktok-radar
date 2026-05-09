import { useEffect, useMemo, useState } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react'
import TopBar from '../components/TopBar'
import { useAuth } from '../components/AuthProvider'

import { AppConfig, Video } from '../types'
import { getApps, getStoredVideos, syncAndCacheVideos } from '../services/tikhub'

const tooltipStyle = {
  backgroundColor: 'var(--panel)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  color: 'var(--text-secondary)',
  fontSize: 12,
}

const WEEK_BUCKETS = 8

function startOfWeek(input: Date) {
  const date = new Date(input)
  date.setHours(0, 0, 0, 0)
  const day = date.getDay() || 7
  date.setDate(date.getDate() - day + 1)
  return date
}

function weekId(date: Date) {
  return date.toISOString().split('T')[0]
}

function weekLabel(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const dayOfMonth = String(date.getDate()).padStart(2, '0')
  return `${month}/${dayOfMonth}`
}

function videoWeekId(dateText: string) {
  const date = new Date(dateText)
  if (Number.isNaN(date.getTime())) return ''
  return weekId(startOfWeek(date))
}

function buildWeeklyData(videos: Video[], appIds: string[]) {
  const currentWeek = startOfWeek(new Date())
  const weeks = new Map<string, Record<string, string | number>>()

  for (let index = WEEK_BUCKETS - 1; index >= 0; index -= 1) {
    const date = new Date(currentWeek)
    date.setDate(currentWeek.getDate() - index * 7)
    const row: Record<string, string | number> = {
      id: weekId(date),
      week: weekLabel(date),
    }
    for (const id of appIds) row[id] = 0
    weeks.set(String(row.id), row)
  }

  for (const video of videos) {
    const key = videoWeekId(video.publishedAt)
    const row = weeks.get(key)
    if (!row) continue
    row[video.app] = Number(row[video.app] || 0) + 1
  }
  return Array.from(weeks.values())
}

export default function TrendAnalysis() {
  const { isAdmin } = useAuth()
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [appConfigs, setAppConfigs] = useState<AppConfig[]>([])

  useEffect(() => {
    getApps().then(setAppConfigs).catch(() => {})
  }, [])

  const loadVideos = async (syncRemote = false) => {
    setError('')
    setLoading(true)
    try {
      const cache = syncRemote ? await syncAndCacheVideos() : await getStoredVideos()
      setVideos(cache.videos)
    } catch (err: any) {
      setError(err.message || '获取真实趋势数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (videos.length === 0) loadVideos()
  }, [])

  const appIds = useMemo(() => appConfigs.map(a => a.id), [appConfigs])
  const weeklyData = useMemo(() => buildWeeklyData(videos, appIds), [videos, appIds])
  const appVideoCount = useMemo(() => appConfigs.map(app => {
    const appVideos = videos.filter(v => v.app === app.id)
    return {
      name: app.name,
      count: appVideos.length,
      likes: Math.round(appVideos.reduce((s, v) => s + v.likes, 0) / 1_000_000 * 10) / 10,
      color: app.color,
      avgLikes: appVideos.length ? Math.round(appVideos.reduce((s, v) => s + v.likes, 0) / appVideos.length) : 0,
    }
  }), [appConfigs, videos])

  const popularTags = useMemo(() => {
    const counts = new Map<string, number>()
    for (const video of videos) {
      for (const tag of video.tags) {
        const normalized = tag.toLowerCase()
        counts.set(normalized, (counts.get(normalized) || 0) + 1)
      }
    }
    return Array.from(counts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12)
  }, [videos])

  const hasData = videos.length > 0

  return (
    <div className="p-6">
      <TopBar title="趋势分析" subtitle={hasData ? `${videos.length} 条 TikHub 真实视频` : '正在加载真实趋势数据'} />

      <div className="mt-6 mb-4 flex items-center gap-3">
        {isAdmin ? (
          <button
            onClick={() => loadVideos(true)}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-[#6366F1]/40 bg-[rgba(99,102,241,0.08)] text-[#818CF8] hover:bg-[rgba(99,102,241,0.15)] disabled:opacity-40 transition-colors"
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            同步真实数据
          </button>
        ) : (
          <div className="text-xs text-text-muted">普通成员仅查看已有缓存趋势数据。</div>
        )}
        {error && (
          <div className="flex items-center gap-1.5 text-xs text-red-400">
            <AlertCircle size={13} /> {error}
          </div>
        )}
      </div>

      {!hasData && !loading ? (
        <div className="rounded-xl border border-border bg-bg py-16 text-center text-sm text-[#555873]">
          {isAdmin ? '暂无真实趋势数据，请手动同步后查看' : '暂无真实趋势数据，请等待管理员同步'}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          <div className="rounded-xl border border-border bg-bg p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-1">最近 8 周新增视频量</h3>
            <p className="text-xs text-text-muted mb-4">按真实视频发布时间聚合，横轴为每周起始日期</p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={weeklyData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="week" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-muted)' }} />
                {appConfigs.map(app => (
                  <Line
                    key={app.id}
                    type="monotone"
                    dataKey={app.id}
                    name={app.name}
                    stroke={app.color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl border border-border bg-bg p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-1">累计点赞量对比</h3>
            <p className="text-xs text-text-muted mb-4">各 App 真实视频总点赞（百万）</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={appVideoCount} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} unit="M" />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}M`, '点赞']} />
                <Bar dataKey="likes" radius={[4, 4, 0, 0]}>
                  {appVideoCount.map(entry => <Cell key={entry.name} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl border border-border bg-bg p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-1">热门标签 TOP 12</h3>
            <p className="text-xs text-text-muted mb-4">来自 TikHub 真实视频标签</p>
            <div className="flex flex-wrap gap-2">
              {popularTags.map(({ tag, count }) => (
                <div key={tag} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border border-border bg-panel">
                  <span className="text-text-secondary">#{tag}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-[rgba(99,102,241,0.15)] text-[#818CF8]">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-bg p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-1">各 App 数据概览</h3>
            <p className="text-xs text-text-muted mb-4">真实视频数量 & 平均点赞</p>
            <div className="space-y-3">
              {appConfigs.map(app => {
                const row = appVideoCount.find(v => v.name === app.name)!
                return (
                  <div key={app.id} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: app.color }} />
                    <span className="text-sm text-text-secondary w-28 shrink-0">{app.name}</span>
                    <div className="flex-1 h-2 bg-panel rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${videos.length ? (row.count / videos.length) * 100 : 0}%`, backgroundColor: app.color, opacity: 0.7 }}
                      />
                    </div>
                    <span className="text-xs text-text-muted w-16 text-right shrink-0">{row.count} 条视频</span>
                    <span className="text-xs text-text-muted w-20 text-right shrink-0">均赞 {(row.avgLikes / 1000).toFixed(0)}K</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
