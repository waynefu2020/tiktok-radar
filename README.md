# TikTok Radar

> A local-first TikTok UGC monitoring tool for tracking competitor videos, creator activity, and lightweight campaign insights.

Live intro page: https://landing-eta-self-21.vercel.app/

![Tech Stack](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![Tech Stack](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Tech Stack](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss)
![Tech Stack](https://img.shields.io/badge/Express-5-000000?logo=express)

## Overview

TikTok Radar is built for app growth teams that want competitor content intelligence without manually scrolling TikTok. You tell the system which apps or creators matter, and it helps surface high-performing UGC, track trends, compare creators, and generate lightweight AI-assisted content analysis.

Core value:
- Monitor TikTok competitor content in one place
- Track creator and app-level momentum across campaigns
- Turn raw videos into reusable content intelligence faster

## Features

- Track TikTok UGC videos for multiple apps
- Filter by app, date window, creator, and keyword
- Monitor creator lists and lightweight ideaShell UGC performance
- Generate inline AI-assisted script analysis from available subtitles or ASR when configured
- Run as a single-node app with SQLite and local media caching

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS + Recharts |
| Backend | Express + Axios + SQLite (`node:sqlite`) |
| Media tooling | `yt-dlp` + `ffmpeg` |
| AI | OpenAI-compatible chat + Whisper-compatible transcription |
| Data source | TikHub TikTok API |

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/waynefu2020/tiktok-radar.git
cd tiktok-radar
npm install
```

### 2. Create `.env`

Copy `.env.example` to `.env` and fill in your own values:

```env
HOST=0.0.0.0
PORT=3001
JWT_SECRET=replace-with-a-long-random-secret
TIKHUB_API_KEY=your_tikhub_api_key
AI_BASE_URL=https://api.openai.com/v1
AI_API_KEY=your_openai_api_key
AI_MODEL=gpt-4o
DB_PATH=./data/tiktok-radar.db
ALLOWED_ORIGIN=
```

Required values:
- `JWT_SECRET`
- `TIKHUB_API_KEY`

Optional AI values:
- `AI_BASE_URL`
- `AI_API_KEY`
- `AI_MODEL`

### 3. Install system dependencies

- Node.js 22+
- `ffmpeg`
- `yt-dlp`

Examples:

```bash
# macOS
brew install ffmpeg yt-dlp

# Debian / Ubuntu
sudo apt install ffmpeg
pip install yt-dlp
```

### 4. Initialize the first admin user

The server does not create a default admin account.

```bash
npm run init-admin -- admin StrongPass123 "Admin User"
```

### 5. Start the app

Production-style local run:

```bash
npm run build
npm run start
```

Development mode:

```bash
npm run dev
```

LAN-friendly development mode:

```bash
npm run dev:lan
```

Default access URL:

- Local: `http://127.0.0.1:3001`
- LAN: `http://<your-local-ip>:3001`

## Project Structure

```text
tiktok-radar/
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── types/
│   └── utils/
├── scripts/
├── server.cjs
├── db.cjs
└── public/
```

## Data and Media

- SQLite database files are runtime state and are intentionally ignored by git.
- Downloaded thumbnails and avatars are runtime-generated assets and are intentionally excluded from version control.
- Do not commit `.env`, database files, or generated media.

## Security Notes

- The app uses JWT-based auth with `admin` and `user` roles.
- High-cost operations such as sync, creator management, and AI analysis are intended for admins.
- Public repositories should use placeholder values only; rotate any secret immediately if it was ever committed elsewhere.
