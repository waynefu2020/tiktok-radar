import { useState, useMemo, useEffect, useCallback } from 'react'
import { Heart, MessageCircle, Bookmark, Share2, ExternalLink, FileText, ChevronUp, Copy, RefreshCw, CheckCircle2, AlertCircle, Loader2, Database, Sparkles } from 'lucide-react'
import TopBar from '../components/TopBar'
import StatCard, { fmt } from '../components/StatCard'
import AppBadge from '../components/AppBadge'

import { AppId, AppConfig, ScriptBreakdown, Video } from '../types'
import { Video as VideoIcon, Users, Flame, Heart as HeartIcon } from 'lucide-react'
import { analyzeVideoScript, getApps, getHealth, getStoredVideos, sortVideosByNewest, syncAll, syncApp } from '../services/tikhub'
import { creatorAvatarFallback, videoThumbnailFallback } from '../utils/media'

const TIME_FILTERS = [
  { label: '最近7天', days: 7 },
  { label: '最近30天', days: 30 },
  { label: '最近90天', days: 90 },
  { label: '全部', days: 9999 },
]

type SyncStatus = 'idle' | 'syncing' | 'done' | 'error'

function inRange(dateText: string, start: Date, end: Date) {
  const time = new Date(dateText).getTime()
  return Number.isFinite(time) && time >= start.getTime() && time < end.getTime()
}

function BreakdownView({ breakdown, source, inferredFrom }: { breakdown: ScriptBreakdown; source?: string; inferredFrom?: string }) {
  const isInferred = source === 'inferred'
  const isAsr = source === 'asr'
  return (
    <div className="space-y-3">
      {isAsr && (
        <div className="flex items-start gap-2 rounded-lg bg-sky-500/10 border border-sky-500/20 p-3">
          <Sparkles size={14} className="text-sky-400 mt-0.5 shrink-0" />
          <div className="text-xs text-sky-200/80 leading-relaxed">
            <span className="font-medium text-sky-300">基于 AI 语音转写拆解</span>
            <span className="mx-1">·</span>
            通过下载视频并提取音频，由 Whisper 模型自动转写生成逐字稿，再基于此做拆解分析。
          </div>
        </div>
      )}
      {isInferred && (
        <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
          <Sparkles size={14} className="text-amber-400 mt-0.5 shrink-0" />
          <div className="text-xs text-amber-200/80 leading-relaxed">
            <span className="font-medium text-amber-300">基于有限信息推测拆解</span>
            <span className="mx-1">·</span>
            未获取到视频真实字幕，以下分析由 AI 根据标题、标签和互动数据推测生成，仅供参考。
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-lg bg-[rgb(18,20,28)] border border-[#2E3045] p-3">
          <div className="text-[#8A8FA8] mb-1">开场钩子</div>
          <div className="text-[#C8CBE0] leading-relaxed">{breakdown.hook}</div>
        </div>
        <div className="rounded-lg bg-[rgb(18,20,28)] border border-[#2E3045] p-3">
          <div className="text-[#8A8FA8] mb-1">痛点</div>
          <div className="text-[#C8CBE0] leading-relaxed">{breakdown.painPoint}</div>
        </div>
        <div className="rounded-lg bg-[rgb(18,20,28)] border border-[#2E3045] p-3">
          <div className="text-[#8A8FA8] mb-1">产品植入</div>
          <div className="text-[#C8CBE0] leading-relaxed">{breakdown.productPlacement}</div>
        </div>
        <div className="rounded-lg bg-[rgb(18,20,28)] border border-[#2E3045] p-3">
          <div className="text-[#8A8FA8] mb-1">CTA</div>
          <div className="text-[#C8CBE0] leading-relaxed">{breakdown.cta}</div>
        </div>
        <div className="rounded-lg bg-[rgb(18,20,28)] border border-[#2E3045] p-3 col-span-2">
          <div className="text-[#8A8FA8] mb-2">内容结构</div>
          <ol className="space-y-1 text-[#C8CBE0] list-decimal list-inside">
            {breakdown.structure.map((item, idx) => <li key={idx}>{item}</li>)}
          </ol>
        </div>
        <div className="rounded-lg bg-[rgb(18,20,28)] border border-[#2E3045] p-3 col-span-2">
          <div className="text-[#8A8FA8] mb-2">可复用拍摄建议</div>
          <ul className="space-y-1 text-[#C8CBE0] list-disc list-inside">
            {breakdown.reusableIdeas.map((item, idx) => <li key={idx}>{item}</li>)}
          </ul>
        </div>
      </div>
    </div>
  )
}

function VideoRow({ video, appConfigs }: { video: Video; appConfigs: AppConfig[] }) {
  const [expanded, setExpanded] = useState(false)
  const [scriptVideo, setScriptVideo] = useState(video)
  const [loadingScript, setLoadingScript] = useState(false)
  const [scriptError, setScriptError] = useState('')
  const thumbnailSrc = video.thumbnailUrl || videoThumbnailFallback(video.title)
  const avatarSrc = video.creator.avatarUrl || creatorAvatarFallback(video.creator.username)

  const handleToggleScript = async () => {
    const nextExpanded = !expanded
    setExpanded(nextExpanded)
    if (!nextExpanded || scriptVideo.transcriptStatus === 'ready' || (scriptVideo.transcriptStatus === 'no_transcript' && scriptVideo.breakdown) || loadingScript) return

    setLoadingScript(true)
    setScriptError('')
    try {
      const analyzed = await analyzeVideoScript(video.id)
      setScriptVideo(analyzed)
    } catch (err: any) {
      setScriptError(err.message || '脚本分析失败')
    } finally {
      setLoadingScript(false)
    }
  }

  return (
    <>
      <tr className="table-row group">
        <td className="px-4 py-3 w-[42%]">
          <div className="flex items-start gap-3">
            <div className="w-16 h-9 rounded overflow-hidden shrink-0 bg-[rgb(28,30,42)]">
              <img
                src={thumbnailSrc}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
                onError={e => { (e.target as HTMLImageElement).src = videoThumbnailFallback(video.title) }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <a
                href={video.tiktokUrl}
                target="_blank"
                rel="noreferrer"
                title="打开 TikTok 原视频"
                className="block text-sm text-white leading-snug line-clamp-2 mb-1.5 hover:text-[#22D3EE] transition-colors"
              >
                {video.title}
              </a>
              <div className="flex flex-wrap gap-1">
                {video.tags.slice(0, 3).map(t => (
                  <span key={t} className="tag-badge">#{t}</span>
                ))}
              </div>
            </div>
          </div>
        </td>
        <td className="px-3 py-3 w-[10%]"><AppBadge app={video.app} configs={appConfigs} /></td>
        <td className="px-3 py-3 w-[12%]">
          <div className="flex items-center gap-2">
            <img
              src={avatarSrc}
              alt=""
              className="w-6 h-6 rounded-full shrink-0 bg-[rgb(28,30,42)]"
              onError={e => { (e.target as HTMLImageElement).src = creatorAvatarFallback(video.creator.username) }}
            />
            <span className="text-xs text-[#C8CBE0] truncate">@{video.creator.username}</span>
          </div>
        </td>
        <td className="px-3 py-3 w-[8%] text-xs text-[#8A8FA8]">{video.publishedAt}</td>
        <td className="px-3 py-3 w-[7%]">
          <div className="flex items-center gap-1 text-xs text-[#C8CBE0]">
            <Heart size={11} className="text-rose-400" />{fmt(video.likes)}
          </div>
        </td>
        <td className="px-3 py-3 w-[7%]">
          <div className="flex items-center gap-1 text-xs text-[#C8CBE0]">
            <MessageCircle size={11} className="text-blue-400" />{fmt(video.comments)}
          </div>
        </td>
        <td className="px-3 py-3 w-[7%]">
          <div className="flex items-center gap-1 text-xs text-[#C8CBE0]">
            <Bookmark size={11} className="text-amber-400" />{fmt(video.saves)}
          </div>
        </td>
        <td className="px-3 py-3 w-[7%]">
          <div className="flex items-center gap-1 text-xs text-[#C8CBE0]">
            <Share2 size={11} className="text-emerald-400" />{fmt(video.shares)}
          </div>
        </td>
        <td className="px-3 py-3 w-[8%]">
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleScript}
              title="查看脚本"
              className="w-7 h-7 rounded-md flex items-center justify-center bg-[rgb(28,30,42)] border border-[#2E3045] text-[#8A8FA8] hover:text-[#6366F1] hover:border-[#6366F1]/40 transition-colors"
            >
              {expanded ? <ChevronUp size={13} /> : <FileText size={13} />}
            </button>
            <a
              href={video.tiktokUrl} target="_blank" rel="noreferrer"
              title="TikTok 原视频"
              className="w-7 h-7 rounded-md flex items-center justify-center bg-[rgb(28,30,42)] border border-[#2E3045] text-[#8A8FA8] hover:text-[#22D3EE] hover:border-[#22D3EE]/40 transition-colors"
            >
              <ExternalLink size={13} />
            </a>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={9} className="p-0">
            <div className="px-6 py-4 bg-[rgb(14,16,22)] border-t border-[#2E3045]/40">
              {loadingScript ? (
                <div className="flex items-center gap-2 text-sm text-[#818CF8]">
                  <Loader2 size={14} className="animate-spin" />
                  正在分析视频脚本（下载视频→提取音频→AI 转写→拆解）…
                </div>
              ) : scriptError ? (
                <div className="text-sm text-red-400">{scriptError}</div>
              ) : !scriptVideo.breakdown && scriptVideo.transcriptStatus === 'no_transcript' ? (
                <div className="text-sm text-[#8A8FA8]">未获取到这条视频的真实字幕/转写，暂不生成 AI 拆解。</div>
              ) : (
                <div className="space-y-4">
                  {scriptVideo.transcriptText && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-[#8A8FA8] font-medium">脚本原文 / 真实字幕</div>
                        <button
                          onClick={() => navigator.clipboard.writeText(scriptVideo.transcriptText || '')}
                          className="flex items-center gap-1.5 text-xs text-[#6366F1] hover:text-[#818CF8] transition-colors"
                        >
                          <Copy size={11} /> 复制原文
                        </button>
                      </div>
                      <pre className="text-xs text-[#C8CBE0] whitespace-pre-wrap leading-relaxed font-sans bg-[rgb(18,20,28)] border border-[#2E3045] rounded-lg p-3 max-h-52 overflow-auto">
                        {scriptVideo.transcriptText}
                      </pre>
                    </div>
                  )}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs text-[#8A8FA8] font-medium">AI 拆解</div>
                      {scriptVideo.analysisSource === 'asr' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">AI 转写</span>
                      )}
                      {scriptVideo.analysisSource === 'inferred' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">推测</span>
                      )}
                    </div>
                    {scriptVideo.breakdown ? (
                      <BreakdownView
                        breakdown={scriptVideo.breakdown}
                        source={scriptVideo.analysisSource}
                        inferredFrom={scriptVideo.inferredFrom}
                      />
                    ) : (
                      <div className="text-sm text-[#8A8FA8]">暂无 AI 拆解</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export default function UGCVideoCenter() {
  const [appFilter, setAppFilter] = useState<AppId | 'all'>('all')
  const [timeFilter, setTimeFilter] = useState(9999)
  const [search, setSearch] = useState('')
  const [appConfigs, setAppConfigs] = useState<AppConfig[]>([])

  // 真实数据状态
  const [realVideos, setRealVideos] = useState<Video[]>([])
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [syncMessage, setSyncMessage] = useState('')
  const [syncingApp, setSyncingApp] = useState<AppId | 'all' | null>(null)
  const [serverOnline, setServerOnline] = useState<boolean | null>(null)
  const [asrAvailable, setAsrAvailable] = useState<boolean | null>(null)
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null)

  useEffect(() => {
    getApps().then(setAppConfigs).catch(() => {})
  }, [])

  const displayVideos = realVideos

  const filtered = useMemo(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - timeFilter)
    return sortVideosByNewest(displayVideos.filter(v => {
      if (appFilter !== 'all' && v.app !== appFilter) return false
      if (timeFilter !== 9999 && new Date(v.publishedAt) < cutoff) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          v.title.toLowerCase().includes(q) ||
          v.creator.username.toLowerCase().includes(q) ||
          v.tags.some(t => t.toLowerCase().includes(q))
        )
      }
      return true
    }))
  }, [displayVideos, appFilter, timeFilter, search])

  // 同步所有竞品
  const handleSyncAll = useCallback(async () => {
    setSyncStatus('syncing')
    setSyncingApp('all')
    setSyncMessage('正在同步所有竞品数据…')
    try {
      const result = await syncAll()
      if (result.videos.length > 0) {
        setRealVideos(result.videos)
        setLastSyncTime(new Date().toLocaleTimeString('zh-CN'))
        setSyncStatus('done')
        setSyncMessage(`同步完成：获取 ${result.total} 条真实数据`)
      } else {
        setSyncStatus('error')
        setSyncMessage(result.errors?.length ? `API 错误: ${result.errors[0].error}` : '未获取到数据')
      }
    } catch (err: any) {
      setSyncStatus('error')
      setSyncMessage(err.message || '网络错误')
    } finally {
      setSyncingApp(null)
    }
  }, [])

  // 检查后端是否在线；在线时进入页面默认同步真实数据。
  useEffect(() => {
    getHealth().then(health => {
      const ok = health.ok && health.keyConfigured
      setServerOnline(ok)
      setAsrAvailable(health.asrAvailable ?? null)
      if (ok) {
        getStoredVideos()
          .then(cache => {
            if (cache.videos.length > 0) {
              setRealVideos(cache.videos)
              setLastSyncTime(new Date(cache.syncedAt).toLocaleTimeString('zh-CN'))
            } else {
              handleSyncAll()
            }
          })
          .catch(() => handleSyncAll())
      } else {
        setSyncStatus('error')
        setSyncMessage('API 服务离线或未配置 Key，无法获取真实数据')
      }
    }).catch(() => {
      setServerOnline(false)
      setAsrAvailable(false)
      setSyncStatus('error')
      setSyncMessage('API 服务离线或未配置 Key，无法获取真实数据')
    })
  }, [handleSyncAll])

  // 同步单个 App
  const handleSyncApp = useCallback(async (appId: AppId) => {
    setSyncStatus('syncing')
    setSyncingApp(appId)
    const cfg = appConfigs.find(a => a.id === appId) || { id: appId, name: appId, color: '#6366F1', bgColor: 'rgba(99,102,241,0.12)', borderColor: 'rgba(99,102,241,0.3)' }
    setSyncMessage(`正在同步 ${cfg.name}…`)
    try {
      const result = await syncApp(appId, 20)
      if (result.videos.length > 0) {
        const cache = await getStoredVideos()
        setRealVideos(cache.videos)
        setLastSyncTime(new Date(cache.syncedAt).toLocaleTimeString('zh-CN'))
        setSyncStatus('done')
        setSyncMessage(`${cfg.name} 同步完成：${result.total} 条`)
      } else {
        setSyncStatus('error')
        setSyncMessage(`${cfg.name} 未获取到数据`)
      }
    } catch (err: any) {
      setSyncStatus('error')
      setSyncMessage(`${cfg.name} 同步失败: ${err.message}`)
    } finally {
      setSyncingApp(null)
    }
  }, [realVideos.length])

  const isSyncing = syncStatus === 'syncing'
  const realCount = realVideos.length

  const totalLikes = filtered.reduce((s, v) => s + v.likes, 0)
  const uniqueCreators = new Set(filtered.map(v => v.creator.id)).size
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(weekStart.getDate() - 7)
  const currentWeekVideos = filtered.filter(v => inRange(v.publishedAt, weekStart, now))
  const weekNew = currentWeekVideos.length

  return (
    <div className="p-6">
      <TopBar
        title="UGC 视频中心"
        subtitle={`监控 ${appConfigs.length} 个竞品 App · ${realCount > 0 ? `${realCount} 条真实数据` : '正在加载真实数据'}`}
        onSearch={setSearch}
      />

      {/* Sync bar */}
      <div className="mt-5 mb-4 flex items-center gap-3 flex-wrap">
        {/* Server status */}
        <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border ${
          serverOnline === null ? 'border-[#2E3045] text-[#8A8FA8]' :
          serverOnline ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' :
          'border-red-500/30 bg-red-500/10 text-red-400'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${serverOnline === null ? 'bg-[#8A8FA8]' : serverOnline ? 'bg-emerald-400' : 'bg-red-400'}`} />
          {serverOnline === null ? '检测中…' : serverOnline ? 'API 服务在线' : 'API 服务离线'}
        </div>
        {serverOnline && asrAvailable === false && (
          <div className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300">
            <AlertCircle size={12} />
            未检测到视频转写工具，将优先使用字幕，失败后只做推测拆解
          </div>
        )}

        {/* Sync all */}
        <button
          onClick={handleSyncAll}
          disabled={isSyncing || serverOnline === false}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-[#6366F1]/40 bg-[rgba(99,102,241,0.08)] text-[#818CF8] hover:bg-[rgba(99,102,241,0.15)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {isSyncing && syncingApp === 'all' ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
          同步所有竞品
        </button>

        {/* Sync per app */}
        {appConfigs.map(app => (
          <button
            key={app.id}
            onClick={() => handleSyncApp(app.id)}
            disabled={isSyncing || serverOnline === false}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            style={{
              borderColor: app.borderColor,
              color: app.color,
              backgroundColor: app.bgColor,
            }}
          >
            {isSyncing && syncingApp === app.id ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            {app.name}
          </button>
        ))}

        {/* Status message */}
        {syncStatus !== 'idle' && (
          <div className={`flex items-center gap-1.5 text-xs ml-auto ${
            syncStatus === 'syncing' ? 'text-[#818CF8]' :
            syncStatus === 'done' ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {syncStatus === 'syncing' && <Loader2 size={12} className="animate-spin" />}
            {syncStatus === 'done' && <CheckCircle2 size={12} />}
            {syncStatus === 'error' && <AlertCircle size={12} />}
            {syncMessage}
          </div>
        )}

        {/* Real data indicator */}
        {realCount > 0 && syncStatus === 'idle' && (
          <div className="flex items-center gap-1.5 text-xs text-[#8A8FA8] ml-auto">
            <Database size={11} />
            上次同步：{lastSyncTime} · {realCount} 条真实数据
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="flex gap-4 mb-6">
        <StatCard label="监控视频总数" value={String(filtered.length)} icon={VideoIcon} iconColor="#6366F1" />
        <StatCard label="本周新增" value={String(weekNew)} icon={Flame} iconColor="#F59E0B" />
        <StatCard label="总点赞量" value={fmt(totalLikes)} icon={HeartIcon} iconColor="#F43F5E" />
        <StatCard label="追踪达人数" value={String(uniqueCreators)} icon={Users} iconColor="#10B981" />
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button className={`filter-btn${appFilter === 'all' ? ' active' : ''}`} onClick={() => setAppFilter('all')}>
            全部 <span className="ml-1 text-[#6366F1]">{displayVideos.length}</span>
          </button>
          {appConfigs.map(app => {
            const count = displayVideos.filter(v => v.app === app.id).length
            return (
              <button
                key={app.id}
                className={`filter-btn${appFilter === app.id ? ' active' : ''}`}
                onClick={() => setAppFilter(app.id)}
                style={appFilter === app.id ? { borderColor: app.borderColor, color: app.color, backgroundColor: app.bgColor } : {}}
              >
                {app.name} <span className="ml-1" style={{ color: appFilter === app.id ? app.color : '#6366F1' }}>{count}</span>
              </button>
            )
          })}
        </div>
        <div className="flex items-center gap-2">
          {TIME_FILTERS.map(tf => (
            <button
              key={tf.days}
              className={`filter-btn${timeFilter === tf.days ? ' active' : ''}`}
              onClick={() => setTimeFilter(tf.days)}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#2E3045] overflow-hidden bg-[rgb(12,14,20)]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#2E3045]">
              {['视频内容', '来源 App', '达人', '时间', '点赞', '评论', '收藏', '分享', '操作'].map(h => (
                <th key={h} className="px-3 py-3 text-left text-[11px] font-medium text-[#8A8FA8] first:px-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-16 text-sm text-[#555873]">
                  {syncStatus === 'syncing' ? '正在获取真实数据…' : '暂无真实数据，请检查 API 后重试同步'}
                </td>
              </tr>
            ) : (
              filtered.map(v => <VideoRow key={v.id} video={v} appConfigs={appConfigs} />)
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 text-xs text-[#555873] text-right">
        共 {filtered.length} 条
        {realCount > 0 && <span className="text-emerald-500/60"> · {realCount} 条来自 TikHub 真实数据</span>}
        {realCount === 0 && syncStatus === 'syncing' && <span> · 正在从 TikHub 获取真实数据</span>}
        {realCount === 0 && syncStatus === 'error' && <span> · 暂无真实数据</span>}
      </div>
    </div>
  )
}
