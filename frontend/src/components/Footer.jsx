import { Link } from 'react-router-dom'
import { Bone } from 'lucide-react'

const footerSections = [
  {
    title: 'Product',
    links: [
      { label: 'X-ray Analysis', href: '/#features' },
      { label: 'Medical Reports', href: '/#features' },
      { label: 'Recovery Guidance', href: '/#features' },
      { label: 'Analysis History' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About' },
      { label: 'How It Works', href: '/#workflow' },
      { label: 'Contact' },
    ],
  },
  {
    title: 'Resources / Legal',
    links: [
      { label: 'FAQ' },
      { label: 'Privacy Policy' },
      { label: 'Terms of Service' },
    ],
  },
]

function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <section className="footer-brand-section">
          <Link className="brand footer-brand" to="/" aria-label="OrthoVision AI home">
            <span className="brand-mark">
              <Bone size={18} aria-hidden="true" />
            </span>
            <span>OrthoVision AI</span>
          </Link>
          <p>
            AI-powered assistance for X-ray analysis, medical reports, and
            recovery guidance.
          </p>
        </section>

        <nav className="footer-links-grid" aria-label="Footer navigation">
          {footerSections.map((section) => (
            <div className="footer-link-column" key={section.title}>
              <h2>{section.title}</h2>
              <ul>
                {section.links.map((link) => (
                  <li key={link.label}>
                    {link.href ? (
                      <a href={link.href}>{link.label}</a>
                    ) : (
                      <span>{link.label}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className="footer-bottom">
        <p>© 2026 OrthoVision AI. All rights reserved.</p>
        <p>
          OrthoVision AI provides AI-assisted information for educational and
          supportive purposes and does not replace professional medical advice,
          diagnosis, or treatment.
        </p>
      </div>
    </footer>
  )
}

export default Footer
