import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Bone,
  CalendarClock,
  CheckCircle2,
  FileScan,
  HeartPulse,
  UploadCloud,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext.jsx'
import DashboardLayout from '../layouts/DashboardLayout.jsx'
import { getMedicalReports, getPredictionHistory } from '../services/analysisService.js'

function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const firstName = user?.name?.split(' ')[0] || 'Anurag'
  const [predictions, setPredictions] = useState([])
  const [reports, setReports] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadDashboardData() {
      try {
        const [predictionRecords, reportRecords] = await Promise.all([
          getPredictionHistory(),
          getMedicalReports(),
        ])

        if (isMounted) {
          setPredictions(Array.isArray(predictionRecords) ? predictionRecords : [])
          setReports(Array.isArray(reportRecords) ? reportRecords : [])
        }
      } catch {
        if (isMounted) {
          setPredictions([])
          setReports([])
        }
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadDashboardData()

    return () => {
      isMounted = false
    }
  }, [])

  const summaryCards = useMemo(() => [
    {
      icon: Bone,
      label: 'X-rays Analyzed',
      value: isLoading ? '...' : String(predictions.length).padStart(2, '0'),
      helper: 'Authenticated model analyses',
    },
    {
      icon: FileScan,
      label: 'Medical Reports',
      value: isLoading ? '...' : String(reports.length).padStart(2, '0'),
      helper: 'Uploaded report records',
    },
    {
      icon: CheckCircle2,
      label: 'Recent Analysis',
      value: predictions[0]?.disease || 'None yet',
      helper: predictions[0]?.confidence || 'Run an X-ray analysis',
    },
    {
      icon: HeartPulse,
      label: 'Recovery Status',
      value: 'Pending',
      helper: 'Available after guidance backend support',
    },
  ], [isLoading, predictions, reports])

  const activityItems = useMemo(() => [
    ...predictions.slice(0, 3).map((prediction) => ({
      label: `X-ray analysis ${prediction.status || 'completed'}`,
      time: formatDashboardDate(prediction.created_at),
    })),
    ...reports.slice(0, 3).map((report) => ({
      label: 'Medical report uploaded',
      time: formatDashboardDate(report.created_at),
    })),
  ].slice(0, 3), [predictions, reports])

  return (
    <DashboardLayout pageTitle="Dashboard">
      <section className="dashboard-content">
        <header className="dashboard-welcome">
          <div>
            <p className="dashboard-eyebrow">OrthoVision AI workspace</p>
            <h2>Good morning, {firstName} 👋</h2>
            <p>Here&apos;s an overview of your recent health activity.</p>
          </div>
          <span className="demo-badge">Backend-connected workspace</span>
        </header>

        <section className="dashboard-action-grid" aria-label="Quick actions">
          <QuickAction
            description="Upload an X-ray for AI-assisted fracture analysis."
            icon={UploadCloud}
            title="Analyze X-ray"
            variant="primary"
            path="/xray-analysis"
          />
          <QuickAction
            description="Upload a medical report for analysis."
            icon={FileScan}
            title="Upload Medical Report"
            path="/medical-reports"
          />
        </section>

        <section className="summary-grid" aria-label="Dashboard summary">
          {summaryCards.map((card) => (
            <SummaryCard key={card.label} {...card} />
          ))}
        </section>

        <section className="dashboard-main-grid">
          <article className="analysis-table-card">
            <div className="section-heading">
              <div>
                <p className="dashboard-eyebrow">Recent records</p>
                <h2>Recent X-ray Analysis</h2>
              </div>
              <Bone size={22} />
            </div>

            <div className="analysis-table">
              {predictions.length > 0 ? (
                predictions.slice(0, 3).map((analysis) => (
                  <div className="analysis-row" key={analysis.id}>
                    <div>
                      <strong>{analysis.disease || 'X-ray analysis'}</strong>
                      <span>{analysis.summary || analysis.status || 'completed'}</span>
                    </div>
                    <time>{formatDashboardDate(analysis.created_at)}</time>
                    <button type="button" onClick={() => navigate('/analysis-history')}>
                      View Analysis
                      <ArrowRight size={15} />
                    </button>
                  </div>
                ))
              ) : (
                <p className="module-disclaimer">No X-ray analyses yet. Upload an X-ray to run the ML model.</p>
              )}
            </div>
          </article>

          <article className="recovery-overview-card">
            <HeartPulse size={24} />
            <p className="dashboard-eyebrow">Recovery Overview</p>
            <h2>Recovery guidance will appear here.</h2>
            <p>
              Once verified analysis and clinical workflow support are available,
              this card can show AI-assisted recovery guidance, home-care reminders,
              and diet recommendations.
            </p>
            <button
              className="card-link-button recovery-link-button"
              type="button"
              onClick={() => navigate('/recovery-guidance')}
            >
              View Recovery Guidance
              <ArrowRight size={16} />
            </button>
          </article>
        </section>

        <section className="recent-activity-card">
          <div className="section-heading">
            <div>
              <p className="dashboard-eyebrow">Recent Activity</p>
              <h2>Health activity timeline</h2>
            </div>
            <CalendarClock size={22} />
          </div>

          <div className="activity-list">
            {activityItems.length > 0 ? (
              activityItems.map((activity) => (
                <div className="activity-item" key={`${activity.label}-${activity.time}`}>
                  <span></span>
                  <div>
                    <strong>{activity.label}</strong>
                    <p>{activity.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="module-disclaimer">No recent activity yet.</p>
            )}
          </div>

          <button
            className="card-link-button timeline-link-button"
            type="button"
            onClick={() => navigate('/health-timeline')}
          >
            View Health Timeline
            <ArrowRight size={16} />
          </button>
        </section>
      </section>
    </DashboardLayout>
  )
}

function QuickAction({ description, icon: Icon, title, variant, path }) {
  const navigate = useNavigate()

  return (
    <button
      className={`dashboard-action-card ${variant === 'primary' ? 'primary' : ''}`}
      type="button"
      onClick={() => navigate(path)}
    >
      <span>
        <Icon size={24} />
      </span>
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
      <ArrowRight size={18} />
    </button>
  )
}

function SummaryCard({ helper, icon: Icon, label, value }) {
  return (
    <article className="summary-card">
      <div className="summary-icon">
        <Icon size={21} />
      </div>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{helper}</p>
    </article>
  )
}

function formatDashboardDate(value) {
  if (!value) return 'Just now'
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export default Dashboard
