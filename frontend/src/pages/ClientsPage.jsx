/**
 * ClientsPage — Full client list with search, filters, and create/edit modals
 */
import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Search, SlidersHorizontal, X, Users } from 'lucide-react'
import { PageSpinner, EmptyState, Modal } from '../components/ui/index'
import ClientCard from '../components/clients/ClientCard'
import ClientForm from '../components/clients/ClientForm'
import { ALL_STATUSES, getErrorMessage } from '../utils/helpers'
import api from '../utils/api'
import toast from 'react-hot-toast'

export default function ClientsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [clients, setClients] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showModal, setShowModal] = useState(false)

  // Filters — initialise from URL query params so "View all today" link works
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [followupFrom, setFollowupFrom] = useState(searchParams.get('followup_from') || '')
  const [followupTo, setFollowupTo] = useState(searchParams.get('followup_to') || '')
  const [showFilters, setShowFilters] = useState(!!(searchParams.get('followup_from')))

  // Open create modal if ?new=1
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setShowModal(true)
      setSearchParams({})
    }
  }, [])

  // Fetch clients on filter change (debounced search)
  const fetchClients = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (search.trim()) params.search = search.trim()
      if (statusFilter) params.status = statusFilter
      if (followupFrom) params.followup_from = followupFrom
      if (followupTo) params.followup_to = followupTo
      const { data } = await api.get('/clients/', { params })
      setClients(data.clients)
      setTotal(data.total)
    } catch {
      toast.error('Failed to load clients')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, followupFrom, followupTo])

  // Debounce search
  useEffect(() => {
    const t = setTimeout(fetchClients, 300)
    return () => clearTimeout(t)
  }, [fetchClients])

  const handleCreate = async (formData) => {
    setCreating(true)
    try {
      await api.post('/clients/', formData)
      toast.success('Client added!')
      setShowModal(false)
      fetchClients()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setCreating(false)
    }
  }

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('')
    setFollowupFrom('')
    setFollowupTo('')
  }

  const hasFilters = search || statusFilter || followupFrom || followupTo

  // Human-readable header when date filter is active
  const dateFilterLabel = followupFrom && followupTo && followupFrom === followupTo
    ? `Follow-ups on ${followupFrom}`
    : followupFrom || followupTo
      ? `Follow-ups ${followupFrom ? `from ${followupFrom}` : ''} ${followupTo ? `to ${followupTo}` : ''}`.trim()
      : null

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">
            {dateFilterLabel || 'Clients'}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{total} client{total !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" /> Add Client
        </button>
      </div>

      {/* Search + Filter bar */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn-secondary gap-2 ${showFilters ? 'bg-brand-50 border-brand-200 text-brand-700' : ''}`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">Filter</span>
          {(statusFilter || followupFrom) && <span className="w-2 h-2 rounded-full bg-brand-500" />}
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="card p-4 mb-4 animate-slide-up space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">Filters</p>
            {hasFilters && (
              <button onClick={clearFilters} className="text-xs text-red-500 hover:underline">
                Clear all
              </button>
            )}
          </div>

          {/* Status filter */}
          <div>
            <p className="label">Status</p>
            <div className="flex flex-wrap gap-2">
              {ALL_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    statusFilter === s
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Date range filter */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Follow-up from</label>
              <input
                type="date"
                className="input text-sm"
                value={followupFrom}
                onChange={(e) => setFollowupFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Follow-up to</label>
              <input
                type="date"
                className="input text-sm"
                value={followupTo}
                onChange={(e) => setFollowupTo(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <PageSpinner />
      ) : clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title={hasFilters ? 'No clients match your filters' : 'No clients yet'}
          description={hasFilters ? 'Try adjusting your search or filters.' : 'Add your first client to get started.'}
          action={
            !hasFilters && (
              <button className="btn-primary" onClick={() => setShowModal(true)}>
                <Plus className="w-4 h-4" /> Add First Client
              </button>
            )
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {clients.map((c) => (
            <ClientCard key={c.id} client={c} />
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add New Client">
        <ClientForm
          onSubmit={handleCreate}
          onCancel={() => setShowModal(false)}
          submitLabel="Add Client"
          loading={creating}
        />
      </Modal>
    </div>
  )
}
