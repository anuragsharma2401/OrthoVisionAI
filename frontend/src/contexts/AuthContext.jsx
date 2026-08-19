import { createContext, useContext, useMemo, useState } from 'react'

const AuthContext = createContext(null)
const SESSION_KEY = 'orthovision_dev_user'
const DEV_AUTH_ENABLED = import.meta.env.VITE_ENABLE_DEV_AUTH === 'true'

const defaultDevelopmentUser = {
  name: 'Anurag Sharma',
  email: 'anurag@example.com',
  phone: '9876543210',
  role: 'Student',
  emailVerified: false,
  phoneVerified: false,
}

function getInitialUser() {
  if (!DEV_AUTH_ENABLED) return null

  try {
    const storedUser = window.sessionStorage.getItem(SESSION_KEY)
    return storedUser ? JSON.parse(storedUser) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getInitialUser)

  function startDevelopmentSession(userData = {}) {
    if (!DEV_AUTH_ENABLED) {
      throw new Error('Development auth is disabled.')
    }

    const nextUser = {
      ...defaultDevelopmentUser,
      ...userData,
    }

    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(nextUser))
    setUser(nextUser)
    return nextUser
  }

  function updateCurrentUser(userData) {
    const nextUser = {
      ...user,
      ...userData,
    }

    if (DEV_AUTH_ENABLED) {
      window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(nextUser))
    }

    setUser(nextUser)
    return nextUser
  }

  function logout() {
    window.sessionStorage.removeItem(SESSION_KEY)
    setUser(null)
  }

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(user),
      isDevelopmentAuthEnabled: DEV_AUTH_ENABLED,
      logout,
      startDevelopmentSession,
      updateCurrentUser,
      user,
    }),
    [user],
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
