# TikTok Radar · 竞品 UGC 视频监测与 AI 脚本拆解

> 面向出海营销团队的 TikTok 竞品投放视频监测工具。自动抓取竞品 App 的 UGC 视频，通过 AI 语音转写提取逐字稿，并拆解脚本结构，帮助你快速复刻爆款内容。

![Tech Stack](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![Tech Stack](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Tech Stack](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss)
![Tech Stack](https://img.shields.io/badge/Express-5-000000?logo=express)

---

## 核心功能

### 🔍 UGC 视频中心
- 追踪竞品 App 在 TikTok 上的投放视频（支持多竞品对比）
- 实时同步视频数据：标题、标签、互动数据、创作者信息
- 按时间、App、关键词筛选

### 📝 AI 脚本拆解（三层降级）
每条视频自动获取脚本并拆解为 6 个维度：

| 层级 | 方式 | 说明 |
|---|---|---|
| **第 1 层** | TikHub 字幕提取 | 从 API 中提取视频自带字幕 |
| **第 2 层** | **AI 语音转写**（Whisper） | 下载视频 → 提取音频 → Whisper 转写 |
| **第 3 层** | AI 推测拆解 | 基于标题、标签、互动数据推测脚本结构 |

拆解维度：开场钩子 · 用户痛点 · 内容结构 · 产品植入 · CTA · 可复用拍摄建议

### 📚 脚本库
- 浏览所有已分析的脚本逐字稿和 AI 拆解
- 按 App / 钩子类型 / 来源（真实字幕/AI 转写/推测）筛选
- 一键复制英文逐字稿用于复刻
- 添加个人复刻备注

### 📊 趋势分析
- 按周统计竞品视频发布量趋势
- 可视化对比不同竞品的投放节奏

### 👤 达人库
- 监测和管理竞品合作的 TikTok 达人
- 记录达人绑定的竞品 App

---

## 技术栈

| 层 | 技术 |
|---|---|
| **前端** | React 18 + Vite + TypeScript + Tailwind CSS + Recharts |
| **后端** | Express + Axios + SQLite (node:sqlite) |
| **视频处理** | yt-dlp + ffmpeg |
| **语音识别** | OpenAI Whisper API（或兼容 API） |
| **数据源** | [TikHub.io](https://tikhub.io) TikTok API |

---

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/waynefu2020/tiktok-radar.git
cd tiktok-radar
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env`（或直接在项目根目录创建 `.env`）：

```env
# 服务器端口
PORT=3001

# TikHub API Key（用于获取 TikTok 数据）
# 申请地址：https://tikhub.io
TIKHUB_API_KEY=your_tikhub_api_key

# AI API 配置（用于脚本拆解和 Whisper 转写）
# 支持 OpenAI 或任何兼容 OpenAI 格式的 API 服务商
AI_BASE_URL=https://api.openai.com/v1
AI_API_KEY=your_openai_api_key
AI_MODEL=gpt-4o
```

### 3. 安装系统依赖

确保系统已安装以下工具：

- **Node.js** 18+
- **ffmpeg** — 音频提取
  ```bash
  # macOS
  brew install ffmpeg
  
  # Ubuntu/Debian
  sudo apt install ffmpeg
  ```
- **yt-dlp** — 视频下载
  ```bash
  # macOS
  brew install yt-dlp
  
  # 或使用 pip
  pip install yt-dlp
  ```

### 4. 启动开发服务器

```bash
npm run dev
```

将同时启动：
- 前端：`http://localhost:5173`
- 后端 API：`http://localhost:3001`

后端使用 **nodemon** 监控文件变化，修改代码后自动重启。

---

## 使用指南

### 添加竞品

编辑 `server.cjs` 中的 `APP_KEYWORDS` 配置：

```javascript
const APP_KEYWORDS = {
  turbo:    ['turbolearn ai', 'turboai app'],
  studley:  ['studley app'],
  coconote: ['coconote'],
  // 添加你的竞品
  yourapp:  ['your app name'],
}
```

### 同步视频数据

在 **UGC 视频中心** 页面点击「同步真实视频」，系统会自动：
1. 调用 TikHub API 搜索竞品关键词
2. 获取视频列表并存入本地 SQLite
3. 展示在页面上

### 分析脚本

点击任意视频右侧的 📄 **脚本按钮**，系统将自动执行：
1. 尝试提取 TikHub 字幕
2. 字幕不存在 → 下载视频 → 提取音频 → Whisper 转写
3. 基于转写文本生成 AI 拆解
4. 结果保存到本地数据库

### 复刻脚本

在 **脚本拆解** 页面：
1. 浏览已分析的视频卡片
2. 查看英文逐字稿和中文拆解
3. 点击「复制逐字稿」获取原文
4. 添加自己的复刻备注

---

## 项目结构

```
tiktok-radar/
├── src/
│   ├── components/          # 通用组件（Sidebar、TopBar 等）
│   ├── pages/               # 页面组件
│   │   ├── UGCVideoCenter.tsx   # UGC 视频中心
│   │   ├── ScriptLibrary.tsx    # 脚本拆解库
│   │   ├── TrendAnalysis.tsx    # 趋势分析
│   │   ├── CreatorDatabase.tsx  # 达人库
│   │   └── Downloads.tsx        # 素材下载
│   ├── services/            # API 服务层
│   ├── types/               # TypeScript 类型定义
│   └── data/                # 静态配置
├── server.cjs               # Express 后端服务
├── db.cjs                   # SQLite 数据库操作
├── temp/                    # 临时文件（视频/音频，自动清理）
└── data/                    # SQLite 数据库文件
```

---

## 数据存储

使用 **SQLite** 本地存储，无需额外数据库服务：

| 表 | 说明 |
|---|---|
| `videos` | 同步的视频数据 |
| `video_scripts` | 脚本、转写文本、AI 拆解结果 |
| `monitored_creators` | 监测的达人列表 |
| `sync_meta` | 同步元数据 |

---

## 注意事项

1. **Whisper API 费用**：视频转写按音频时长计费，约 $0.006/分钟。建议优先使用 TikHub 字幕提取（免费额度内）。
2. **yt-dlp 下载**：TikTok CDN 链接有过期时间，yt-dlp 通过模拟浏览器行为获取无水印视频，成功率较高。
3. **免费额度**：TikHub 每日有免费 API 调用额度，超出后需付费。
4. **语言支持**：当前 Whisper 转写默认使用英文（`language: en`），如需其他语言请修改 `server.cjs` 中的 `downloadAndTranscribe` 函数。

---

## License

MIT
