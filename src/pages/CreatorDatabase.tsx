import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Users, Heart, Video, ArrowUpDown, Plus, RefreshCw, Trash2, X, Loader2, AlertCircle } from 'lucide-react'
import TopBar from '../components/TopBar'
import AppBadge from '../components/AppBadge'

import { AppId, AppConfig, Creator, Video as TikTokVideo } from '../types'
import { fmt } from '../components/StatCard'
import {
  deleteCreator,
  deleteMonitoredCreator,
  getApps,
  getHiddenCreators,
  getMonitoredCreators,
  getStoredVideos,
  MonitoredCreator,
  parseTikTokUsername,
  saveMonitoredCreator,
  syncAndCacheVideos,
} from '../services/tikhub'

type SortKey = 'followers' | 'totalVideos' | 'avgLikes'
type LocalCreator = MonitoredCreator
type CreatorRow = Creator & { source?: 'local' | 'video' }

function buildCreators(videos: TikTokVideo[]): CreatorRow[] {
  const map = new Map<string, Creator>()
  for (const v of videos) {
    const existing = map.get(v.creator.id)
    if (!existing) {
      map.set(v.creator.id, { ...v.creator, apps: [v.app], totalVideos: 1 })
    } else {
      if (!existing.apps.includes(v.app)) existing.apps.push(v.app)
      existing.totalVideos += 1
    }
  }
  return Array.from(map.values()).map(creator => ({ ...creator, source: 'video' as const }))
}

export default function CreatorDatabase() {
  const [appFilter, setAppFilter] = useState<AppId | 'all'>('all')
  const [sortKey, setSortKey] = useState<SortKey>('followers')
  const [sortAsc, setSortAsc] = useState(false)
  const [localCreators, setLocalCreators] = useState<LocalCreator[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [usernameInput, setUsernameInput] = useState('')
  const [selectedApps, setSelectedApps] = useState<AppId[]>([])
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [refreshing, setRefreshing] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [videos, setVideos] = useState<TikTokVideo[]>([])
  const [loadingVideos, setLoadingVideos] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [appConfigs, setAppConfigs] = useState<AppConfig[]>([])
  const [hiddenUsernames, setHiddenUsernames] = useState<Set<string>>(new Set())

  useEffect(() => {
    getApps().then(setAppConfigs).catch(() => {})
  }, [])

  const allCreators = useMemo<CreatorRow[]>(() => {
    const rows = new Map<string, CreatorRow>()
    for (const creator of buildCreators(videos)) {
      rows.set(creator.username.toLowerCase(), creator)
    }
    for (const creator of localCreators) {
      rows.set(creator.username.toLowerCase(), creator)
    }
    return Array.from(rows.values())
      .filter(creator => !hiddenUsernames.has(creator.username.toLowerCase()))
  }, [hiddenUsernames, localCreators, videos])

  const loadRealVideos = async () => {
    setLoadError('')
    setLoadingVideos(true)
    try {
      const existing = await getStoredVideos()
      const cache = existing.videos.length > 0 ? existing : await syncAndCacheVideos()
      setVideos(cache.videos)
    } catch (err: any) {
      setLoadError(err.message || '获取真实视频失败')
    } finally {
      setLoadingVideos(false)
    }
  }

  const loadLocalCreators = async () => {
    try {
      const [monitored, hidden] = await Promise.all([
        getMonitoredCreators(),
        getHiddenCreators(),
      ])
      setLocalCreators(monitored)
      setHiddenUsernames(new Set(hidden.map(creator => creator.username.toLowerCase())))
    } catch (err: any) {
      setLoadError(err.message || '获取监控账号失败')
    }
  }

  useEffect(() => {
    if (videos.length === 0) loadRealVideos()
    loadLocalCreators()
  }, [])

  const filtered = useMemo(() => {
    return [...allCreators]
      .filter(c => appFilter === 'all' || c.apps.includes(appFilter))
      .sort((a, b) => {
        const diff = a[sortKey] - b[sortKey]
        return sortAsc ? diff : -diff
      })
  }, [allCreators, appFilter, sortAsc, sortKey])

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortAsc(!sortAsc)
    else { setSortKey(k); setSortAsc(false) }
  }

  const toggleApp = (appId: AppId) => {
    setSelectedApps(prev =>
      prev.includes(appId) ? prev.filter(id => id !== appId) : [...prev, appId],
    )
  }

  const closeModal = () => {
    setModalOpen(false)
    setUsernameInput('')
    setSelectedApps([])
    setFormError('')
  }

  const handleAddCreator = async (event: FormEvent) => {
    event.preventDefault()
    setFormError('')
    const username = parseTikTokUsername(usernameInput)

    if (!username) {
      setFormError('请输入 TikTok 账号')
      return
    }
    if (selectedApps.length === 0) {
      setFormError('至少选择一个关联竞品')
      return
    }

    setSaving(true)
    try {
      await saveMonitoredCreator(username, selectedApps)
      await loadLocalCreators()
      closeModal()
    } catch (err: any) {
      setFormError(err.message || '获取达人资料失败')
    } finally {
      setSaving(false)
    }
  }

  const handleRefreshCreator = async (creator: LocalCreator) => {
    setRefreshing(creator.username)
    try {
      await saveMonitoredCreator(creator.username, creator.apps)
      await loadLocalCreators()
    } catch (err: any) {
      alert(err.message || '刷新达人资料失败')
    } finally {
      setRefreshing(null)
    }
  }

  const handleDeleteCreator = async (creator: CreatorRow) => {
    const ok = confirm(`确定从达人库删除 @${creator.username}？\n删除后刷新页面也不会再显示。`)
    if (!ok) return

    setDeleting(creator.username)
    try {
      if (creator.source === 'local') {
        await deleteMonitoredCreator(creator.username)
      }
      await deleteCreator(creator.username)
      setHiddenUsernames(prev => new Set(prev).add(creator.username.toLowerCase()))
      setLocalCreators(prev => prev.filter(item => item.username.toLowerCase() !== creator.username.toLowerCase()))
    } catch (err: any) {
      alert(err.message || '删除达人失败')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="p-6">
      <TopBar
        title="达人库"
        subtitle={`共 ${allCreators.length} 位真实达人 · ${localCreators.length} 位手动监控`}
      />

      <div className="flex items-center justify-between mt-6 mb-5 gap-3">
        <div className="flex items-center gap-2">
          <button className={`filter-btn${appFilter === 'all' ? ' active' : ''}`} onClick={() => setAppFilter('all')}>全部</button>
          {appConfigs.map(app => (
            <button
              key={app.id}
              className={`filter-btn${appFilter === app.id ? ' active' : ''}`}
              onClick={() => setAppFilter(app.id)}
              style={appFilter === app.id ? { borderColor: app.borderColor, color: app.color, backgroundColor: app.bgColor } : {}}
            >
              {app.name}
            </button>
          ))}
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-[#6366F1]/40 bg-[rgba(99,102,241,0.12)] text-[#C8CBE0] hover:bg-[rgba(99,102,241,0.2)] transition-colors"
        >
          <Plus size={13} /> 添加监控账号
        </button>
        <button
          onClick={loadRealVideos}
          disabled={loadingVideos}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-[#2E3045] text-[#8A8FA8] hover:text-[#C8CBE0] disabled:opacity-50 transition-colors"
        >
          {loadingVideos ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
          同步真实达人
        </button>
      </div>

      {loadError && (
        <div className="mb-4 flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
          <AlertCircle size={13} />
          {loadError}
        </div>
      )}

      <div className="rounded-xl border border-[#2E3045] overflow-hidden bg-[rgb(12,14,20)]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#2E3045]">
              <th className="px-4 py-3 text-left text-[11px] font-medium text-[#8A8FA8]">达人</th>
              <th className="px-3 py-3 text-left text-[11px] font-medium text-[#8A8FA8]">合作 App</th>
              <th
                className="px-3 py-3 text-left text-[11px] font-medium text-[#8A8FA8] cursor-pointer hover:text-[#C8CBE0] transition-colors select-none"
                onClick={() => toggleSort('followers')}
              >
                <div className="flex items-center gap-1">粉丝量 <ArrowUpDown size={10} /></div>
              </th>
              <th
                className="px-3 py-3 text-left text-[11px] font-medium text-[#8A8FA8] cursor-pointer hover:text-[#C8CBE0] transition-colors select-none"
                onClick={() => toggleSort('totalVideos')}
              >
                <div className="flex items-center gap-1">视频数 <ArrowUpDown size={10} /></div>
              </th>
              <th
                className="px-3 py-3 text-left text-[11px] font-medium text-[#8A8FA8] cursor-pointer hover:text-[#C8CBE0] transition-colors select-none"
                onClick={() => toggleSort('avgLikes')}
              >
                <div className="flex items-center gap-1">平均点赞 <ArrowUpDown size={10} /></div>
              </th>
              <th className="px-3 py-3 text-left text-[11px] font-medium text-[#8A8FA8]">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-16 text-sm text-[#555873]">
                  {loadingVideos ? '正在获取真实达人…' : '暂无真实达人，请同步真实数据或添加监控账号'}
                </td>
              </tr>
            ) : filtered.map(creator => {
              const isLocal = creator.source === 'local'
              return (
                <tr key={creator.id} className="table-row">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {creator.avatarUrl ? (
                        <img
                          src={creator.avatarUrl}
                          alt=""
                          className="w-9 h-9 rounded-full shrink-0 bg-[rgb(28,30,42)]"
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full shrink-0 bg-[rgb(28,30,42)] border border-[#2E3045] flex items-center justify-center text-xs text-[#8A8FA8]">
                          {creator.username.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="text-sm text-white font-medium">{creator.displayName}</div>
                          {isLocal && <span className="text-[10px] text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 rounded px-1.5 py-0.5">监控中</span>}
                        </div>
                        <a
                          href={`https://www.tiktok.com/@${creator.username}`}
                          target="_blank"
                          rel="noreferrer"
                          className="block text-xs text-[#8A8FA8] hover:text-[#22D3EE] transition-colors truncate"
                          title="打开 TikTok 达人主页"
                        >
                          @{creator.username}
                        </a>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex gap-1.5 flex-wrap">
                      {creator.apps.map(a => <AppBadge key={a} app={a} size="sm" configs={appConfigs} />)}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5 text-sm text-[#C8CBE0]">
                      <Users size={12} className="text-[#8A8FA8]" />
                      {fmt(creator.followers)}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5 text-sm text-[#C8CBE0]">
                      <Video size={12} className="text-[#8A8FA8]" />
                      {creator.totalVideos}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5 text-sm text-[#C8CBE0]">
                      <Heart size={12} className="text-rose-400" />
                      {fmt(creator.avgLikes)}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      {isLocal && (
                        <button
                          title="刷新资料"
                          onClick={() => handleRefreshCreator(creator as LocalCreator)}
                          disabled={refreshing === creator.username}
                          className="w-7 h-7 rounded-md flex items-center justify-center bg-[rgb(28,30,42)] border border-[#2E3045] text-[#8A8FA8] hover:text-[#6366F1] hover:border-[#6366F1]/40 disabled:opacity-50 transition-colors"
                        >
                          {refreshing === creator.username ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                        </button>
                      )}
                        <button
                        title="删除达人"
                        onClick={() => handleDeleteCreator(creator)}
                        disabled={deleting === creator.username}
                        className="w-7 h-7 rounded-md flex items-center justify-center bg-[rgb(28,30,42)] border border-[#2E3045] text-[#8A8FA8] hover:text-red-400 hover:border-red-500/40 disabled:opacity-50 transition-colors"
                        >
                        {deleting === creator.username ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                        </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <form
            onSubmit={handleAddCreator}
            className="w-full max-w-md rounded-xl border border-[#2E3045] bg-[rgb(12,14,20)] shadow-2xl"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#2E3045]">
              <div>
                <div className="text-sm font-semibold text-white">添加监控账号</div>
                <div className="text-xs text-[#8A8FA8] mt-0.5">从 TikHub 拉取 TikTok 达人资料</div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8A8FA8] hover:text-[#C8CBE0] hover:bg-[rgb(28,30,42)] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <label className="block">
                <span className="text-xs font-medium text-[#C8CBE0]">TikTok 账号</span>
                <input
                  value={usernameInput}
                  onChange={e => setUsernameInput(e.target.value)}
                  placeholder="@username 或 TikTok 主页链接"
                  className="mt-2 w-full bg-[rgb(28,30,42)] border border-[#2E3045] rounded-lg px-3 py-2 text-sm text-[#C8CBE0] placeholder-[#555873] focus:outline-none focus:border-[#6366F1]/50 transition-colors"
                />
              </label>

              <div>
                <div className="text-xs font-medium text-[#C8CBE0] mb-2">关联竞品</div>
                <div className="flex flex-wrap gap-2">
                  {appConfigs.map(app => {
                    const active = selectedApps.includes(app.id)
                    return (
                      <button
                        type="button"
                        key={app.id}
                        onClick={() => toggleApp(app.id)}
                        className="px-3 py-1.5 rounded-lg text-xs border transition-colors"
                        style={active
                          ? { borderColor: app.borderColor, color: app.color, backgroundColor: app.bgColor }
                          : { borderColor: '#2E3045', color: '#8A8FA8', backgroundColor: 'transparent' }}
                      >
                        {app.name}
                      </button>
                    )
                  })}
                </div>
              </div>

              {formError && (
                <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                  <AlertCircle size={13} />
                  {formError}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 px-5 py-4 border-t border-[#2E3045]">
              <button
                type="button"
                onClick={closeModal}
                className="px-3 py-1.5 rounded-lg text-xs border border-[#2E3045] text-[#8A8FA8] hover:text-[#C8CBE0] transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-[#6366F1]/40 bg-[rgba(99,102,241,0.12)] text-[#C8CBE0] hover:bg-[rgba(99,102,241,0.2)] disabled:opacity-50 transition-colors"
              >
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                {saving ? '拉取中' : '添加'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
