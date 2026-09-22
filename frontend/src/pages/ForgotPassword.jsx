import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/auth/AuthLayout.jsx'
import FormField from '../components/auth/FormField.jsx'
import OtpVerification from '../components/auth/OtpVerification.jsx'
import { forgotPassword } from '../services/authService.js'
import { isValidEmail } from '../utils/validation.js'

function ForgotPassword() {
  const navigate = useNavigate()
  const [identifier, setIdentifier] = useState('')
  const [error, setError] = useState('')
  const [status, setStatus] = useState({ type: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [otpRequested, setOtpRequested] = useState(false)

  function validate() {
    if (!identifier.trim()) {
      setError('Enter your email address.')
      return false
    }

    if (!isValidEmail(identifier)) {
      setError('Enter a valid registered email address.')
      return false
    }

    setError('')
    return true
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setStatus({ type: '', message: '' })

    if (!validate()) return

    setIsSubmitting(true)
    try {
      await forgotPassword({ identifier })
      setOtpRequested(true)
    } catch (requestError) {
      setStatus({
        type: 'error',
        message:
          requestError.message || 'Password recovery is unavailable right now.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="Password recovery"
      title="Recover access securely."
      subtitle="Enter your registered email. OTP verification is required before setting a new password."
    >
      {!otpRequested ? (
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <FormField
            autoComplete="username"
            error={error}
            id="recoveryIdentifier"
            label="Email"
            name="identifier"
            placeholder="you@example.com"
            value={identifier}
            onChange={(event) => {
              setIdentifier(event.target.value)
              setError('')
            }}
          />

          {status.message && (
            <p className={`form-status ${status.type}`}>{status.message}</p>
          )}

          <button className="primary-button auth-submit" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Requesting OTP...' : 'Send Recovery OTP'}
          </button>

          <p className="auth-switch">
            Remembered your password? <Link to="/login">Login</Link>
          </p>
        </form>
      ) : (
        <>
          <OtpVerification
            contactLabel={identifier}
            identifier={identifier}
            purpose="forgot-password"
            onChangeContactPath="/forgot-password"
            onVerified={(otp) => {
              navigate(
                `/reset-password?identifier=${encodeURIComponent(identifier)}&otp=${encodeURIComponent(otp)}`,
              )
            }}
          />
          <p className="auth-switch reset-next-step">
            OTP verified? Continue to <Link to="/reset-password">Reset Password</Link>
          </p>
        </>
      )}
    </AuthLayout>
  )
}

export default ForgotPassword
