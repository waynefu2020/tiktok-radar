import { LucideIcon, Construction } from 'lucide-react'
import TopBar from '../components/TopBar'

interface Props {
  title: string
  subtitle?: string
}

export default function Placeholder({ title, subtitle }: Props) {
  return (
    <div className="p-6">
      <TopBar title={title} subtitle={subtitle} />
      <div className="mt-20 flex flex-col items-center gap-3 text-center">
        <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center">
          <Construction size={22} className="text-white" />
        </div>
        <p className="text-sm text-[#C8CBE0] font-medium">{title}</p>
        <p className="text-xs text-[#8A8FA8]">功能正在建设中，敬请期待</p>
      </div>
    </div>
  )
}
