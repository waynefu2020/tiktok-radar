import { AppConfig } from '../types'

// 兜底默认配置，在 API 未返回前使用
export const DEFAULT_APP_CONFIGS: AppConfig[] = [
  {
    id: 'turbo',
    name: 'Turbo AI',
    color: '#6366F1',
    bgColor: 'rgba(99, 102, 241, 0.12)',
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  {
    id: 'studley',
    name: 'Studley',
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  {
    id: 'coconote',
    name: 'Coconote',
    color: '#22D3EE',
    bgColor: 'rgba(34, 211, 238, 0.12)',
    borderColor: 'rgba(34, 211, 238, 0.3)',
  },
]

export const getAppConfig = (id: string, configs: AppConfig[] = DEFAULT_APP_CONFIGS): AppConfig =>
  configs.find((a) => a.id === id) ?? DEFAULT_APP_CONFIGS[0]
