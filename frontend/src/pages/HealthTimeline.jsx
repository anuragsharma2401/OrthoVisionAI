import { useEffect, useMemo, useState } from 'react'
import {
  CalendarClock,
  CheckCircle2,
  FileScan,
} from 'lucide-react'
import {
  EmptyState,
  ModuleCard,
  ModuleHeader,
  StatusPill,
} from '../components/modules/ModuleComponents.jsx'
import DashboardLayout from '../layouts/DashboardLayout.jsx'
import { getMedicalReports, getPredictionHistory } from '../services/analysisService.js'

function HealthTimeline() {
  const [predictions, setPredictions] = useState([])
  const [reports, setReports] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadTimeline() {
      try {
        const [predictionRecords, reportRecords] = await Promise.all([
          getPredictionHistory(),
          getMedicalReports(),
        ])

        if (isMounted) {
          setPredictions(Array.isArray(predictionRecords) ? predictionRecords : [])
          setReports(Array.isArray(reportRecords) ? reportRecords : [])
        }
      } catch (error) {
        if (isMounted) setErrorMessage(error.message)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadTimeline()

    return () => {
      isMounted = false
    }
  }, [])

  const timelineEvents = useMemo(() => {
    return [
      ...predictions.map((prediction) => ({
        date: prediction.created_at,
        description: prediction.summary || `Model result: ${prediction.disease || 'No detection'}.`,
        icon: CheckCircle2,
        status: prediction.status || 'completed',
        title: 'X-ray analysis completed',
        id: `xray-${prediction.id}`,
      })),
      ...reports.map((report) => ({
        date: report.created_at,
        description: report.report_text || 'Report uploaded. AI extraction is pending backend support.',
        icon: FileScan,
        status: report.status || 'uploaded',
        title: 'Medical report uploaded',
        id: `report-${report.id}`,
      })),
    ].sort((first, second) => new Date(second.date || 0) - new Date(first.date || 0))
  }, [predictions, reports])

  return (
    <DashboardLayout pageTitle="Health Timeline">
      <section className="module-page">
        <ModuleHeader
          eyebrow="Chronological care view"
          title="Track health analysis events over time."
          description="A professional timeline for X-rays, report uploads, results, and future recovery updates."
        />

        <ModuleCard>
          <div className="module-card-heading">
              <CalendarClock size={22} />
              <div>
                <h2>Timeline</h2>
              <p>Authenticated X-ray and report events returned by the backend.</p>
              </div>
            </div>

          {errorMessage && <p className="module-alert error">{errorMessage}</p>}

          {isLoading ? (
            <EmptyState
              icon={CalendarClock}
              title="Loading timeline"
              description="Fetching your authenticated health events."
            />
          ) : timelineEvents.length > 0 ? (
            <div className="health-timeline">
              {timelineEvents.map((event) => (
                <article className="timeline-event" key={event.id || `${event.title}-${event.date}`}>
                  <div className="timeline-marker">
                    <event.icon size={18} />
                  </div>
                  <div className="timeline-content">
                    <div>
                      <h2>{event.title}</h2>
                      <time>{formatTimelineDate(event.date)}</time>
                    </div>
                    <p>{event.description}</p>
                    <StatusPill tone="info">{event.status}</StatusPill>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={CalendarClock}
              title="No health timeline yet"
              description="X-ray analyses and report uploads will appear here after you create them."
            />
          )}
        </ModuleCard>
      </section>
    </DashboardLayout>
  )
}

function formatTimelineDate(value) {
  if (!value) return 'Just now'
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export default HealthTimeline
