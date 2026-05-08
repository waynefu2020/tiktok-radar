import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
  Users, Plus, Trash2, RefreshCw, Loader2, AlertCircle,
  CheckCircle2, X, ExternalLink, Heart, MessageCircle, Share2, Video, Eye, Activity,
} from 'lucide-react'
import TopBar from '../components/TopBar'
import { fmt } from '../components/StatCard'
import {
  getIdeaCreators,
  addIdeaCreator,
  deleteIdeaCreator,
  refreshIdeaCreator,
  getIdeaVideos,
  fetchIdeaVideos,
  backfillIdeaVideos,
  parseTikTokUsername,
  IdeaCreator,
  IdeaVideo,
  IdeaFetchResult,
} from '../services/idea'
import { creatorAvatarFallback, videoThumbnailFallback } from '../utils/media'

type Tab = 'creators' | 'videos'

type IdeaCreatorRow = IdeaCreator & {
  language: string
  totalViews: number
  totalEngagements: number
  engagementRate: number
}

function detectCreatorLanguage(videos: IdeaVideo[]) {
  const text = videos
    .flatMap(video => [video.title, ...(video.tags || [])])
    .join(' ')
    .toLowerCase()

  if (!text.trim()) return '未知'

  const score = (patterns: RegExp[]) => patterns.reduce((sum, pattern) => sum + (text.match(pattern)?.length || 0), 0)

  const spanish = score([
    /\b(estudiante|universidad|estudiando|estudio|consejos|horas|semana|antes|manera|eficiente|encantar)\b/g,
    /[áéíóúñ]/g,
  ])
  const portuguese = score([
    /\b(estudar|estudo|faculdade|universidade|dicas|estudante|prova|aula)\b/g,
    /[ãõç]/g,
  ])
  const french = score([
    /\b(étude|étudiant|université|conseils|cours|réviser|examens)\b/g,
    /[àâçéèêëîïôùûü]/g,
  ])
  const german = score([
    /\b(lernen|schule|studium|prüfung|tipps|student)\b/g,
    /[äöüß]/g,
  ])
  const english = score([
    /\b(study|studying|student|school|college|exam|exams|tips|hack|university)\b/g,
  ])

  const ranked = [
    { label: '西语', value: spanish },
    { label: '英语', value: english },
    { label: '葡语', value: portuguese },
    { label: '法语', value: french },
    { label: '德语', value: german },
  ].sort((a, b) => b.value - a.value)

  return ranked[0].value > 0 ? ranked[0].label : '未知'
}

function CreatorRow({ creator, onRefresh, onDelete, refreshing, deleting }: {
  creator: IdeaCreatorRow
  onRefresh: (c: IdeaCreator) => void
  onDelete: (c: IdeaCreator) => void
  refreshing: string | null
  deleting: string | null
}) {
  return (
    <tr className="table-row">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <img
            src={creator.avatarUrl || creatorAvatarFallback(creator.username)}
            alt=""
            className="w-9 h-9 rounded-full shrink-0 bg-[rgb(28,30,42)]"
            onError={e => { (e.target as HTMLImageElement).src = creatorAvatarFallback(creator.username) }}
          />
          <div className="min-w-0">
            <div className="text-sm text-white font-medium">{creator.displayName}</div>
            <a href={`https://www.tiktok.com/@${creator.username}`} target="_blank" rel="noreferrer" className="text-xs text-[#8A8FA8] hover:text-[#22D3EE] transition-colors">
              @{creator.username}
            </a>
          </div>
        </div>
      </td>
      <td className="px-3 py-3 text-sm text-[#C8CBE0]">{creator.language}</td>
      <td className="px-3 py-3 text-sm text-[#C8CBE0]">{fmt(creator.followers)}</td>
      <td className="px-3 py-3 text-sm text-[#C8CBE0]">{fmt(creator.totalVideos)}</td>
      <td className="px-3 py-3 text-sm text-[#C8CBE0]">{fmt(creator.totalViews)}</td>
      <td className="px-3 py-3 text-sm text-[#C8CBE0]">{fmt(creator.totalEngagements)}</td>
      <td className="px-3 py-3 text-sm text-[#C8CBE0]">{creator.engagementRate.toFixed(1)}%</td>
      <td className="px-3 py-3 text-xs text-[#8A8FA8]">{new Date(creator.updatedAt).toLocaleDateString('zh-CN')}</td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onRefresh(creator)}
            disabled={refreshing === creator.username}
            title="刷新资料并抓取视频"
            className="w-7 h-7 rounded-md flex items-center justify-center bg-[rgb(28,30,42)] border border-[#2E3045] text-[#8A8FA8] hover:text-[#6366F1] hover:border-[#6366F1]/40 disabled:opacity-50 transition-colors"
          >
            {refreshing === creator.username ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
          </button>
          <button
            onClick={() => onDelete(creator)}
            disabled={deleting === creator.username}
            className="w-7 h-7 rounded-md flex items-center justify-center bg-[rgb(28,30,42)] border border-[#2E3045] text-[#8A8FA8] hover:text-red-400 hover:border-red-500/40 disabled:opacity-50 transition-colors"
          >
            {deleting === creator.username ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
          </button>
        </div>
      </td>
    </tr>
  )
}

function VideoRow({ video }: { video: IdeaVideo }) {
  const thumbnailSrc = video.thumbnailUrl || videoThumbnailFallback(video.title)
  return (
    <tr className="table-row">
      <td className="px-4 py-3 w-[44%]">
        <div className="flex items-start gap-3">
          <div className="w-16 h-9 rounded overflow-hidden shrink-0 bg-[rgb(28,30,42)]">
            <img src={thumbnailSrc} alt="" className="w-full h-full object-cover" loading="lazy" onError={e => { (e.target as HTMLImageElement).src = videoThumbnailFallback(video.title) }} />
          </div>
          <div className="flex-1 min-w-0">
            <a href={video.tiktokUrl} target="_blank" rel="noreferrer" className="block text-sm text-white leading-snug line-clamp-2 hover:text-[#22D3EE] transition-colors">
              {video.title}
            </a>
          </div>
        </div>
      </td>
      <td className="px-3 py-3 w-[14%]">
        <div className="flex items-center gap-2">
          <img
            src={video.creator.avatarUrl || creatorAvatarFallback(video.creator.username)}
            alt=""
            className="w-6 h-6 rounded-full shrink-0 bg-[rgb(28,30,42)]"
            onError={e => { (e.target as HTMLImageElement).src = creatorAvatarFallback(video.creator.username) }}
          />
          <span className="text-xs text-[#C8CBE0] truncate">@{video.creator.username}</span>
        </div>
      </td>
      <td className="px-3 py-3 w-[10%] text-xs text-[#8A8FA8]">{video.publishedAt}</td>
      <td className="px-3 py-3 w-[8%]"><div className="flex items-center gap-1 text-xs text-[#C8CBE0]"><Eye size={11} className="text-[#8A8FA8]" />{fmt(video.views || 0)}</div></td>
      <td className="px-3 py-3 w-[8%]"><div className="flex items-center gap-1 text-xs text-[#C8CBE0]"><Heart size={11} className="text-rose-400" />{fmt(video.likes)}</div></td>
      <td className="px-3 py-3 w-[8%]"><div className="flex items-center gap-1 text-xs text-[#C8CBE0]"><MessageCircle size={11} className="text-blue-400" />{fmt(video.comments)}</div></td>
      <td className="px-3 py-3 w-[8%]"><div className="flex items-center gap-1 text-xs text-[#C8CBE0]"><Share2 size={11} className="text-emerald-400" />{fmt(video.shares)}</div></td>
      <td className="px-3 py-3 w-[4%]">
        <a href={video.tiktokUrl} target="_blank" rel="noreferrer" className="text-[#8A8FA8] hover:text-[#22D3EE] transition-colors">
          <ExternalLink size={13} />
        </a>
      </td>
    </tr>
  )
}

function fetchResultText(result: IdeaFetchResult) {
  const errorText = result.errors.length ? `，失败 ${result.errors.length} 位` : ''
  return `抓取 ${result.fetched} 条视频，新增 ${result.newVideos} 条${errorText}`
}

export default function IdeaShellPage() {
  const [tab, setTab] = useState<Tab>('creators')
  const [creators, setCreators] = useState<IdeaCreator[]>([])
  const [videos, setVideos] = useState<IdeaVideo[]>([])
  const [loadingCreators, setLoadingCreators] = useState(false)
  const [loadingVideos, setLoadingVideos] = useState(false)
  const [adding, setAdding] = useState(false)
  const [usernameInput, setUsernameInput] = useState('')
  const [refreshing, setRefreshing] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [fetchingAll, setFetchingAll] = useState(false)
  const [backfilling, setBackfilling] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [fetchError, setFetchError] = useState('')
  const [addError, setAddError] = useState('')
  const attemptedBackfill = useRef(false)

  const loadCreators = useCallback(async () => {
    setLoadingCreators(true)
    try {
      const data = await getIdeaCreators()
      setCreators(data)
      return data
    } finally {
      setLoadingCreators(false)
    }
  }, [])

  const loadVideos = useCallback(async () => {
    setLoadingVideos(true)
    try {
      const data = await getIdeaVideos()
      setVideos(data)
      return data
    } finally {
      setLoadingVideos(false)
    }
  }, [])

  const reloadAll = useCallback(async () => {
    const [creatorRows, videoRows] = await Promise.all([loadCreators(), loadVideos()])
    return { creatorRows, videoRows }
  }, [loadCreators, loadVideos])

  useEffect(() => {
    reloadAll().then(({ creatorRows, videoRows }) => {
      if (creatorRows.length > 0 && videoRows.length === 0 && !attemptedBackfill.current) {
        attemptedBackfill.current = true
        setBackfilling(true)
        setFetchError('')
        backfillIdeaVideos()
          .then(async result => {
            setStatusMessage(`已自动补抓：${fetchResultText(result)}`)
            await loadVideos()
          })
          .catch(err => {
            setFetchError(err.message || '自动补抓失败')
          })
          .finally(() => setBackfilling(false))
      }
    }).catch(err => {
      setFetchError(err.message || '加载失败')
    })
  }, [reloadAll, loadVideos])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const username = parseTikTokUsername(usernameInput)
    if (!username) {
      setAddError('请输入 TikTok 账号')
      return
    }
    setAdding(true)
    setAddError('')
    setFetchError('')
    try {
      const result = await addIdeaCreator(username)
      setUsernameInput('')
      setStatusMessage(`已添加 @${result.creator.username}，${fetchResultText(result.fetchResult)}`)
      await reloadAll()
      setTab('videos')
    } catch (err: any) {
      setAddError(err.message || '添加失败')
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async (creator: IdeaCreator) => {
    if (!confirm(`确定删除 @${creator.username}？\n该博主已抓取的视频也会一起删除。`)) return
    setDeleting(creator.username)
    try {
      await deleteIdeaCreator(creator.username)
      await reloadAll()
    } catch (err: any) {
      alert(err.message || '删除失败')
    } finally {
      setDeleting(null)
    }
  }

  const handleRefresh = async (creator: IdeaCreator) => {
    setRefreshing(creator.username)
    setFetchError('')
    try {
      const result = await refreshIdeaCreator(creator.username)
      setStatusMessage(`已刷新 @${result.creator.username}，${fetchResultText(result.fetchResult)}`)
      await reloadAll()
      setTab('videos')
    } catch (err: any) {
      alert(err.message || '刷新失败')
    } finally {
      setRefreshing(null)
    }
  }

  const handleFetchAll = async () => {
    setFetchingAll(true)
    setFetchError('')
    try {
      const result = await fetchIdeaVideos()
      setStatusMessage(`已抓取全部博主视频：${fetchResultText(result)}`)
      await loadVideos()
      setTab('videos')
    } catch (err: any) {
      setFetchError(err.message || '抓取失败')
    } finally {
      setFetchingAll(false)
    }
  }

  const hasCreators = creators.length > 0
  const subtitle = useMemo(() => `${creators.length} 位合作博主 · ${videos.length} 条已抓取视频`, [creators.length, videos.length])
  const headlineStats = useMemo(() => {
    const totalViews = videos.reduce((sum, video) => sum + (video.views || 0), 0)
    const totalEngagements = videos.reduce(
      (sum, video) => sum + (video.likes || 0) + (video.comments || 0) + (video.shares || 0),
      0,
    )
    const averageEngagementRate = totalViews > 0 ? (totalEngagements / totalViews) * 100 : 0

    return {
      totalViews,
      totalEngagements,
      averageEngagementRate,
    }
  }, [videos])
  const creatorRows = useMemo<IdeaCreatorRow[]>(() => {
    const statsByUsername = new Map<string, { totalViews: number; totalEngagements: number }>()

    for (const video of videos) {
      const username = String(video.creator?.username || '').toLowerCase()
      if (!username) continue
      const current = statsByUsername.get(username) || { totalViews: 0, totalEngagements: 0 }
      current.totalViews += video.views || 0
      current.totalEngagements += (video.likes || 0) + (video.comments || 0) + (video.shares || 0)
      statsByUsername.set(username, current)
    }

    return creators.map(creator => {
      const creatorVideos = videos.filter(video => String(video.creator?.username || '').toLowerCase() === String(creator.username || '').toLowerCase())
      const stats = statsByUsername.get(String(creator.username || '').toLowerCase()) || { totalViews: 0, totalEngagements: 0 }
      const engagementRate = stats.totalViews > 0 ? (stats.totalEngagements / stats.totalViews) * 100 : 0
      return {
        ...creator,
        language: detectCreatorLanguage(creatorVideos),
        totalViews: stats.totalViews,
        totalEngagements: stats.totalEngagements,
        engagementRate,
      }
    })
  }, [creators, videos])

  return (
    <div className="p-6">
      <TopBar title="ideaShell UGC" subtitle={subtitle} />

      {/* 核心指标卡片 */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-[rgb(18,20,28)] border border-[#2E3045] px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center shrink-0">
            <Eye size={15} className="text-sky-400" />
          </div>
          <div>
            <div className="text-[11px] text-[#8A8FA8]">总播放量</div>
            <div className="text-base font-semibold text-white leading-tight">{fmt(headlineStats.totalViews)}</div>
          </div>
        </div>
        <div className="rounded-xl bg-[rgb(18,20,28)] border border-[#2E3045] px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
            <Activity size={15} className="text-violet-400" />
          </div>
          <div>
            <div className="text-[11px] text-[#8A8FA8]">总互动量</div>
            <div className="text-base font-semibold text-white leading-tight">{fmt(headlineStats.totalEngagements)}</div>
          </div>
        </div>
        <div className="rounded-xl bg-[rgb(18,20,28)] border border-[#2E3045] px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0">
            <Heart size={15} className="text-rose-400" />
          </div>
          <div>
            <div className="text-[11px] text-[#8A8FA8]">平均互动率</div>
            <div className="text-base font-semibold text-white leading-tight">{headlineStats.averageEngagementRate.toFixed(1)}%</div>
          </div>
        </div>
      </div>

      {/* Tab 栏 + 操作按钮同行 */}
      <div className="flex items-center justify-between mt-5 mb-4">
        <div className="flex items-center gap-2">
          <button className={`filter-btn${tab === 'creators' ? ' active' : ''}`} onClick={() => setTab('creators')}>
            <Users size={12} className="inline mr-1" />
            博主管理
          </button>
          <button className={`filter-btn${tab === 'videos' ? ' active' : ''}`} onClick={() => setTab('videos')}>
            <Video size={12} className="inline mr-1" />
            视频列表
          </button>
        </div>

        <div className="flex items-center gap-3">
          {backfilling && (
            <div className="flex items-center gap-1.5 text-xs text-[#818CF8]">
              <Loader2 size={12} className="animate-spin" />
              正在自动补抓…
            </div>
          )}
          {statusMessage && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400">
              <CheckCircle2 size={12} />
              {statusMessage}
            </div>
          )}
          {fetchError && (
            <div className="flex items-center gap-1.5 text-xs text-red-400">
              <AlertCircle size={12} />
              {fetchError}
            </div>
          )}
          <button
            onClick={handleFetchAll}
            disabled={fetchingAll || !hasCreators}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-[#6366F1]/40 bg-[rgba(99,102,241,0.08)] text-[#818CF8] hover:bg-[rgba(99,102,241,0.15)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {fetchingAll ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            抓取全部博主视频
          </button>
        </div>
      </div>

      {tab === 'creators' && (
        <div className="space-y-3">
          {/* 添加博主表单 */}
          <div className="rounded-xl border border-[#2E3045] bg-[rgb(18,20,28)] px-4 py-3">
            <form onSubmit={handleAdd} className="flex items-center gap-2">
              <input
                value={usernameInput}
                onChange={e => setUsernameInput(e.target.value)}
                placeholder="输入 TikTok 账号或主页链接"
                className="flex-1 bg-[rgb(12,14,20)] border border-[#2E3045] rounded-lg px-3 py-2 text-sm text-[#C8CBE0] placeholder-[#555873] focus:outline-none focus:border-[#6366F1]/50"
              />
              <button
                type="submit"
                disabled={adding}
                className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-[#6366F1]/40 bg-[rgba(99,102,241,0.12)] text-[#C8CBE0] hover:bg-[rgba(99,102,241,0.2)] disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {adding ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                添加博主
              </button>
            </form>
            {addError && (
              <div className="flex items-center gap-2 text-xs text-red-400 mt-2">
                <AlertCircle size={13} />{addError}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-[#2E3045] overflow-hidden bg-[rgb(12,14,20)]">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2E3045]">
                  {['达人', '语言', '粉丝量', '视频数', '播放量', '互动量', '互动率', '更新时间', '操作'].map(h => (
                    <th key={h} className="px-3 py-3 text-left text-[11px] font-medium text-[#8A8FA8] first:px-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {creatorRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-16 text-sm text-[#555873]">
                      {loadingCreators ? '加载中…' : '暂无 ideaShell 合作博主，请添加'}
                    </td>
                  </tr>
                ) : creatorRows.map(c => (
                  <CreatorRow
                    key={c.id}
                    creator={c}
                    onRefresh={handleRefresh}
                    onDelete={handleDelete}
                    refreshing={refreshing}
                    deleting={deleting}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'videos' && (
        <div className="rounded-xl border border-[#2E3045] overflow-hidden bg-[rgb(12,14,20)]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2E3045]">
                {['视频内容', '达人', '发布时间', '播放', '点赞', '评论', '分享', ''].map(h => (
                  <th key={h} className="px-3 py-3 text-left text-[11px] font-medium text-[#8A8FA8] first:px-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {videos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-sm text-[#555873]">
                    {loadingVideos || backfilling
                      ? '正在加载视频…'
                      : '暂无视频，可先刷新博主或等待自动抓取完成'}
                  </td>
                </tr>
              ) : videos.map(v => <VideoRow key={v.id} video={v} />)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
