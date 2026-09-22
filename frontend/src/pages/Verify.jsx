import { useState } from 'react'
import AuthLayout from '../components/auth/AuthLayout.jsx'
import FormField from '../components/auth/FormField.jsx'
import OtpVerification from '../components/auth/OtpVerification.jsx'
import { sendOTP } from '../services/authService.js'
import { isValidEmail } from '../utils/validation.js'

function Verify() {
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState({ type: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [otpRequested, setOtpRequested] = useState(false)

  function validate() {
    const nextErrors = {}

    if (!email.trim()) {
      nextErrors.email = 'Email is required.'
    } else if (!isValidEmail(email)) {
      nextErrors.email = 'Enter a valid email address.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSendOtp(event) {
    event.preventDefault()
    setStatus({ type: '', message: '' })

    if (!validate()) return

    setIsSubmitting(true)
    try {
      await sendOTP({ identifier: email, purpose: 'account-verification' })
      setOtpRequested(true)
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'OTP request is unavailable right now.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="Account verification"
      title="Verify your email."
      subtitle="Enter your registered email to receive a secure OTP."
    >
      {!otpRequested ? (
        <form className="auth-form" onSubmit={handleSendOtp} noValidate>
          <FormField
            autoComplete="email"
            error={errors.email}
            id="verificationEmail"
            label="Email"
            name="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              setErrors({})
            }}
          />

          {status.message && (
            <p className={`form-status ${status.type}`}>{status.message}</p>
          )}

          <button className="primary-button auth-submit" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Sending OTP...' : 'Send OTP'}
          </button>
        </form>
      ) : (
        <OtpVerification
          contactLabel={email}
          identifier={email}
          purpose="account-verification"
          onChangeContactPath="/verify"
        />
      )}
    </AuthLayout>
  )
}

export default Verify
