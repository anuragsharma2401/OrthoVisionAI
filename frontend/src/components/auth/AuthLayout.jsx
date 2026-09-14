import { Link } from 'react-router-dom'
import { Bone } from 'lucide-react'

function AuthLayout({ eyebrow, title, subtitle, children }) {
  return (
    <main className="auth-page">
      <Link className="brand auth-brand" to="/" aria-label="Back to OrthoVision AI home">
        <span className="brand-mark">
          <Bone size={18} aria-hidden="true" />
        </span>
        <span>OrthoVision AI</span>
      </Link>

      <section className="auth-shell">
        <div className="auth-panel">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>

        <div className="auth-card">{children}</div>
      </section>
    </main>
  )
}

export default AuthLayout
