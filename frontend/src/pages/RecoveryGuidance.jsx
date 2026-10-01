import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  HeartPulse,
  Home,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react'

import {
  EmptyState,
  ModuleCard,
  ModuleHeader,
  StatusPill,
} from '../components/modules/ModuleComponents.jsx'

import DashboardLayout from '../layouts/DashboardLayout.jsx'
import { getPredictionHistory } from '../services/analysisService.js'

function formatDate(value) {
  if (!value) return 'Date unavailable'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Date unavailable'
  }

  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function normalizeGuidance(value) {
  if (!value) return []

  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean)
  }

  if (typeof value === 'string') {
    const cleaned = value
      .replace(/^\{|\}$/g, '')
      .trim()

    if (!cleaned) return []

    return cleaned
      .split(/\s*,\s*/)
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return []
}

function GuidanceCard({
  icon: Icon,
  title,
  description,
  items,
  emptyText,
}) {
  return (
    <ModuleCard className="recovery-guidance-card">
      <div className="recovery-guidance-card-header">
        <div className="recovery-guidance-icon">
          <Icon size={22} />
        </div>

        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>

      {items.length > 0 ? (
        <ul className="recovery-guidance-list">
          {items.map((item, index) => (
            <li key={`${item}-${index}`}>
              <span className="guidance-bullet" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="recovery-guidance-empty">
          {emptyText}
        </p>
      )}
    </ModuleCard>
  )
}

function RecoveryGuidance() {
  const [predictions, setPredictions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadGuidance() {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const response = await getPredictionHistory()

        if (isMounted) {
          setPredictions(Array.isArray(response) ? response : [])
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error?.message || 'Unable to load recovery guidance.'
          )
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadGuidance()

    return () => {
      isMounted = false
    }
  }, [])

  const latestAnalysis = useMemo(() => {
    if (!predictions.length) return null

    return [...predictions].sort(
      (first, second) =>
        new Date(second.created_at || 0) -
        new Date(first.created_at || 0)
    )[0]
  }, [predictions])
  // console.log("Latest X-ray analysis:", latestAnalysis)
  const recoveryGuidance = useMemo(
    () => normalizeGuidance(latestAnalysis?.recovery_guidance),
    [latestAnalysis]
  )

  const homeCareGuidance = useMemo(
    () => normalizeGuidance(latestAnalysis?.home_care_guidance),
    [latestAnalysis]
  )

  const warningGuidance = useMemo(
    () => normalizeGuidance(latestAnalysis?.warning_guidance),
    [latestAnalysis]
  )

  return (
    <DashboardLayout pageTitle="Recovery Guidance">
      <section className="module-page">
        <ModuleHeader
          eyebrow="Supportive recovery"
          title="Recovery guidance"
          description="Review supportive guidance generated from your latest X-ray analysis."
        />

        {isLoading && (
          <ModuleCard>
            <EmptyState
              icon={HeartPulse}
              title="Loading recovery guidance"
              description="Retrieving your latest analysis and recovery information."
            />
          </ModuleCard>
        )}

        {!isLoading && errorMessage && (
          <ModuleCard>
            <div className="module-alert error">
              {errorMessage}
            </div>
          </ModuleCard>
        )}

        {!isLoading && !errorMessage && !latestAnalysis && (
          <ModuleCard>
            <EmptyState
              icon={HeartPulse}
              title="No recovery information yet"
              description="Complete an X-ray analysis first. Your recovery guidance will appear here."
            />
          </ModuleCard>
        )}

        {!isLoading && !errorMessage && latestAnalysis && (
          <>
            {/* Latest Analysis */}
            <ModuleCard className="recovery-overview-card">
              <div className="recovery-overview-top">
                <div>
                  <span className="recovery-overview-label">
                    Latest X-ray analysis
                  </span>

                  <h2>
                    {latestAnalysis.finding ||
                      latestAnalysis.prediction ||
                      latestAnalysis.disease ||
                      'X-ray analysis'}
                  </h2>

                  <p>
                    {latestAnalysis.detected_bone
                      ? `Detected bone: ${latestAnalysis.detected_bone}`
                      : 'Recovery guidance is based on this analysis.'}
                  </p>
                </div>

                {/* <StatusPill >{latestAnalysis.status || 'Completed'}</StatusPill> */}
                  
              </div>

              <div className="recovery-overview-details">
                <div>
                  <span>Analysis date: </span>
                  <strong>
                    {formatDate(latestAnalysis.created_at)}
                  </strong>
                </div>

                <div>
                  <span>Severity: </span>
                  <strong>
                    {latestAnalysis.severity || 'Not available'}
                  </strong>
                </div>

                <div>
                  <span>Confidence: </span>
                  <strong>
                    {latestAnalysis.confidence || 'Not available'}
                  </strong>
                </div>
              </div>
            </ModuleCard>

            {/* Guidance */}
            <div className="recovery-guidance-section">
              <div className="recovery-section-heading">
                <div>
                  <span className="module-eyebrow">
                    AI-assisted guidance
                  </span>

                  <h2>Supporting your recovery</h2>

                  <p>
                    These recommendations are generated from the
                    available analysis information.
                  </p>
                </div>
              </div>

              <div className="recovery-guidance-grid">
                <GuidanceCard
                  icon={HeartPulse}
                  title="Recovery guidance"
                  description="General information to support your recovery."
                  items={recoveryGuidance}
                  emptyText="Recovery guidance is not available for this analysis."
                />

                <GuidanceCard
                  icon={Home}
                  title="Home care"
                  description="Supportive care information for your recovery."
                  items={homeCareGuidance}
                  emptyText="Home-care guidance is not available for this analysis."
                />

                <GuidanceCard
                  icon={Stethoscope}
                  title="When to seek medical care"
                  description="Important warning signs identified by the analysis."
                  items={warningGuidance}
                  emptyText="Warning guidance is not available for this analysis."
                />
              </div>
            </div>

            {/* Disclaimer */}
            <ModuleCard className="medical-disclaimer-card">
              <AlertTriangle size={24} />

              <div>
                <h2>Medical disclaimer</h2>

                <p>
                  OrthoVision AI provides AI-assisted information for
                  educational and supportive purposes only. It does not
                  replace professional medical advice, diagnosis,
                  treatment, or emergency care.
                </p>
              </div>
            </ModuleCard>
          </>
        )}
      </section>
    </DashboardLayout>
  )
}

export default RecoveryGuidance