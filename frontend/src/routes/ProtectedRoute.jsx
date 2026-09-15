import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'

function ProtectedRoute({ children }) {
  const { isAuthenticated, isRestoringSession, restoreSession } = useAuth()
  const [hasCheckedSession, setHasCheckedSession] = useState(false)
  const location = useLocation()

  useEffect(() => {
    let isMounted = true

    async function checkSession() {
      if (!isAuthenticated) {
        await restoreSession()
      }

      if (isMounted) {
        setHasCheckedSession(true)
      }
    }

    checkSession()

    return () => {
      isMounted = false
    }
  }, [isAuthenticated, restoreSession])

  if (!hasCheckedSession || isRestoringSession) {
    return null
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}

export default ProtectedRoute
