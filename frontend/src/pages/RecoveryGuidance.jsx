import {
  AlertTriangle,
  ClipboardPlus,
  HeartPulse,
  Home,
  ShieldCheck,
  Utensils,
} from 'lucide-react'
import { ModuleCard, ModuleHeader } from '../components/modules/ModuleComponents.jsx'
import DashboardLayout from '../layouts/DashboardLayout.jsx'

const guidanceSections = [
  {
    icon: HeartPulse,
    title: 'Recovery progress',
    text: 'Future AI-generated progress summaries will appear here after verified analysis data is available.',
  },
  {
    icon: ShieldCheck,
    title: 'Precautions',
    text: 'Precaution guidance is intentionally withheld until clinician-safe backend logic is connected.',
  },
  {
    icon: ClipboardPlus,
    title: 'Activities',
    text: 'Activity guidance will be generated from validated analysis and recovery context later.',
  },
  {
    icon: Utensils,
    title: 'Diet guidance',
    text: 'Diet recommendations will remain backend-driven and clearly scoped when implemented.',
  },
  {
    icon: Home,
    title: 'Home-care guidance',
    text: 'Home-care content will be generated only from connected clinical workflow data.',
  },
]

function RecoveryGuidance() {
  return (
    <DashboardLayout pageTitle="Recovery Guidance">
      <section className="module-page">
        <ModuleHeader
          eyebrow="Supportive recovery"
          title="Recovery guidance foundation."
          description="This page is prepared for future AI-generated recovery, diet, precautions, and home-care guidance."
        />

        <section className="guidance-grid">
          {guidanceSections.map((section) => (
            <ModuleCard className="guidance-card" key={section.title}>
              <section.icon size={24} />
              <h2>{section.title}</h2>
              <p>{section.text}</p>
            </ModuleCard>
          ))}
        </section>

        <ModuleCard className="medical-disclaimer-card">
          <AlertTriangle size={24} />
          <div>
            <h2>Medical disclaimer</h2>
            <p>
              OrthoVision AI provides AI-assisted information for educational
              and supportive purposes only. It does not replace professional
              medical advice, diagnosis, treatment, or emergency care.
            </p>
          </div>
        </ModuleCard>
      </section>
    </DashboardLayout>
  )
}

export default RecoveryGuidance
