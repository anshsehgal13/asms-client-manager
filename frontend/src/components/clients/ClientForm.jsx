/**
 * ClientForm — reusable form for creating and editing clients
 */
import { useState } from 'react'
import { Spinner } from '../ui/index'
import DatePickerInput from '../ui/DatePickerInput'
import { ALL_STATUSES } from '../../utils/helpers'

const EMPTY_FORM = {
  name: '',
  phone: '',
  notes: '',
  status: 'Not Responded',
  followup_date: null,
}

export default function ClientForm({ initial = {}, onSubmit, onCancel, submitLabel = 'Save', loading }) {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...initial })
  const [errors, setErrors] = useState({})

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    if (errors[field]) setErrors((er) => ({ ...er, [field]: null }))
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Name is required'
    if (!form.phone.trim()) errs.phone = 'Phone number is required'
    else if (!/^[+\d\s\-().]{5,20}$/.test(form.phone.trim())) errs.phone = 'Enter a valid phone number'
    return errs
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSubmit({
      name: form.name.trim(),
      phone: form.phone.trim(),
      notes: form.notes.trim() || null,
      status: form.status,
      followup_date: form.followup_date || null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div>
        <label className="label">Full Name *</label>
        <input
          className={`input ${errors.name ? 'border-red-300 focus:ring-red-400' : ''}`}
          placeholder="e.g. Rahul Sharma"
          value={form.name}
          onChange={set('name')}
          disabled={loading}
        />
        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
      </div>

      {/* Phone */}
      <div>
        <label className="label">Phone Number *</label>
        <input
          className={`input ${errors.phone ? 'border-red-300 focus:ring-red-400' : ''}`}
          placeholder="e.g. +91 98765 43210"
          value={form.phone}
          onChange={set('phone')}
          disabled={loading}
        />
        {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
      </div>

      {/* Status */}
      <div>
        <label className="label">Status</label>
        <select
          className="input"
          value={form.status}
          onChange={set('status')}
          disabled={loading}
        >
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Follow-up date */}
      <div>
        <label className="label">Follow-up Date</label>
        <DatePickerInput
          value={form.followup_date}
          onChange={(date) => setForm((f) => ({ ...f, followup_date: date }))}
          disabled={loading}
        />
      </div>

      {/* Notes */}
      <div>
        <label className="label">Notes</label>
        <textarea
          className="input resize-none"
          rows={3}
          placeholder="Any notes about this client..."
          value={form.notes}
          onChange={set('notes')}
          disabled={loading}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button type="button" className="btn-secondary flex-1" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="btn-primary flex-1" disabled={loading}>
          {loading ? <Spinner size="sm" /> : submitLabel}
        </button>
      </div>
    </form>
  )
}
