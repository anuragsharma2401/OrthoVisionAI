import axios from 'axios'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

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

export async function apiRequest(config) {
  assertApiConfigured()

  try {
    const response = await apiClient(config)
    return response.data
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.detail ||
      error.message ||
      'Request failed.'

    throw new Error(message)
  }
}

export default apiClient
