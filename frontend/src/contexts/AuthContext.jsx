import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { clearStoredToken, getStoredToken, setStoredToken } from '../services/api.js'
import {
  getCurrentUser,
  loginUser,
  registerUser,
} from '../services/authService.js'

const AuthContext = createContext(null)
const DEV_SESSION_KEY = 'orthovision_dev_user'
const DEV_AUTH_ENABLED = import.meta.env.VITE_ENABLE_DEV_AUTH === 'true'

const defaultDevelopmentUser = {
  name: 'Anurag',
  fullName: 'Anurag',
  email: 'anurag@example.com',
  phone: '9876543210',
  role: 'Student',
  emailVerified: false,
  phoneVerified: false,
}

function getInitialUser() {
  if (!DEV_AUTH_ENABLED) return null

  try {
    const storedUser = window.sessionStorage.getItem(DEV_SESSION_KEY)
    return storedUser ? JSON.parse(storedUser) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getInitialUser)
  const [isRestoringSession, setIsRestoringSession] = useState(false)

  const applyAuthenticatedUser = useCallback((response) => {
    if (response.token) {
      setStoredToken(response.token)
    }

    setUser(response.user)
  }, [])

  const login = useCallback(async (credentials) => {
    const response = await loginUser(credentials)
    applyAuthenticatedUser(response)
    return response
  }, [applyAuthenticatedUser])

  const register = useCallback(async (payload) => {
    const response = await registerUser(payload)
    return response
  }, [])

  const restoreSession = useCallback(async () => {
    const token = getStoredToken()

    if (!token) return null

    setIsRestoringSession(true)
    try {
      const response = await getCurrentUser()
      setUser(response.user || response)
      return response
    } catch {
      clearStoredToken()
      setUser(null)
      return null
    } finally {
      setIsRestoringSession(false)
    }
  }, [])

  const startDevelopmentSession = useCallback((userData = {}) => {
    if (!DEV_AUTH_ENABLED) {
      throw new Error('Development auth is disabled.')
    }

    const nextUser = {
      ...defaultDevelopmentUser,
      ...userData,
    }

    window.sessionStorage.setItem(DEV_SESSION_KEY, JSON.stringify(nextUser))
    setUser(nextUser)
    return nextUser
  }, [])

  const updateCurrentUser = useCallback((userData) => {
    const nextUser = {
      ...user,
      ...userData,
    }

    if (DEV_AUTH_ENABLED) {
      window.sessionStorage.setItem(DEV_SESSION_KEY, JSON.stringify(nextUser))
    }

    setUser(nextUser)
    return nextUser
  }, [user])

  const logout = useCallback(() => {
    clearStoredToken()
    window.sessionStorage.removeItem(DEV_SESSION_KEY)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(user),
      isDevelopmentAuthEnabled: DEV_AUTH_ENABLED,
      isRestoringSession,
      login,
      logout,
      register,
      restoreSession,
      startDevelopmentSession,
      updateCurrentUser,
      user,
    }),
    [
      isRestoringSession,
      login,
      logout,
      register,
      restoreSession,
      startDevelopmentSession,
      updateCurrentUser,
      user,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider.')
  }

  return context
}
