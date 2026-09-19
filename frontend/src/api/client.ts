import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

export const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8000/api/v1' : '/api/v1')
export const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || (import.meta.env.DEV ? 'http://localhost:8000' : window.location.origin)

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) return fallback

  const detail = error.response?.data?.detail
  if (typeof detail === 'string' && detail.trim()) return detail
  if (Array.isArray(detail)) {
    const messages = detail.map((item) => typeof item === 'string' ? item : item?.msg).filter((item): item is string => Boolean(item))
    if (messages.length) return messages.join('. ')
  }
  return fallback
}

let refreshPromise: Promise<string> | null = null

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined
    const requestUrl = originalRequest?.url ?? ''
    const isAuthRequest = /\/auth\/(login|register)$/.test(requestUrl)

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry || isAuthRequest) {
      return Promise.reject(error)
    }

    const refreshToken = localStorage.getItem('refresh_token')
    if (!refreshToken) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      return Promise.reject(error)
    }

    originalRequest._retry = true

    try {
      refreshPromise ??= axios
        .post<{ access_token: string; refresh_token: string }>(
          '/auth/refresh',
          { refresh_token: refreshToken },
          { baseURL: client.defaults.baseURL },
        )
        .then(({ data }) => {
          localStorage.setItem('access_token', data.access_token)
          localStorage.setItem('refresh_token', data.refresh_token)
          return data.access_token
        })
        .finally(() => {
          refreshPromise = null
        })

      const accessToken = await refreshPromise
      originalRequest.headers.Authorization = `Bearer ${accessToken}`
      return client(originalRequest)
    } catch (refreshError) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      window.location.href = '/login'
      return Promise.reject(refreshError)
    }
  },
)

export default client
