import {
  CalendarClock,
  CheckCircle2,
  FileScan,
  HeartPulse,
  UploadCloud,
} from 'lucide-react'
import { ModuleCard, ModuleHeader, StatusPill } from '../components/modules/ModuleComponents.jsx'
import DashboardLayout from '../layouts/DashboardLayout.jsx'

const timelineEvents = [
  {
    date: '12 Aug 2026',
    description: 'Demo X-ray workflow reached completed state. No real diagnosis is displayed.',
    icon: CheckCircle2,
    status: 'Demo',
    title: 'X-ray analysis completed',
  },
  {
    date: '11 Aug 2026',
    description: 'Sample report upload event prepared for future backend records.',
    icon: FileScan,
    status: 'Placeholder',
    title: 'Medical report uploaded',
  },
  {
    date: '10 Aug 2026',
    description: 'Recovery guidance area initialized for future AI-generated supportive content.',
    icon: HeartPulse,
    status: 'Backend pending',
    title: 'Recovery guidance generated',
  },
  {
    date: '09 Aug 2026',
    description: 'Upload workspace opened for future X-ray image analysis.',
    icon: UploadCloud,
    status: 'Demo',
    title: 'X-ray upload prepared',
  },
]

function HealthTimeline() {
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
              <p>Demo events only. Backend records will replace these placeholders.</p>
            </div>
          </div>

          <div className="health-timeline">
            {timelineEvents.map((event) => (
              <article className="timeline-event" key={`${event.title}-${event.date}`}>
                <div className="timeline-marker">
                  <event.icon size={18} />
                </div>
                <div className="timeline-content">
                  <div>
                    <h2>{event.title}</h2>
                    <time>{event.date}</time>
                  </div>
                  <p>{event.description}</p>
                  <StatusPill tone="info">{event.status}</StatusPill>
                </div>
              </article>
            ))}
          </div>
        </ModuleCard>
      </section>
    </DashboardLayout>
  )
}

export default HealthTimeline
