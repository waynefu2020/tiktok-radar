import { NavLink } from 'react-router-dom'
import { Radar, LayoutDashboard, TrendingUp, Users, BookOpen, Settings, Box, BarChart3, Shell, Sun, Moon, LogOut, Shield } from 'lucide-react'
import { useTheme } from './ThemeProvider'
import { useAuth } from './AuthProvider'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'UGC 视频中心' },
  { to: '/trends', icon: TrendingUp, label: '趋势分析' },
  { to: '/creators', icon: Users, label: '达人库' },
  { to: '/apps', icon: Box, label: '竞品管理' },
  { to: '/weekly', icon: BarChart3, label: '爆款周报' },
  { to: '/idea-shell', icon: Shell, label: 'ideaShell UGC' },
]

const bottomItems = [
  { to: '/docs', icon: BookOpen, label: '使用文档' },
  { to: '/settings', icon: Settings, label: '设置' },
]

export default function Sidebar() {
  const { theme, toggleTheme } = useTheme()
  const { user, logout, isAdmin } = useAuth()

  const displayName = user?.displayName || user?.username || '用户'
  const roleLabel = user?.role === 'admin' ? '管理员' : '成员'
  const initial = displayName.slice(0, 1).toUpperCase()

  return (
    <aside
      className="fixed left-0 top-0 h-full z-40 flex flex-col border-r"
      style={{ background: 'var(--sidebar)', borderColor: 'var(--sidebar-border)', width: 240 }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-[60px] border-b shrink-0" style={{ borderColor: 'var(--sidebar-border)' }}>
        <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center shrink-0">
          <Radar size={16} className="text-white" />
        </div>
        <div>
          <div className="text-sm font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>竞品雷达</div>
          <div className="text-[10px] leading-tight" style={{ color: 'var(--text-muted)' }}>ideaShell TikTok</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <Icon size={18} className="shrink-0" />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}

        {isAdmin && (
          <NavLink
            to="/users"
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <Shield size={18} className="shrink-0" />
            <span className="truncate">用户管理</span>
          </NavLink>
        )}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 border-t pt-3 space-y-0.5" style={{ borderColor: 'var(--sidebar-border)' }}>
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="nav-item w-full"
        >
          {theme === 'dark' ? <Sun size={18} className="shrink-0" /> : <Moon size={18} className="shrink-0" />}
          <span className="truncate">{theme === 'dark' ? '切换浅色' : '切换深色'}</span>
        </button>

        {bottomItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <Icon size={18} className="shrink-0" />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}

        {/* User info */}
        <div className="flex items-center gap-2 px-4 py-2.5 mt-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ background: 'var(--accent)' }}
          >
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate" style={{ color: 'var(--text-secondary)' }}>{displayName}</div>
            <div className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>{roleLabel}</div>
          </div>
          <button
            onClick={logout}
            title="退出登录"
            className="w-6 h-6 rounded flex items-center justify-center transition-colors shrink-0"
            style={{ color: 'var(--text-muted)' }}
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </aside>
  )
}
