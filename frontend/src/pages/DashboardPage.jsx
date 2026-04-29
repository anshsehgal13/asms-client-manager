/**
 * DashboardPage — Overview with follow-up sections and stats
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Clock, CalendarCheck, Users, TrendingUp, Plus } from 'lucide-react'
import { PageSpinner, SectionHeader, EmptyState } from '../components/ui/index'
import ClientCard from '../components/clients/ClientCard'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import toast from 'react-hot-toast'

// Stat card component
function StatCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div className="card p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800 leading-none">{value ?? '—'}</p>
        <p className="text-xs text-slate-500 mt-0.5 font-medium">{label}</p>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const { data: resp } = await api.get('/clients/dashboard')
        setData(resp)
      } catch {
        toast.error('Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <PageSpinner />

  const { today_followups = [], upcoming_followups = [], overdue_followups = [], stats = {} } = data || {}

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">{greeting}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-sm text-slate-500 mt-0.5">Here's your client follow-up overview</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/clients?new=1')}>
          <Plus className="w-4 h-4" /> New Client
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard icon={Users}        label="Total Clients"   value={stats.total}          color="text-brand-600"  bg="bg-brand-50" />
        <StatCard icon={AlertCircle}  label="Overdue"         value={stats.overdue_count}  color="text-red-500"    bg="bg-red-50" />
        <StatCard icon={Clock}        label="Due Today"        value={stats.today_count}    color="text-amber-500"  bg="bg-amber-50" />
        <StatCard icon={TrendingUp}   label="Upcoming (7d)"   value={stats.upcoming_count} color="text-green-600"  bg="bg-green-50" />
      </div>

      {/* Overdue section */}
      {overdue_followups.length > 0 && (
        <div className="mb-8">
          <SectionHeader
            title="Overdue Follow-ups"
            count={overdue_followups.length}
            badge="bg-red-50 text-red-600"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {overdue_followups.map((c) => <ClientCard key={c.id} client={c} compact />)}
          </div>
        </div>
      )}

      {/* Today section */}
      <div className="mb-8">
        <SectionHeader
          title="Follow-ups Today"
          count={today_followups.length}
          badge="bg-amber-50 text-amber-600"
          action={
            <button className="text-xs text-brand-600 font-medium hover:underline" onClick={() => { const t = new Date().toISOString().slice(0,10); navigate(`/clients?followup_from=${t}&followup_to=${t}`) }}>
              View all
            </button>
          }
        />
        {today_followups.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {today_followups.map((c) => <ClientCard key={c.id} client={c} compact />)}
          </div>
        ) : (
          <div className="card p-5 text-center">
            <CalendarCheck className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-600">All clear for today!</p>
            <p className="text-xs text-slate-400">No follow-ups scheduled.</p>
          </div>
        )}
      </div>

      {/* Upcoming section */}
      <div>
        <SectionHeader
          title="Upcoming (Next 7 Days)"
          count={upcoming_followups.length}
          badge="bg-brand-50 text-brand-600"
        />
        {upcoming_followups.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {upcoming_followups.map((c) => <ClientCard key={c.id} client={c} compact />)}
          </div>
        ) : (
          <EmptyState
            icon={CalendarCheck}
            title="No upcoming follow-ups"
            description="Add follow-up dates to clients to see them here."
          />
        )}
      </div>
    </div>
  )
}
