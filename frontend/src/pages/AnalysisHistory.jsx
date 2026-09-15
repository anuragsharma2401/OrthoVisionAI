import { useEffect, useMemo, useState } from 'react'
import { FileSearch, History, Search } from 'lucide-react'
import {
  EmptyState,
  ModuleCard,
  ModuleHeader,
  StatusPill,
} from '../components/modules/ModuleComponents.jsx'
import DashboardLayout from '../layouts/DashboardLayout.jsx'
import { getMedicalReports, getPredictionHistory } from '../services/analysisService.js'

function AnalysisHistory() {
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [historyItems, setHistoryItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadHistory() {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const [predictions, reports] = await Promise.all([
          getPredictionHistory(),
          getMedicalReports(),
        ])

        const items = [
          ...(Array.isArray(predictions) ? predictions : []).map((prediction) => ({
            date: prediction.created_at,
            summary: prediction.summary || `Model result: ${prediction.disease || 'No detection'}`,
            title: prediction.disease || 'X-ray analysis',
            type: 'X-ray',
            status: prediction.status || 'completed',
            id: `xray-${prediction.id}`,
          })),
          ...(Array.isArray(reports) ? reports : []).map((report) => ({
            date: report.created_at,
            summary: report.report_text || 'Report uploaded. AI extraction is pending backend support.',
            title: report.file_name || 'Medical report',
            type: 'Report',
            status: report.status || 'uploaded',
            id: `report-${report.id}`,
          })),
        ].sort((first, second) => new Date(second.date || 0) - new Date(first.date || 0))

        if (isMounted) setHistoryItems(items)
      } catch (error) {
        if (isMounted) setErrorMessage(error.message)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadHistory()

    return () => {
      isMounted = false
    }
  }, [])

  const filteredItems = useMemo(() => {
    return historyItems.filter((item) => {
      const matchesQuery = `${item.title} ${item.summary} ${item.type}`
        .toLowerCase()
        .includes(query.toLowerCase())
      const matchesType = typeFilter === 'All' || item.type === typeFilter
      return matchesQuery && matchesType
    })
  }, [query, typeFilter])

  return (
    <DashboardLayout pageTitle="Analysis History">
      <section className="module-page">
        <ModuleHeader
          eyebrow="Unified records"
          title="Review previous analysis activity."
          description="A central history for X-ray and medical-report analysis records, ready for backend data."
        />

        {errorMessage && <p className="module-alert error">{errorMessage}</p>}

        <ModuleCard>
          <div className="history-filters">
            <label>
              <Search size={18} />
              <input
                placeholder="Search history..."
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
              <option>All</option>
              <option>X-ray</option>
              <option>Report</option>
            </select>
          </div>
        </ModuleCard>

        <ModuleCard>
          {isLoading ? (
            <EmptyState
              icon={History}
              title="Loading history"
              description="Fetching your authenticated analysis records."
            />
          ) : filteredItems.length > 0 ? (
            <div className="history-list">
              {filteredItems.map((item) => (
                <div className="history-row" key={item.id || `${item.title}-${item.date}`}>
                  <div className="history-icon">
                    <History size={20} />
                  </div>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.summary}</p>
                  </div>
                  <time>{formatHistoryDate(item.date)}</time>
                  <StatusPill tone="info">{item.status}</StatusPill>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FileSearch}
              title="No matching history"
              description="Try a different search term or filter. Future backend records will appear here."
            />
          )}
        </ModuleCard>
      </section>
    </DashboardLayout>
  )
}

function formatHistoryDate(value) {
  if (!value) return 'Just now'
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export default AnalysisHistory
