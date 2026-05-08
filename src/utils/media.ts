function svgDataUrl(svg: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

export function videoThumbnailFallback(title?: string) {
  const label = String(title || 'Video').slice(0, 24)
  return svgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180">
      <rect width="320" height="180" rx="18" fill="#1c1e2a"/>
      <rect x="1" y="1" width="318" height="178" rx="17" fill="none" stroke="#2E3045"/>
      <circle cx="160" cy="90" r="28" fill="#2E3045"/>
      <polygon points="152,76 152,104 174,90" fill="#8A8FA8"/>
      <text x="160" y="146" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#8A8FA8">${label}</text>
    </svg>
  `)
}

export function creatorAvatarFallback(name?: string) {
  const letter = String(name || '?').trim().slice(0, 1).toUpperCase() || '?'
  return svgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
      <rect width="96" height="96" rx="48" fill="#1c1e2a"/>
      <rect x="1" y="1" width="94" height="94" rx="47" fill="none" stroke="#2E3045"/>
      <text x="48" y="58" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" fill="#8A8FA8">${letter}</text>
    </svg>
  `)
}
