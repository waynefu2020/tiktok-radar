const fs = require('fs')
const path = require('path')
const { DatabaseSync } = require('node:sqlite')

const DATA_DIR = path.join(__dirname, 'data')
const DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, 'tiktok-radar.db')

fs.mkdirSync(DATA_DIR, { recursive: true })

const db = new DatabaseSync(DB_PATH)
db.exec('PRAGMA journal_mode = WAL')
db.exec('PRAGMA foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS videos (
    id TEXT PRIMARY KEY,
    app TEXT NOT NULL,
    published_at TEXT NOT NULL,
    likes INTEGER NOT NULL DEFAULT 0,
    payload TEXT NOT NULL,
    synced_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS monitored_creators (
    username TEXT PRIMARY KEY,
    payload TEXT NOT NULL,
    apps TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS hidden_creators (
    username TEXT PRIMARY KEY,
    hidden_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS video_scripts (
    video_id TEXT PRIMARY KEY,
    script TEXT NOT NULL DEFAULT '',
    hook_type TEXT,
    transcript_text TEXT NOT NULL DEFAULT '',
    transcript_status TEXT NOT NULL DEFAULT 'pending',
    breakdown_json TEXT NOT NULL DEFAULT '',
    ai_status TEXT NOT NULL DEFAULT 'pending',
    analysis_source TEXT NOT NULL DEFAULT 'transcript',
    inferred_from TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sync_meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS apps (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#6366F1',
    bg_color TEXT NOT NULL DEFAULT 'rgba(99,102,241,0.12)',
    border_color TEXT NOT NULL DEFAULT 'rgba(99,102,241,0.3)',
    keywords TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL
  );
`)

for (const column of [
  ["transcript_text", "TEXT NOT NULL DEFAULT ''"],
  ["transcript_status", "TEXT NOT NULL DEFAULT 'pending'"],
  ["breakdown_json", "TEXT NOT NULL DEFAULT ''"],
  ["ai_status", "TEXT NOT NULL DEFAULT 'pending'"],
  ["analysis_source", "TEXT NOT NULL DEFAULT 'transcript'"],
  ["inferred_from", "TEXT NOT NULL DEFAULT ''"],
]) {
  try {
    db.exec(`ALTER TABLE video_scripts ADD COLUMN ${column[0]} ${column[1]}`)
  } catch (err) {
    if (!String(err.message || '').includes('duplicate column')) throw err
  }
}

function nowIso() {
  return new Date().toISOString()
}

// --- apps (竞品配置) ---

function ensureDefaultApps() {
  const count = db.prepare('SELECT COUNT(*) as c FROM apps').get().c
  if (count > 0) return
  const defaults = [
    { id: 'turbo', name: 'Turbo AI', color: '#6366F1', bgColor: 'rgba(99, 102, 241, 0.12)', borderColor: 'rgba(99, 102, 241, 0.3)', keywords: ['turbolearn ai', 'turboai app'] },
    { id: 'studley', name: 'Studley', color: '#10B981', bgColor: 'rgba(16, 185, 129, 0.12)', borderColor: 'rgba(16, 185, 129, 0.3)', keywords: ['studley app'] },
    { id: 'coconote', name: 'Coconote', color: '#22D3EE', bgColor: 'rgba(34, 211, 238, 0.12)', borderColor: 'rgba(34, 211, 238, 0.3)', keywords: ['coconote'] },
  ]
  const stmt = db.prepare(`INSERT INTO apps (id, name, color, bg_color, border_color, keywords, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`)
  const ts = nowIso()
  db.exec('BEGIN')
  try {
    for (const app of defaults) {
      stmt.run(app.id, app.name, app.color, app.bgColor, app.borderColor, JSON.stringify(app.keywords), ts)
    }
    db.exec('COMMIT')
  } catch (err) {
    db.exec('ROLLBACK')
    throw err
  }
}

function getApps() {
  const rows = db.prepare('SELECT id, name, color, bg_color as bgColor, border_color as borderColor, keywords, created_at as createdAt FROM apps ORDER BY created_at').all()
  return rows.map(row => ({
    ...row,
    keywords: parseJson(row.keywords, []),
  }))
}

function getAppById(id) {
  const row = db.prepare('SELECT id, name, color, bg_color as bgColor, border_color as borderColor, keywords, created_at as createdAt FROM apps WHERE id = ?').get(id)
  if (!row) return null
  return { ...row, keywords: parseJson(row.keywords, []) }
}

function saveApp({ id, name, color, bgColor, borderColor, keywords }) {
  const existing = db.prepare('SELECT id FROM apps WHERE id = ?').get(id)
  const ts = nowIso()
  if (existing) {
    db.prepare(`UPDATE apps SET name = ?, color = ?, bg_color = ?, border_color = ?, keywords = ?, created_at = ? WHERE id = ?`)
      .run(name, color, bgColor, borderColor, JSON.stringify(keywords || []), ts, id)
  } else {
    db.prepare(`INSERT INTO apps (id, name, color, bg_color, border_color, keywords, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(id, name, color, bgColor, borderColor, JSON.stringify(keywords || []), ts)
  }
  return getAppById(id)
}

function deleteApp(id) {
  db.prepare('DELETE FROM video_scripts WHERE video_id IN (SELECT id FROM videos WHERE app = ?)').run(id)
  db.prepare('DELETE FROM videos WHERE app = ?').run(id)
  db.prepare('DELETE FROM apps WHERE id = ?').run(id)
  return true
}

ensureDefaultApps()

function parseJson(value, fallback) {
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function videoTime(video) {
  const time = new Date(video.publishedAt).getTime()
  return Number.isFinite(time) ? time : 0
}

function sortVideosByNewest(videos) {
  return videos.sort((a, b) => videoTime(b) - videoTime(a))
}

function applyScript(video) {
  const script = db
    .prepare('SELECT script, hook_type, transcript_text, transcript_status, breakdown_json, ai_status, analysis_source, inferred_from FROM video_scripts WHERE video_id = ?')
    .get(video.id)
  if (!script) return video
  return {
    ...video,
    script: script.script || '',
    hookType: script.hook_type || null,
    transcriptText: script.transcript_text || '',
    transcriptStatus: script.transcript_status || 'pending',
    breakdown: parseJson(script.breakdown_json, null),
    aiStatus: script.ai_status || 'pending',
    analysisSource: script.analysis_source || 'transcript',
    inferredFrom: script.inferred_from || '',
  }
}

function upsertVideos(videos) {
  const stmt = db.prepare(`
    INSERT INTO videos (id, app, published_at, likes, payload, synced_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      app = excluded.app,
      published_at = excluded.published_at,
      likes = excluded.likes,
      payload = excluded.payload,
      synced_at = excluded.synced_at
  `)
  const syncedAt = nowIso()
  db.exec('BEGIN')
  try {
    for (const video of videos) {
      stmt.run(
        video.id,
        video.app,
        video.publishedAt || '',
        video.likes || 0,
        JSON.stringify(video),
        syncedAt,
      )
    }
    db.exec('COMMIT')
  } catch (err) {
    db.exec('ROLLBACK')
    throw err
  }
  setMeta('last_sync_at', syncedAt)
  return syncedAt
}

function replaceAppVideos(appId, videos) {
  db.prepare('DELETE FROM videos WHERE app = ?').run(appId)
  upsertVideos(videos)
}

function getVideos() {
  const rows = db
    .prepare('SELECT payload FROM videos ORDER BY published_at DESC, likes DESC')
    .all()
  return sortVideosByNewest(rows.map(row => applyScript(parseJson(row.payload, null))).filter(Boolean))
}

function getVideoScripts() {
  return db.prepare('SELECT video_id, script, hook_type, transcript_text, transcript_status, breakdown_json, ai_status, analysis_source, inferred_from, updated_at FROM video_scripts').all()
}

function saveVideoScript(videoId, { script = '', hookType = null, transcriptText, transcriptStatus, breakdown, aiStatus, analysisSource, inferredFrom }) {
  const existing = db.prepare('SELECT * FROM video_scripts WHERE video_id = ?').get(videoId)
  const updatedAt = nowIso()
  const nextScript = script ?? existing?.script ?? ''
  const nextHookType = hookType ?? existing?.hook_type ?? null
  const nextTranscriptText = transcriptText ?? existing?.transcript_text ?? ''
  const nextTranscriptStatus = transcriptStatus ?? existing?.transcript_status ?? 'pending'
  const nextBreakdownJson = breakdown !== undefined
    ? JSON.stringify(breakdown)
    : existing?.breakdown_json ?? ''
  const nextAiStatus = aiStatus ?? existing?.ai_status ?? 'pending'
  const nextAnalysisSource = analysisSource ?? existing?.analysis_source ?? 'transcript'
  const nextInferredFrom = inferredFrom ?? existing?.inferred_from ?? ''
  db.prepare(`
    INSERT INTO video_scripts (video_id, script, hook_type, transcript_text, transcript_status, breakdown_json, ai_status, analysis_source, inferred_from, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(video_id) DO UPDATE SET
      script = excluded.script,
      hook_type = excluded.hook_type,
      transcript_text = excluded.transcript_text,
      transcript_status = excluded.transcript_status,
      breakdown_json = excluded.breakdown_json,
      ai_status = excluded.ai_status,
      analysis_source = excluded.analysis_source,
      inferred_from = excluded.inferred_from,
      updated_at = excluded.updated_at
  `).run(
    videoId,
    nextScript,
    nextHookType || null,
    nextTranscriptText,
    nextTranscriptStatus,
    nextBreakdownJson,
    nextAiStatus,
    nextAnalysisSource,
    nextInferredFrom,
    updatedAt,
  )
  return {
    videoId,
    script: nextScript,
    hookType: nextHookType || null,
    transcriptText: nextTranscriptText,
    transcriptStatus: nextTranscriptStatus,
    breakdown: parseJson(nextBreakdownJson, null),
    aiStatus: nextAiStatus,
    analysisSource: nextAnalysisSource,
    inferredFrom: nextInferredFrom,
    updatedAt,
  }
}

function getVideoById(videoId) {
  const row = db.prepare('SELECT payload FROM videos WHERE id = ?').get(videoId)
  return row ? applyScript(parseJson(row.payload, null)) : null
}

function getMonitoredCreators() {
  return db.prepare('SELECT payload, apps, updated_at FROM monitored_creators ORDER BY updated_at DESC').all()
    .map(row => ({
      ...parseJson(row.payload, {}),
      apps: parseJson(row.apps, []),
      source: 'local',
      updatedAt: row.updated_at,
    }))
}

function saveMonitoredCreator(creator, apps) {
  const updatedAt = nowIso()
  const username = String(creator.username || '').toLowerCase()
  const existing = db.prepare('SELECT apps FROM monitored_creators WHERE username = ?').get(username)
  const mergedApps = Array.from(new Set([...(existing ? parseJson(existing.apps, []) : []), ...apps]))
  const payload = { ...creator, apps: mergedApps }
  db.prepare(`
    INSERT INTO monitored_creators (username, payload, apps, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(username) DO UPDATE SET
      payload = excluded.payload,
      apps = excluded.apps,
      updated_at = excluded.updated_at
  `).run(username, JSON.stringify(payload), JSON.stringify(mergedApps), updatedAt)
  return { ...payload, source: 'local', updatedAt }
}

function deleteMonitoredCreator(username) {
  db.prepare('DELETE FROM monitored_creators WHERE username = ?').run(String(username).toLowerCase())
}

function hideCreator(username) {
  const normalized = String(username || '').trim().replace(/^@/, '').toLowerCase()
  if (!normalized) return null
  const hiddenAt = nowIso()
  db.prepare(`
    INSERT INTO hidden_creators (username, hidden_at)
    VALUES (?, ?)
    ON CONFLICT(username) DO UPDATE SET hidden_at = excluded.hidden_at
  `).run(normalized, hiddenAt)
  deleteMonitoredCreator(normalized)
  return { username: normalized, hiddenAt }
}

function unhideCreator(username) {
  db.prepare('DELETE FROM hidden_creators WHERE username = ?').run(String(username || '').trim().replace(/^@/, '').toLowerCase())
}

function getHiddenCreators() {
  return db.prepare('SELECT username, hidden_at as hiddenAt FROM hidden_creators ORDER BY hidden_at DESC').all()
}

function setMeta(key, value) {
  db.prepare(`
    INSERT INTO sync_meta (key, value, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      updated_at = excluded.updated_at
  `).run(key, value, nowIso())
}

function getMeta() {
  const rows = db.prepare('SELECT key, value, updated_at FROM sync_meta').all()
  return Object.fromEntries(rows.map(row => [row.key, { value: row.value, updatedAt: row.updated_at }]))
}

module.exports = {
  DB_PATH,
  deleteApp,
  deleteMonitoredCreator,
  getHiddenCreators,
  getAppById,
  getApps,
  getMeta,
  getMonitoredCreators,
  getVideoById,
  getVideos,
  getVideoScripts,
  replaceAppVideos,
  saveApp,
  hideCreator,
  saveMonitoredCreator,
  saveVideoScript,
  sortVideosByNewest,
  upsertVideos,
}
