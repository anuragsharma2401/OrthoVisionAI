import { Navigate, Route, Routes } from 'react-router-dom'
import AnalysisHistory from './pages/AnalysisHistory.jsx'
import Dashboard from './pages/Dashboard.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import HealthTimeline from './pages/HealthTimeline.jsx'
import Landing from './pages/Landing.jsx'
import Login from './pages/Login.jsx'
import Profile from './pages/Profile.jsx'
import Register from './pages/Register.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import RecoveryGuidance from './pages/RecoveryGuidance.jsx'
import Settings from './pages/Settings.jsx'
import Verify from './pages/Verify.jsx'
import ProtectedRoute from './routes/ProtectedRoute.jsx'
import XRayAnalysis from './pages/XRayAnalysis.jsx'
import MedicalReports from './pages/MedicalReports.jsx'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify" element={<Verify />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route 
        path="/xray-analysis" 
        element={
          <ProtectedRoute>
            <XRayAnalysis />
          </ProtectedRoute>
        }
      />

      <Route
        path="/medical-reports"
        element={
          <ProtectedRoute>
            <MedicalReports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analysis-history"
        element={
          <ProtectedRoute>
            <AnalysisHistory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/recovery-guidance"
        element={
          <ProtectedRoute>
            <RecoveryGuidance />
          </ProtectedRoute>
        }
      />
      <Route
        path="/health-timeline"
        element={
          <ProtectedRoute>
            <HealthTimeline />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
