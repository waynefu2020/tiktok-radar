import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react'
import { User, AuthContextType } from '../types/auth'
import { getMe, login as loginApi, clearStoredToken, setStoredToken, getStoredToken, refreshToken } from '../services/auth'

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => {},
  logout: () => {},
  isAdmin: false,
})

export function useAuth() {
  return useContext(AuthContext)
}

function parseJwtExp(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp ? payload.exp * 1000 : null
  } catch {
    return null
  }
}

function isTokenExpiringSoon(token: string, thresholdDays = 3): boolean {
  const exp = parseJwtExp(token)
  if (!exp) return false
  const threshold = thresholdDays * 24 * 60 * 60 * 1000
  return exp - Date.now() < threshold
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const doRefresh = useCallback(async () => {
    const token = getStoredToken()
    if (!token || !isTokenExpiringSoon(token)) return
    try {
      const { token: newToken } = await refreshToken()
      setStoredToken(newToken)
    } catch {
      // refresh failed, let it expire naturally
    }
  }, [])

  useEffect(() => {
    const token = getStoredToken()
    if (token) {
      getMe()
        .then(u => {
          setUser(u)
          // refresh immediately if expiring soon
          doRefresh()
        })
        .catch(() => {
          clearStoredToken()
          setUser(null)
        })
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }

    // auto-refresh every 24h
    intervalRef.current = setInterval(doRefresh, 24 * 60 * 60 * 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [doRefresh])

  const login = useCallback(async (username: string, password: string) => {
    const { token, user } = await loginApi(username, password)
    setStoredToken(token)
    setUser(user)
  }, [])

  const logout = useCallback(() => {
    clearStoredToken()
    setUser(null)
    window.location.reload()
  }, [])

  const isAdmin = user?.role === 'admin'

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}
