import { Search, Bell, RefreshCw } from 'lucide-react'

interface Props {
  title: string
  subtitle?: string
  onSearch?: (q: string) => void
}

export default function TopBar({ title, subtitle, onSearch }: Props) {
  return (
    <header className="h-[60px] border-b border-[#2E3045] flex items-center px-6 gap-4 bg-[rgba(10,12,16,0.8)] backdrop-blur-sm sticky top-0 z-30">
      <div className="flex-1 min-w-0">
        <h1 className="text-sm font-semibold text-white leading-tight">{title}</h1>
        {subtitle && <p className="text-[11px] text-[#8A8FA8] leading-tight">{subtitle}</p>}
      </div>

      {onSearch && (
        <div className="relative w-56">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8FA8]" />
          <input
            type="text"
            placeholder="搜索视频、达人、标签…"
            onChange={(e) => onSearch(e.target.value)}
            className="w-full bg-[rgb(28,30,42)] border border-[#2E3045] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#C8CBE0] placeholder-[#555873] focus:outline-none focus:border-[#6366F1]/50 transition-colors"
          />
        </div>
      )}

      <button className="w-8 h-8 rounded-lg bg-[rgb(28,30,42)] border border-[#2E3045] flex items-center justify-center text-[#8A8FA8] hover:text-[#C8CBE0] hover:border-[#6366F1]/40 transition-colors">
        <RefreshCw size={14} />
      </button>
      <button className="w-8 h-8 rounded-lg bg-[rgb(28,30,42)] border border-[#2E3045] flex items-center justify-center text-[#8A8FA8] hover:text-[#C8CBE0] hover:border-[#6366F1]/40 transition-colors relative">
        <Bell size={14} />
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#6366F1] rounded-full"></span>
      </button>
    </header>
  )
}
