import { apiRequest } from './api.js'

export function loginUser(payload) {
  return apiRequest({
    method: 'POST',
    url: '/auth/login',
    data: payload,
  })
}

export function registerUser(payload) {
  return apiRequest({
    method: 'POST',
    url: '/auth/register',
    data: payload,
  })
}

export function googleLogin() {
  return apiRequest({
    method: 'GET',
    url: '/auth/google',
  })
}

export function sendOTP(payload) {
  return apiRequest({
    method: 'POST',
    url: '/auth/otp/send',
    data: payload,
  })
}

export function verifyOTP(payload) {
  return apiRequest({
    method: 'POST',
    url: '/auth/otp/verify',
    data: payload,
  })
}

export function resendOTP(payload) {
  return apiRequest({
    method: 'POST',
    url: '/auth/otp/resend',
    data: payload,
  })
}

export function forgotPassword(payload) {
  return apiRequest({
    method: 'POST',
    url: '/auth/forgot-password',
    data: payload,
  })
}

export function resetPassword(payload) {
  return apiRequest({
    method: 'POST',
    url: '/auth/reset-password',
    data: payload,
  })
}

export function updateProfile(payload) {
  return apiRequest({
    method: 'PATCH',
    url: '/users/me',
    data: payload,
  })
}

export function changePassword(payload) {
  return apiRequest({
    method: 'POST',
    url: '/auth/change-password',
    data: payload,
  })
}
