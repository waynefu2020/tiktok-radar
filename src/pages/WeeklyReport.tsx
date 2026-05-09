import { useState, useEffect } from 'react'
import { TrendingUp, Heart, Eye, Calendar, BarChart3, ExternalLink } from 'lucide-react'
import TopBar from '../components/TopBar'
import { getWeeklyReport } from '../services/tikhub'
import { Video } from '../types'
import { videoThumbnailFallback, creatorAvatarFallback } from '../utils/media'
import AppBadge from '../components/AppBadge'

export default function WeeklyReport() {
  const [report, setReport] = useState<{
    weekStart: string
    weekEnd: string
    viralCount: number
    topVideos: Video[]
    byApp: Record<string, number>
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getWeeklyReport()
      .then(data => {
        setReport(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-400">加载周报失败: {error}</p>
      </div>
    )
  }

  if (!report) return null

  const { weekStart, weekEnd, viralCount, topVideos, byApp } = report

  return (
    <div className="p-6 space-y-6">
      <TopBar title="爆款周报" subtitle={`${weekStart} ~ ${weekEnd}`} />

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-rose-500/20 to-orange-500/20 border border-rose-500/30 rounded-xl p-5">
          <div className="flex items-center gap-2 text-rose-400 mb-2">
            <TrendingUp size={18} />
            <span className="text-sm font-medium">爆款视频</span>
          </div>
          <div className="text-3xl font-bold text-text-primary">{viralCount}</div>
          <div className="text-xs text-rose-300/70 mt-1">本周发现</div>
        </div>

        <div className="bg-bg border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 text-text-muted mb-2">
            <Heart size={18} />
            <span className="text-sm font-medium">最高点赞</span>
          </div>
          <div className="text-3xl font-bold text-text-primary">
            {topVideos[0]?.likes?.toLocaleString() || 0}
          </div>
          <div className="text-xs text-text-muted mt-1">likes</div>
        </div>

        <div className="bg-bg border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 text-text-muted mb-2">
            <Eye size={18} />
            <span className="text-sm font-medium">最高播放</span>
          </div>
          <div className="text-3xl font-bold text-text-primary">
            {topVideos[0]?.views?.toLocaleString() || 0}
          </div>
          <div className="text-xs text-text-muted mt-1">views</div>
        </div>

        <div className="bg-bg border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 text-text-muted mb-2">
            <BarChart3 size={18} />
            <span className="text-sm font-medium">竞品分布</span>
          </div>
          <div className="text-3xl font-bold text-text-primary">
            {Object.keys(byApp).length}
          </div>
          <div className="text-xs text-text-muted mt-1">个 App 有爆款</div>
        </div>
      </div>

      {/* 竞品分布 */}
      <div className="bg-bg border border-border rounded-xl p-5">
        <h3 className="text-sm font-medium text-text-secondary mb-4">竞品爆款分布</h3>
        <div className="flex gap-4">
          {Object.entries(byApp).map(([app, count]) => (
            <div key={app} className="flex items-center gap-2">
              <AppBadge app={app} />
              <span className="text-text-primary font-medium">{count}</span>
              <span className="text-text-muted text-sm">个爆款</span>
            </div>
          ))}
          {Object.keys(byApp).length === 0 && (
            <p className="text-text-muted text-sm">本周暂无爆款数据</p>
          )}
        </div>
      </div>

      {/* Top 视频列表 */}
      <div className="bg-bg border border-border rounded-xl p-5">
        <h3 className="text-sm font-medium text-text-secondary mb-4">爆款视频 TOP 10</h3>
        {topVideos.length === 0 ? (
          <p className="text-text-muted text-sm py-8 text-center">本周暂无爆款数据</p>
        ) : (
          <div className="space-y-3">
            {topVideos.map((video, idx) => (
              <a
                key={video.id}
                href={video.tiktokUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-3 rounded-lg bg-bg hover:bg-bg transition-colors group"
              >
                <span className="text-2xl font-bold text-text-muted w-8">{idx + 1}</span>
                <img
                  src={video.thumbnailUrl || videoThumbnailFallback(video.title)}
                  alt=""
                  className="w-24 h-16 object-cover rounded-lg"
                  onError={e => { e.currentTarget.src = videoThumbnailFallback(video.title) }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-secondary line-clamp-2 leading-tight">
                    {video.title}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-text-muted">
                    <span className="flex items-center gap-1">
                      <Heart size={12} className="text-rose-400" />
                      {video.likes?.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye size={12} />
                      {video.views?.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {video.publishedAt}
                    </span>
                    <AppBadge app={video.app} />
                  </div>
                </div>
                <ExternalLink size={16} className="text-text-muted group-hover:text-text-primary transition-colors" />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
