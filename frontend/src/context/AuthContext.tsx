import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from 'react'
import client from '../api/client'
import type {
  LoginCredentials,
  RegisterCredentials,
  TokenResponse,
  User,
} from '../types/auth'

interface AuthContextValue {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  register: (credentials: RegisterCredentials) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function persistTokens(data: TokenResponse): void {
  localStorage.setItem('access_token', data.access_token)
  localStorage.setItem('refresh_token', data.refresh_token)
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('access_token'))
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const hydrateUser = async () => {
      const accessToken = localStorage.getItem('access_token')
      if (!accessToken) {
        setIsLoading(false)
        return
      }

      try {
        const response = await client.get<User>('/auth/me')
        setUser(response.data)
        setToken(accessToken)
      } catch {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        setUser(null)
        setToken(null)
      } finally {
        setIsLoading(false)
      }
    }

    void hydrateUser()
  }, [])

  const login = async (credentials: LoginCredentials) => {
    const { data } = await client.post<TokenResponse>('/auth/login', credentials)
    persistTokens(data)
    setToken(data.access_token)
    const profile = await client.get<User>('/auth/me')
    setUser(profile.data)
  }

  const register = async (credentials: RegisterCredentials) => {
    await client.post<User>('/auth/register', credentials)
    await login({ email: credentials.email, password: credentials.password })
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
    setToken(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token),
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
