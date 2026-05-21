import axios, { type InternalAxiosRequestConfig } from 'axios'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const api = axios.create({ baseURL })

// ---- Request interceptor: добавя Authorization header ----
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ---- Response interceptor: handle 401 with refresh token ----
type RetriableRequest = InternalAxiosRequestConfig & { _retry?: boolean }

let isRefreshing = false
let refreshSubscribers: Array<(token: string) => void> = []

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token))
  refreshSubscribers = []
}

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb)
}

function clearAuthAndRedirect() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('user')
  if (window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as RetriableRequest | undefined

    // Не пипай ако няма config или вече сме опитвали да rerun-ваме
    if (
      !originalRequest ||
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes('/api/auth/token/refresh/') ||
      originalRequest.url?.includes('/api/auth/login/')
    ) {
      return Promise.reject(error)
    }

    originalRequest._retry = true

    const refreshToken = localStorage.getItem('refresh_token')
    if (!refreshToken) {
      clearAuthAndRedirect()
      return Promise.reject(error)
    }

    // Ако вече се прави refresh, изчакай го
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((newToken) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`
          }
          api(originalRequest).then(resolve).catch(reject)
        })
      })
    }

    isRefreshing = true

    try {
      const { data } = await axios.post(`${baseURL}/api/auth/token/refresh/`, {
        refresh: refreshToken,
      })
      localStorage.setItem('access_token', data.access)
      if (data.refresh) {
        // ROTATE_REFRESH_TOKENS = True в settings.py - идва нов refresh
        localStorage.setItem('refresh_token', data.refresh)
      }
      onRefreshed(data.access)
      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${data.access}`
      }
      return api(originalRequest)
    } catch (refreshError) {
      clearAuthAndRedirect()
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)
