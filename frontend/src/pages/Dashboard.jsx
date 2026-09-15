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

const summaryCards = [
  {
    icon: Bone,
    label: 'X-rays Analyzed',
    value: '03',
    helper: 'Demo uploads prepared',
  },
  {
    icon: FileScan,
    label: 'Medical Reports',
    value: '02',
    helper: 'Awaiting backend storage',
  },
  {
    icon: CheckCircle2,
    label: 'Recent Analysis',
    value: '1 demo case',
    helper: 'No real prediction shown',
  },
  {
    icon: HeartPulse,
    label: 'Recovery Status',
    value: 'Not started',
    helper: 'Generated after analysis',
  },
]

const recentAnalyses = [
  {
    date: '12 Aug 2026',
    name: 'Wrist X-ray',
    status: 'Demo analysis completed',
  },
  {
    date: '10 Aug 2026',
    name: 'Forearm X-ray',
    status: 'Demo review pending',
  },
]

const activityItems = [
  {
    label: 'X-ray analysis completed',
    time: 'Today · 10:20 AM',
  },
  {
    label: 'Medical report uploaded',
    time: 'Yesterday · 04:15 PM',
  },
  {
    label: 'Recovery guidance generated',
    time: 'Demo event · backend pending',
  },
]

function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const firstName = user?.name?.split(' ')[0] || 'Anurag'

  return (
    <DashboardLayout pageTitle="Dashboard">
      <section className="dashboard-content">
        <header className="dashboard-welcome">
          <div>
            <p className="dashboard-eyebrow">OrthoVision AI workspace</p>
            <h2>Good morning, {firstName} 👋</h2>
            <p>Here&apos;s an overview of your recent health activity.</p>
          </div>
          <span className="demo-badge">Demo dashboard data</span>
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
                <p className="dashboard-eyebrow">Demo records</p>
                <h2>Recent X-ray Analysis</h2>
              </div>
              <Bone size={22} />
            </div>

            <div className="analysis-table">
              {recentAnalyses.map((analysis) => (
                <div className="analysis-row" key={`${analysis.name}-${analysis.date}`}>
                  <div>
                    <strong>{analysis.name}</strong>
                    <span>{analysis.status}</span>
                  </div>
                  <time>{analysis.date}</time>
                  <button type="button" onClick={() => navigate('/analysis-history')}>
                    View Analysis
                    <ArrowRight size={15} />
                  </button>
                </div>
              ))}
            </div>
          </article>

          <article className="recovery-overview-card">
            <HeartPulse size={24} />
            <p className="dashboard-eyebrow">Recovery Overview</p>
            <h2>Recovery guidance will appear here.</h2>
            <p>
              Once a verified X-ray analysis is available, this card can show
              AI-generated recovery guidance, home-care reminders, and diet
              recommendations.
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
            {activityItems.map((activity) => (
              <div className="activity-item" key={activity.label}>
                <span></span>
                <div>
                  <strong>{activity.label}</strong>
                  <p>{activity.time}</p>
                </div>
              </div>
            ))}
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

export default Dashboard
