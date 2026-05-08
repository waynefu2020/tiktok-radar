# TikHub subtitle verification

Run:

```bash
node scripts/verify_tikhub_subtitles.cjs
```

Optional flags:

```bash
node scripts/verify_tikhub_subtitles.cjs --sample-size 12
node scripts/verify_tikhub_subtitles.cjs --video-id tk_7637318080632311061
node scripts/verify_tikhub_subtitles.cjs --region GB
```

What it does:

- validates the current `TIKHUB_API_KEY`
- samples cached videos from `data/tiktok-radar.db`
- checks whether TikHub detail endpoints return:
  - direct transcript text
  - subtitle URLs
  - neither, which means ASR / inferred fallback is still needed
