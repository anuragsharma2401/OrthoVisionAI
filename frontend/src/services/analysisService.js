import { apiRequest } from './api.js'

export function analyzeXray(file) {
  const formData = new FormData()
  formData.append('file', file)

  return apiRequest({
    method: 'POST',
    url: '/predictions/upload',
    data: formData,
  })
}

export function getPredictionHistory() {
  return apiRequest({
    method: 'GET',
    url: '/predictions/',
  })
}

export function uploadMedicalReport(file) {
  const formData = new FormData()
  formData.append('file', file)

  return apiRequest({
    method: 'POST',
    url: '/reports/upload',
    data: formData,
  })
}

export function getMedicalReports() {
  return apiRequest({
    method: 'GET',
    url: '/reports/',
  })
}
