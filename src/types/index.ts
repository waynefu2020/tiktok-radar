export type AppId = string

export interface AppConfig {
  id: AppId
  name: string
  color: string
  bgColor: string
  borderColor: string
  keywords?: string[]
  createdAt?: string
}

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
  videoUrl?: string
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

export interface WeeklyStats {
  week: string
  [appId: string]: string | number
}
