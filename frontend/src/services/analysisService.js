import { API_BASE_URL, apiRequest, getStoredToken } from './api.js'

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

export async function downloadAnalysisReport(analysisId) {
  const response = await fetch(`${API_BASE_URL}/predictions/${analysisId}/report`, {
    headers: {
      Authorization: `Bearer ${getStoredToken()}`,
    },
  })

  if (!response.ok) {
    throw new Error('Could not download the analysis report.')
  }

  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `orthovision-analysis-${analysisId}.html`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}
