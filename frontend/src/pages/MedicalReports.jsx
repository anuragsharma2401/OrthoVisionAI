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
  const [latestReport, setLatestReport] = useState(null)
  const [expandedReportId, setExpandedReportId] = useState(null)

  useEffect(() => {
    let isMounted = true

    async function loadReports() {
      try {
        const reports = await getMedicalReports()
        if (isMounted) {
          const reportItems = Array.isArray(reports) ? reports : []
          setUploadedReports(reportItems)
          setLatestReport(reportItems[0] || null)
        }
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
      setLatestReport(response.report)
      setSelectedFile(null)
      if (response.analysis_error) {
        setErrorMessage(response.analysis_error)
      } else {
        setSuccessMessage(
          response.report?.status === 'Analyzed'
            ? 'Medical report uploaded and analyzed with Gemini.'
            : 'Medical report uploaded. Analysis details are shown when available.',
        )
      }
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
                <h2>AI report analysis</h2>
                <p>Gemini explains uploaded reports when server-side API access is configured.</p>
              </div>
            </div>

            <InfoGrid
              items={[
                { label: 'Report type', value: latestReport?.analysis?.report_type || 'Pending upload' },
                { label: 'Status', value: latestReport?.status || 'Not uploaded' },
                { label: 'Severity', value: latestReport?.analysis?.severity || 'Not specified' },
                { label: 'Findings', value: latestReport?.key_findings?.length ? `${latestReport.key_findings.length} extracted` : 'Pending analysis' },
              ]}
            />

            {/* {latestReport?.analysis_error && (
              <p className="module-alert error">{latestReport.analysis_error}</p>
            )} */}

          </ModuleCard>
        </section>
        {(latestReport?.explanation || latestReport?.key_findings?.length || latestReport?.guidance) && (
              <div className="ai-explanation-card">
                {latestReport?.explanation && (
                  <section>
                    <h3>Report explanation</h3>
                    <p>{latestReport.explanation}</p>
                  </section>
                )}
                {latestReport?.key_findings?.length > 0 && (
                  <section>
                    <h3>Structured findings</h3>
                    <ul>
                      {latestReport.key_findings.map((finding) => (
                        <li key={finding}>{finding}</li>
                      ))}
                    </ul>
                  </section>
                )}
                {latestReport?.guidance && (
                  <section>
                    <h3>General guidance</h3>
                    <p>{latestReport.guidance}</p>
                  </section>
                )}
              </div>
            )}
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
              {uploadedReports.slice(0, 5).map((report) => {
                const isExpanded = expandedReportId === report.id

                return (
                  <div className={`recent-analysis-item ${isExpanded ? 'expanded' : ''}`}>
                    <div className="module-list-row">
                      <div className="recent-analysis-summary">
                        <strong>{report.file_name || 'Medical report'}</strong>

                        <span>
                          {report.analysis?.report_type || 'Medical report'}
                        </span>

                        <small>
                          {formatReportDate(report.created_at)}
                        </small>
                      </div>

                      <div className="recent-analysis-actions">
                        <StatusPill tone="info">
                          {report.status || 'uploaded'}
                        </StatusPill>

                        <button
                          type="button"
                          className="recent-analysis-expand"
                          onClick={() =>
                            setExpandedReportId(isExpanded ? null : report.id)
                          }
                        >
                          {isExpanded ? '←' : '→'}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="recent-analysis-details">
                        <div className="recent-analysis-guidance">
                          {report.explanation && (
                            <details open>
                              <summary>Report Explanation</summary>
                              <p>{report.explanation||
                                'No explanation available.'}</p>
                            </details>
                          )}

                          {report.key_findings?.length > 0 && (
                            <details>
                              <summary>Structured Findings</summary>
                              <ul>
                                {report.key_findings.map((finding) => (
                                  <li key={finding}>{finding}</li>
                                ))||
                                'No structure findings available.'}
                              </ul>
                            </details>
                          )}

                          {report.guidance && (
                            <details>
                              <summary>General Guidance</summary>
                              <p>{report.guidance ||
                                'No general guidance available.'}</p>
                            </details>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="module-disclaimer">
              No medical reports uploaded yet.
            </p>
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
