import { useMemo, useState } from 'react'
import { FileSearch, History, Search } from 'lucide-react'
import {
  EmptyState,
  ModuleCard,
  ModuleHeader,
  StatusPill,
} from '../components/modules/ModuleComponents.jsx'
import DashboardLayout from '../layouts/DashboardLayout.jsx'

const historyItems = [
  {
    date: '12 Aug 2026',
    summary: 'Demo X-ray workflow completed. No real diagnosis displayed.',
    title: 'Wrist X-ray',
    type: 'X-ray',
    status: 'Demo completed',
  },
  {
    date: '09 Aug 2026',
    summary: 'Medical report upload placeholder awaiting backend extraction.',
    title: 'Consultation report',
    type: 'Report',
    status: 'Backend pending',
  },
]

function AnalysisHistory() {
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')

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
          {filteredItems.length > 0 ? (
            <div className="history-list">
              {filteredItems.map((item) => (
                <div className="history-row" key={`${item.title}-${item.date}`}>
                  <div className="history-icon">
                    <History size={20} />
                  </div>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.summary}</p>
                  </div>
                  <time>{item.date}</time>
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

export default AnalysisHistory
