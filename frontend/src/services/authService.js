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

export function googleLogin() {
  return rejectMissingEndpoint('Google OAuth')
}

export function sendOTP() {
  return rejectMissingEndpoint('OTP sending')
}

export function verifyOTP() {
  return rejectMissingEndpoint('OTP verification')
}

export function resendOTP() {
  return rejectMissingEndpoint('OTP resend')
}

export function forgotPassword() {
  return rejectMissingEndpoint('Forgot password')
}

export function resetPassword() {
  return rejectMissingEndpoint('Password reset')
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
      phone: backendUser.phone || '',
      role: backendUser.role || 'user',
      emailVerified: Boolean(backendUser.email_verified),
      phoneVerified: Boolean(backendUser.phone_verified),
    },
  }
}

function rejectMissingEndpoint(featureName) {
  return Promise.reject(
    new Error(`${featureName} is waiting for backend API support.`),
  )
}
