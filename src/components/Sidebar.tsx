import { NavLink } from 'react-router-dom'
import { Radar, LayoutDashboard, TrendingUp, FileText, Download, Users, BookOpen, Settings, Box } from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'UGC 视频中心' },
  { to: '/trends', icon: TrendingUp, label: '趋势分析' },
  { to: '/scripts', icon: FileText, label: '脚本拆解' },
  { to: '/downloads', icon: Download, label: '素材下载' },
  { to: '/creators', icon: Users, label: '达人库' },
  { to: '/apps', icon: Box, label: '竞品管理' },
]

const bottomItems = [
  { to: '/docs', icon: BookOpen, label: '使用文档' },
  { to: '/settings', icon: Settings, label: '设置' },
]

export default function Sidebar() {
  return (
    <aside
      className="fixed left-0 top-0 h-full z-40 flex flex-col border-r border-[#2E3045]"
      style={{ background: 'rgba(20, 22, 31, 0.98)', width: 240 }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-[60px] border-b border-[#2E3045]/50 shrink-0">
        <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center shrink-0">
          <Radar size={16} className="text-white" />
        </div>
        <div>
          <div className="text-sm font-bold text-white leading-tight">竞品雷达</div>
          <div className="text-[10px] text-[#8A8FA8] leading-tight">ideaShell TikTok</div>
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
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 border-t border-[#2E3045]/50 pt-3 space-y-0.5">
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

        {/* User avatar */}
        <div className="flex items-center gap-2 px-4 py-2.5 mt-2">
          <div className="w-7 h-7 rounded-full gradient-bg flex items-center justify-center text-white text-xs font-bold shrink-0">
            大
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-[#C8CBE0] truncate">大威</div>
            <div className="text-[10px] text-[#8A8FA8] truncate">ideaShell 运营</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
