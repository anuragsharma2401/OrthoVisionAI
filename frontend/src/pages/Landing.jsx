import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Bone,
  BrainCircuit,
  ClipboardPlus,
  Download,
  Eye,
  HeartPulse,
  ScanSearch,
  UploadCloud,
  Utensils,
} from 'lucide-react'

const featureSet = [
  { icon: UploadCloud, label: 'Upload X-ray' },
  { icon: Bone, label: 'Detect fracture' },
  { icon: Eye, label: 'Explain AI heatmap' },
  { icon: ClipboardPlus, label: 'Recovery guidance' },
  { icon: Utensils, label: 'Diet plan' },
  { icon: Download, label: 'Download report' },
]

function Landing() {
  return (
    <main className="apple-page">
      <nav className="apple-nav" aria-label="Primary navigation">
        <Link className="brand" to="/" aria-label="OrthoVision AI home">
          <span className="brand-mark">
            <Bone size={18} aria-hidden="true" />
          </span>
          <span>OrthoVision AI</span>
        </Link>

        <div className="nav-links">
          <a href="/#features">Features</a>
          <a href="/#workflow">How It Works</a>
          <Link to="/login">Login</Link>
        </div>

        <Link className="ghost-button nav-cta" to="/register">
          Get Started
        </Link>
      </nav>

      <section className="apple-hero" id="home">
        <div className="hero-copy">
          <p className="eyebrow">AI fracture detection for X-ray workflows</p>
          <h1>Clear answers from orthopedic images.</h1>
          <p className="hero-description">
            Upload an X-ray, identify the affected bone, visualize the AI
            reasoning, and generate patient-friendly recovery guidance.
          </p>

          <div className="cta-row">
            <Link className="primary-button" to="/register">
              Analyze X-ray
            </Link>
            <a className="text-button" href="#reports">
              <span>See sample report</span>
              <ArrowRight size={17} aria-hidden="true" />
            </a>
          </div>
        </div>

        <AppleDeviceMockup />
      </section>

      <FeatureStrip />

      <section className="apple-sections" id="features" aria-label="Core AI capabilities">
        <InfoCard
          icon={ScanSearch}
          title="Fracture localization"
          text="Highlights possible fracture zones with clean explainability overlays."
        />
        <InfoCard
          icon={BrainCircuit}
          title="Bone recognition"
          text="Automatically labels the bone region and summarizes visual evidence."
        />
        <InfoCard
          icon={HeartPulse}
          title="Recovery planning"
          text="Turns findings into recovery, diet, and home-care recommendations."
        />
      </section>
    </main>
  )
}

function AppleDeviceMockup() {
  return (
    <aside className="apple-device" aria-label="AI X-ray analysis preview" id="workflow">
      <div className="device-toolbar" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
      </div>

      <div className="xray-panel">
        <div className="bone-shape"></div>
        <div className="fracture-marker"></div>
      </div>

      <div className="device-summary" id="reports">
        <p>Detected bone</p>
        <strong>Distal Radius</strong>
        <span>Explainability map generated</span>
      </div>
    </aside>
  )
}

function FeatureStrip() {
  return (
    <section className="feature-strip" aria-label="OrthoVision AI workflow">
      {featureSet.map((feature) => (
        <div className="feature-item" key={feature.label}>
          <feature.icon size={19} aria-hidden="true" />
          <span>{feature.label}</span>
        </div>
      ))}
    </section>
  )
}

function InfoCard({ icon: Icon, title, text }) {
  return (
    <article className="info-card">
      <Icon size={24} aria-hidden="true" />
      <h2>{title}</h2>
      <p>{text}</p>
    </article>
  )
}

export default Landing
