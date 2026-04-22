require('dotenv').config()
const express = require('express')
const cors = require('cors')
const axios = require('axios')
const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')
const FormData = require('form-data')
const {
  DB_PATH,
  deleteApp,
  deleteMonitoredCreator,
  getAppById,
  getApps,
  getMeta,
  getMonitoredCreators,
  getVideoById,
  getVideos,
  getVideoScripts,
  replaceAppVideos,
  saveApp,
  saveMonitoredCreator,
  saveVideoScript,
  sortVideosByNewest,
  upsertVideos,
} = require('./db.cjs')

const app = express()
const PORT = process.env.PORT || 3001
const TIKHUB_KEY = process.env.TIKHUB_API_KEY
const TIKHUB_BASE = 'https://api.tikhub.io'
const AI_BASE_URL = process.env.AI_BASE_URL || 'https://oneapi.rrdtech.cn/v1'
const AI_API_KEY = process.env.AI_API_KEY
const AI_MODEL = process.env.AI_MODEL || 'gpt-5.4'

app.use(cors())
app.use(express.json())

const tikhub = axios.create({
  baseURL: TIKHUB_BASE,
  headers: { Authorization: `Bearer ${TIKHUB_KEY}` },
  timeout: 30000,
})

const aiClient = axios.create({
  baseURL: AI_BASE_URL,
  headers: AI_API_KEY ? { Authorization: `Bearer ${AI_API_KEY}` } : {},
  timeout: 60000,
})

// 动态加载竞品配置
function getAppKeywords() {
  const apps = getApps()
  const map = {}
  for (const app of apps) {
    map[app.id] = app.keywords || []
  }
  return map
}

function firstUrl(list) {
  return Array.isArray(list) ? list[0] : list
}

function normalizeCreatorProfile(payload, selectedApps = []) {
  const data = payload?.data || payload || {}
  const user =
    data.user ||
    data.user_info ||
    data.userInfo?.user ||
    data.user_info?.user ||
    data
  const stats =
    data.stats ||
    data.userInfo?.stats ||
    data.user_info?.stats ||
    user.stats ||
    {}

  const username = user.unique_id || user.uniqueId || user.uniqueIdStr || user.short_id
  const userId = user.uid || user.id || user.user_id || username
  if (!username) return null

  const avatarUrl =
    firstUrl(user.avatar_thumb?.url_list) ||
    firstUrl(user.avatar_medium?.url_list) ||
    firstUrl(user.avatar_larger?.url_list) ||
    user.avatarThumb ||
    user.avatarMedium ||
    user.avatarLarger ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`

  const followers =
    user.follower_count ??
    user.followerCount ??
    stats.follower_count ??
    stats.followerCount ??
    0
  const totalVideos =
    user.aweme_count ??
    user.video_count ??
    user.videoCount ??
    stats.aweme_count ??
    stats.video_count ??
    stats.videoCount ??
    0
  const totalLikes =
    user.total_favorited ??
    user.totalFavorited ??
    stats.total_favorited ??
    stats.totalFavorited ??
    stats.heart_count ??
    stats.heartCount ??
    0

  return {
    id: `creator_${userId}`,
    username,
    displayName: user.nickname || user.display_name || username,
    avatarUrl,
    followers,
    totalVideos,
    avgLikes: totalVideos > 0 ? Math.round(totalLikes / totalVideos) : 0,
    apps: selectedApps,
  }
}

// 标准化 TikHub V3 search response → 前端 Video 类型
function normalizeVideo(aweme, appId) {
  const stats = aweme.statistics || aweme.stats || {}
  const author = aweme.author || {}
  const video = aweme.video || {}

  // cover URL 嵌套在 url_list 数组里
  const coverUrls =
    video.cover?.url_list ||
    video.dynamic_cover?.url_list ||
    video.origin_cover?.url_list ||
    []
  const coverUrl = coverUrls[0] || `https://picsum.photos/seed/${aweme.aweme_id}/160/90`

  // 视频下载链接（用于 ASR 转写）
  const videoUrl =
    video.play_addr_h264?.url_list?.[0] ||
    video.play_addr?.url_list?.[0] ||
    video.download_no_watermark_addr?.url_list?.[0] ||
    video.download_addr?.url_list?.[0] ||
    ''

  const avatarUrls =
    author.avatar_thumb?.url_list ||
    author.avatar_medium?.url_list ||
    []
  const avatarUrl = avatarUrls[0] || `https://api.dicebear.com/7.x/avataaars/svg?seed=${author.unique_id}`

  const tags = (aweme.text_extra || aweme.cha_list || [])
    .filter(t => t.hashtag_name || t.cha_name)
    .map(t => t.hashtag_name || t.cha_name)
    .filter(Boolean)
    .slice(0, 6)

  return {
    id: `tk_${aweme.aweme_id}`,
    title: aweme.desc || '(无标题)',
    thumbnailUrl: coverUrl,
    tiktokUrl: `https://www.tiktok.com/@${author.unique_id}/video/${aweme.aweme_id}`,
    videoUrl,
    app: appId,
    creator: {
      id: `creator_${author.uid || author.unique_id}`,
      username: author.unique_id || 'unknown',
      displayName: author.nickname || author.unique_id || 'Unknown',
      avatarUrl,
      followers: author.follower_count || 0,
      totalVideos: 1,
      avgLikes: stats.digg_count || 0,
      apps: [appId],
    },
    publishedAt: aweme.create_time
      ? new Date(aweme.create_time * 1000).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    likes: stats.digg_count || 0,
    comments: stats.comment_count || 0,
    saves: stats.collect_count || 0,
    shares: stats.share_count || 0,
    views: stats.play_count || 0,
    tags,
    script: '',
    hookType: null,
  }
}

function tiktokAwemeId(videoId) {
  return String(videoId || '').replace(/^tk_/, '')
}

function collectTranscriptCandidates(value, results = []) {
  if (!value) return results
  if (typeof value === 'string') {
    if (value.trim().length > 8) results.push(value.trim())
    return results
  }
  if (Array.isArray(value)) {
    for (const item of value) collectTranscriptCandidates(item, results)
    return results
  }
  if (typeof value === 'object') {
    for (const key of ['text', 'caption', 'subtitle', 'transcript', 'utterance', 'content']) {
      if (typeof value[key] === 'string') collectTranscriptCandidates(value[key], results)
    }
    for (const key of ['subtitles', 'subtitle_infos', 'caption_infos', 'utterances', 'segments']) {
      if (value[key]) collectTranscriptCandidates(value[key], results)
    }
  }
  return results
}

function collectSubtitleUrls(value, urls = []) {
  if (!value) return urls
  if (typeof value === 'string') {
    if (/^https?:\/\//i.test(value)) urls.push(value)
    return urls
  }
  if (Array.isArray(value)) {
    for (const item of value) collectSubtitleUrls(item, urls)
    return urls
  }
  if (typeof value === 'object') {
    for (const key of ['url', 'uri', 'url_list', 'subtitle_url', 'caption_url']) {
      if (value[key]) collectSubtitleUrls(value[key], urls)
    }
    for (const key of ['subtitles', 'subtitle_infos', 'caption_infos']) {
      if (value[key]) collectSubtitleUrls(value[key], urls)
    }
  }
  return urls
}

function stripVtt(text) {
  return String(text || '')
    .replace(/^WEBVTT.*$/gim, '')
    .replace(/^\d+$/gm, '')
    .replace(/\d{2}:\d{2}:\d{2}[.,]\d{3}\s+-->\s+\d{2}:\d{2}:\d{2}[.,]\d{3}.*$/gm, '')
    .replace(/<[^>]+>/g, '')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .join('\n')
}

async function fetchTranscriptFromTikHub(video) {
  const awemeId = tiktokAwemeId(video.id)
  const resp = await tikhub.get('/api/v1/tiktok/app/v3/fetch_one_video', {
    params: { aweme_id: awemeId },
  })
  const detail = resp.data?.data || resp.data
  const candidates = collectTranscriptCandidates(detail)
    .filter(text => text !== video.title && !/^https?:\/\//i.test(text))
  if (candidates.length) return candidates.join('\n')

  const urls = collectSubtitleUrls(detail)
  for (const url of urls.slice(0, 3)) {
    try {
      const subtitleResp = await axios.get(url, { timeout: 20000 })
      const text = stripVtt(subtitleResp.data)
      if (text.length > 8) return text
    } catch {
      // Try the next subtitle URL.
    }
  }
  return ''
}

const TEMP_DIR = path.join(__dirname, 'temp')
fs.mkdirSync(TEMP_DIR, { recursive: true })

function runCommand(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { ...opts, stdio: ['ignore', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', d => stdout += d)
    child.stderr.on('data', d => stderr += d)
    child.on('close', code => {
      if (code !== 0) return reject(new Error(`${cmd} exited ${code}: ${stderr || stdout}`))
      resolve(stdout)
    })
    child.on('error', reject)
    if (opts.timeout) {
      setTimeout(() => {
        child.kill('SIGTERM')
        reject(new Error(`${cmd} timeout after ${opts.timeout}ms`))
      }, opts.timeout)
    }
  })
}

async function downloadAndTranscribe(video) {
  const videoId = tiktokAwemeId(video.id)
  const videoPath = path.join(TEMP_DIR, `${videoId}.mp4`)
  const audioPath = path.join(TEMP_DIR, `${videoId}.mp3`)

  try {
    // 1. 下载视频（使用 yt-dlp）
    console.log(`[ASR] Downloading video: ${video.tiktokUrl}`)
    await runCommand('yt-dlp', [
      '--no-warnings',
      '-o', videoPath,
      '-S', 'ext:mp4',
      '--no-playlist',
      video.tiktokUrl,
    ], { timeout: 60000 })

    if (!fs.existsSync(videoPath)) {
      throw new Error('Video download failed: file not created')
    }

    // 2. 提取音频
    console.log(`[ASR] Extracting audio...`)
    await runCommand('ffmpeg', [
      '-y', '-i', videoPath,
      '-vn', '-ar', '16000', '-ac', '1',
      '-c:a', 'libmp3lame', '-q:a', '4',
      audioPath,
    ], { timeout: 30000 })

    if (!fs.existsSync(audioPath)) {
      throw new Error('Audio extraction failed: file not created')
    }

    // 3. Whisper API 转写
    console.log(`[ASR] Transcribing with Whisper...`)
    const form = new FormData()
    form.append('file', fs.createReadStream(audioPath))
    form.append('model', 'whisper-1')
    form.append('language', 'en')
    form.append('response_format', 'text')

    const whisperResp = await aiClient.post('/audio/transcriptions', form, {
      headers: form.getHeaders(),
      timeout: 120000,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    })

    const transcript = String(whisperResp.data?.text || whisperResp.data || '').trim()
    console.log(`[ASR] Transcript length: ${transcript.length}`)
    return transcript
  } catch (err) {
    console.error(`[ASR] Failed for ${videoId}:`, err.message)
    return ''
  } finally {
    // 4. 清理临时文件
    try { fs.unlinkSync(videoPath) } catch {}
    try { fs.unlinkSync(audioPath) } catch {}
  }
}

function parseAiJson(content) {
  const raw = String(content || '').trim()
  try {
    return JSON.parse(raw)
  } catch {
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('AI returned non-JSON content')
    return JSON.parse(match[0])
  }
}

const BREAKDOWN_SCHEMA = {
  type: 'object',
  properties: {
    hook: { type: 'string' },
    painPoint: { type: 'string' },
    structure: { type: 'array', items: { type: 'string' } },
    productPlacement: { type: 'string' },
    cta: { type: 'string' },
    reusableIdeas: { type: 'array', items: { type: 'string' } },
  },
  required: ['hook', 'painPoint', 'structure', 'productPlacement', 'cta', 'reusableIdeas'],
  additionalProperties: false,
}

async function generateBreakdown(video, transcript) {
  if (!AI_API_KEY) throw new Error('Missing AI_API_KEY')
  const resp = await aiClient.post('/chat/completions', {
    model: AI_MODEL,
    messages: [
      {
        role: 'system',
        content: '你是短视频投放与UGC脚本分析专家。只输出JSON，必须符合用户给定结构。',
      },
      {
        role: 'user',
        content: JSON.stringify({
          instruction: '基于真实字幕拆解这条TikTok UGC视频，输出中文分析。不要编造字幕以外的信息。',
          expectedSchema: BREAKDOWN_SCHEMA,
          video: {
            title: video.title,
            app: video.app,
            tags: video.tags,
            likes: video.likes,
            comments: video.comments,
            saves: video.saves,
            shares: video.shares,
          },
          transcript,
        }),
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2,
  })
  const content = resp.data?.choices?.[0]?.message?.content
  return parseAiJson(content)
}

async function generateInferredBreakdown(video) {
  if (!AI_API_KEY) throw new Error('Missing AI_API_KEY')
  const inferredFrom = JSON.stringify({
    title: video.title,
    tags: video.tags,
    app: video.app,
    likes: video.likes,
    comments: video.comments,
    saves: video.saves,
    shares: video.shares,
    creator: video.creator?.username,
    publishedAt: video.publishedAt,
  })
  const resp = await aiClient.post('/chat/completions', {
    model: AI_MODEL,
    messages: [
      {
        role: 'system',
        content: '你是短视频投放与UGC脚本分析专家。只输出JSON，必须符合用户给定结构。',
      },
      {
        role: 'user',
        content: JSON.stringify({
          instruction: '这条TikTok UGC视频没有字幕/转写文本。请基于视频标题、标签、互动数据和竞品上下文，进行推测性拆解。输出中文分析。明确标注这是推测，但只要合理推断即可。',
          expectedSchema: BREAKDOWN_SCHEMA,
          video: {
            title: video.title,
            app: video.app,
            tags: video.tags,
            likes: video.likes,
            comments: video.comments,
            saves: video.saves,
            shares: video.shares,
          },
          note: '没有真实字幕，请基于标题、标签和竞品App的UGC投放惯例进行合理推测。',
        }),
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.4,
  })
  const content = resp.data?.choices?.[0]?.message?.content
  return { breakdown: parseAiJson(content), inferredFrom }
}

// 获取指定 TikTok 达人资料
app.get('/api/creator/:username', async (req, res) => {
  const rawUsername = String(req.params.username || '').trim()
  const username = rawUsername
    .replace(/^@/, '')
    .replace(/^https?:\/\/(www\.)?tiktok\.com\/@/i, '')
    .split(/[/?#]/)[0]

  if (!username) return res.status(400).json({ error: 'Missing username' })

  try {
    const resp = await tikhub.get('/api/v1/tiktok/app/v3/handler_user_profile', {
      params: { unique_id: username },
    })
    const creator = normalizeCreatorProfile(resp.data)
    if (!creator) {
      return res.status(404).json({ error: `Creator not found: ${username}` })
    }
    res.json({ creator })
  } catch (err) {
    const detail = err.response?.data?.detail || err.response?.data?.message || err.message
    console.error(`[TikHub] Creator profile error for "${username}":`, detail)
    res.status(err.response?.status || 500).json({
      error: String(err.response?.data?.detail?.message || detail || 'Failed to fetch creator'),
    })
  }
})

app.get('/api/videos', (_req, res) => {
  res.json({
    total: getVideos().length,
    videos: getVideos(),
    meta: getMeta(),
  })
})

app.get('/api/video-scripts', (_req, res) => {
  res.json({ scripts: getVideoScripts() })
})

app.put('/api/video-scripts/:videoId', (req, res) => {
  const { videoId } = req.params
  if (!videoId) return res.status(400).json({ error: 'Missing video id' })
  const saved = saveVideoScript(videoId, {
    script: String(req.body?.script || ''),
    hookType: req.body?.hookType || null,
  })
  res.json({ script: saved })
})

app.post('/api/videos/:videoId/analyze-script', async (req, res) => {
  const { videoId } = req.params
  const video = getVideoById(videoId)
  if (!video) return res.status(404).json({ error: 'Video not found' })

  try {
    let transcript = video.transcriptText || ''
    let source = video.transcriptText ? 'transcript' : null

    if (!transcript) {
      transcript = await fetchTranscriptFromTikHub(video)
      if (transcript) source = 'transcript'
    }

    if (!transcript) {
      // 第2层：尝试 ASR 音频转写
      transcript = await downloadAndTranscribe(video)
      if (transcript) source = 'asr'
    }

    if (!transcript) {
      // 第3层：ASR 也失败，走推测拆解
      const inferred = video.breakdown
        ? { breakdown: video.breakdown, inferredFrom: video.inferredFrom || '' }
        : await generateInferredBreakdown(video)
      const saved = saveVideoScript(video.id, {
        script: video.script || '',
        hookType: video.hookType || null,
        transcriptText: '',
        transcriptStatus: 'no_transcript',
        breakdown: inferred.breakdown,
        aiStatus: 'ready',
        analysisSource: 'inferred',
        inferredFrom: inferred.inferredFrom,
      })
      return res.json({
        video: { ...video, ...saved, transcriptText: '', transcriptStatus: 'no_transcript', breakdown: inferred.breakdown, aiStatus: 'ready', analysisSource: 'inferred', inferredFrom: inferred.inferredFrom },
      })
    }
    const breakdown = video.breakdown || await generateBreakdown(video, transcript)
    const saved = saveVideoScript(video.id, {
      script: video.script || '',
      hookType: video.hookType || null,
      transcriptText: transcript,
      transcriptStatus: 'ready',
      breakdown,
      aiStatus: 'ready',
      analysisSource: source,
      inferredFrom: '',
    })
    res.json({
      video: {
        ...video,
        ...saved,
        transcriptText: transcript,
        transcriptStatus: 'ready',
        breakdown,
        aiStatus: 'ready',
        analysisSource: source,
        inferredFrom: '',
      },
    })
    return
  } catch (err) {
    const existingTranscript = video.transcriptText || ''
    const saved = saveVideoScript(video.id, {
      script: video.script || '',
      hookType: video.hookType || null,
      transcriptText: existingTranscript,
      transcriptStatus: existingTranscript ? 'ready' : 'error',
      breakdown: video.breakdown || null,
      aiStatus: 'error',
      analysisSource: video.analysisSource || 'transcript',
      inferredFrom: video.inferredFrom || '',
    })
    res.status(500).json({
      error: err.message || 'Analyze script failed',
      video: { ...video, ...saved },
    })
  }
})

app.get('/api/monitored-creators', (_req, res) => {
  const creators = getMonitoredCreators()
  res.json({ total: creators.length, creators })
})

app.post('/api/monitored-creators', async (req, res) => {
  const rawUsername = String(req.body?.username || '').trim()
  const apps = Array.isArray(req.body?.apps) ? req.body.apps : []
  const username = rawUsername
    .replace(/^@/, '')
    .replace(/^https?:\/\/(www\.)?tiktok\.com\/@/i, '')
    .split(/[/?#]/)[0]

  if (!username) return res.status(400).json({ error: 'Missing username' })
  if (!apps.length) return res.status(400).json({ error: 'Missing apps' })

  try {
    const resp = await tikhub.get('/api/v1/tiktok/app/v3/handler_user_profile', {
      params: { unique_id: username },
    })
    const creator = normalizeCreatorProfile(resp.data, apps)
    if (!creator) return res.status(404).json({ error: `Creator not found: ${username}` })
    res.json({ creator: saveMonitoredCreator(creator, apps) })
  } catch (err) {
    const detail = err.response?.data?.detail || err.response?.data?.message || err.message
    console.error(`[TikHub] Save monitored creator error for "${username}":`, detail)
    res.status(err.response?.status || 500).json({
      error: String(err.response?.data?.detail?.message || detail || 'Failed to save creator'),
    })
  }
})

app.delete('/api/monitored-creators/:username', (req, res) => {
  deleteMonitoredCreator(req.params.username)
  res.json({ ok: true })
})

// 搜索某个竞品 App 的视频
app.get('/api/sync/:appId', async (req, res) => {
  const { appId } = req.params
  const count = parseInt(req.query.count) || 20

  const keywords = getAppKeywords()[appId]
  if (!keywords) return res.status(400).json({ error: `Unknown app: ${appId}` })

  const allVideos = []
  const errors = []

  for (const keyword of keywords) {
    try {
      console.log(`[TikHub] Searching: "${keyword}"`)
      const resp = await tikhub.get('/api/v1/tiktok/app/v3/fetch_video_search_result', {
        params: { keyword, count, offset: 0 },
      })

      // 真实数据在 search_item_list[].aweme_info
      const searchItems = resp.data?.data?.search_item_list || []
      const items = searchItems
        .map(si => si.aweme_info || si)
        .filter(item => item && item.aweme_id)

      console.log(`[TikHub] "${keyword}" → ${items.length} videos (from ${searchItems.length} search items)`)

      for (const item of items) {
        const normalized = normalizeVideo(item, appId)
        if (!allVideos.find(v => v.id === normalized.id)) {
          allVideos.push(normalized)
        }
      }
    } catch (err) {
      const errDetail = err.response?.data?.detail || err.message
      console.error(`[TikHub] Error for "${keyword}":`, errDetail)
      errors.push({ keyword, error: String(err.response?.data?.detail?.message || err.message) })
    }
  }

  sortVideosByNewest(allVideos)
  replaceAppVideos(appId, allVideos)

  res.json({
    appId,
    total: allVideos.length,
    videos: getVideos().filter(v => v.app === appId),
    errors: errors.length ? errors : undefined,
  })
})

// 批量同步所有竞品
app.get('/api/sync', async (req, res) => {
  const appIds = Object.keys(getAppKeywords())
  const results = {}

  await Promise.allSettled(
    appIds.map(async (appId) => {
      try {
        const resp = await axios.get(`http://localhost:${PORT}/api/sync/${appId}?count=15`)
        results[appId] = resp.data
      } catch (err) {
        results[appId] = { appId, total: 0, videos: [], errors: [{ error: err.message }] }
      }
    })
  )

  const allVideos = Object.values(results).flatMap(r => r.videos || [])
  sortVideosByNewest(allVideos)
  upsertVideos(allVideos)

  res.json({
    total: getVideos().length,
    byApp: Object.fromEntries(Object.entries(results).map(([k, v]) => [k, v.total || 0])),
    videos: getVideos(),
  })
})

// 竞品配置 CRUD
app.get('/api/apps', (_req, res) => {
  res.json({ apps: getApps() })
})

app.post('/api/apps', (req, res) => {
  const { id, name, color, bgColor, borderColor, keywords } = req.body
  if (!id || !name) return res.status(400).json({ error: 'Missing id or name' })
  const existing = getAppById(id)
  if (existing) return res.status(409).json({ error: `App already exists: ${id}` })
  const saved = saveApp({ id, name, color: color || '#6366F1', bgColor: bgColor || 'rgba(99,102,241,0.12)', borderColor: borderColor || 'rgba(99,102,241,0.3)', keywords: keywords || [] })
  res.json({ app: saved })
})

app.put('/api/apps/:id', (req, res) => {
  const { id } = req.params
  const existing = getAppById(id)
  if (!existing) return res.status(404).json({ error: 'App not found' })
  const { name, color, bgColor, borderColor, keywords } = req.body
  const saved = saveApp({ id, name: name ?? existing.name, color: color ?? existing.color, bgColor: bgColor ?? existing.bgColor, borderColor: borderColor ?? existing.borderColor, keywords: keywords ?? existing.keywords })
  res.json({ app: saved })
})

app.delete('/api/apps/:id', (req, res) => {
  deleteApp(req.params.id)
  res.json({ ok: true })
})

// 健康检查
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, keyConfigured: !!TIKHUB_KEY, dbPath: DB_PATH, apps: getApps().length })
})

app.listen(PORT, () => {
  console.log(`✅ TikTok Radar API server on http://localhost:${PORT}`)
  console.log(`   API Key: ${TIKHUB_KEY ? TIKHUB_KEY.substring(0, 8) + '...' : '❌ NOT SET'}`)
})
