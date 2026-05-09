import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './components/AuthProvider'
import { ThemeProvider } from './components/ThemeProvider'
import Sidebar from './components/Sidebar'
import ViralAlert from './components/ViralAlert'
import Login from './pages/Login'
import UGCVideoCenter from './pages/UGCVideoCenter'
import TrendAnalysis from './pages/TrendAnalysis'
import CreatorDatabase from './pages/CreatorDatabase'
import AppManager from './pages/AppManager'
import WeeklyReport from './pages/WeeklyReport'
import IdeaShellPage from './pages/IdeaShellPage'
import Docs from './pages/Docs'
import Settings from './pages/Settings'
import UserManagement from './pages/UserManagement'

function ProtectedRoute({ children, requireAdmin = false }: { children: React.ReactNode; requireAdmin?: boolean }) {
  const { user, isLoading, isAdmin } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="animate-spin w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

function AppLayout() {
  return (
    <div className="min-h-screen bg-bg flex">
      <Sidebar />
      <main className="flex-1 ml-[240px] min-h-screen overflow-auto">
        <ViralAlert />
        <Routes>
          <Route path="/" element={<UGCVideoCenter />} />
          <Route path="/trends" element={<TrendAnalysis />} />
          <Route path="/scripts" element={<Navigate to="/" replace />} />
          <Route path="/downloads" element={<Navigate to="/" replace />} />
          <Route path="/creators" element={<CreatorDatabase />} />
          <Route path="/apps" element={<AppManager />} />
          <Route path="/weekly" element={<WeeklyReport />} />
          <Route path="/idea-shell" element={<IdeaShellPage />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/users" element={<UserManagement />} />
        </Routes>
      </main>
    </div>
  )
}

function LoginRoute() {
  const { user, isLoading } = useAuth()
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="animate-spin w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full" />
      </div>
    )
  }
  if (user) return <Navigate to="/" replace />
  return <Login />
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginRoute />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  )
}
