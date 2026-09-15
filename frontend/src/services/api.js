import axios from 'axios'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const TOKEN_KEY = 'orthovision_access_token'

export function assertApiConfigured() {
  if (!API_BASE_URL) {
    throw new Error('API is not configured yet. Set VITE_API_BASE_URL to connect FastAPI.')
  }
}

const apiClient = axios.create({
  baseURL: API_BASE_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
})

export function getStoredToken() {
  return window.sessionStorage.getItem(TOKEN_KEY)
}

export function setStoredToken(token) {
  if (token) {
    window.sessionStorage.setItem(TOKEN_KEY, token)
  }
}

export function clearStoredToken() {
  window.sessionStorage.removeItem(TOKEN_KEY)
}

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }

  return config
})

export async function apiRequest(config) {
  assertApiConfigured()

  try {
    const response = await apiClient(config)
    return response.data
  } catch (error) {
    if (error.response?.status === 401) {
      clearStoredToken()
    }

    const message =
      getFriendlyApiError(error.response?.status, error.response?.data) ||
      'Something went wrong. Please try again.'

    throw new Error(message)
  }
}

function getFriendlyApiError(status, data) {
  const detail = data?.detail || data?.message

  if (status === 401) {
    return detail === 'Invalid password'
      ? 'Invalid email or password.'
      : 'Your session is invalid or expired. Please login again.'
  }

  if (status === 404 && detail === 'User not found') {
    return 'Invalid email or password.'
  }

  if (status === 400 && detail) {
    return detail
  }

  if (Array.isArray(detail)) {
    return detail[0]?.msg || 'Please check the highlighted fields.'
  }

  if (typeof detail === 'string' && status && status < 500) {
    return detail
  }

  return ''
}

export default apiClient
