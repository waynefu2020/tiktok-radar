import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, ExternalLink, Image, Loader2, RefreshCw, Video as VideoIcon } from 'lucide-react'
import TopBar from '../components/TopBar'
import AppBadge from '../components/AppBadge'
import { fmt } from '../components/StatCard'
import { AppConfig, Video } from '../types'
import { getApps, getStoredVideos, sortVideosByNewest, syncAndCacheVideos } from '../services/tikhub'
import { videoThumbnailFallback } from '../utils/media'

export default function Downloads() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [appConfigs, setAppConfigs] = useState<AppConfig[]>([])

  const sorted = useMemo(() => sortVideosByNewest(videos), [videos])

  useEffect(() => {
    getApps().then(setAppConfigs).catch(() => {})
  }, [])

  const loadVideos = async () => {
    setError('')
    setLoading(true)
    try {
      const existing = await getStoredVideos()
      const cache = existing.videos.length > 0 ? existing : await syncAndCacheVideos()
      setVideos(cache.videos)
    } catch (err: any) {
      setError(err.message || '获取真实素材失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (videos.length === 0) loadVideos()
  }, [])

  return (
    <div className="p-6">
      <TopBar title="素材下载" subtitle={videos.length ? `${videos.length} 条真实视频素材` : '正在加载真实视频素材'} />

      <div className="mt-6 mb-4 flex items-center gap-3">
        <button
          onClick={loadVideos}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-[#6366F1]/40 bg-[rgba(99,102,241,0.08)] text-[#818CF8] hover:bg-[rgba(99,102,241,0.15)] disabled:opacity-40 transition-colors"
        >
          {loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
          同步真实素材
        </button>
        {error && (
          <div className="flex items-center gap-1.5 text-xs text-red-400">
            <AlertCircle size={13} /> {error}
          </div>
        )}
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-xl border border-[#2E3045] bg-[rgb(12,14,20)] py-16 text-center text-sm text-[#555873]">
          {loading ? '正在获取真实素材…' : '暂无真实素材，请检查 API 后重试同步'}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {sorted.map(video => (
            <div key={video.id} className="rounded-xl border border-[#2E3045] bg-[rgb(12,14,20)] p-4 flex items-start gap-4">
              <img
                src={video.thumbnailUrl || videoThumbnailFallback(video.title)}
                alt=""
                className="w-28 h-36 rounded-lg object-cover shrink-0 bg-[rgb(28,30,42)]"
                loading="lazy"
                onError={e => { (e.target as HTMLImageElement).src = videoThumbnailFallback(video.title) }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <AppBadge app={video.app} size="sm" configs={appConfigs} />
                  <span className="text-xs text-[#8A8FA8]">@{video.creator.username}</span>
                  <span className="text-xs text-[#555873]">{video.publishedAt}</span>
                </div>
                <div className="text-sm font-medium text-white leading-snug line-clamp-2 mb-2">{video.title}</div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {video.tags.slice(0, 4).map(tag => <span key={tag} className="tag-badge">#{tag}</span>)}
                </div>
                <div className="flex items-center gap-3 text-xs text-[#8A8FA8] mb-4">
                  <span>{fmt(video.likes)} 赞</span>
                  <span>{fmt(video.comments)} 评论</span>
                  <span>{fmt(video.shares)} 分享</span>
                </div>
                <div className="flex items-center gap-2">
                  {video.thumbnailUrl && (
                    <a
                      href={video.thumbnailUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-[#2E3045] text-[#8A8FA8] hover:text-[#C8CBE0] transition-colors"
                    >
                      <Image size={12} /> 打开封面
                    </a>
                  )}
                  <a
                    href={video.tiktokUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-[#2E3045] text-[#8A8FA8] hover:text-[#22D3EE] transition-colors"
                  >
                    <ExternalLink size={12} /> 原视频
                  </a>
                  <span className="ml-auto flex items-center gap-1 text-xs text-[#555873]">
                    <VideoIcon size={12} /> TikHub
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
