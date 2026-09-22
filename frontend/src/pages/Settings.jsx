import { Link } from 'react-router-dom'
import {
  Bell,
  LockKeyhole,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext.jsx'
import DashboardLayout from '../layouts/DashboardLayout.jsx'

function Settings() {
  const { user } = useAuth()

  return (
    <DashboardLayout pageTitle="Settings">
      <section className="settings-content">
        <div className="dashboard-hero-card settings-hero">
          <div>
            <p className="eyebrow">Account controls</p>
            <h2>Manage security and preferences.</h2>
            <p>
              Keep the foundation simple while backend sessions, notifications,
              and verification APIs are connected.
            </p>
          </div>
        </div>

        <section className="settings-grid">
          <SettingsCard
            icon={LockKeyhole}
            title="Account"
            description="Password and contact verification controls."
            items={[
              { label: 'Change password', to: '/reset-password' },
              {
                label: user?.emailVerified ? 'Email verified' : 'Verify email',
                to: '/verify',
              },
            ]}
          />

          <SettingsCard
            icon={Bell}
            title="Preferences"
            description="Notification and interface preferences."
            items={[
              { label: 'Email notifications: planned' },
              { label: 'Recovery reminders: planned' },
              { label: 'Compact dashboard UI: planned' },
            ]}
          />
        </section>
      </section>
    </DashboardLayout>
  )
}

function SettingsCard({ description, icon: Icon, items, title }) {
  return (
    <article className="settings-card">
      <Icon size={24} />
      <h2>{title}</h2>
      <p>{description}</p>
      <div className="settings-list">
        {items.map((item) =>
          item.to ? (
            <Link key={item.label} to={item.to}>
              {item.label}
            </Link>
          ) : (
            <span key={item.label}>{item.label}</span>
          ),
        )}
      </div>
    </article>
  )
}

export default Settings
