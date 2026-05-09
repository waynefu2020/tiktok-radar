import { useState, useEffect, useCallback } from 'react'
import { X, ExternalLink, Bell, BellOff } from 'lucide-react'
import { Video } from '../types'
import { getViralVideos } from '../services/tikhub'

interface ViralAlertProps {
  onViewDetails?: (video: Video) => void
}

interface ViralNotification {
  video: Video
  read: boolean
}

const STORAGE_KEY = 'viral_alert_last_checked'

export default function ViralAlert({ onViewDetails }: ViralAlertProps) {
  const [notifications, setNotifications] = useState<ViralNotification[]>([])
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [lastChecked, setLastChecked] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY))
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => {
    const stored = localStorage.getItem('viral_alert_dismissed')
    return stored ? new Set(JSON.parse(stored)) : new Set()
  })

  // 保存已 dismissing 的 ID 到 localStorage
  const saveDismissed = (ids: Set<string>) => {
    localStorage.setItem('viral_alert_dismissed', JSON.stringify([...ids]))
  }

  // 请求通知权限
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return
    const result = await Notification.requestPermission()
    setPermission(result)
  }, [])

  // 检查新爆款视频
  const checkNewViralVideos = useCallback(async () => {
    // 如果没有 lastChecked，跳过检查（避免首次加载显示所有历史爆款）
    if (!lastChecked) {
      setLastChecked(new Date().toISOString())
      localStorage.setItem(STORAGE_KEY, new Date().toISOString())
      return
    }

    try {
      const data = await getViralVideos(lastChecked)
      const newVideos = data.videos.filter(v => !dismissedIds.has(v.id))

      if (newVideos.length > 0) {
        const newNotifications = newVideos.map(video => ({ video, read: false }))

        // 浏览器通知
        if (permission === 'granted') {
          for (const { video } of newNotifications) {
            new Notification('🎉 爆款视频发现！', {
              body: `${video.title.slice(0, 50)} - ${video.likes.toLocaleString()} likes`,
              icon: video.thumbnailUrl || undefined,
              tag: video.id,
            })
          }
        }

        setNotifications(prev => [...newNotifications, ...prev].slice(0, 20))
      }

      // 更新时间戳
      const now = new Date().toISOString()
      setLastChecked(now)
      localStorage.setItem(STORAGE_KEY, now)
    } catch (err) {
      console.error('[ViralAlert] Failed to check viral videos:', err)
    }
  }, [lastChecked, permission, dismissedIds])

  // 初始化
  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
      if (Notification.permission === 'default') {
        requestPermission()
      }
    }

    // 延迟执行初始检查，确保 localStorage 已读取
    const timer = setTimeout(() => {
      checkNewViralVideos()
    }, 1000)

    // 每 30 秒轮询
    const interval = setInterval(checkNewViralVideos, 30000)
    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [checkNewViralVideos, requestPermission])

  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = (videoId: string) => {
    setNotifications(prev =>
      prev.map(n => n.video.id === videoId ? { ...n, read: true } : n)
    )
  }

  const dismiss = (videoId: string) => {
    const newDismissed = new Set(dismissedIds)
    newDismissed.add(videoId)
    setDismissedIds(newDismissed)
    saveDismissed(newDismissed)
    setNotifications(prev => prev.filter(n => n.video.id !== videoId))
  }

  if (notifications.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 w-96 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-rose-500/20 to-orange-500/20 border border-rose-500/30 rounded-xl px-4 py-3">
        <div className="flex items-center gap-2">
          {permission === 'granted' ? (
            <Bell size={18} className="text-rose-500" />
          ) : (
            <BellOff size={18} className="text-rose-500" />
          )}
          <span className="font-medium text-rose-600 dark:text-rose-200">
            爆款提醒 {unreadCount > 0 && <span className="ml-1 px-1.5 py-0.5 bg-rose-500 rounded-full text-xs text-white">{unreadCount}</span>}
          </span>
        </div>
        {permission !== 'granted' && (
          <button
            onClick={requestPermission}
            className="text-xs text-rose-500 hover:text-rose-600 dark:text-rose-300 dark:hover:text-rose-200 underline"
          >
            开启通知
          </button>
        )}
      </div>

      {/* Notification list */}
      {notifications.map(({ video, read }) => (
        <div
          key={video.id}
          className={`rounded-xl overflow-hidden shadow-xl transition-all ${
            read ? 'opacity-60' : 'border-rose-500/30'
          }`}
          style={{ background: 'var(--card)', border: `1px solid var(--border)${read ? '' : ''}` }}
          onClick={() => markAsRead(video.id)}
        >
          <div className="flex gap-3 p-3">
            <img
              src={video.thumbnailUrl || '/thumbnails/fallback.svg'}
              alt=""
              className="w-20 h-14 object-cover rounded-lg shrink-0"
              onError={e => { e.currentTarget.src = '/thumbnails/fallback.svg' }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm line-clamp-2 leading-tight" style={{ color: 'var(--text-secondary)' }}>
                {video.title}
              </p>
              <div className="flex items-center gap-3 mt-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                <span className="text-rose-500 font-medium">
                  ❤️ {video.likes.toLocaleString()}
                </span>
                <span>👁 {video.views?.toLocaleString() || 0}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: 'var(--panel)' }}>
                  {video.app}
                </span>
              </div>
            </div>
            <button
              onClick={e => { e.stopPropagation(); dismiss(video.id) }}
              className="p-1 transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              <X size={14} />
            </button>
          </div>
          <div className="flex" style={{ borderTop: '1px solid var(--border)' }}>
            <button
              onClick={() => { markAsRead(video.id); onViewDetails?.(video) }}
              className="flex-1 flex items-center justify-center gap-1 py-2 text-xs transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              <ExternalLink size={12} />
              查看详情
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
