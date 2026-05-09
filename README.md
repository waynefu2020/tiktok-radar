# TikTok Radar

[English](#english) | [中文版](#中文版)

Live intro page: https://landing-eta-self-21.vercel.app/

![Tech Stack](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![Tech Stack](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Tech Stack](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss)
![Tech Stack](https://img.shields.io/badge/Express-5-000000?logo=express)

## English

> A local-first TikTok UGC monitoring tool for tracking competitor videos, creator activity, and lightweight campaign insights.

### Overview

TikTok Radar is built for app growth teams that want competitor content intelligence without manually scrolling TikTok. You tell the system which apps or creators matter, and it helps surface high-performing UGC, track trends, compare creators, and generate lightweight AI-assisted content analysis.

Core value:
- Monitor TikTok competitor content in one place
- Track creator and app-level momentum across campaigns
- Turn raw videos into reusable content intelligence faster

### Features

- Track TikTok UGC videos for multiple apps
- Filter by app, date window, creator, and keyword
- Monitor creator lists and lightweight ideaShell UGC performance
- Generate inline AI-assisted script analysis from available subtitles or ASR when configured
- Run as a single-node app with SQLite and local media caching

### Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS + Recharts |
| Backend | Express + Axios + SQLite (`node:sqlite`) |
| Media tooling | `yt-dlp` + `ffmpeg` |
| AI | OpenAI-compatible chat + Whisper-compatible transcription |
| Data source | TikHub TikTok API |

### Quick Start

#### 1. Clone and install

```bash
git clone https://github.com/waynefu2020/tiktok-radar.git
cd tiktok-radar
npm install
```

#### 2. Create `.env`

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

#### 3. Install system dependencies

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

#### 4. Initialize the first admin user

The server does not create a default admin account.

```bash
npm run init-admin -- admin StrongPass123 "Admin User"
```

#### 5. Start the app

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

### Project Structure

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

### Data and Media

- SQLite database files are runtime state and are intentionally ignored by git.
- Downloaded thumbnails and avatars are runtime-generated assets and are intentionally excluded from version control.
- Do not commit `.env`, database files, or generated media.

### Security Notes

- The app uses JWT-based auth with `admin` and `user` roles.
- High-cost operations such as sync, creator management, and AI analysis are intended for admins.
- Public repositories should use placeholder values only; rotate any secret immediately if it was ever committed elsewhere.

## 中文版

> 一个本地优先的 TikTok UGC 内容监控工具，用来追踪竞品视频、创作者动态和轻量级内容情报。

### 项目介绍

TikTok Radar 面向增长、投放和出海团队，目标是把“手动刷 TikTok 找竞品内容”变成可复用的情报工作流。你只需要告诉系统要关注哪些 App 或创作者，它就能帮你聚合高表现 UGC、观察趋势、比较达人，并在需要时补充 AI 辅助分析。

核心价值：
- 在一个界面里集中监控 TikTok 竞品内容
- 追踪创作者和 App 维度的内容增长节奏
- 把原始视频快速转成可复用的内容情报

### 功能特性

- 追踪多个 App 的 TikTok UGC 视频
- 按 App、时间窗口、创作者和关键词筛选
- 管理达人库和 ideaShell UGC 的轻量数据面板
- 在配置完成后，基于字幕或 ASR 生成 AI 辅助脚本分析
- 使用 SQLite 和本地媒体缓存，以单机方式运行

### 技术栈

| 层级 | 技术 |
| --- | --- |
| 前端 | React 18 + Vite + TypeScript + Tailwind CSS + Recharts |
| 后端 | Express + Axios + SQLite (`node:sqlite`) |
| 媒体工具 | `yt-dlp` + `ffmpeg` |
| AI | OpenAI 兼容对话接口 + Whisper 兼容转写接口 |
| 数据源 | TikHub TikTok API |

### 快速开始

#### 1. 克隆并安装依赖

```bash
git clone https://github.com/waynefu2020/tiktok-radar.git
cd tiktok-radar
npm install
```

#### 2. 创建 `.env`

复制 `.env.example` 为 `.env`，并填入你自己的配置：

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

必填项：
- `JWT_SECRET`
- `TIKHUB_API_KEY`

可选 AI 配置：
- `AI_BASE_URL`
- `AI_API_KEY`
- `AI_MODEL`

#### 3. 安装系统依赖

- Node.js 22+
- `ffmpeg`
- `yt-dlp`

示例：

```bash
# macOS
brew install ffmpeg yt-dlp

# Debian / Ubuntu
sudo apt install ffmpeg
pip install yt-dlp
```

#### 4. 初始化首个管理员账号

服务不会自动创建默认管理员账号。

```bash
npm run init-admin -- admin StrongPass123 "Admin User"
```

#### 5. 启动项目

生产风格本地运行：

```bash
npm run build
npm run start
```

开发模式：

```bash
npm run dev
```

局域网开发模式：

```bash
npm run dev:lan
```

默认访问地址：
- 本机：`http://127.0.0.1:3001`
- 局域网：`http://<你的局域网IP>:3001`

### 项目结构

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

### 数据与媒体

- SQLite 数据库文件属于运行时状态，不纳入 git。
- 下载得到的缩略图和头像属于运行期生成资产，不纳入版本控制。
- 不要提交 `.env`、数据库文件和生成媒体。

### 安全说明

- 系统使用 JWT 鉴权，并区分 `admin` / `user` 两类角色。
- 同步、创作者管理、AI 分析等高成本操作应由管理员执行。
- 公开仓库只能保留占位符配置；如果真实密钥曾在别处暴露，应立即轮换。
