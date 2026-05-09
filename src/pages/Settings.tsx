import { useState, useEffect } from 'react'
import { Shield, User, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import TopBar from '../components/TopBar'
import { useAuth } from '../components/AuthProvider'
import { changePassword } from '../services/auth'

export default function Settings() {
  const { user } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000)
      return () => clearTimeout(timer)
    }
  }, [success])

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('请填写所有密码字段')
      return
    }
    if (newPassword.length < 6) {
      setError('新密码至少6位')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('两次输入的新密码不一致')
      return
    }
    if (!user) return
    setSaving(true)
    try {
      await changePassword(user.id, currentPassword, newPassword)
      setSuccess('密码修改成功')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setError(err.message || '修改密码失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6">
      <TopBar title="设置" subtitle="账号与密码管理" />

      <div className="max-w-lg mt-6 space-y-5">
        {/* 用户信息卡片 */}
        <div
          className="rounded-xl border p-5"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>当前账号</h3>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
              style={{ background: 'var(--accent)' }}
            >
              {(user?.displayName || user?.username || '?').slice(0, 1).toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {user?.displayName || user?.username}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>@{user?.username}</span>
                {user?.role === 'admin' ? (
                  <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-500">
                    <Shield size={9} /> 管理员
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full border" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                    <User size={9} /> 成员
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 修改密码 */}
        <div
          className="rounded-xl border p-5"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>修改密码</h3>

          {error && (
            <div className="mb-3 flex items-center gap-2 text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <AlertCircle size={13} /> {error}
            </div>
          )}
          {success && (
            <div className="mb-3 flex items-center gap-2 text-xs text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
              <CheckCircle2 size={13} /> {success}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text-muted)' }}>当前密码</label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="输入当前密码"
                  className="w-full rounded-lg px-3 py-2 text-xs focus:outline-none pr-8"
                  style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-2 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                  {showCurrent ? <EyeOff size={12} /> : <Eye size={12} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text-muted)' }}>新密码</label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="至少6位"
                  className="w-full rounded-lg px-3 py-2 text-xs focus:outline-none pr-8"
                  style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-2 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                  {showNew ? <EyeOff size={12} /> : <Eye size={12} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text-muted)' }}>确认新密码</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="再次输入新密码"
                  className="w-full rounded-lg px-3 py-2 text-xs focus:outline-none pr-8"
                  style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-2 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                  {showConfirm ? <EyeOff size={12} /> : <Eye size={12} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg text-white transition-colors disabled:opacity-50"
              style={{ background: 'var(--accent)' }}
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : null}
              {saving ? '保存中…' : '修改密码'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
