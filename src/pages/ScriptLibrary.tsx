import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, Check, Copy, ExternalLink, ChevronDown, ChevronUp, Pencil, Save, Loader2, RefreshCw } from 'lucide-react'
import TopBar from '../components/TopBar'
import AppBadge from '../components/AppBadge'
import { APP_CONFIGS } from '../data/appConfig'
import { AppId, ScriptBreakdown, Video } from '../types'
import { applySavedScripts, getStoredVideos, saveVideoScript, syncAndCacheVideos } from '../services/tikhub'

const HOOK_LABELS: Record<string, { label: string; color: string }> = {
  question:  { label: '疑问式', color: '#6366F1' },
  story:     { label: '故事式', color: '#10B981' },
  shock:     { label: '震撼式', color: '#F43F5E' },
  trend:     { label: '蹭热点', color: '#F59E0B' },
  review:    { label: '测评式', color: '#22D3EE' },
}

const SCRIPT_SECTIONS = ['开场钩子', '痛点', '产品展示', 'CTA']

function BreakdownView({ breakdown }: { breakdown: ScriptBreakdown }) {
  return (
    <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
      <div className="rounded-lg bg-[rgb(18,20,28)] border border-[#2E3045] p-3">
        <div className="text-[#8A8FA8] mb-1">开场钩子</div>
        <div className="text-[#C8CBE0] leading-relaxed">{breakdown.hook}</div>
      </div>
      <div className="rounded-lg bg-[rgb(18,20,28)] border border-[#2E3045] p-3">
        <div className="text-[#8A8FA8] mb-1">痛点</div>
        <div className="text-[#C8CBE0] leading-relaxed">{breakdown.painPoint}</div>
      </div>
      <div className="rounded-lg bg-[rgb(18,20,28)] border border-[#2E3045] p-3 col-span-2">
        <div className="text-[#8A8FA8] mb-2">内容结构</div>
        <ol className="space-y-1 text-[#C8CBE0] list-decimal list-inside">
          {breakdown.structure.map((item, idx) => <li key={idx}>{item}</li>)}
        </ol>
      </div>
      <div className="rounded-lg bg-[rgb(18,20,28)] border border-[#2E3045] p-3">
        <div className="text-[#8A8FA8] mb-1">产品植入</div>
        <div className="text-[#C8CBE0] leading-relaxed">{breakdown.productPlacement}</div>
      </div>
      <div className="rounded-lg bg-[rgb(18,20,28)] border border-[#2E3045] p-3">
        <div className="text-[#8A8FA8] mb-1">CTA</div>
        <div className="text-[#C8CBE0] leading-relaxed">{breakdown.cta}</div>
      </div>
    </div>
  )
}

function ScriptCard({ video, onSaved }: { video: Video; onSaved: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [scriptText, setScriptText] = useState(video.script ?? '')
  const [hookType, setHookType] = useState<Video['hookType']>(video.hookType)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSave = () => {
    saveVideoScript(video.id, { script: scriptText, hookType }).then(() => {
      setEditing(false)
      onSaved()
    })
  }

  const hook = hookType ? HOOK_LABELS[hookType] : null

  return (
    <div className="rounded-xl border border-[#2E3045] bg-[rgb(12,14,20)] overflow-hidden">
      <div
        className="flex items-start gap-4 p-4 cursor-pointer hover:bg-[rgb(18,20,28)] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <img src={video.thumbnailUrl} alt="" className="w-20 h-11 rounded-lg object-cover shrink-0 bg-[rgb(28,30,42)]" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-1.5">
            <p className="text-sm text-white leading-snug flex-1 line-clamp-2">{video.title}</p>
            {hook && (
              <span
                className="shrink-0 text-[10px] px-2 py-0.5 rounded-full border font-medium"
                style={{ color: hook.color, borderColor: `${hook.color}40`, backgroundColor: `${hook.color}14` }}
              >
                {hook.label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <AppBadge app={video.app} size="sm" />
            <span className="text-xs text-[#8A8FA8]">@{video.creator.username}</span>
            <span className="text-xs text-[#555873]">{video.publishedAt}</span>
          </div>
        </div>
        <div className="shrink-0 text-[#8A8FA8]">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-[#2E3045]/60 p-4 bg-[rgb(10,12,16)]">
          <div className="flex gap-2 mb-3 flex-wrap">
            {SCRIPT_SECTIONS.map(s => (
              <span key={s} className="text-[10px] px-2 py-0.5 rounded bg-[rgb(42,45,62)] text-[#8A8FA8]">{s}</span>
            ))}
          </div>

          <div className="mb-3 flex items-center gap-2">
            <span className="text-xs text-[#8A8FA8]">钩子类型</span>
            <select
              value={hookType ?? ''}
              onChange={e => setHookType((e.target.value || undefined) as Video['hookType'])}
              disabled={!editing}
              className="bg-[rgb(18,20,28)] border border-[#2E3045] rounded-lg px-2 py-1 text-xs text-[#C8CBE0] focus:outline-none focus:border-[#6366F1]/50 disabled:opacity-60"
            >
              <option value="">未分类</option>
              {Object.entries(HOOK_LABELS).map(([value, item]) => (
                <option key={value} value={value}>{item.label}</option>
              ))}
            </select>
          </div>

          {editing ? (
            <textarea
              value={scriptText}
              onChange={e => setScriptText(e.target.value)}
              className="w-full bg-[rgb(18,20,28)] border border-[#6366F1]/40 rounded-lg p-3 text-xs text-[#C8CBE0] leading-relaxed font-sans resize-none focus:outline-none"
              rows={12}
              placeholder="填写这条真实视频的脚本拆解..."
            />
          ) : (
            <div className="space-y-3">
              <pre className="text-xs text-[#C8CBE0] whitespace-pre-wrap leading-relaxed font-sans bg-[rgb(18,20,28)] rounded-lg p-3">
                {video.transcriptText || scriptText || <span className="text-[#555873] italic">暂无真实字幕，点击 UGC 页脚本按钮生成，或点击编辑添加备注</span>}
              </pre>
              {video.breakdown && <BreakdownView breakdown={video.breakdown} />}
            </div>
          )}

          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handleCopy}
              disabled={!scriptText}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[rgba(99,102,241,0.12)] border border-[rgba(99,102,241,0.3)] text-[#818CF8] hover:bg-[rgba(99,102,241,0.2)] disabled:opacity-40 transition-colors"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? '已复制' : '复制脚本'}
            </button>
            <button
              onClick={editing ? handleSave : () => setEditing(true)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[rgb(28,30,42)] border border-[#2E3045] text-[#8A8FA8] hover:text-[#C8CBE0] transition-colors"
            >
              {editing ? <><Save size={12} /> 保存</> : <><Pencil size={12} /> 编辑</>}
            </button>
            <a
              href={video.tiktokUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[rgb(28,30,42)] border border-[#2E3045] text-[#8A8FA8] hover:text-[#22D3EE] transition-colors ml-auto"
            >
              <ExternalLink size={12} /> 看原视频
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ScriptLibrary() {
  const [appFilter, setAppFilter] = useState<AppId | 'all'>('all')
  const [hookFilter, setHookFilter] = useState<string>('all')
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const reloadSavedScripts = async () => {
    const cache = await getStoredVideos()
    setVideos(await applySavedScripts(cache.videos))
  }

  const loadVideos = async () => {
    setError('')
    setLoading(true)
    try {
      const existing = await getStoredVideos()
      const cache = existing.videos.length > 0 ? existing : await syncAndCacheVideos()
      setVideos(await applySavedScripts(cache.videos))
    } catch (err: any) {
      setError(err.message || '获取真实视频失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (videos.length === 0) loadVideos()
  }, [])

  const filtered = useMemo(() => videos.filter(v => {
    if (appFilter !== 'all' && v.app !== appFilter) return false
    if (hookFilter !== 'all' && v.hookType !== hookFilter) return false
    return true
  }), [videos, appFilter, hookFilter])

  const withScript = filtered.filter(v => v.script)
  const withoutScript = filtered.filter(v => !v.script)

  return (
    <div className="p-6">
      <TopBar
        title="脚本拆解"
        subtitle={`${withScript.length} 条已有脚本 · ${withoutScript.length} 条待填写 · ${videos.length} 条真实视频`}
      />

      <div className="mt-6 flex items-center gap-3 flex-wrap mb-5">
        <button
          onClick={loadVideos}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-[#6366F1]/40 bg-[rgba(99,102,241,0.08)] text-[#818CF8] hover:bg-[rgba(99,102,241,0.15)] disabled:opacity-40 transition-colors"
        >
          {loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
          同步真实视频
        </button>
        {error && (
          <div className="flex items-center gap-1.5 text-xs text-red-400">
            <AlertCircle size={13} /> {error}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 flex-wrap mb-5">
        <div className="flex items-center gap-2">
          <button className={`filter-btn${appFilter === 'all' ? ' active' : ''}`} onClick={() => setAppFilter('all')}>全部 App</button>
          {APP_CONFIGS.map(app => (
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
        <div className="flex items-center gap-2">
          <button className={`filter-btn${hookFilter === 'all' ? ' active' : ''}`} onClick={() => setHookFilter('all')}>所有类型</button>
          {Object.entries(HOOK_LABELS).map(([k, v]) => (
            <button
              key={k}
              className={`filter-btn${hookFilter === k ? ' active' : ''}`}
              onClick={() => setHookFilter(k)}
              style={hookFilter === k ? { borderColor: `${v.color}40`, color: v.color, backgroundColor: `${v.color}12` } : {}}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-[#2E3045] bg-[rgb(12,14,20)] py-16 text-center text-sm text-[#555873]">
          {loading ? '正在获取真实视频…' : '暂无真实视频可拆解，请检查 API 后重试同步'}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(v => <ScriptCard key={v.id} video={v} onSaved={reloadSavedScripts} />)}
        </div>
      )}
    </div>
  )
}
