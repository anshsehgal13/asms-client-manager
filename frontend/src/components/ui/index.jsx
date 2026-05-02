/**
 * Shared UI primitives used across the app
 */
import { X } from 'lucide-react'
import { STATUS_CONFIG } from '../../utils/helpers'

/* ── Status Badge ─────────────────────────────────────────── */
export function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG['Not Responded']
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

/* ── Spinner ──────────────────────────────────────────────── */
export function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' }
  return (
    <div className={`${sizes[size]} border-2 border-brand-500 border-t-transparent rounded-full animate-spin ${className}`} />
  )
}

/* ── Page Spinner ─────────────────────────────────────────── */
export function PageSpinner() {
  return (
    <div className="flex items-center justify-center py-24">
      <Spinner size="lg" />
    </div>
  )
}

/* ── Empty State ──────────────────────────────────────────── */
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {Icon && (
        <div className="w-12 h-12 rounded-2xl bg-surface-100 flex items-center justify-center mb-4">
          <Icon className="w-6 h-6 text-slate-400" />
        </div>
      )}
      <p className="text-sm font-semibold text-slate-700 mb-1">{title}</p>
      {description && <p className="text-sm text-slate-400 mb-4 max-w-xs">{description}</p>}
      {action}
    </div>
  )
}

/* ── Modal ────────────────────────────────────────────────── */
export function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-xl w-full ${maxWidth} animate-slide-up flex flex-col max-h-[90vh]`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <h2 className="text-base font-semibold text-slate-800">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-surface-100 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

/* ── Confirm Dialog ───────────────────────────────────────── */
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Delete', loading }) {
  if (!open) return null
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-sm">
      <p className="text-sm text-slate-600 mb-5">{message}</p>
      <div className="flex gap-3 justify-end">
        <button onClick={onClose} className="btn-secondary" disabled={loading}>Cancel</button>
        <button onClick={onConfirm} className="btn-danger" disabled={loading}>
          {loading ? <Spinner size="sm" /> : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}

/* ── Section Header ───────────────────────────────────────── */
export function SectionHeader({ title, count, badge, action }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
        {(count !== undefined || badge) && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge || 'bg-surface-100 text-slate-500'}`}>
            {count}
          </span>
        )}
      </div>
      {action}
    </div>
  )
}
