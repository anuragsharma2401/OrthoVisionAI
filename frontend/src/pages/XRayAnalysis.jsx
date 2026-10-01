import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Bone, BrainCircuit, FileImage, ScanSearch } from 'lucide-react'
import {
  EmptyState,
  InfoGrid,
  ModuleCard,
  ModuleHeader,
  StatusPill,
  UploadPanel,
} from '../components/modules/ModuleComponents.jsx'
import DashboardLayout from '../layouts/DashboardLayout.jsx'
import { API_BASE_URL } from '../services/api.js'
import {
  analyzeXray,
  downloadAnalysisReport,
  getPredictionHistory,
} from '../services/analysisService.js'

function XRayAnalysis() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [recentAnalyses, setRecentAnalyses] = useState([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isDownloadingReport, setIsDownloadingReport] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [expandedAnalysisId, setExpandedAnalysisId] = useState(null)
  const [reviewImage, setReviewImage] = useState(null)

  const imagePreview = useMemo(() => {
    if (!selectedFile) return ''
    return URL.createObjectURL(selectedFile)
  }, [selectedFile])
 
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview)
    }
  }, [imagePreview])

  useEffect(() => {
    let isMounted = true

    async function loadHistory() {
      try {
        const history = await getPredictionHistory()
        if (isMounted) {
          setRecentAnalyses(Array.isArray(history) ? history : [])
        }
      } catch (error) {
        if (isMounted) setErrorMessage(error.message)
      } finally {
        if (isMounted) setIsLoadingHistory(false)
      }
    }

    loadHistory()

    return () => {
      isMounted = false
    }
  }, [])

  function handleFileChange(event) {
    setSelectedFile(event.target.files?.[0] || null)
    setAnalysisResult(null)
    setShowHeatmap(false)
    setErrorMessage('')
    setSuccessMessage('')
  }

  async function handleAnalyze() {
    if (!selectedFile || isAnalyzing) return

    setIsAnalyzing(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const response = await analyzeXray(selectedFile)

      console.log('X-RAY ANALYSIS RESPONSE:', response)
      console.log('ANALYSIS DATA:', response.analysis)

      setAnalysisResult(response.analysis)
      setRecentAnalyses((current) => [response.analysis, ...current])
      setSuccessMessage('X-ray analysis completed using the connected ML model.')
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsAnalyzing(false)
    }
  }

  async function handleDownloadReport() {
    if (!analysisResult?.id || isDownloadingReport) return

    setIsDownloadingReport(true)
    setErrorMessage('')
    try {
      await downloadAnalysisReport(analysisResult.id)
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsDownloadingReport(false)
    }
  }

  return (
    <DashboardLayout pageTitle="X-Ray Analysis">
      <section className="module-page">
        <ModuleHeader
          eyebrow="AI image workflow"
          title="Upload an X-ray for assisted analysis."
          description="Send X-ray images to the FastAPI backend for YOLO-based fracture/anomaly detection and structured results."
        />

        <section className="module-two-column">
          <ModuleCard>
            <div className="module-card-heading">
              <FileImage size={22} />
              <div>
                <h2>X-ray upload</h2>
                <p>Supported files: JPG, PNG, JPEG up to 10 MB.</p>
              </div>
            </div>

            <UploadPanel
              accept="image/png,image/jpeg,image/jpg"
              description="Upload a clear orthopedic X-ray image."
              file={selectedFile}
              id="xrayUpload"
              title="Drop X-ray image here"
              onChange={handleFileChange}
              onRemove={() => setSelectedFile(null)}
            />

            {imagePreview && (
              <div className="image-preview-card">
                <img src={imagePreview} alt="Selected X-ray preview" />
              </div>
            )}

            {errorMessage && <p className="module-alert error">{errorMessage}</p>}
            {successMessage && <p className="module-alert success">{successMessage}</p>}

            <button
              className="primary-button module-primary-button"
              disabled={!selectedFile || isAnalyzing}
              type="button"
              onClick={handleAnalyze}
            >
              {isAnalyzing ? 'Analyzing X-ray...' : 'Analyze X-ray'}
              <ArrowRight size={17} />
            </button>
          </ModuleCard>

          <ModuleCard>
            <div className="module-card-heading">
              <BrainCircuit size={22} />
              <div>
                <h2>AI result</h2>
                <p>Results come from the connected ML model. They are AI-assisted and require clinician review.</p>
              </div>
            </div>

            

            {analysisResult?.result_image_url || analysisResult?.heatmap_image_url ? (
              <div className="result-image-section">

                <div className="result-image-toggle">
                  <button
                    type="button"
                    className={!showHeatmap ? 'active' : ''}
                    onClick={() => setShowHeatmap(false)}
                    disabled={!analysisResult?.result_image_url}
                  >
                    Detection Result
                  </button>

                  <button
                    type="button"
                    className={showHeatmap ? 'active' : ''}
                    onClick={() => setShowHeatmap(true)}
                    disabled={!analysisResult?.heatmap_image_url}
                  >
                    AI Heatmap
                  </button>
                </div>

                <div className="result-image-card">
                  <img
                    src={getBackendAssetUrl(
                      showHeatmap
                        ? analysisResult.heatmap_image_url
                        : analysisResult.result_image_url
                    )}
                    alt={
                      showHeatmap
                        ? 'AI heatmap showing the detected region'
                        : 'AI-marked X-ray prediction result'
                    }
                  />

                  <span>
                    {showHeatmap
                      ? 'AI heatmap highlighting regions associated with the model prediction.'
                      : 'AI-marked output generated by the detection model.'}
                  </span>
                </div>

              </div>
            ) : (
              <div className="heatmap-placeholder">
                <ScanSearch size={30} />
                <span>
                  {analysisResult?.detections?.length
                    ? `${analysisResult.detections.length} model detection(s) returned.`
                    : 'Explainable AI visualization will render here when returned by the model.'}
                </span>
              </div>
            )}
            <InfoGrid
              items={[
                { label: 'Detected region', value: analysisResult?.detected_bone || 'Pending Gemini enrichment' },
                { label: 'Detected finding', value: analysisResult?.finding || analysisResult?.prediction || 'Pending analysis' },
                { label: 'Confidence', value: analysisResult?.confidence || 'Pending model output' },
                { label: 'Severity', value: analysisResult?.severity || 'Not specified' },
              ]}
            />
            {analysisResult?.summary && (
              <p className="module-disclaimer">
                {analysisResult.summary} This AI-assisted output is educational support and does not replace professional medical diagnosis.
              </p>
            )}

            {analysisResult?.gemini_error && (
              <p className="module-alert error">{analysisResult.gemini_error}</p>
            )}

            {analysisResult?.id && (
              <button
                className="secondary-report-button"
                disabled={isDownloadingReport}
                type="button"
                onClick={handleDownloadReport}
              >
                {isDownloadingReport ? 'Preparing report...' : 'Download AI report'}
              </button>
            )}
          </ModuleCard>
        </section>
        {(analysisResult?.explanation ||
              analysisResult?.recovery_guidance ||
              analysisResult?.home_care_guidance ||
              analysisResult?.warning_guidance) && (
              <div className="ai-explanation-card">
                {analysisResult?.explanation && (
                  <section>
                    <h3>Patient-friendly explanation</h3>
                    <p>{analysisResult.explanation}</p>
                  </section>
                )}
                {analysisResult?.recovery_guidance && (
                  <section>
                    <h3>Recovery information</h3>
                    <p>{analysisResult.recovery_guidance}</p>
                  </section>
                )}
                {analysisResult?.home_care_guidance && (
                  <section>
                    <h3>General home-care guidance</h3>
                    <p>{analysisResult.home_care_guidance}</p>
                  </section>
                )}
                {analysisResult?.warning_guidance && (
                  <section>
                    <h3>When to seek medical care</h3>
                    <p>{analysisResult.warning_guidance}</p>
                  </section>
                )}
              </div>
            )}
        <ModuleCard>
          <div className="module-card-heading">
            <Bone size={22} />
            <div>
              <h2>Recent analyses</h2>
              <p>Authenticated analysis records returned by FastAPI.</p>
            </div>
          </div>

          {isLoadingHistory ? (
            <EmptyState
              icon={ScanSearch}
              title="Loading analysis history"
              description="Fetching your authenticated X-ray records."
            />
          ) : recentAnalyses.length > 0 ? (
            <div className="module-list">
              {recentAnalyses.slice(0, 5).map((analysis) => {
                console.log('RECENT ANALYSIS:', analysis)
                const isExpanded = expandedAnalysisId === analysis.id

                return (
                  <div
                    className={`recent-analysis-item ${isExpanded ? 'expanded' : ''}`}
                    key={analysis.id || `${analysis.prediction}-${analysis.created_at}`}
                  >
                    <div className="module-list-row">
                      <div className="recent-analysis-summary">
                        <strong>
                          {analysis.finding ||
                            analysis.prediction ||
                            analysis.disease ||
                            'X-ray analysis'}
                        </strong>

                        <span>
                          {analysis.detected_bone || 'Region not specified'}
                        </span>

                        <small>
                          {formatAnalysisDate(analysis.created_at)}
                        </small>
                      </div>

                      <div className="recent-analysis-actions">
                        <StatusPill tone="info">
                          {analysis.status || 'completed'}
                        </StatusPill>

                        <button
                          type="button"
                          className="recent-analysis-expand"
                          onClick={() =>
                            setExpandedAnalysisId(
                              isExpanded ? null : analysis.id
                            )
                          }
                          aria-label={
                            isExpanded
                              ? 'Collapse analysis'
                              : 'View analysis details'
                          }
                        >
                          {isExpanded ? '←' : '→'}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="recent-analysis-details">
                        <div className="recent-analysis-meta">
                          <div>
                            <span>Confidence</span>
                            <strong>
                              {analysis.confidence || 'Not available'}
                            </strong>
                          </div>

                          <div>
                            <span>Severity</span>
                            <strong>
                              {analysis.severity || 'Not specified'}
                            </strong>
                          </div>

                          <div>
                            <span>Status</span>
                            <strong>
                              {analysis.status || 'completed'}
                            </strong>
                          </div>
                        </div>

                        <div className="recent-analysis-image-actions">
                          <button
                            type="button"
                            disabled={!analysis.result_image_url}
                            onClick={() =>
                              setReviewImage({
                                title: 'Annotated X-ray',
                                url: analysis.result_image_url,
                                description:
                                  'AI-marked output generated from the X-ray analysis.',
                              })
                            }
                          >
                            Review Annotated X-ray
                          </button>

                          <button
                            type="button"
                            disabled={!analysis.heatmap_image_url}
                            onClick={() =>
                              setReviewImage({
                                title: 'AI Heatmap',
                                url: analysis.heatmap_image_url,
                                description:
                                  'AI heatmap highlighting regions associated with the model prediction.',
                              })
                            }
                          >
                            Review AI Heatmap
                          </button>
                        </div>

                        <div className="recent-analysis-guidance">
                          <details open>
                            <summary>AI Explanation</summary>
                            <p>
                              {analysis.explanation ||
                                analysis.summary ||
                                'No explanation available.'}
                            </p>
                          </details>

                          <details>
                            <summary>Recovery Guidance</summary>
                            <p>
                              {analysis.recovery_guidance ||
                                'No recovery guidance available.'}
                            </p>
                          </details>

                          <details>
                            <summary>Home Care Guidance</summary>
                            <p>
                              {analysis.home_care_guidance ||
                                'No home-care guidance available.'}
                            </p>
                          </details>

                          <details>
                            <summary>When To Seek Medical Care</summary>
                            <p>
                              {analysis.warning_guidance ||
                                'Seek professional medical evaluation for pain, swelling, deformity, numbness, worsening symptoms, or other urgent concerns.'}
                            </p>
                          </details>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyState
              icon={Bone}
              title="No X-ray analyses yet"
              description="Upload an X-ray to create your first authenticated model result."
            />
          )}
        </ModuleCard>
        {reviewImage && (
          <div className="analysis-image-modal">
            <div className="analysis-image-modal-card">
              <div className="analysis-image-modal-header">
                <div>
                  <h3>{reviewImage.title}</h3>
                  <p>{reviewImage.description}</p>
                </div>

                <button
                  type="button"
                  className="analysis-image-modal-close"
                  onClick={() => setReviewImage(null)}
                  aria-label="Close image review"
                >
                  ×
                </button>
              </div>

              <div className="analysis-image-modal-body">
                <img
                  src={getBackendAssetUrl(reviewImage.url)}
                  alt={reviewImage.title}
                />
              </div>
            </div>
          </div>
        )}
      </section>
    </DashboardLayout>
  )
}

function formatAnalysisDate(value) {
  if (!value) return 'Just now'
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function getBackendAssetUrl(path) {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return `${API_BASE_URL}${path}`
}

export default XRayAnalysis
