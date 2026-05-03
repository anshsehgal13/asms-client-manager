/**
 * ClientDetailPage — Full detail view for a single client
 * Shows: client info, edit/delete actions, activity timeline
 */
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Phone, Calendar, Edit2, Trash2,
  FileText, Clock, MessageSquare, ShieldCheck
} from 'lucide-react'
import {
  PageSpinner, StatusBadge, Modal, ConfirmDialog
} from '../components/ui/index'
import ClientForm from '../components/clients/ClientForm'
import Timeline from '../components/timeline/Timeline'
import { formatDate, getFollowupUrgency, URGENCY_CONFIG, timeAgo, getErrorMessage } from '../utils/helpers'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { format, parseISO } from 'date-fns'

export default function ClientDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()

  const [client, setClient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [activeTab, setActiveTab] = useState('details')
  const [ownerName, setOwnerName] = useState(null)

  const load = async () => {
    try {
      const { data } = await api.get(`/clients/${id}`)
      setClient(data)
    } catch {
      toast.error('Client not found')
      navigate('/clients')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [id])

  // Fetch owner name when client loads and user is admin
  useEffect(() => {
    if (!client || !isAdmin) return
    api.get(`/clients/${id}/owner`)
      .then(({ data }) => setOwnerName(data.owner_name))
      .catch(() => setOwnerName(null))
  }, [client, isAdmin])

  const handleEdit = async (formData) => {
    setSaving(true)
    try {
      const { data } = await api.put(`/clients/${id}`, formData)
      setClient(data)
      setEditOpen(false)
      toast.success('Client updated!')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await api.delete(`/clients/${id}`)
      toast.success('Client deleted')
      navigate('/clients')
    } catch (err) {
      toast.error(getErrorMessage(err))
      setDeleting(false)
      setDeleteOpen(false)
    }
  }

  if (loading) return <PageSpinner />
  if (!client) return null

  const urgency = client.next_followup_date ? getFollowupUrgency(client.next_followup_date) : null
  const urgencyCfg = urgency ? URGENCY_CONFIG[urgency] : null

  // Prepare initial values for edit form
  const editInitial = {
    name: client.name,
    phone: client.phone,
    notes: client.notes || '',
    status: client.status,
    followup_date: client.next_followup_date
      ? format(parseISO(client.next_followup_date), 'yyyy-MM-dd')
      : null,
    payment: client.payment || 'N/A',
    folder_type: client.folder_type || 'N/A',
    replacement_duration: client.replacement_duration || 'N/A',
    model: client.model || 'N/A',
  }

  return (
    <div className="p-6 max-w-2xl mx-auto animate-fade-in">
      {/* Back */}
      <button
        onClick={() => navigate('/clients')}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-5 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Clients
      </button>

      {/* Client header card */}
      <div className="card p-5 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center flex-shrink-0">
              <span className="text-xl font-bold text-brand-600">
                {client.name?.[0]?.toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">{client.name}</h1>
              <div className="flex items-center gap-1.5 mt-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <a
                  href={`tel:${client.phone}`}
                  className="text-sm text-slate-600 font-mono hover:text-brand-600 transition-colors"
                >
                  {client.phone}
                </a>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditOpen(true)}
              className="btn-secondary !px-3"
              title="Edit client"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeleteOpen(true)}
              className="btn-danger !px-3"
              title="Delete client"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status + follow-up row */}
        <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-slate-50">
          <StatusBadge status={client.status} />

          {client.next_followup_date && urgencyCfg && (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
              ${urgencyCfg.bg} ${urgencyCfg.color} border ${urgencyCfg.border}`}>
              <Calendar className="w-3 h-3" />
              {urgencyCfg.label}: {formatDate(client.next_followup_date)}
            </span>
          )}

          <span className="ml-auto text-xs text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Added {timeAgo(client.created_at)}
          </span>
          {isAdmin && ownerName && (
            <span className="text-xs flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-50 text-brand-600">
              <ShieldCheck className="w-3 h-3" />
              {ownerName}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-100 rounded-xl mb-4">
        {[
          { id: 'details', label: 'Details', icon: FileText },
          { id: 'timeline', label: 'Timeline', icon: MessageSquare },
        ].map(({ id: tid, label, icon: Icon }) => (
          <button
            key={tid}
            onClick={() => setActiveTab(tid)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tid
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="card p-5 animate-fade-in" key={activeTab}>
        {activeTab === 'details' && (
          <div className="space-y-4">
            <div>
              <p className="label">Status</p>
              <StatusBadge status={client.status} />
            </div>

            <div>
              <p className="label">Follow-up Date</p>
              {client.next_followup_date ? (
                <p className="text-sm text-slate-700">{formatDate(client.next_followup_date)}</p>
              ) : (
                <p className="text-sm text-slate-400 italic">Not scheduled</p>
              )}
            </div>

            <div>
              <p className="label">Notes</p>
              {client.notes ? (
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{client.notes}</p>
              ) : (
                <p className="text-sm text-slate-400 italic">No notes added</p>
              )}
            </div>

            {/* ── Extra client details ── */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-50">
              <div>
                <p className="label">Payment</p>
                <p className="text-sm text-slate-700">{client.payment || 'N/A'}</p>
              </div>
              <div>
                <p className="label">Folder Type</p>
                <p className="text-sm text-slate-700">{client.folder_type || 'N/A'}</p>
              </div>
              <div>
                <p className="label">Replacement Period</p>
                <p className="text-sm text-slate-700">{client.replacement_duration || 'N/A'}</p>
              </div>
              <div>
                <p className="label">Product Type</p>
                <p className="text-sm text-slate-700">{client.model || 'N/A'}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-50 grid grid-cols-2 gap-4">
              <div>
                <p className="label">Created</p>
                <p className="text-sm text-slate-600">{formatDate(client.created_at)}</p>
              </div>
              <div>
                <p className="label">Last Updated</p>
                <p className="text-sm text-slate-600">{timeAgo(client.updated_at)}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <Timeline clientId={client.id} />
        )}
      </div>

      {/* Edit modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Client">
        <ClientForm
          initial={editInitial}
          onSubmit={handleEdit}
          onCancel={() => setEditOpen(false)}
          submitLabel="Save Changes"
          loading={saving}
        />
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Client"
        message={`Are you sure you want to delete "${client.name}"? This will also delete all activity history and cannot be undone.`}
        confirmLabel="Delete Client"
        loading={deleting}
      />
    </div>
  )
}
