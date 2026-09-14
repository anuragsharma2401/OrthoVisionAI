import { useMemo, useState } from 'react'
import AuthLayout from '../components/auth/AuthLayout.jsx'
import FormField from '../components/auth/FormField.jsx'
import OtpVerification from '../components/auth/OtpVerification.jsx'
import { sendOTP } from '../services/authService.js'
import { isValidEmail, isValidPhone } from '../utils/validation.js'

function Verify() {
  const [method, setMethod] = useState('email')
  const [contact, setContact] = useState('')
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState({ type: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [otpRequested, setOtpRequested] = useState(false)

  const contactLabel = useMemo(() => {
    if (!contact) return method === 'email' ? 'your email' : 'your phone'
    return method === 'email' ? `email ${contact}` : `phone ${contact}`
  }, [contact, method])

  function validate() {
    const nextErrors = {}

    if (!contact.trim()) {
      nextErrors.contact =
        method === 'email' ? 'Email is required.' : 'Phone number is required.'
    } else if (method === 'email' && !isValidEmail(contact)) {
      nextErrors.contact = 'Enter a valid email address.'
    } else if (method === 'phone' && !isValidPhone(contact)) {
      nextErrors.contact = 'Enter a valid 10-digit Indian mobile number.'
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
      await sendOTP({ method, contact, purpose: 'account-verification' })
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
      title="Verify one contact method."
      subtitle="You can verify email or phone now. The other can be completed later from profile settings."
    >
      {!otpRequested ? (
        <form className="auth-form" onSubmit={handleSendOtp} noValidate>
          <div className="verification-choice" role="radiogroup" aria-label="Verification method">
            <button
              className={method === 'email' ? 'active' : ''}
              type="button"
              onClick={() => {
                setMethod('email')
                setContact('')
                setErrors({})
              }}
            >
              Email OTP
            </button>
            <button
              className={method === 'phone' ? 'active' : ''}
              type="button"
              onClick={() => {
                setMethod('phone')
                setContact('')
                setErrors({})
              }}
            >
              Phone OTP
            </button>
          </div>

          <FormField
            autoComplete={method === 'email' ? 'email' : 'tel'}
            error={errors.contact}
            id="verificationContact"
            inputMode={method === 'phone' ? 'numeric' : undefined}
            label={method === 'email' ? 'Email' : 'Phone Number'}
            name="contact"
            placeholder={method === 'email' ? 'you@example.com' : '9876543210'}
            value={contact}
            onChange={(event) => {
              setContact(event.target.value)
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
          contactLabel={contactLabel}
          purpose="account-verification"
          onChangeContactPath="/verify"
        />
      )}
    </AuthLayout>
  )
}

export default Verify
