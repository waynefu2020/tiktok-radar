import { useState, useEffect } from 'react'
import { Plus, Trash2, Loader2, Shield, User, AlertCircle, CheckCircle2, Eye, EyeOff, Pencil, Save, X } from 'lucide-react'
import TopBar from '../components/TopBar'
import { useAuth } from '../components/AuthProvider'
import { getUsers, registerUser, deleteUser, adminResetPassword, updateUser } from '../services/auth'
import { User as UserType } from '../types/auth'

export default function UserManagement() {
  const { user: currentUser, isAdmin } = useAuth()
  const [users, setUsers] = useState<UserType[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [formUsername, setFormUsername] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formDisplayName, setFormDisplayName] = useState('')
  const [formRole, setFormRole] = useState<'user' | 'admin'>('user')
  const [showFormPassword, setShowFormPassword] = useState(false)
  const [saving, setSaving] = useState(false)

  const [resetTarget, setResetTarget] = useState<UserType | null>(null)
  const [resetPassword, setResetPassword] = useState('')
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [resetting, setResetting] = useState(false)

  const [editingUser, setEditingUser] = useState<UserType | null>(null)
  const [editDisplayName, setEditDisplayName] = useState('')
  const [editRole, setEditRole] = useState<'user' | 'admin'>('user')
  const [editSaving, setEditSaving] = useState(false)

  const loadUsers = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getUsers()
      setUsers(data)
    } catch (err: any) {
      setError(err.message || '获取用户列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin) loadUsers()
  }, [isAdmin])

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000)
      return () => clearTimeout(timer)
    }
  }, [success])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!formUsername.trim() || !formPassword) {
      setError('用户名和密码必填')
      return
    }
    setSaving(true)
    try {
      await registerUser({
        username: formUsername.trim(),
        password: formPassword,
        displayName: formDisplayName.trim() || undefined,
        role: formRole,
      })
      setSuccess(`用户 ${formUsername.trim()} 创建成功`)
      setFormUsername('')
      setFormPassword('')
      setFormDisplayName('')
      setFormRole('user')
      setShowForm(false)
      await loadUsers()
    } catch (err: any) {
      setError(err.message || '创建用户失败')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (u: UserType) => {
    if (!confirm(`确定删除用户 "${u.displayName || u.username}"？\n此操作不可撤销。`)) return
    setError('')
    try {
      await deleteUser(u.id)
      setSuccess(`已删除用户 ${u.username}`)
      await loadUsers()
    } catch (err: any) {
      setError(err.message || '删除失败')
    }
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetTarget || !resetPassword) return
    setError('')
    setSuccess('')
    setResetting(true)
    try {
      await adminResetPassword(resetTarget.id, resetPassword)
      setSuccess(`已重置 ${resetTarget.username} 的密码`)
      setResetTarget(null)
      setResetPassword('')
    } catch (err: any) {
      setError(err.message || '重置密码失败')
    } finally {
      setResetting(false)
    }
  }

  const startEdit = (u: UserType) => {
    setEditingUser(u)
    setEditDisplayName(u.displayName || '')
    setEditRole(u.role)
    setError('')
  }

  const cancelEdit = () => {
    setEditingUser(null)
    setEditDisplayName('')
    setEditRole('user')
  }

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return
    setError('')
    setSuccess('')
    setEditSaving(true)
    try {
      await updateUser(editingUser.id, {
        displayName: editDisplayName.trim(),
        role: editRole,
      })
      setSuccess(`已更新 ${editingUser.username} 的资料`)
      setEditingUser(null)
      await loadUsers()
    } catch (err: any) {
      setError(err.message || '更新用户资料失败')
    } finally {
      setEditSaving(false)
    }
  }

  if (!isAdmin) {
    return (
      <div className="p-6">
        <TopBar title="用户管理" />
        <div className="mt-20 flex flex-col items-center gap-3 text-center">
          <Shield size={32} style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>仅管理员可访问</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>请联系管理员获取权限</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <TopBar title="用户管理" subtitle={`共 ${users.length} 位用户 · 管理员可创建/删除/重置密码`} />

      {error && (
        <div className="mt-4 flex items-center gap-2 text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          <AlertCircle size={13} /> {error}
        </div>
      )}
      {success && (
        <div className="mt-4 flex items-center gap-2 text-xs text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
          <CheckCircle2 size={13} /> {success}
        </div>
      )}

      <div className="mt-5 mb-4">
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors"
          style={{ borderColor: 'var(--accent)', color: 'var(--accent)', background: 'rgba(99,102,241,0.08)' }}
        >
          {showForm ? null : <Plus size={13} />}
          {showForm ? '取消' : '添加用户'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleAdd}
          className="mb-5 rounded-xl border p-4 space-y-3"
          style={{ background: 'var(--panel)', borderColor: 'var(--border)' }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text-muted)' }}>用户名 *</label>
              <input
                value={formUsername}
                onChange={e => setFormUsername(e.target.value)}
                placeholder="英文用户名"
                className="w-full rounded-lg px-3 py-2 text-xs focus:outline-none"
                style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text-muted)' }}>密码 *</label>
              <div className="relative">
                <input
                  type={showFormPassword ? 'text' : 'password'}
                  value={formPassword}
                  onChange={e => setFormPassword(e.target.value)}
                  placeholder="至少6位"
                  className="w-full rounded-lg px-3 py-2 text-xs focus:outline-none pr-8"
                  style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
                <button type="button" onClick={() => setShowFormPassword(!showFormPassword)} className="absolute right-2 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                  {showFormPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text-muted)' }}>显示名</label>
              <input
                value={formDisplayName}
                onChange={e => setFormDisplayName(e.target.value)}
                placeholder="如：张三"
                className="w-full rounded-lg px-3 py-2 text-xs focus:outline-none"
                style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text-muted)' }}>角色</label>
              <select
                value={formRole}
                onChange={e => setFormRole(e.target.value as 'user' | 'admin')}
                className="w-full rounded-lg px-3 py-2 text-xs focus:outline-none cursor-pointer"
                style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              >
                <option value="user">普通用户</option>
                <option value="admin">管理员</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg text-white transition-colors disabled:opacity-50"
            style={{ background: 'var(--accent)' }}
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
            {saving ? '创建中…' : '创建用户'}
          </button>
        </form>
      )}

      {resetTarget && (
        <form
          onSubmit={handleReset}
          className="mb-5 rounded-xl border p-4 space-y-3"
          style={{ background: 'var(--panel)', borderColor: 'var(--border)' }}
        >
          <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            重置密码：{resetTarget.displayName || resetTarget.username}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type={showResetPassword ? 'text' : 'password'}
                value={resetPassword}
                onChange={e => setResetPassword(e.target.value)}
                placeholder="输入新密码"
                className="w-full rounded-lg px-3 py-2 text-xs focus:outline-none pr-8"
                style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
              <button type="button" onClick={() => setShowResetPassword(!showResetPassword)} className="absolute right-2 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                {showResetPassword ? <EyeOff size={12} /> : <Eye size={12} />}
              </button>
            </div>
            <button
              type="submit"
              disabled={resetting || !resetPassword}
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg text-white transition-colors disabled:opacity-50"
              style={{ background: 'var(--accent)' }}
            >
              {resetting ? <Loader2 size={12} className="animate-spin" /> : '确认重置'}
            </button>
            <button
              type="button"
              onClick={() => { setResetTarget(null); setResetPassword('') }}
              className="text-xs px-3 py-2 rounded-lg border transition-colors"
              style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
            >
              取消
            </button>
          </div>
        </form>
      )}

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th className="px-4 py-3 text-left text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>用户</th>
              <th className="px-3 py-3 text-left text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>角色</th>
              <th className="px-3 py-3 text-left text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>创建时间</th>
              <th className="px-3 py-3 text-left text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <Loader2 size={16} className="animate-spin inline mr-2" /> 加载中…
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>
                  暂无用户
                </td>
              </tr>
            ) : users.map(u => (
              <tr
                key={u.id}
                className="transition-colors"
                style={{ borderBottom: '1px solid color-mix(in srgb, var(--border) 60%, transparent)' }}
              >
                {editingUser?.id === u.id ? (
                  <>
                    <td className="px-4 py-3" colSpan={4}>
                      <form onSubmit={handleEditSave} className="flex items-center gap-3">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                            style={{ background: 'var(--accent)' }}
                          >
                            {(u.displayName || u.username).slice(0, 1).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>@{u.username}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <input
                                value={editDisplayName}
                                onChange={e => setEditDisplayName(e.target.value)}
                                placeholder="显示名"
                                className="rounded-lg px-2 py-1 text-xs focus:outline-none w-32"
                                style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                              />
                              <select
                                value={editRole}
                                onChange={e => setEditRole(e.target.value as 'user' | 'admin')}
                                className="rounded-lg px-2 py-1 text-xs focus:outline-none cursor-pointer"
                                style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                              >
                                <option value="user">成员</option>
                                <option value="admin">管理员</option>
                              </select>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="submit"
                            disabled={editSaving}
                            className="flex items-center gap-1 text-[10px] px-2 py-1 rounded text-white transition-colors disabled:opacity-50"
                            style={{ background: 'var(--accent)' }}
                          >
                            {editSaving ? <Loader2 size={10} className="animate-spin" /> : <Save size={10} />}
                            保存
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="flex items-center gap-1 text-[10px] px-2 py-1 rounded border transition-colors"
                            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                          >
                            <X size={10} /> 取消
                          </button>
                        </div>
                      </form>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                          style={{ background: 'var(--accent)' }}
                        >
                          {(u.displayName || u.username).slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {u.displayName || u.username}
                          </div>
                          <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>@{u.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      {u.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-500">
                          <Shield size={10} /> 管理员
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                          <User size={10} /> 成员
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                      {new Date(u.createdAt).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEdit(u)}
                          className="w-6 h-6 rounded flex items-center justify-center transition-colors"
                          style={{ color: 'var(--text-muted)' }}
                          title="编辑资料"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() => { setResetTarget(u); setResetPassword('') }}
                          className="text-[10px] px-2 py-1 rounded border transition-colors"
                          style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                        >
                          重置密码
                        </button>
                        {u.id !== currentUser?.id && (
                          <button
                            onClick={() => handleDelete(u)}
                            className="w-6 h-6 rounded flex items-center justify-center transition-colors"
                            style={{ color: 'var(--text-muted)' }}
                            title="删除"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
