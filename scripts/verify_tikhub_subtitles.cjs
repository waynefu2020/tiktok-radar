require('dotenv').config()

const path = require('path')
const { DatabaseSync } = require('node:sqlite')
const axios = require('axios')

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'tiktok-radar.db')
const TIKHUB_BASE = 'https://api.tikhub.io'
const TIKHUB_KEY = String(process.env.TIKHUB_API_KEY || '').trim()
const DEFAULT_SAMPLE_SIZE = 8
const DEFAULT_REGION = 'US'

const db = new DatabaseSync(DB_PATH)

const tikhub = axios.create({
  baseURL: TIKHUB_BASE,
  headers: { Authorization: `Bearer ${TIKHUB_KEY}` },
  timeout: 30000,
})

function parseArgs(argv) {
  const options = {
    sampleSize: DEFAULT_SAMPLE_SIZE,
    region: DEFAULT_REGION,
    videoId: '',
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--sample-size' && argv[index + 1]) {
      options.sampleSize = Math.max(1, Number.parseInt(argv[index + 1], 10) || DEFAULT_SAMPLE_SIZE)
      index += 1
      continue
    }
    if (arg === '--region' && argv[index + 1]) {
      options.region = String(argv[index + 1]).trim().toUpperCase() || DEFAULT_REGION
      index += 1
      continue
    }
    if (arg === '--video-id' && argv[index + 1]) {
      options.videoId = String(argv[index + 1]).trim()
      index += 1
    }
  }

  return options
}

function tiktokAwemeId(videoId) {
  return String(videoId || '').replace(/^tk_/, '')
}

function loadVideoById(videoId) {
  const row = db.prepare('SELECT payload FROM videos WHERE id = ?').get(videoId)
  if (!row) return null
  return JSON.parse(row.payload)
}

function loadSampleVideos(sampleSize) {
  const rows = db.prepare(`
    WITH ranked AS (
      SELECT
        payload,
        ROW_NUMBER() OVER (PARTITION BY json_extract(payload, '$.app') ORDER BY published_at DESC, likes DESC) AS app_rank
      FROM videos
    )
    SELECT payload
    FROM ranked
    WHERE app_rank <= 3
    LIMIT ?
  `).all(sampleSize)

  return rows.map(row => JSON.parse(row.payload))
}

function summarizeText(value, limit = 120) {
  const text = String(value || '').replace(/\s+/g, ' ').trim()
  if (!text) return ''
  return text.length > limit ? `${text.slice(0, limit)}...` : text
}

function collectTranscriptCandidates(value, results = [], pathPrefix = 'root') {
  if (!value) return results

  if (typeof value === 'string') {
    const text = value.trim()
    if (text.length > 8 && !/^https?:\/\//i.test(text)) {
      results.push({ path: pathPrefix, text })
    }
    return results
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => collectTranscriptCandidates(item, results, `${pathPrefix}[${index}]`))
    return results
  }

  if (typeof value === 'object') {
    for (const key of ['text', 'caption', 'subtitle', 'transcript', 'utterance', 'content']) {
      if (typeof value[key] === 'string') {
        collectTranscriptCandidates(value[key], results, `${pathPrefix}.${key}`)
      }
    }
    for (const key of ['subtitles', 'subtitle_infos', 'caption_infos', 'utterances', 'segments']) {
      if (value[key]) {
        collectTranscriptCandidates(value[key], results, `${pathPrefix}.${key}`)
      }
    }
  }

  return results
}

function collectSubtitleUrls(value, urls = [], pathPrefix = 'root') {
  if (!value) return urls

  if (typeof value === 'string') {
    if (/^https?:\/\//i.test(value)) {
      urls.push({ path: pathPrefix, url: value })
    }
    return urls
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => collectSubtitleUrls(item, urls, `${pathPrefix}[${index}]`))
    return urls
  }

  if (typeof value === 'object') {
    for (const key of ['url', 'uri', 'url_list', 'subtitle_url', 'caption_url']) {
      if (value[key]) {
        collectSubtitleUrls(value[key], urls, `${pathPrefix}.${key}`)
      }
    }
    for (const key of ['subtitles', 'subtitle_infos', 'caption_infos']) {
      if (value[key]) {
        collectSubtitleUrls(value[key], urls, `${pathPrefix}.${key}`)
      }
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

async function validateToken() {
  try {
    const response = await tikhub.get('/api/v1/tikhub/user/get_user_info')
    return {
      ok: true,
      status: response.status,
      user: response.data?.user_data || null,
      apiKey: response.data?.api_key_data || null,
    }
  } catch (error) {
    return {
      ok: false,
      status: error.response?.status || 0,
      error: error.response?.data || { message: error.message },
    }
  }
}

async function fetchSubtitleUrlPreview(subtitleUrl) {
  try {
    const response = await axios.get(subtitleUrl, { timeout: 20000 })
    const text = stripVtt(response.data)
    return {
      ok: text.length > 8,
      preview: summarizeText(text),
      length: text.length,
    }
  } catch (error) {
    return {
      ok: false,
      error: error.message,
    }
  }
}

async function inspectEndpoint(endpoint, awemeId, region) {
  try {
    const response = await tikhub.get(endpoint, { params: { aweme_id: awemeId, region } })
    const detail = response.data?.data || response.data
    const transcriptCandidates = collectTranscriptCandidates(detail)
    const subtitleUrls = collectSubtitleUrls(detail)
    const subtitlePreview = subtitleUrls.length > 0 ? await fetchSubtitleUrlPreview(subtitleUrls[0].url) : null

    return {
      ok: true,
      status: response.status,
      transcriptCandidates: transcriptCandidates.slice(0, 5).map(item => ({
        path: item.path,
        preview: summarizeText(item.text),
      })),
      subtitleUrls: subtitleUrls.slice(0, 5),
      subtitlePreview,
      directTranscriptAvailable: transcriptCandidates.length > 0,
      subtitleUrlAvailable: subtitleUrls.length > 0,
    }
  } catch (error) {
    return {
      ok: false,
      status: error.response?.status || 0,
      error: error.response?.data || { message: error.message },
      directTranscriptAvailable: false,
      subtitleUrlAvailable: false,
    }
  }
}

function printTokenStatus(tokenStatus) {
  console.log('== TikHub token status ==')
  console.log(JSON.stringify(tokenStatus, null, 2))
  console.log('')
}

function printSampleReport(results) {
  console.log('== Subtitle coverage report ==')
  console.log(JSON.stringify(results.summary, null, 2))
  console.log('')

  for (const item of results.samples) {
    console.log(`-- ${item.video.id} | ${item.video.app} | @${item.video.creator.username}`)
    console.log(`title: ${summarizeText(item.video.title, 96)}`)
    for (const check of item.checks) {
      const line = [
        check.endpoint,
        `status=${check.status || 0}`,
        `ok=${check.ok}`,
        `direct=${check.directTranscriptAvailable}`,
        `subtitleUrl=${check.subtitleUrlAvailable}`,
      ].join(' ')
      console.log(line)
      if (check.transcriptCandidates?.length) {
        console.log(`  transcript paths: ${check.transcriptCandidates.map(entry => entry.path).join(', ')}`)
      }
      if (check.subtitleUrls?.length) {
        console.log(`  subtitle urls: ${check.subtitleUrls.map(entry => entry.path).join(', ')}`)
      }
      if (check.subtitlePreview?.ok) {
        console.log(`  subtitle preview: ${check.subtitlePreview.preview}`)
      }
      if (!check.ok) {
        console.log(`  error: ${JSON.stringify(check.error)}`)
      }
    }
    console.log('')
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2))

  if (!TIKHUB_KEY) {
    console.error('Missing TIKHUB_API_KEY in environment.')
    process.exitCode = 1
    return
  }

  const tokenStatus = await validateToken()
  printTokenStatus(tokenStatus)

  if (!tokenStatus.ok) {
    console.error('Token validation failed. Subtitle coverage checks skipped until the token is fixed.')
    process.exitCode = 1
    return
  }

  const videos = options.videoId
    ? [loadVideoById(options.videoId)].filter(Boolean)
    : loadSampleVideos(options.sampleSize)

  if (videos.length === 0) {
    console.error('No sample videos found to inspect.')
    process.exitCode = 1
    return
  }

  const endpoints = [
    '/api/v1/tiktok/app/v3/fetch_one_video',
    '/api/v1/tiktok/app/v3/fetch_one_video_v3',
  ]

  const samples = []
  const summary = {
    sampleCount: videos.length,
    endpointChecks: 0,
    directTranscriptHits: 0,
    subtitleUrlHits: 0,
    fullMisses: 0,
  }

  for (const video of videos) {
    const awemeId = tiktokAwemeId(video.id)
    const checks = []

    for (const endpoint of endpoints) {
      const check = await inspectEndpoint(endpoint, awemeId, options.region)
      checks.push({ endpoint, ...check })
      summary.endpointChecks += 1
      if (check.directTranscriptAvailable) summary.directTranscriptHits += 1
      if (check.subtitleUrlAvailable) summary.subtitleUrlHits += 1
      if (!check.directTranscriptAvailable && !check.subtitleUrlAvailable) summary.fullMisses += 1
    }

    samples.push({ video, checks })
  }

  printSampleReport({ summary, samples })
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
