export type AppId = 'turbo' | 'studley' | 'coconote'

export interface Creator {
  id: string
  username: string
  displayName: string
  avatarUrl: string
  followers: number
  totalVideos: number
  avgLikes: number
  apps: AppId[]
}

export interface Video {
  id: string
  title: string
  thumbnailUrl: string
  tiktokUrl: string
  app: AppId
  creator: Creator
  publishedAt: string
  likes: number
  comments: number
  saves: number
  shares: number
  tags: string[]
  script?: string
  hookType?: 'question' | 'story' | 'shock' | 'trend' | 'review'
  transcriptText?: string
  transcriptStatus?: 'pending' | 'ready' | 'no_transcript' | 'error'
  breakdown?: ScriptBreakdown | null
  aiStatus?: 'pending' | 'ready' | 'error' | 'skipped'
  analysisSource?: 'transcript' | 'inferred' | 'asr'
  inferredFrom?: string
  views?: number
}

export interface ScriptBreakdown {
  hook: string
  painPoint: string
  structure: string[]
  productPlacement: string
  cta: string
  reusableIdeas: string[]
}

export interface AppConfig {
  id: AppId
  name: string
  color: string
  bgColor: string
  borderColor: string
}

export interface WeeklyStats {
  week: string
  turbo: number
  studley: number
  coconote: number
}
