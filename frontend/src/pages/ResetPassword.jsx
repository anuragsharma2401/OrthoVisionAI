import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import AuthLayout from '../components/auth/AuthLayout.jsx'
import FormField from '../components/auth/FormField.jsx'
import { resetPassword } from '../services/authService.js'
import { getPasswordStrength } from '../utils/validation.js'

const initialValues = {
  identifier: '',
  otp: '',
  password: '',
  confirmPassword: '',
}

function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [values, setValues] = useState({
    ...initialValues,
    identifier: searchParams.get('identifier') || '',
    otp: searchParams.get('otp') || '',
  })
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
    setStatus({ type: '', message: '' })
  }

  function validate() {
    const nextErrors = {}

    if (!values.identifier.trim()) {
      nextErrors.identifier = 'Email is required.'
    }

    if (!/^\d{6}$/.test(values.otp)) {
      nextErrors.otp = 'Enter the 6-digit OTP.'
    }

    if (!values.password) nextErrors.password = 'New password is required.'
    else if (passwordStrength.score < 4) {
      nextErrors.password =
        'Use at least 8 characters with uppercase, lowercase, number, and symbol.'
    }

    if (!values.confirmPassword) {
      nextErrors.confirmPassword = 'Confirm your new password.'
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
      await resetPassword({
        identifier: values.identifier,
        otp: values.otp,
        password: values.password,
      })
      setStatus({
        type: 'success',
        message: 'Password reset successfully. Redirecting to login...',
      })
      window.setTimeout(() => navigate('/login', { replace: true }), 900)
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Password reset is unavailable right now.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="Set new password"
      title="Create a safer password."
      subtitle="Use a strong password that is unique to your OrthoVision AI account."
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <FormField
          autoComplete="email"
          error={errors.identifier}
          id="resetIdentifier"
          label="Email"
          name="identifier"
          placeholder="you@example.com"
          value={values.identifier}
          onChange={updateValue}
        />

        <FormField
          autoComplete="one-time-code"
          error={errors.otp}
          id="resetOtp"
          inputMode="numeric"
          label="OTP"
          name="otp"
          placeholder="Enter 6-digit OTP"
          value={values.otp}
          onChange={updateValue}
        />

        <FormField
          autoComplete="new-password"
          error={errors.password}
          id="newPassword"
          label="New Password"
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
          id="confirmNewPassword"
          label="Confirm Password"
          name="confirmPassword"
          placeholder="Repeat your new password"
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
          {isSubmitting ? 'Saving password...' : 'Reset Password'}
        </button>

        <p className="auth-switch">
          Back to <Link to="/login">Login</Link>
        </p>
      </form>
    </AuthLayout>
  )
}

export default ResetPassword
