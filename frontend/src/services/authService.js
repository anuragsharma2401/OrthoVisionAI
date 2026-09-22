import { apiRequest } from './api.js'

export async function loginUser(payload) {
  const response = await apiRequest({
    method: 'POST',
    url: '/users/login',
    data: {
      email: payload.email,
      password: payload.password,
    },
  })

  return normalizeAuthResponse(response)
}

export async function registerUser(payload) {
  const response = await apiRequest({
    method: 'POST',
    url: '/users/register',
    data: {
      full_name: payload.fullName,
      email: payload.email,
      password: payload.password,
      role: 'user',
    },
  })

  return normalizeAuthResponse(response)
}

export async function googleLogin() {
  const accessToken = await requestGoogleAccessToken()

  const response = await apiRequest({
    method: 'POST',
    url: '/users/google-login',
    data: {
      access_token: accessToken,
    },
  })

  return normalizeAuthResponse(response)
}

export function sendOTP(payload) {
  return apiRequest({
    method: 'POST',
    url: '/users/otp/send',
    data: {
      identifier: payload.identifier,
      purpose: payload.purpose,
    },
  })
}

export function verifyOTP(payload) {
  return apiRequest({
    method: 'POST',
    url: '/users/otp/verify',
    data: {
      identifier: payload.identifier,
      otp: payload.otp,
      purpose: payload.purpose,
    },
  })
}

export function resendOTP(payload) {
  return apiRequest({
    method: 'POST',
    url: '/users/otp/resend',
    data: {
      identifier: payload.identifier,
      purpose: payload.purpose,
    },
  })
}

export function forgotPassword(payload) {
  return apiRequest({
    method: 'POST',
    url: '/users/forgot-password',
    data: {
      identifier: payload.identifier,
    },
  })
}

export function resetPassword(payload) {
  return apiRequest({
    method: 'POST',
    url: '/users/reset-password',
    data: {
      identifier: payload.identifier,
      otp: payload.otp,
      password: payload.password,
    },
  })
}

export function updateProfile() {
  return rejectMissingEndpoint('Profile update')
}

export function changePassword() {
  return rejectMissingEndpoint('Change password')
}

export function getCurrentUser() {
  return apiRequest({
    method: 'GET',
    url: '/users/me',
  }).then(normalizeAuthResponse)
}

function normalizeAuthResponse(response) {
  const backendUser = response.user || {}
  const token = response.access_token || response.token || response.jwt || ''

  return {
    message: response.message,
    token,
    user: {
      id: backendUser.id,
      name: backendUser.full_name || backendUser.name || 'Anurag',
      fullName: backendUser.full_name || backendUser.name || 'Anurag',
      email: backendUser.email || '',
      role: backendUser.role || 'user',
      emailVerified: Boolean(backendUser.email_verified),
    },
  }
}

function rejectMissingEndpoint(featureName) {
  return Promise.reject(
    new Error(`${featureName} is waiting for backend API support.`),
  )
}

function requestGoogleAccessToken() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  if (!clientId) {
    return Promise.reject(
      new Error('Google login is not configured. Set VITE_GOOGLE_CLIENT_ID.'),
    )
  }

  return loadGoogleIdentityScript().then(
    () =>
      new Promise((resolve, reject) => {
        if (!window.google?.accounts?.oauth2) {
          reject(new Error('Google Identity Services could not be loaded.'))
          return
        }

        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'openid email profile',
          callback: (response) => {
            if (response.error) {
              reject(new Error(response.error_description || 'Google login failed.'))
              return
            }

            resolve(response.access_token)
          },
        })

        tokenClient.requestAccessToken({ prompt: 'select_account' })
      }),
  )
}

function loadGoogleIdentityScript() {
  if (window.google?.accounts?.oauth2) return Promise.resolve()

  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector('script[data-google-identity]')
    if (existingScript) {
      existingScript.addEventListener('load', resolve, { once: true })
      existingScript.addEventListener('error', reject, { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.dataset.googleIdentity = 'true'
    script.onload = resolve
    script.onerror = () => reject(new Error('Unable to load Google login.'))
    document.head.appendChild(script)
  })
}
