/**
 * DatePickerInput — calendar dropdown for selecting follow-up dates.
 * Automatically opens upward if there is not enough space below the input.
 */
import { useState, useRef, useEffect } from 'react'
import { DayPicker } from 'react-day-picker'
import { format, parseISO } from 'date-fns'
import { Calendar, X } from 'lucide-react'
import 'react-day-picker/style.css'

export default function DatePickerInput({ value, onChange, placeholder = 'Set follow-up date', disabled }) {
  const [open, setOpen] = useState(false)
  const [openUpward, setOpenUpward] = useState(false)
  const containerRef = useRef(null)

  // Parse value to Date object
  const selected = value
    ? (typeof value === 'string' ? parseISO(value) : value)
    : undefined

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Decide open direction based on available viewport space
  const handleOpen = () => {
    if (disabled) return
    if (!open && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      // Calendar is roughly 320px tall; open upward if less than 340px below
      const spaceBelow = window.innerHeight - rect.bottom
      setOpenUpward(spaceBelow < 340)
    }
    setOpen((prev) => !prev)
  }

  const handleSelect = (date) => {
    if (date) onChange(format(date, 'yyyy-MM-dd'))
    setOpen(false)
  }

  const handleClear = (e) => {
    e.stopPropagation()
    onChange(null)
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        className={`w-full flex items-center gap-2 px-3 py-2 text-sm bg-white border rounded-lg transition-all duration-150
          focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-400
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-slate-300'}
          ${open ? 'border-brand-400 ring-2 ring-brand-500' : 'border-slate-200'}
          ${selected ? 'text-slate-800' : 'text-slate-400'}`}
      >
        <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <span className="flex-1 text-left">
          {selected ? format(selected, 'MMM d, yyyy') : placeholder}
        </span>
        {selected && !disabled && (
          <span
            onClick={handleClear}
            className="text-slate-300 hover:text-slate-500 transition-colors p-0.5 rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </span>
        )}
      </button>

      {open && (
        <div
          className={`absolute z-50 bg-white rounded-xl border border-slate-200 shadow-xl p-3 animate-fade-in
            ${openUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5'}`}
          style={{ minWidth: '280px' }}
        >
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={handleSelect}
            disabled={{ before: new Date() }}
            showOutsideDays
          />
        </div>
      )}
    </div>
  )
}
