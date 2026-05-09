import TopBar from '../components/TopBar'
import {
  BookOpen, Zap, LayoutDashboard, FileText, TrendingUp,
  Users, Box, BarChart3, Shell, HelpCircle, AlertTriangle,
  CheckCircle2, Mic, Sparkles, ExternalLink, ChevronRight, Download,
} from 'lucide-react'

function SectionTitle({ icon: Icon, title }: { icon: typeof BookOpen; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-7 h-7 rounded-lg bg-[#6366F1]/10 border border-[#6366F1]/20 flex items-center justify-center">
        <Icon size={15} className="text-[#6366F1]" />
      </div>
      <h2 className="text-base font-semibold text-white">{title}</h2>
    </div>
  )
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-[#2E3045] bg-[#1c1e2a] p-5 ${className}`}>
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
        <div className="text-sm font-medium text-[#C8CBE0]">{title}</div>
        <div className="text-xs text-[#8A8FA8] mt-0.5 leading-relaxed">{desc}</div>
      </div>
    </div>
  )
}

function ModuleItem({ icon: Icon, title, desc }: { icon: typeof LayoutDashboard; title: string; desc: string }) {
  return (
    <div className="flex gap-3">
      <div className="shrink-0 w-8 h-8 rounded-lg bg-[#1E2130] border border-[#2E3045] flex items-center justify-center">
        <Icon size={15} className="text-[#8A8FA8]" />
      </div>
      <div>
        <div className="text-sm font-medium text-[#C8CBE0]">{title}</div>
        <div className="text-xs text-[#8A8FA8] mt-0.5 leading-relaxed">{desc}</div>
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
        <span className="text-xs text-[#8A8FA8] ml-1">{desc}</span>
      </div>
    </div>
  )
}

function FAQItem({ q, a }: { q: string; a: string }) {
  return (
    <div className="border-b border-[#2E3045] last:border-0 pb-4 last:pb-0">
      <div className="flex items-start gap-2">
        <HelpCircle size={14} className="text-[#6366F1] mt-0.5 shrink-0" />
        <div>
          <div className="text-sm font-medium text-[#C8CBE0]">{q}</div>
          <div className="text-xs text-[#8A8FA8] mt-1 leading-relaxed">{a}</div>
        </div>
      </div>
    </div>
  )
}

export default function Docs() {
  return (
    <div className="p-6 min-h-screen">
      <TopBar title="使用文档" subtitle="快速上手指南" />

      <div className="max-w-3xl mx-auto mt-6 space-y-8">
        {/* 简介 */}
        <Card className="!bg-gradient-to-br !from-[#6366F1]/10 !to-[#8B5CF6]/5 !border-[#6366F1]/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-[#6366F1]/20 border border-[#6366F1]/30 flex items-center justify-center">
              <Zap size={18} className="text-[#6366F1]" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white">TikTok 竞品雷达</h1>
              <p className="text-xs text-[#8A8FA8]">竞品 UGC 视频监测与 AI 脚本拆解工具</p>
            </div>
          </div>
          <p className="text-sm text-[#C8CBE0] leading-relaxed">
            自动追踪竞品 App 在 TikTok 上的投放视频，通过 AI 提取逐字稿并拆解脚本结构，
            帮助你快速复刻爆款内容。面向出海营销团队设计。
          </p>
        </Card>

        {/* 快速开始 */}
        <div>
          <SectionTitle icon={BookOpen} title="快速开始" />
          <Card className="space-y-5">
            <Step
              num={1}
              title="添加竞品"
              desc='进入「竞品管理」页面，输入 App 名称和 TikTok 关键词（如 "turbolearn ai"），点击添加。'
            />
            <Step
              num={2}
              title="同步视频数据"
              desc='进入「UGC 视频中心」，点击「同步视频」按钮，系统自动从 TikTok 拉取竞品相关视频。'
            />
            <Step
              num={3}
              title="查看 AI 脚本拆解"
              desc='点击任意视频右侧的「脚本」按钮，系统会自动提取字幕/转写文本，并生成 6 维度的拆解分析。'
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
              desc="追踪竞品在 TikTok 上的投放视频，支持按时间范围（最近7天/30天/90天）、App、关键词筛选。点击「同步视频」可拉取最新数据。"
            />
            <ModuleItem
              icon={FileText}
              title="脚本拆解"
              desc="浏览所有已分析的脚本逐字稿和 AI 拆解结果。可按 App、钩子类型、拆解来源筛选。支持一键复制英文逐字稿，用于内容复刻。"
            />
            <ModuleItem
              icon={TrendingUp}
              title="趋势分析"
              desc="按周统计各竞品的视频发布量，可视化对比投放节奏。帮助判断竞品是否在加大投放力度。"
            />
            <ModuleItem
              icon={Download}
              title="素材下载"
              desc="下载视频原始素材（封面、视频文件等），用于内部素材库建设。"
            />
            <ModuleItem
              icon={Users}
              title="达人库"
              desc="监测和管理竞品合作的 TikTok 达人。记录每位达人绑定的竞品 App，方便筛选合作对象。"
            />
            <ModuleItem
              icon={Box}
              title="竞品管理"
              desc="配置要追踪的竞品 App。每个 App 可设置多个关键词，系统会同时搜索这些关键词相关的视频。"
            />
            <ModuleItem
              icon={BarChart3}
              title="爆款周报"
              desc="每周自动生成爆款视频 TOP10。统计周期为上周五到本周四，仅统计本周内发布的爆款视频（点赞≥1万且互动率>5%）。"
            />
            <ModuleItem
              icon={Shell}
              title="ideaShell UGC"
              desc="管理 ideaShell 自有合作博主。添加 TikTok 账号后，系统自动抓取博主视频并展示数据面板（粉丝量、播放量、互动率等）。"
            />
          </Card>
        </div>

        {/* AI 脚本拆解说明 */}
        <div>
          <SectionTitle icon={Sparkles} title="AI 脚本拆解原理" />
          <Card className="space-y-4">
            <p className="text-sm text-[#C8CBE0] leading-relaxed">
              每条视频的脚本拆解采用<strong className="text-white">三层降级策略</strong>，优先使用最准确的数据源：
            </p>
            <div className="space-y-3 rounded-lg bg-[#161823] border border-[#2E3045] p-4">
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
            <p className="text-xs text-[#8A8FA8] leading-relaxed">
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
                <ExternalLink size={14} className="text-[#8A8FA8] mt-0.5 shrink-0" />
                <div>
                  <div className="font-medium text-[#C8CBE0]">TikHub API</div>
                  <div className="text-xs text-[#8A8FA8] mt-0.5">
                    每日有免费 API 调用额度。超出后需付费。视频同步和博主信息查询均通过 TikHub。
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mic size={14} className="text-[#8A8FA8] mt-0.5 shrink-0" />
                <div>
                  <div className="font-medium text-[#C8CBE0]">Whisper 语音转写</div>
                  <div className="text-xs text-[#8A8FA8] mt-0.5">
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
              a="常见原因：1）TikHub API Key 失效或额度用完；2）网络连接问题；3）竞品关键词没有返回结果。可尝试刷新页面后重新同步，或检查「健康检查」页面（右上角）确认 API 状态。"
            />
            <FAQItem
              q="爆款周报为什么显示 0 条？"
              a="周报的统计周期是「上周五到本周四」，仅统计这个时间段内发布且满足「点赞≥1万、互动率>5%」条件的视频。如果本周竞品没有发布足够爆的视频，或者数据尚未同步，就会显示 0 条。"
            />
            <FAQItem
              q="数据多久自动更新一次？"
              a="视频数据不会自动更新，需要手动进入「UGC 视频中心」或「ideaShell UGC」页面点击同步按钮拉取最新数据。"
            />
            <FAQItem
              q="如何添加新的竞品 App？"
              a='进入「竞品管理」页面，填写 App ID（英文小写，如 coconote）、显示名称、品牌色和搜索关键词（多个关键词用英文逗号分隔，如 "coconote, coconote app"），点击添加即可。'
            />
            <FAQItem
              q="ideaShell UGC 和 UGC 视频中心有什么区别？"
              a="UGC 视频中心追踪的是「竞品」的投放视频；ideaShell UGC 管理的是「我们自己的合作博主」发布的视频。两者数据源和用途不同。"
            />
          </Card>
        </div>

        {/* 底部提示 */}
        <div className="text-center pb-8">
          <p className="text-xs text-[#8A8FA8]">
            遇到其他问题？联系技术团队或查看项目 README。
          </p>
        </div>
      </div>
    </div>
  )
}
