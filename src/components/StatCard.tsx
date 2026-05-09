import { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface Props {
  label: string
  value: string
  change?: string
  changeUp?: boolean
  icon: LucideIcon
  iconColor?: string
}

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}

export { fmt }

export default function StatCard({ label, value, change, changeUp, icon: Icon, iconColor = '#6366F1' }: Props) {
  return (
    <div className="stat-card flex-1">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${iconColor}22` }}>
          <Icon size={14} style={{ color: iconColor }} />
        </div>
      </div>
      <div className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>{value}</div>
      {change && (
        <div className={`flex items-center gap-1 text-xs ${changeUp ? 'text-emerald-500' : 'text-red-500'}`}>
          {changeUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {change} vs 上周
        </div>
      )}
    </div>
  )
}
