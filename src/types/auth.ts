export interface User {
  id: number
  username: string
  role: 'admin' | 'user'
  displayName: string
  createdAt: string
}

export interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  isAdmin: boolean
}
