import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import UGCVideoCenter from './pages/UGCVideoCenter'
import TrendAnalysis from './pages/TrendAnalysis'
import ScriptLibrary from './pages/ScriptLibrary'
import Downloads from './pages/Downloads'
import CreatorDatabase from './pages/CreatorDatabase'
import Placeholder from './pages/Placeholder'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#0A0C10] flex">
        <Sidebar />
        <main className="flex-1 ml-[240px] min-h-screen overflow-auto">
          <Routes>
            <Route path="/" element={<UGCVideoCenter />} />
            <Route path="/trends" element={<TrendAnalysis />} />
            <Route path="/scripts" element={<ScriptLibrary />} />
            <Route path="/downloads" element={<Downloads />} />
            <Route path="/creators" element={<CreatorDatabase />} />
            <Route path="/docs" element={<Placeholder title="使用文档" subtitle="快速上手指南" />} />
            <Route path="/settings" element={<Placeholder title="设置" subtitle="账号与偏好设置" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
