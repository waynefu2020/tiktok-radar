import TopBar from '../components/TopBar'
import {
  BookOpen, Zap, LayoutDashboard, FileText, TrendingUp,
  Users, Box, BarChart3, Shell, HelpCircle, AlertTriangle,
  CheckCircle2, Mic, Sparkles, ExternalLink, ChevronRight, Shield,
} from 'lucide-react'

function SectionTitle({ icon: Icon, title }: { icon: typeof BookOpen; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-7 h-7 rounded-lg bg-[#6366F1]/10 border border-[#6366F1]/20 flex items-center justify-center">
        <Icon size={15} className="text-[#6366F1]" />
      </div>
      <h2 className="text-base font-semibold text-text-primary">{title}</h2>
    </div>
  )
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-border bg-bg p-5 ${className}`}>
      {children}
    </div>
  )
}

function Step({ num, title, desc }: { num: number; title: string; desc: string }) {
  return (
    <div className="flex gap-4">
      <div className="shrink-0 w-7 h-7 rounded-full bg-[#6366F1]/20 border border-[#6366F1]/30 flex items-center justify-center text-xs font-bold text-[#6366F1]">
        {num}
      </div>
      <div>
        <div className="text-sm font-medium text-text-secondary">{title}</div>
        <div className="text-xs text-text-muted mt-0.5 leading-relaxed">{desc}</div>
      </div>
    </div>
  )
}

function ModuleItem({ icon: Icon, title, desc }: { icon: typeof LayoutDashboard; title: string; desc: string }) {
  return (
    <div className="flex gap-3">
      <div className="shrink-0 w-8 h-8 rounded-lg bg-[#1E2130] border border-border flex items-center justify-center">
        <Icon size={15} className="text-text-muted" />
      </div>
      <div>
        <div className="text-sm font-medium text-text-secondary">{title}</div>
        <div className="text-xs text-text-muted mt-0.5 leading-relaxed">{desc}</div>
      </div>
    </div>
  )
}

function SourceBadge({ color, label, desc }: { color: string; label: string; desc: string }) {
  return (
    <div className="flex items-start gap-2">
      <span
        className="shrink-0 inline-block w-2.5 h-2.5 rounded-full mt-1"
        style={{ backgroundColor: color }}
      />
      <div>
        <span className="text-xs font-medium" style={{ color }}>{label}</span>
        <span className="text-xs text-text-muted ml-1">{desc}</span>
      </div>
    </div>
  )
}

function FAQItem({ q, a }: { q: string; a: string }) {
  return (
    <div className="border-b border-border last:border-0 pb-4 last:pb-0">
      <div className="flex items-start gap-2">
        <HelpCircle size={14} className="text-[#6366F1] mt-0.5 shrink-0" />
        <div>
          <div className="text-sm font-medium text-text-secondary">{q}</div>
          <div className="text-xs text-text-muted mt-1 leading-relaxed">{a}</div>
        </div>
      </div>
    </div>
  )
}

export default function Docs() {
  return (
    <div className="p-6 min-h-screen">
      <TopBar title="使用文档" subtitle="项目介绍与快速上手" />

      <div className="max-w-3xl mx-auto mt-6 space-y-8">
        {/* 简介 */}
        <Card className="!bg-gradient-to-br !from-[#6366F1]/10 !to-[#8B5CF6]/5 !border-[#6366F1]/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-[#6366F1]/20 border border-[#6366F1]/30 flex items-center justify-center">
              <Zap size={18} className="text-[#6366F1]" />
            </div>
            <div>
              <h1 className="text-base font-bold text-text-primary">TikTok 竞品雷达</h1>
              <p className="text-xs text-text-muted">竞品 UGC 视频监测与 AI 脚本拆解工具</p>
            </div>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">
            不用手动刷 TikTok。告诉系统你关注哪些 App 或创作者，它会帮你聚合 UGC 视频、追踪趋势、沉淀达人库，并在需要时补充 AI 辅助分析。
          </p>
        </Card>

        <div>
          <SectionTitle icon={Zap} title="项目介绍" />
          <Card className="space-y-4">
            <p className="text-sm text-text-secondary leading-relaxed">
              TikTok Radar 面向内容投放、增长和出海团队，核心目标是把「刷 TikTok 找素材」这件事，收敛成可复用的内容情报工作流。
            </p>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="rounded-lg bg-panel border border-border p-3">
                <div className="text-text-primary font-medium mb-1">监控内容</div>
                <div className="text-text-muted leading-relaxed">集中查看竞品 UGC、发布时间、互动量和来源 App。</div>
              </div>
              <div className="rounded-lg bg-panel border border-border p-3">
                <div className="text-text-primary font-medium mb-1">发现趋势</div>
                <div className="text-text-muted leading-relaxed">按时间和产品维度比对增长节奏，快速定位爆款方向。</div>
              </div>
              <div className="rounded-lg bg-panel border border-border p-3">
                <div className="text-text-primary font-medium mb-1">沉淀素材</div>
                <div className="text-text-muted leading-relaxed">把视频、达人和脚本洞察留在本地库里，减少重复检索成本。</div>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg bg-panel border border-border p-4">
              <div>
                <div className="text-sm font-medium text-text-primary">查看项目介绍页</div>
                <div className="text-xs text-text-muted mt-1">外部介绍页包含产品定位、核心功能和快速开始说明。</div>
              </div>
              <a
                href="https://landing-eta-self-21.vercel.app/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-[#6366F1]/30 bg-[rgba(99,102,241,0.12)] text-[#818CF8] hover:bg-[rgba(99,102,241,0.18)] transition-colors whitespace-nowrap"
              >
                <ExternalLink size={12} />
                打开介绍页
              </a>
            </div>
          </Card>
        </div>

        {/* 快速开始 */}
        <div>
          <SectionTitle icon={BookOpen} title="快速开始" />
          <Card className="space-y-5">
            <Step
              num={1}
              title="初始化管理员账号"
              desc='首次启动前，在服务器或本机执行 `npm run init-admin -- <username> <password> [display_name]`，系统不会再自动创建默认管理员。'
            />
            <Step
              num={2}
              title="管理员同步数据"
              desc='管理员进入「UGC 视频中心」或「ideaShell UGC」，手动触发同步、抓取或补抓。普通成员默认只读取已有缓存。'
            />
            <Step
              num={3}
              title="团队查看与筛选"
              desc='同事通过局域网地址访问系统，查看首页、脚本库、达人库、周报和 idea 视频列表；只有管理员可执行写操作和高成本分析。'
            />
          </Card>
        </div>

        <div>
          <SectionTitle icon={Shield} title="局域网部署" />
          <Card className="space-y-5">
            <Step
              num={1}
              title="推荐给同事访问的方式"
              desc='执行 `npm run build` 后再执行 `npm run start`，服务会在 `http://<局域网IP>:3001` 提供前后端一体化访问。'
            />
            <Step
              num={2}
              title="开发联调用法"
              desc='需要热更新时可执行 `npm run dev:lan`。前端开发端口为 `5173`，后端 API 端口为 `3001`，只适合调试，不建议作为团队长期访问入口。'
            />
            <Step
              num={3}
              title="必要环境变量"
              desc='至少配置 `JWT_SECRET`、`TIKHUB_API_KEY`，如需 AI 脚本拆解再配置 `AI_API_KEY`、`AI_BASE_URL`、`AI_MODEL`。可选配置 `ALLOWED_ORIGIN` 和 `DB_PATH`。'
            />
          </Card>
        </div>

        {/* 模块指南 */}
        <div>
          <SectionTitle icon={LayoutDashboard} title="功能模块指南" />
          <Card className="space-y-5">
            <ModuleItem
              icon={LayoutDashboard}
              title="UGC 视频中心"
              desc="追踪竞品在 TikTok 上的投放视频，支持按时间范围（最近7天/30天/90天）、App、关键词筛选。默认只显示已有缓存，管理员可手动同步最新数据。"
            />
            <ModuleItem
              icon={TrendingUp}
              title="趋势分析"
              desc="按周统计各竞品的视频发布量，可视化对比投放节奏。帮助判断竞品是否在加大投放力度。"
            />
            <ModuleItem
              icon={Users}
              title="达人库"
              desc="查看竞品合作的 TikTok 达人及其绑定 App。新增监控账号、刷新资料和删除达人仅管理员可操作。"
            />
            <ModuleItem
              icon={Box}
              title="竞品管理"
              desc="配置要追踪的竞品 App。普通成员只读，管理员可新增或删除关键词配置。"
            />
            <ModuleItem
              icon={BarChart3}
              title="爆款周报"
              desc="每周自动生成爆款视频 TOP10。统计周期为上周五到本周四，仅统计本周内发布的爆款视频（点赞≥1万且互动率>5%）。"
            />
            <ModuleItem
              icon={Shell}
              title="ideaShell UGC"
              desc="管理 ideaShell 自有合作博主并展示数据面板。页面不再自动补抓视频，由管理员手动执行补抓或全量抓取。"
            />
          </Card>
        </div>

        {/* AI 脚本拆解说明 */}
        <div>
          <SectionTitle icon={Sparkles} title="AI 脚本拆解原理" />
          <Card className="space-y-4">
            <p className="text-sm text-text-secondary leading-relaxed">
              每条视频的脚本拆解采用<strong className="text-text-primary">三层降级策略</strong>，优先使用最准确的数据源：
            </p>
            <div className="space-y-3 rounded-lg bg-[#161823] border border-border p-4">
              <SourceBadge
                color="#10B981"
                label="真实字幕"
                desc="从 TikHub API 直接提取视频自带字幕，准确度最高，免费额度内使用。"
              />
              <SourceBadge
                color="#38BDF8"
                label="AI 转写"
                desc="下载视频 → 提取音频 → 通过 OpenAI Whisper 模型自动转写生成逐字稿。按音频时长计费，约 $0.006/分钟。"
              />
              <SourceBadge
                color="#F59E0B"
                label="推测"
                desc="未获取到视频字幕且 Whisper 不可用，AI 基于标题、标签和互动数据推测脚本结构。仅供参考，准确度有限。"
              />
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              拆解维度包括：开场钩子 · 用户痛点 · 内容结构 · 产品植入 · CTA（行动号召）· 可复用拍摄建议。
            </p>
          </Card>
        </div>

        {/* 费用说明 */}
        <div>
          <SectionTitle icon={AlertTriangle} title="费用与额度" />
          <Card>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <ExternalLink size={14} className="text-text-muted mt-0.5 shrink-0" />
                <div>
                  <div className="font-medium text-text-secondary">TikHub API</div>
                  <div className="text-xs text-text-muted mt-0.5">
                    每日有免费 API 调用额度。超出后需付费。视频同步和博主信息查询均通过 TikHub。
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mic size={14} className="text-text-muted mt-0.5 shrink-0" />
                <div>
                  <div className="font-medium text-text-secondary">Whisper 语音转写</div>
                  <div className="text-xs text-text-muted mt-0.5">
                    按音频时长计费，约 <span className="text-[#F59E0B] font-medium">$0.006/分钟</span>。
                    建议优先使用 TikHub 字幕提取（免费），仅当字幕不存在时才触发 Whisper 转写。
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* FAQ */}
        <div>
          <SectionTitle icon={HelpCircle} title="常见问题" />
          <Card className="space-y-4">
            <FAQItem
              q="为什么脚本分析结果显示「推测」？"
              a="该视频没有自带字幕，且 Whisper 语音转写因某种原因失败（如视频下载失败、API 不可用等）。系统退回到第三层策略，由 AI 根据标题、标签和互动数据推测脚本结构，准确度有限，仅供参考。"
            />
            <FAQItem
              q="同步视频失败怎么办？"
              a="常见原因：1）TikHub API Key 失效或额度用完；2）网络连接问题；3）竞品关键词没有返回结果；4）当前账号不是管理员。优先确认是否为管理员，再检查环境变量和网络。"
            />
            <FAQItem
              q="爆款周报为什么显示 0 条？"
              a="周报的统计周期是「上周五到本周四」，仅统计这个时间段内发布且满足「点赞≥1万、互动率>5%」条件的视频。如果本周竞品没有发布足够爆的视频，或者数据尚未同步，就会显示 0 条。"
            />
            <FAQItem
              q="数据多久自动更新一次？"
              a="视频数据不会自动更新。管理员需要手动进入「UGC 视频中心」或「ideaShell UGC」页面执行同步、抓取或补抓；普通成员只查看已有缓存。"
            />
            <FAQItem
              q="如何添加新的竞品 App？"
              a='管理员进入「竞品管理」页面，填写 App ID（英文小写，如 coconote）、显示名称、品牌色和搜索关键词（多个关键词用英文逗号分隔，如 "coconote, coconote app"），点击添加即可。'
            />
            <FAQItem
              q="为什么首次启动后不能直接登录？"
              a="系统已移除默认管理员和默认密码。首次部署后必须先执行 `npm run init-admin -- <username> <password> [display_name]` 初始化首个管理员账号。"
            />
            <FAQItem
              q="忘记管理员密码怎么办？"
              a="可在部署机器上执行 `node scripts/reset_admin_password.cjs <username> <new_password>`。该脚本会操作当前 `DB_PATH` 指向的数据库；若未设置 `DB_PATH`，默认修改项目本地 `data/tiktok-radar.db`。"
            />
            <FAQItem
              q="ideaShell UGC 和 UGC 视频中心有什么区别？"
              a="UGC 视频中心追踪的是「竞品」的投放视频；ideaShell UGC 管理的是「我们自己的合作博主」发布的视频。两者数据源和用途不同。"
            />
          </Card>
        </div>

        {/* 底部提示 */}
        <div className="text-center pb-8">
          <p className="text-xs text-text-muted">
            遇到其他问题？联系技术团队或查看项目 README。
          </p>
        </div>
      </div>
    </div>
  )
}
