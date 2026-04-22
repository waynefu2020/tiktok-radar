import { AppId } from '../types'
import { getAppConfig } from '../data/appConfig'

interface Props {
  app: AppId
  size?: 'sm' | 'md'
}

export default function AppBadge({ app, size = 'md' }: Props) {
  const cfg = getAppConfig(app)
  const cls = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1'
  return (
    <span
      className={`inline-flex items-center rounded-md font-medium ${cls}`}
      style={{
        color: cfg.color,
        backgroundColor: cfg.bgColor,
        border: `1px solid ${cfg.borderColor}`,
      }}
    >
      {cfg.name}
    </span>
  )
}
