export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export function isValidPhone(phone) {
  return /^[6-9]\d{9}$/.test(phone.trim())
}

export function getPasswordStrength(password) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ]

  const score = checks.filter(Boolean).length

  if (score <= 2) return { label: 'Weak', score, className: 'weak' }
  if (score <= 4) return { label: 'Good', score, className: 'good' }
  return { label: 'Strong', score, className: 'strong' }
}
