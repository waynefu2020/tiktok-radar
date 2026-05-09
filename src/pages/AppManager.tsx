import { useEffect, useState } from 'react'
import { Plus, Trash2, AlertCircle, Loader2, RefreshCw } from 'lucide-react'
import TopBar from '../components/TopBar'
import { useAuth } from '../components/AuthProvider'
import { AppConfig } from '../types'
import { createApp, getApps, removeApp } from '../services/tikhub'

export default function AppManager() {
  const { isAdmin } = useAuth()
  const [apps, setApps] = useState<AppConfig[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    id: '',
    name: '',
    color: '#6366F1',
    keywords: '',
  })

  const loadApps = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getApps()
      setApps(data)
    } catch (err: any) {
      setError(err.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadApps()
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.id || !form.name) return
    setSaving(true)
    setError('')
    try {
      const keywords = form.keywords.split(',').map(k => k.trim()).filter(Boolean)
      await createApp({
        id: form.id.toLowerCase().replace(/\s+/g, '_'),
        name: form.name,
        color: form.color,
        bgColor: `${form.color}1F`,
        borderColor: `${form.color}4D`,
        keywords,
      })
      setForm({ id: '', name: '', color: '#6366F1', keywords: '' })
      await loadApps()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(`确定删除竞品 "${id}"？\n会同时删除该竞品下的所有视频和脚本数据。`)) return
    try {
      await removeApp(id)
      await loadApps()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const presetColors = [
    '#6366F1', '#10B981', '#22D3EE', '#F59E0B', '#F43F5E',
    '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#06B6D4',
  ]

  return (
    <div className="p-6">
      <TopBar
        title="竞品管理"
        subtitle={isAdmin ? `共 ${apps.length} 个竞品 · 在此添加或删除竞品 App` : `共 ${apps.length} 个竞品 · 当前为只读模式`}
      />

      {error && (
        <div className="mt-4 flex items-center gap-2 text-sm text-red-400">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {!isAdmin && (
        <div className="mt-4 flex items-center gap-2 text-sm text-amber-300">
          <AlertCircle size={14} />
          仅管理员可新增、删除和调整竞品配置。
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-6">
        {/* 添加表单 */}
        {isAdmin ? (
          <div className="rounded-xl border border-border bg-bg p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-4">添加竞品</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs text-text-muted mb-1.5">标识 ID（英文，如 astra）</label>
                <input
                  value={form.id}
                  onChange={e => setForm({ ...form, id: e.target.value })}
                  placeholder="astra"
                  className="w-full bg-panel border border-border rounded-lg px-3 py-2 text-sm text-text-secondary placeholder-text-muted/60 focus:outline-none focus:border-[#6366F1]/50"
                />
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1.5">显示名称（如 AstraAI）</label>
                <input
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="AstraAI"
                  className="w-full bg-panel border border-border rounded-lg px-3 py-2 text-sm text-text-secondary placeholder-text-muted/60 focus:outline-none focus:border-[#6366F1]/50"
                />
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1.5">颜色</label>
                <div className="flex flex-wrap gap-2">
                  {presetColors.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm({ ...form, color: c })}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${form.color === c ? 'scale-110 border-white' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1.5">搜索关键词（多个用逗号分隔）</label>
                <input
                  value={form.keywords}
                  onChange={e => setForm({ ...form, keywords: e.target.value })}
                  placeholder="astra ai, astra app"
                  className="w-full bg-panel border border-border rounded-lg px-3 py-2 text-sm text-text-secondary placeholder-text-muted/60 focus:outline-none focus:border-[#6366F1]/50"
                />
                <p className="text-[10px] text-[#555873] mt-1">TikHub 会按这些关键词搜索 TikTok 视频</p>
              </div>
              <button
                type="submit"
                disabled={saving || !form.id || !form.name}
                className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg bg-[rgba(99,102,241,0.12)] border border-[rgba(99,102,241,0.3)] text-[#818CF8] hover:bg-[rgba(99,102,241,0.2)] disabled:opacity-40 transition-colors"
              >
                {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                添加竞品
              </button>
            </form>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-bg p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-4">权限说明</h3>
            <p className="text-sm text-text-muted leading-relaxed">
              普通成员可查看当前竞品列表，但不能新增、删除或修改关键词。
            </p>
          </div>
        )}

        {/* 列表 */}
        <div className="rounded-xl border border-border bg-bg p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-primary">当前竞品</h3>
            <button onClick={loadApps} disabled={loading} className="text-text-muted hover:text-text-secondary transition-colors">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
          {loading && apps.length === 0 ? (
            <div className="text-sm text-[#555873]">加载中...</div>
          ) : apps.length === 0 ? (
            <div className="text-sm text-[#555873]">暂无竞品</div>
          ) : (
            <div className="space-y-3">
              {apps.map(app => (
                <div key={app.id} className="flex items-center gap-3 p-3 rounded-lg bg-panel border border-border">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: app.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-text-secondary font-medium">{app.name}</div>
                    <div className="text-[10px] text-[#555873]">ID: {app.id} · 关键词: {(app.keywords || []).join(', ')}</div>
                  </div>
                  <button
                    onClick={() => handleDelete(app.id)}
                    disabled={!isAdmin}
                    className="text-text-muted hover:text-red-400 transition-colors"
                    title="删除"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
