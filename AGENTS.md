# Repository Guidance

## Overview
- This project is a local-first TikTok UGC monitoring tool built with React, Vite, Express, and SQLite.
- Treat this repository as a public-safe source tree: do not commit real API keys, local databases, runtime media caches, or production-only operational notes.

## Development Rules
- Keep secrets in `.env` only. Public examples belong in `.env.example`.
- Runtime data belongs in ignored paths such as `data/`, `temp/`, and `public/thumbnails/`.
- Prefer small, reviewable changes and verify with `npm run build` after meaningful edits.
- Do not add production URLs, deployment credentials, or internal runbooks to tracked files.

## Project Notes
- `server.cjs` serves both the API and the built frontend.
- SQLite is stored outside version control and should be treated as runtime state.
- Media thumbnails and downloaded avatars are generated artifacts, not source assets.
