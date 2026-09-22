import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Camera, CheckCircle2, Mail, ShieldAlert } from 'lucide-react'
import FormField from '../components/auth/FormField.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import DashboardLayout from '../layouts/DashboardLayout.jsx'
import { updateProfile } from '../services/authService.js'
import { isValidEmail } from '../utils/validation.js'

function Profile() {
  const { updateCurrentUser, user } = useAuth()
  const [values, setValues] = useState({
    name: user?.name || '',
    email: user?.email || '',
  })
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState({ type: '', message: '' })
  const [isSaving, setIsSaving] = useState(false)

  function updateValue(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
    setStatus({ type: '', message: '' })
  }

  function validate() {
    const nextErrors = {}

    if (!values.name.trim()) nextErrors.name = 'Name is required.'
    if (!values.email.trim()) nextErrors.email = 'Email is required.'
    else if (!isValidEmail(values.email)) nextErrors.email = 'Enter a valid email address.'

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setStatus({ type: '', message: '' })

    if (!validate()) return

    setIsSaving(true)
    try {
      const response = await updateProfile(values)
      updateCurrentUser(response.user || values)
      setStatus({ type: 'success', message: 'Profile update submitted.' })
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Profile update is unavailable right now.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <DashboardLayout pageTitle="Profile">
      <section className="settings-content">
        <article className="profile-summary-card">
          <div className="profile-avatar-wrap">
            <span className="profile-avatar">{user?.name?.charAt(0) || 'A'}</span>
            <button type="button" aria-label="Upload profile picture">
              <Camera size={18} />
            </button>
          </div>
          <div>
            <p className="dashboard-eyebrow">Account profile</p>
            <h2>{user?.name || 'Anurag'}</h2>
            <p>Manage basic identity and verification status for your workspace.</p>
          </div>
        </article>

        <section className="settings-grid">
          <form className="settings-card profile-form" onSubmit={handleSubmit} noValidate>
            <div className="section-heading">
              <div>
                <p className="dashboard-eyebrow">Basic information</p>
                <h2>Edit profile</h2>
              </div>
            </div>

            <FormField
              error={errors.name}
              id="profileName"
              label="Name"
              name="name"
              value={values.name}
              onChange={updateValue}
            />
            <FormField
              error={errors.email}
              id="profileEmail"
              label="Email"
              name="email"
              value={values.email}
              onChange={updateValue}
            />

            {status.message && (
              <p className={`form-status ${status.type}`}>{status.message}</p>
            )}

            <button className="primary-button auth-submit" disabled={isSaving} type="submit">
              {isSaving ? 'Saving...' : 'Save Profile'}
            </button>
          </form>

          <article className="settings-card">
            <div className="section-heading">
              <div>
                <p className="dashboard-eyebrow">Verification</p>
                <h2>Contact status</h2>
              </div>
            </div>

            <VerificationRow
              icon={Mail}
              label="Email"
              value={values.email}
              verified={user?.emailVerified}
              verifyPath="/verify"
            />

            <Link className="profile-action-link" to="/reset-password">
              Change password
            </Link>
          </article>
        </section>
      </section>
    </DashboardLayout>
  )
}

function VerificationRow({ icon: Icon, label, value, verified, verifyPath }) {
  return (
    <div className="verification-row">
      <Icon size={20} />
      <div>
        <strong>{label}</strong>
        <span>{value || 'Not added'}</span>
      </div>
      <span className={`verify-badge ${verified ? 'verified' : 'unverified'}`}>
        {verified ? <CheckCircle2 size={15} /> : <ShieldAlert size={15} />}
        {verified ? 'Verified' : 'Not verified'}
      </span>
      {!verified && <Link to={verifyPath}>Verify</Link>}
    </div>
  )
}

export default Profile
