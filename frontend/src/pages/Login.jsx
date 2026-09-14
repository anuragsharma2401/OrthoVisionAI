import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/auth/AuthLayout.jsx'
import FormField from '../components/auth/FormField.jsx'
import GoogleButton from '../components/auth/GoogleButton.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { googleLogin, loginUser } from '../services/authService.js'
import { isValidEmail } from '../utils/validation.js'

const initialValues = {
  email: '',
  password: '',
  remember: false,
}

function Login() {
  const { isDevelopmentAuthEnabled, startDevelopmentSession, updateCurrentUser } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState({ type: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  function updateValue(event) {
    const { checked, name, type, value } = event.target
    setValues((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
    setErrors((current) => ({ ...current, [name]: '' }))
  }

  function validate() {
    const nextErrors = {}

    if (!values.email.trim()) nextErrors.email = 'Email is required.'
    else if (!isValidEmail(values.email)) nextErrors.email = 'Enter a valid email address.'

    if (!values.password) nextErrors.password = 'Password is required.'

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setStatus({ type: '', message: '' })

    if (!validate()) return

    setIsSubmitting(true)
    try {
      const response = await loginUser(values)
      updateCurrentUser(response.user)
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true })
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Login is unavailable right now.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleDevelopmentLogin() {
    try {
      startDevelopmentSession({
        email: values.email || 'anurag@example.com',
      })
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true })
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    }
  }

  async function handleGoogleLogin() {
    setStatus({ type: '', message: '' })
    setIsSubmitting(true)
    try {
      await googleLogin()
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Google login is unavailable right now.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="Secure access"
      title="Welcome back to OrthoVision AI."
      subtitle="Sign in to continue your X-ray analysis workflow, recovery guidance, and reports."
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <GoogleButton
          disabled={isSubmitting}
          text="Continue with Google"
          onClick={handleGoogleLogin}
        />

        <div className="auth-divider">
          <span>or sign in with email</span>
        </div>

        <FormField
          autoComplete="email"
          error={errors.email}
          id="email"
          label="Email"
          name="email"
          placeholder="you@example.com"
          value={values.email}
          onChange={updateValue}
        />

        <FormField
          autoComplete="current-password"
          error={errors.password}
          id="password"
          label="Password"
          name="password"
          placeholder="Enter your password"
          showPassword={showPassword}
          type="password"
          value={values.password}
          onChange={updateValue}
          onTogglePassword={() => setShowPassword((current) => !current)}
        />

        <div className="form-row">
          <label className="checkbox-field">
            <input
              checked={values.remember}
              name="remember"
              type="checkbox"
              onChange={updateValue}
            />
            <span>Remember me</span>
          </label>
          <Link to="/forgot-password">Forgot Password?</Link>
        </div>

        {status.message && (
          <p className={`form-status ${status.type}`}>{status.message}</p>
        )}

        <button className="primary-button auth-submit" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Signing in...' : 'Login'}
        </button>

        {isDevelopmentAuthEnabled && (
          <button className="dev-auth-button" type="button" onClick={handleDevelopmentLogin}>
            Continue with development session
          </button>
        )}

        <p className="auth-switch">
          Don&apos;t have an account? <Link to="/register">Register</Link>
        </p>
      </form>
    </AuthLayout>
  )
}

export default Login
