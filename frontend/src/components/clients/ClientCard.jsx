/**
 * ClientCard — compact card shown in client lists and dashboard sections
 */
import { useNavigate } from 'react-router-dom'
import { Phone, Calendar, ChevronRight, AlertCircle, ShieldCheck } from 'lucide-react'
import { StatusBadge } from '../ui/index'
import { useAuth } from '../../context/AuthContext'
import { formatDate, getFollowupUrgency, URGENCY_CONFIG } from '../../utils/helpers'

export default function ClientCard({ client, compact = false }) {
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const urgency = client.next_followup_date
    ? getFollowupUrgency(client.next_followup_date)
    : null
  const urgencyCfg = urgency ? URGENCY_CONFIG[urgency] : null

  return (
    <div
      onClick={() => navigate(`/clients/${client.id}`)}
      className={`card p-4 cursor-pointer hover:shadow-card-hover hover:-translate-y-px transition-all duration-150 animate-fade-in
        ${urgency === 'overdue' ? 'border-red-100' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: avatar + info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-brand-50 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-brand-600">
              {client.name?.[0]?.toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">{client.name}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Phone className="w-3 h-3 text-slate-400 flex-shrink-0" />
              <p className="text-xs text-slate-500 font-mono">{client.phone}</p>
            </div>
          </div>
        </div>

        {/* Right: status + arrow */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusBadge status={client.status} />
          <ChevronRight className="w-4 h-4 text-slate-300" />
        </div>
      </div>

      {/* Follow-up pill */}
      {client.next_followup_date && urgencyCfg && (
        <div className={`mt-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium w-fit
          ${urgencyCfg.bg} ${urgencyCfg.color} border ${urgencyCfg.border}`}>
          {urgency === 'overdue' && <AlertCircle className="w-3 h-3" />}
          {urgency !== 'overdue' && <Calendar className="w-3 h-3" />}
          <span>
            {urgency === 'overdue' ? 'Overdue: ' : 'Follow-up: '}
            {formatDate(client.next_followup_date)}
          </span>
        </div>
      )}

      {/* Notes preview */}
      {!compact && client.notes && (
        <p className="mt-2 text-xs text-slate-400 line-clamp-1">{client.notes}</p>
      )}
    </div>
  )
}
