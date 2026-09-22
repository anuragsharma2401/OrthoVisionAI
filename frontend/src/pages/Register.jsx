import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/auth/AuthLayout.jsx'
import FormField from '../components/auth/FormField.jsx'
import GoogleButton from '../components/auth/GoogleButton.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import {
  getPasswordStrength,
  isValidEmail,
} from '../utils/validation.js'

const initialValues = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
}

function Register() {
  const { isDevelopmentAuthEnabled, loginWithGoogle, register, startDevelopmentSession } = useAuth()
  const navigate = useNavigate()
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [status, setStatus] = useState({ type: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const passwordStrength = useMemo(
    () => getPasswordStrength(values.password),
    [values.password],
  )

  function updateValue(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
  }

  function validate() {
    const nextErrors = {}

    if (!values.fullName.trim()) nextErrors.fullName = 'Full name is required.'

    if (!values.email.trim()) nextErrors.email = 'Email is required.'
    else if (!isValidEmail(values.email)) nextErrors.email = 'Enter a valid email address.'

    if (!values.password) nextErrors.password = 'Password is required.'
    else if (passwordStrength.score < 4) {
      nextErrors.password =
        'Use at least 8 characters with uppercase, lowercase, number, and symbol.'
    }

    if (!values.confirmPassword) {
      nextErrors.confirmPassword = 'Confirm your password.'
    } else if (values.confirmPassword !== values.password) {
      nextErrors.confirmPassword = 'Passwords do not match.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setStatus({ type: '', message: '' })

    if (!validate()) return

    setIsSubmitting(true)
    try {
      await register(values)
      setStatus({
        type: 'success',
        message: 'Registration successful. Please login to continue.',
      })
      navigate('/login', { replace: true })
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Registration is unavailable right now.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleDevelopmentRegister() {
    try {
      startDevelopmentSession({
        name: values.fullName || 'Anurag',
        email: values.email || 'anurag@example.com',
      })
      navigate('/verify')
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    }
  }

  async function handleGoogleLogin() {
    setStatus({ type: '', message: '' })
    setIsSubmitting(true)
    try {
      await loginWithGoogle()
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Google registration is unavailable right now.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="Create account"
      title="Start your orthopedic AI workspace."
      subtitle="Create a secure account for X-ray analysis, recovery guidance, and downloadable reports."
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <GoogleButton
          disabled={isSubmitting}
          text="Continue with Google"
          onClick={handleGoogleLogin}
        />

        <div className="auth-divider">
          <span>or register with email</span>
        </div>

        <FormField
          autoComplete="name"
          error={errors.fullName}
          id="fullName"
          label="Full Name"
          name="fullName"
          placeholder="Your full name"
          value={values.fullName}
          onChange={updateValue}
        />

        <FormField
          autoComplete="email"
          error={errors.email}
          id="registerEmail"
          label="Email"
          name="email"
          placeholder="you@example.com"
          value={values.email}
          onChange={updateValue}
        />

        <FormField
          autoComplete="new-password"
          error={errors.password}
          id="registerPassword"
          label="Password"
          name="password"
          placeholder="Create a strong password"
          showPassword={showPassword}
          type="password"
          value={values.password}
          onChange={updateValue}
          onTogglePassword={() => setShowPassword((current) => !current)}
        />

        {values.password && (
          <div className="password-strength" aria-live="polite">
            <span className={passwordStrength.className}></span>
            <p>Password strength: {passwordStrength.label}</p>
          </div>
        )}

        <FormField
          autoComplete="new-password"
          error={errors.confirmPassword}
          id="confirmPassword"
          label="Confirm Password"
          name="confirmPassword"
          placeholder="Repeat your password"
          showPassword={showConfirmPassword}
          type="password"
          value={values.confirmPassword}
          onChange={updateValue}
          onTogglePassword={() => setShowConfirmPassword((current) => !current)}
        />

        {status.message && (
          <p className={`form-status ${status.type}`}>{status.message}</p>
        )}

        <button className="primary-button auth-submit" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Creating account...' : 'Create Account'}
        </button>

        {isDevelopmentAuthEnabled && (
          <button className="dev-auth-button" type="button" onClick={handleDevelopmentRegister}>
            Continue with development session
          </button>
        )}

        <p className="auth-switch">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </AuthLayout>
  )
}

export default Register
