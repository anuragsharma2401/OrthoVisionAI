import { useEffect, useMemo, useState } from 'react'
import { Bone, FileSearch, History, Search } from 'lucide-react'
import {
  EmptyState,
  ModuleCard,
  ModuleHeader,
  StatusPill,
} from '../components/modules/ModuleComponents.jsx'
import DashboardLayout from '../layouts/DashboardLayout.jsx'
import {
  getMedicalReports,
  getPredictionHistory,
} from '../services/analysisService.js'

function AnalysisHistory() {
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [historyItems, setHistoryItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [expandedItemId, setExpandedItemId] = useState(null)
  const [reviewImage, setReviewImage] = useState(null)

  useEffect(() => {
    let isMounted = true

    async function loadHistory() {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const [predictions, reports] = await Promise.all([
          getPredictionHistory(),
          getMedicalReports(),
        ])

        const items = [
          ...(Array.isArray(predictions) ? predictions : []).map(
            (prediction) => ({
              ...prediction,
              type: 'X-ray',
              id: `xray-${prediction.id}`,
              originalId: prediction.id,
              title:
                prediction.finding ||
                prediction.prediction ||
                prediction.disease ||
                'X-ray analysis',
              summary:
                prediction.summary ||
                prediction.explanation ||
                `Model result: ${prediction.disease || 'No detection'}`,
              date: prediction.created_at,
              status: prediction.status || 'completed',
            }),
          ),

          ...(Array.isArray(reports) ? reports : []).map((report) => ({
            ...report,
            type: 'Report',
            id: `report-${report.id}`,
            originalId: report.id,
            title: report.file_name || 'Medical report',
            summary:
              report.report_text ||
              report.explanation ||
              'Medical report uploaded.',
            date: report.created_at,
            status: report.status || 'uploaded',
          })),
        ].sort(
          (first, second) =>
            new Date(second.date || 0) - new Date(first.date || 0),
        )

        if (isMounted) {
          setHistoryItems(items)
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error.message)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadHistory()

    return () => {
      isMounted = false
    }
  }, [])

  const filteredItems = useMemo(() => {
    return historyItems.filter((item) => {
      const searchableText = [
        item.title,
        item.summary,
        item.type,
        item.disease,
        item.finding,
        item.prediction,
        item.detected_bone,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      const matchesQuery = searchableText.includes(query.toLowerCase())

      const matchesType =
        typeFilter === 'All' || item.type === typeFilter

      return matchesQuery && matchesType
    })
  }, [historyItems, query, typeFilter])

  return (
    <DashboardLayout pageTitle="Analysis History">
      <section className="module-page">
        <ModuleHeader
          eyebrow="Unified records"
          title="Review previous analysis activity."
          description="A central history for X-ray and medical-report analysis records."
        />

        {errorMessage && (
          <p className="module-alert error">{errorMessage}</p>
        )}

        <ModuleCard>
          <div className="history-filters">
            <label>
              <Search size={18} />

              <input
                placeholder="Search history..."
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>

            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
            >
              <option>All</option>
              <option>X-ray</option>
              <option>Report</option>
            </select>
          </div>
        </ModuleCard>

        <ModuleCard>
          {isLoading ? (
            <EmptyState
              icon={History}
              title="Loading history"
              description="Fetching your authenticated analysis records."
            />
          ) : filteredItems.length > 0 ? (
            <div className="module-list">
              {filteredItems.map((item) => {
                const isExpanded = expandedItemId === item.id

                return (
                  <div
                    className={`recent-analysis-item ${
                      isExpanded ? 'expanded' : ''
                    }`}
                    key={item.id || `${item.title}-${item.date}`}
                  >
                    <div className="module-list-row">
                      <div className="recent-analysis-summary">
                        <strong>{item.title}</strong>

                        <span>
                          {item.type === 'X-ray'
                            ? item.detected_bone || 'Region not specified'
                            : 'Medical report'}
                        </span>

                        <small>
                          {formatHistoryDate(item.date)}
                        </small>
                      </div>

                      <div className="recent-analysis-actions">
                        <StatusPill tone="info">
                          {item.status || 'completed'}
                        </StatusPill>

                        <button
                          type="button"
                          className="recent-analysis-expand"
                          onClick={() =>
                            setExpandedItemId(
                              isExpanded ? null : item.id,
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
                        {item.type === 'X-ray' ? (
                          <XrayHistoryDetails
                            analysis={item}
                            onReviewImage={setReviewImage}
                          />
                        ) : (
                          <ReportHistoryDetails report={item} />
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyState
              icon={FileSearch}
              title="No matching history"
              description="Try a different search term or filter."
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

function XrayHistoryDetails({ analysis, onReviewImage }) {
  return (
    <>
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
            onReviewImage({
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
            onReviewImage({
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
    </>
  )
}

function ReportHistoryDetails({ report }) {
  return (
    <div className="recent-analysis-guidance">
      <details open>
        <summary>Report Explanation</summary>
        <p>
          {report.explanation ||
            report.report_text ||
            'No explanation available.'}
        </p>
      </details>

      {report.key_findings?.length > 0 && (
        <details>
          <summary>Structured Findings</summary>

          <ul>
            {report.key_findings.map((finding, index) => (
              <li key={`${report.id}-finding-${index}`}>
                {finding}
              </li>
            ))}
          </ul>
        </details>
      )}

      <details>
        <summary>General Guidance</summary>
        <p>
          {report.guidance ||
            'No general guidance available.'}
        </p>
      </details>
    </div>
  )
}

function getBackendAssetUrl(url) {
  if (!url) return ''

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }

  const baseUrl =
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`
}

function formatHistoryDate(value) {
  if (!value) return 'Just now'

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export default AnalysisHistory
