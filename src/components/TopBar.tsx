import { Search, Bell, RefreshCw } from 'lucide-react'

interface Props {
  title: string
  subtitle?: string
  onSearch?: (q: string) => void
}

export default function TopBar({ title, subtitle, onSearch }: Props) {
  return (
    <header
      className="h-[60px] flex items-center px-6 gap-4 backdrop-blur-sm sticky top-0 z-30"
      style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}
    >
      <div className="flex-1 min-w-0">
        <h1 className="text-sm font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>{title}</h1>
        {subtitle && <p className="text-[11px] leading-tight" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>}
      </div>

      {onSearch && (
        <div className="relative w-56">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="搜索视频、达人、标签…"
            onChange={(e) => onSearch(e.target.value)}
            className="w-full rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none transition-colors"
            style={{
              background: 'var(--input-bg)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
            }}
          />
        </div>
      )}

      <button
        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
        style={{ background: 'var(--panel)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
      >
        <RefreshCw size={14} />
      </button>
      <button
        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors relative"
        style={{ background: 'var(--panel)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
      >
        <Bell size={14} />
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }}></span>
      </button>
    </header>
  )
}
