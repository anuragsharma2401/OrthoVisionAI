import { useMemo, useState } from 'react'
import { ArrowRight, Bone, BrainCircuit, FileImage, ScanSearch } from 'lucide-react'
import {
  EmptyState,
  InfoGrid,
  ModuleCard,
  ModuleHeader,
  StatusPill,
  UploadPanel,
} from '../components/modules/ModuleComponents.jsx'
import DashboardLayout from '../layouts/DashboardLayout.jsx'

const recentAnalyses = [
  {
    bone: 'Wrist X-ray',
    date: '12 Aug 2026',
    status: 'Demo completed',
  },
  {
    bone: 'Forearm X-ray',
    date: '10 Aug 2026',
    status: 'Demo review pending',
  },
]

function XRayAnalysis() {
  const [selectedFile, setSelectedFile] = useState(null)

  const imagePreview = useMemo(() => {
    if (!selectedFile) return ''
    return URL.createObjectURL(selectedFile)
  }, [selectedFile])

  function handleFileChange(event) {
    setSelectedFile(event.target.files?.[0] || null)
  }

  return (
    <DashboardLayout pageTitle="X-Ray Analysis">
      <section className="module-page">
        <ModuleHeader
          eyebrow="AI image workflow"
          title="Upload an X-ray for assisted analysis."
          description="Prepare X-ray images for future FastAPI + PyTorch fracture detection, bone identification, and explainable AI visualization."
        />

        <section className="module-two-column">
          <ModuleCard>
            <div className="module-card-heading">
              <FileImage size={22} />
              <div>
                <h2>X-ray upload</h2>
                <p>Supported UI: JPG, PNG, JPEG. Backend validation will be connected later.</p>
              </div>
            </div>

            <UploadPanel
              accept="image/png,image/jpeg,image/jpg"
              description="Upload a clear orthopedic X-ray image."
              file={selectedFile}
              id="xrayUpload"
              title="Drop X-ray image here"
              onChange={handleFileChange}
              onRemove={() => setSelectedFile(null)}
            />

            {imagePreview && (
              <div className="image-preview-card">
                <img src={imagePreview} alt="Selected X-ray preview" />
              </div>
            )}

            <button className="primary-button module-primary-button" disabled={!selectedFile} type="button">
              Analyze X-ray
              <ArrowRight size={17} />
            </button>
          </ModuleCard>

          <ModuleCard>
            <div className="module-card-heading">
              <BrainCircuit size={22} />
              <div>
                <h2>Future AI result</h2>
                <p>No medical prediction is shown until the backend model is connected.</p>
              </div>
            </div>

            <InfoGrid
              items={[
                { label: 'Detected bone', value: 'Pending analysis' },
                { label: 'Anomaly status', value: 'Pending analysis' },
                { label: 'Confidence', value: 'Pending model output' },
                { label: 'Heatmap', value: 'Explainability placeholder' },
              ]}
            />

            <div className="heatmap-placeholder">
              <ScanSearch size={30} />
              <span>Explainable AI heatmap will render here.</span>
            </div>
          </ModuleCard>
        </section>

        <ModuleCard>
          <div className="module-card-heading">
            <Bone size={22} />
            <div>
              <h2>Recent analyses</h2>
              <p>Sample records only. Real history will come from FastAPI.</p>
            </div>
          </div>

          <div className="module-list">
            {recentAnalyses.map((analysis) => (
              <div className="module-list-row" key={`${analysis.bone}-${analysis.date}`}>
                <div>
                  <strong>{analysis.bone}</strong>
                  <span>{analysis.date}</span>
                </div>
                <StatusPill tone="info">{analysis.status}</StatusPill>
              </div>
            ))}
          </div>
        </ModuleCard>
      </section>
    </DashboardLayout>
  )
}

export default XRayAnalysis
