/**
 * Timeline — shows activity history for a client
 */
import { useEffect, useState } from 'react'
import { MessageSquare, RefreshCw, Calendar, UserPlus, FileText, AlertCircle } from 'lucide-react'
import { PageSpinner, EmptyState } from '../ui/index'
import { timeAgo } from '../../utils/helpers'
import api from '../../utils/api'

const ACTIVITY_ICONS = {
  client_created:  { icon: UserPlus,      bg: 'bg-blue-50',   color: 'text-blue-500' },
  note_added:      { icon: FileText,      bg: 'bg-amber-50',  color: 'text-amber-500' },
  status_changed:  { icon: RefreshCw,     bg: 'bg-purple-50', color: 'text-purple-500' },
  followup_set:    { icon: Calendar,      bg: 'bg-green-50',  color: 'text-green-500' },
  followup_logged: { icon: MessageSquare, bg: 'bg-brand-50',  color: 'text-brand-500' },
}

export default function Timeline({ clientId }) {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!clientId) return
    setLoading(true)
    setError(null)

    api.get(`/activity/${clientId}`)
      .then(({ data }) => setActivities(data.activities))
      .catch((err) => {
        const msg = err?.response?.data?.detail || err?.message || 'Failed to load activity'
        setError(msg)
      })
      .finally(() => setLoading(false))
  }, [clientId])

  if (loading) return <PageSpinner />

  if (error) return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <AlertCircle className="w-8 h-8 text-red-400" />
      <p className="text-sm font-medium text-slate-600">Could not load timeline</p>
      <p className="text-xs text-slate-400">{error}</p>
    </div>
  )

  if (!activities.length) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No activity yet"
        description="Actions like status changes and follow-ups will appear here."
      />
    )
  }

  return (
    <div className="relative">
      {/* Vertical connecting line */}
      <div className="absolute left-4 top-2 bottom-2 w-px bg-slate-100" />

      <div className="space-y-1">
        {activities.map((act, i) => {
          const cfg = ACTIVITY_ICONS[act.activity_type] || ACTIVITY_ICONS.note_added
          const Icon = cfg.icon

          return (
            <div
              key={act.id}
              className="flex gap-4 relative animate-fade-in"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              {/* Icon bubble */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${cfg.bg}`}>
                <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
              </div>

              {/* Content */}
              <div className="flex-1 pb-4">
                <p className="text-sm text-slate-700 leading-snug">{act.description}</p>
                <p className="text-xs text-slate-400 mt-0.5">{timeAgo(act.created_at)}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
