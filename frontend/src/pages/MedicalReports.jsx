import { useState } from 'react'
import { ArrowRight, ClipboardList, FileScan, SearchCheck } from 'lucide-react'
import {
  InfoGrid,
  ModuleCard,
  ModuleHeader,
  StatusPill,
  UploadPanel,
} from '../components/modules/ModuleComponents.jsx'
import DashboardLayout from '../layouts/DashboardLayout.jsx'

const uploadedReports = [
  {
    date: '12 Aug 2026',
    name: 'Orthopedic consultation report',
    status: 'Demo uploaded',
  },
  {
    date: '09 Aug 2026',
    name: 'Follow-up notes',
    status: 'Awaiting analysis',
  },
]

function MedicalReports() {
  const [selectedFile, setSelectedFile] = useState(null)

  return (
    <DashboardLayout pageTitle="Medical Reports">
      <section className="module-page">
        <ModuleHeader
          eyebrow="Report intelligence"
          title="Upload medical reports for future AI review."
          description="Prepare PDF, JPG, or PNG reports for backend-supported extraction, summarization, and recovery context."
        />

        <section className="module-two-column">
          <ModuleCard>
            <div className="module-card-heading">
              <FileScan size={22} />
              <div>
                <h2>Report upload</h2>
                <p>Selected files are held in the browser UI only until FastAPI upload endpoints are connected.</p>
              </div>
            </div>

            <UploadPanel
              accept="application/pdf,image/png,image/jpeg,image/jpg"
              description="Upload PDF, JPG, or PNG medical reports."
              file={selectedFile}
              id="medicalReportUpload"
              title="Drop medical report here"
              onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
              onRemove={() => setSelectedFile(null)}
            />

            <button className="primary-button module-primary-button" disabled={!selectedFile} type="button">
              Upload and Analyze
              <ArrowRight size={17} />
            </button>
          </ModuleCard>

          <ModuleCard>
            <div className="module-card-heading">
              <SearchCheck size={22} />
              <div>
                <h2>Future extracted findings</h2>
                <p>No clinical extraction is shown until backend analysis is available.</p>
              </div>
            </div>

            <InfoGrid
              items={[
                { label: 'Report type', value: 'Pending upload' },
                { label: 'Key findings', value: 'Pending backend analysis' },
                { label: 'Care context', value: 'Not generated yet' },
                { label: 'Linked X-ray', value: 'Optional later' },
              ]}
            />
          </ModuleCard>
        </section>

        <ModuleCard>
          <div className="module-card-heading">
            <ClipboardList size={22} />
            <div>
              <h2>Previously uploaded reports</h2>
              <p>Demo report records. Real records will be populated by the backend.</p>
            </div>
          </div>

          <div className="module-list">
            {uploadedReports.map((report) => (
              <div className="module-list-row" key={`${report.name}-${report.date}`}>
                <div>
                  <strong>{report.name}</strong>
                  <span>{report.date}</span>
                </div>
                <StatusPill tone="info">{report.status}</StatusPill>
              </div>
            ))}
          </div>
        </ModuleCard>
      </section>
    </DashboardLayout>
  )
}

export default MedicalReports
