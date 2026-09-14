import { UploadCloud, X } from 'lucide-react'

export function ModuleHeader({ eyebrow, title, description }) {
  return (
    <header className="module-header">
      <p className="dashboard-eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <p>{description}</p>
    </header>
  )
}

export function ModuleCard({ children, className = '' }) {
  return <article className={`module-card ${className}`}>{children}</article>
}

export function UploadPanel({
  accept,
  description,
  file,
  id,
  onChange,
  onRemove,
  title,
}) {
  return (
    <div className="upload-panel">
      {!file ? (
        <label className="upload-dropzone" htmlFor={id}>
          <UploadCloud size={32} />
          <strong>{title}</strong>
          <span>{description}</span>
          <em>Drag and drop or browse from your device</em>
          <input accept={accept} id={id} type="file" onChange={onChange} />
        </label>
      ) : (
        <div className="selected-file-card">
          <div>
            <strong>{file.name}</strong>
            <span>{formatFileSize(file.size)} · {file.type || 'Unknown file type'}</span>
          </div>
          <button type="button" onClick={onRemove} aria-label="Remove selected file">
            <X size={18} />
          </button>
        </div>
      )}
    </div>
  )
}

export function StatusPill({ children, tone = 'neutral' }) {
  return <span className={`module-status-pill ${tone}`}>{children}</span>
}

export function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="module-empty-state">
      <Icon size={28} />
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  )
}

export function InfoGrid({ items }) {
  return (
    <div className="module-info-grid">
      {items.map((item) => (
        <div className="module-info-item" key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  )
}

function formatFileSize(size) {
  if (!size) return '0 KB'
  return `${(size / 1024 / 1024).toFixed(2)} MB`
}
