/**
 * ClientForm — reusable form for creating and editing clients
 */
import { useState } from 'react'
import { Spinner } from '../ui/index'
import DatePickerInput from '../ui/DatePickerInput'
import { ALL_STATUSES } from '../../utils/helpers'

// Options for the 4 new fields
const PAYMENT_OPTIONS   = ['N/A', 'Credit', 'Cash']
const FOLDER_OPTIONS    = ['N/A', 'Pasting', 'Non-Pasting']
const DURATION_OPTIONS  = ['N/A', '4 Months', '6 Months', 'More than 6 Months']
const MODEL_OPTIONS     = ['N/A', 'Crown', 'OG', 'OLED', 'Tools', 'Brand']

const EMPTY_FORM = {
  name: '',
  phone: '',
  notes: '',
  status: 'Not Responded',
  followup_date: null,
  payment: 'N/A',
  folder_type: 'N/A',
  replacement_duration: 'N/A',
  model: 'N/A',
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
      payment: form.payment,
      folder_type: form.folder_type,
      replacement_duration: form.replacement_duration,
      model: form.model,
    })
  }

  // Reusable select row
  const SelectField = ({ label, field, options }) => (
    <div>
      <label className="label">{label}</label>
      <select className="input" value={form[field]} onChange={set(field)} disabled={loading}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )

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
        <select className="input" value={form.status} onChange={set('status')} disabled={loading}>
          {ALL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
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

      {/* 2-column grid for the 4 new fields */}
      <div className="grid grid-cols-2 gap-3">
        <SelectField label="Payment"              field="payment"              options={PAYMENT_OPTIONS} />
        <SelectField label="Folder Type"          field="folder_type"          options={FOLDER_OPTIONS} />
        <SelectField label="Replacement Duration" field="replacement_duration" options={DURATION_OPTIONS} />
        <SelectField label="Model"                field="model"                options={MODEL_OPTIONS} />
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
