import { useEffect, useState } from 'react'
import { ArrowRight, ClipboardList, FileScan, SearchCheck } from 'lucide-react'
import {
  InfoGrid,
  ModuleCard,
  ModuleHeader,
  StatusPill,
  UploadPanel,
} from '../components/modules/ModuleComponents.jsx'
import DashboardLayout from '../layouts/DashboardLayout.jsx'
import { getMedicalReports, uploadMedicalReport } from '../services/analysisService.js'

function MedicalReports() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploadedReports, setUploadedReports] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadReports() {
      try {
        const reports = await getMedicalReports()
        if (isMounted) setUploadedReports(Array.isArray(reports) ? reports : [])
      } catch (error) {
        if (isMounted) setErrorMessage(error.message)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadReports()

    return () => {
      isMounted = false
    }
  }, [])

  async function handleUpload() {
    if (!selectedFile || isUploading) return

    setIsUploading(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const response = await uploadMedicalReport(selectedFile)
      setUploadedReports((current) => [response.report, ...current])
      setSelectedFile(null)
      setSuccessMessage('Medical report uploaded. AI extraction is not connected yet.')
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <DashboardLayout pageTitle="Medical Reports">
      <section className="module-page">
        <ModuleHeader
          eyebrow="Report intelligence"
          title="Upload medical reports for future AI review."
          description="Upload PDF, JPG, or PNG reports to your authenticated workspace for future extraction and recovery context."
        />

        <section className="module-two-column">
          <ModuleCard>
            <div className="module-card-heading">
              <FileScan size={22} />
              <div>
                <h2>Report upload</h2>
                <p>Files are stored through the protected FastAPI reports endpoint.</p>
              </div>
            </div>

            <UploadPanel
              accept="application/pdf,image/png,image/jpeg,image/jpg"
              description="Upload PDF, JPG, or PNG medical reports."
              file={selectedFile}
              id="medicalReportUpload"
              title="Drop medical report here"
              onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
              onRemove={() => setSelectedFile(null)}
            />

            {errorMessage && <p className="module-alert error">{errorMessage}</p>}
            {successMessage && <p className="module-alert success">{successMessage}</p>}

            <button
              className="primary-button module-primary-button"
              disabled={!selectedFile || isUploading}
              type="button"
              onClick={handleUpload}
            >
              {isUploading ? 'Uploading report...' : 'Upload Report'}
              <ArrowRight size={17} />
            </button>
          </ModuleCard>

          <ModuleCard>
            <div className="module-card-heading">
              <SearchCheck size={22} />
              <div>
                <h2>Future extracted findings</h2>
                <p>No clinical extraction is shown until backend analysis is available.</p>
              </div>
            </div>

            <InfoGrid
              items={[
                { label: 'Report type', value: 'Pending upload' },
                { label: 'Key findings', value: 'Pending backend analysis' },
                { label: 'Care context', value: 'Not generated yet' },
                { label: 'Linked X-ray', value: 'Optional later' },
              ]}
            />
          </ModuleCard>
        </section>

        <ModuleCard>
          <div className="module-card-heading">
            <ClipboardList size={22} />
            <div>
              <h2>Previously uploaded reports</h2>
              <p>Your authenticated report uploads. AI extraction remains pending backend support.</p>
            </div>
          </div>

          {isLoading ? (
            <p className="module-disclaimer">Loading medical reports...</p>
          ) : uploadedReports.length > 0 ? (
            <div className="module-list">
              {uploadedReports.map((report) => (
                <div className="module-list-row" key={report.id || `${report.file_name}-${report.created_at}`}>
                  <div>
                    <strong>{report.file_name || 'Medical report'}</strong>
                    <span>{formatReportDate(report.created_at)}</span>
                  </div>
                  <StatusPill tone="info">{report.status || 'uploaded'}</StatusPill>
                </div>
              ))}
            </div>
          ) : (
            <p className="module-disclaimer">No medical reports uploaded yet.</p>
          )}
        </ModuleCard>
      </section>
    </DashboardLayout>
  )
}

function formatReportDate(value) {
  if (!value) return 'Just now'
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export default MedicalReports
