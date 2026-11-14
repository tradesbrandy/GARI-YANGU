export const formatKES = (n) =>
  'KES ' + Number(n).toLocaleString('en-KE', { maximumFractionDigits: 0 })

export const formatKm = (n) => (n == null ? '—' : Number(n).toLocaleString('en-KE') + ' km')

export const cap = (s) => (s === 'suv' ? 'SUV' : s ? s[0].toUpperCase() + s.slice(1) : '')

// Rough monthly instalment (illustrative): 20% deposit, 60 months, 14% p.a.
export function monthlyEstimate(price) {
  const principal = price * 0.8
  const r = 0.14 / 12
  const n = 60
  return Math.round((principal * r) / (1 - Math.pow(1 + r, -n)))
}

export function timeAgo(iso) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000
  if (s < 3600) return Math.max(1, Math.round(s / 60)) + ' min ago'
  if (s < 86400) return Math.round(s / 3600) + ' h ago'
  return Math.round(s / 86400) + ' d ago'
}

export const daysLeft = (iso) => Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 864e5))

export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })

// "2016+ · Petrol · SUV · up to KES 3,800,000 · Nairobi"
export function describeRequest(r) {
  const parts = []
  if (r.min_year) parts.push(`${r.min_year}+`)
  if (r.fuel) parts.push(cap(r.fuel))
  if (r.body_type) parts.push(r.body_type.toUpperCase() === 'SUV' ? 'SUV' : cap(r.body_type))
  if (r.max_price) parts.push(`up to ${formatKES(r.max_price)}`)
  if (r.county) parts.push(r.county)
  return parts.join(' · ')
}

export const KRA_PIN_RE = /^[AP]\d{9}[A-Z]$/i
