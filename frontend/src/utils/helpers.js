/**
 * Utility helpers for date formatting and status display
 */
import { format, formatDistanceToNow, isToday, isPast, parseISO } from 'date-fns'

export const STATUS_CONFIG = {
  'Not Responded': {
    color: 'bg-slate-100 text-slate-600',
    dot: 'bg-slate-400',
    label: 'Not Responded',
  },
  'Interested': {
    color: 'bg-green-50 text-green-700',
    dot: 'bg-green-500',
    label: 'Interested',
  },
  'Follow-up Later': {
    color: 'bg-amber-50 text-amber-700',
    dot: 'bg-amber-500',
    label: 'Follow-up Later',
  },
  'Closed': {
    color: 'bg-blue-50 text-blue-700',
    dot: 'bg-blue-500',
    label: 'Closed',
  },
}

export const ALL_STATUSES = Object.keys(STATUS_CONFIG)

/**
 * Parse a date string from the API.
 * FastAPI returns UTC datetimes without a trailing 'Z', e.g. "2024-04-16T10:30:00"
 * parseISO treats those as local time — appending 'Z' forces UTC interpretation.
 */
function parseApiDate(dateStr) {
  if (!dateStr) return null
  if (typeof dateStr !== 'string') return new Date(dateStr)
  // Already has timezone info
  if (dateStr.endsWith('Z') || dateStr.includes('+')) return parseISO(dateStr)
  // Assume UTC — append Z
  return parseISO(dateStr + 'Z')
}

/**
 * Format a date string for display.
 * For follow-up dates (stored as midnight IST → UTC), we compare only the date
 * part in local time so "Today" shows correctly regardless of timezone offset.
 */
export function formatDate(dateStr) {
  if (!dateStr) return null
  try {
    const d = parseApiDate(dateStr)
    if (isToday(d)) return 'Today'
    return format(d, 'MMM d, yyyy')
  } catch {
    return dateStr
  }
}

/**
 * Format a datetime string as relative time (e.g. "2 minutes ago").
 * Correctly handles UTC datetimes returned by FastAPI.
 */
export function timeAgo(dateStr) {
  if (!dateStr) return ''
  try {
    const d = parseApiDate(dateStr)
    return formatDistanceToNow(d, { addSuffix: true })
  } catch {
    return dateStr
  }
}

/**
 * Determine follow-up urgency for styling.
 * Compares only the calendar DATE (not time) so a follow-up set for
 * today shows as "today" all day, not "overdue" after midnight UTC.
 */
export function getFollowupUrgency(dateStr) {
  if (!dateStr) return null
  try {
    const d = parseApiDate(dateStr)
    // Compare calendar dates only (strips time component)
    const todayStr = format(new Date(), 'yyyy-MM-dd')
    const followupStr = format(d, 'yyyy-MM-dd')
    if (followupStr === todayStr) return 'today'
    if (followupStr < todayStr) return 'overdue'
    return 'upcoming'
  } catch {
    return null
  }
}

export const URGENCY_CONFIG = {
  overdue:  { color: 'text-red-600',   bg: 'bg-red-50',   border: 'border-red-200',   label: 'Overdue' },
  today:    { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Today' },
  upcoming: { color: 'text-brand-600', bg: 'bg-brand-50', border: 'border-brand-200', label: 'Upcoming' },
}

/**
 * Get error message from axios error
 */
export function getErrorMessage(err) {
  return err?.response?.data?.detail || err?.message || 'Something went wrong'
}