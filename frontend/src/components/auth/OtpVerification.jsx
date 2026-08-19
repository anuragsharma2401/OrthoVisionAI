import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { resendOTP, verifyOTP } from '../../services/authService.js'

const OTP_LENGTH = 6
const RESEND_SECONDS = 45

function OtpVerification({
  contactLabel = 'your email or phone',
  purpose = 'verification',
  onChangeContactPath,
}) {
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(''))
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS)
  const [status, setStatus] = useState({ type: '', message: '' })
  const [isLoading, setIsLoading] = useState(false)
  const inputsRef = useRef([])

  const otpValue = digits.join('')
  const canVerify = otpValue.length === OTP_LENGTH && !digits.includes('')

  useEffect(() => {
    if (secondsLeft <= 0) return undefined

    const timer = window.setInterval(() => {
      setSecondsLeft((current) => current - 1)
    }, 1000)

    return () => window.clearInterval(timer)
  }, [secondsLeft])

  function focusInput(index) {
    inputsRef.current[index]?.focus()
  }

  function updateDigit(index, value) {
    const numericValue = value.replace(/\D/g, '').slice(-1)
    const nextDigits = [...digits]
    nextDigits[index] = numericValue
    setDigits(nextDigits)
    setStatus({ type: '', message: '' })

    if (numericValue && index < OTP_LENGTH - 1) {
      focusInput(index + 1)
    }
  }

  function handleKeyDown(index, event) {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      focusInput(index - 1)
    }
  }

  function handlePaste(event) {
    event.preventDefault()
    const pastedValue = event.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, OTP_LENGTH)

    if (!pastedValue) return

    const nextDigits = Array(OTP_LENGTH).fill('')
    pastedValue.split('').forEach((digit, index) => {
      nextDigits[index] = digit
    })
    setDigits(nextDigits)
    focusInput(Math.min(pastedValue.length, OTP_LENGTH - 1))
  }

  async function handleVerify(event) {
    event.preventDefault()
    setStatus({ type: '', message: '' })

    if (!canVerify) {
      setStatus({ type: 'error', message: 'Enter the complete 6-digit OTP.' })
      return
    }

    setIsLoading(true)
    try {
      await verifyOTP({ otp: otpValue, purpose })
      setStatus({ type: 'success', message: 'OTP verified successfully.' })
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'OTP verification is unavailable right now.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleResend() {
    setStatus({ type: '', message: '' })
    setIsLoading(true)
    try {
      await resendOTP({ purpose })
      setSecondsLeft(RESEND_SECONDS)
      setStatus({ type: 'success', message: 'OTP resend request submitted.' })
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'OTP resend is unavailable right now.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form className="auth-form otp-form" onSubmit={handleVerify}>
      <div className="otp-context">
        <strong>Enter the 6-digit code</strong>
        <p>We will verify {contactLabel} for {purpose.replaceAll('-', ' ')}.</p>
      </div>

      <div className="otp-inputs" aria-label="6-digit OTP input">
        {digits.map((digit, index) => (
          <input
            aria-label={`OTP digit ${index + 1}`}
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            inputMode="numeric"
            key={`otp-${index}`}
            maxLength={1}
            ref={(element) => {
              inputsRef.current[index] = element
            }}
            type="text"
            value={digit}
            onChange={(event) => updateDigit(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={handlePaste}
          />
        ))}
      </div>

      {status.message && (
        <p className={`form-status ${status.type}`}>{status.message}</p>
      )}

      <button
        className="primary-button auth-submit"
        disabled={!canVerify || isLoading}
        type="submit"
      >
        {isLoading ? 'Verifying...' : 'Verify OTP'}
      </button>

      <div className="otp-actions">
        <button
          className="text-button"
          disabled={secondsLeft > 0 || isLoading}
          type="button"
          onClick={handleResend}
        >
          {secondsLeft > 0 ? `Resend in ${secondsLeft}s` : 'Resend OTP'}
        </button>

        {onChangeContactPath && (
          <Link to={onChangeContactPath}>Change email/phone</Link>
        )}
      </div>
    </form>
  )
}

export default OtpVerification
