import { Link } from 'react-router-dom'

export function Badge({ tone = 'gray', children }) {
  return <span className={`badge ${tone}`}>{children}</span>
}

export const STATUS_TONE = {
  open: 'blue', fulfilled: 'green', closed: 'gray', expired: 'gray',
  pending: 'amber', accepted: 'green', declined: 'red', withdrawn: 'gray',
  approved: 'green', rejected: 'red', active: 'green', draft: 'gray', sold: 'blue', hidden: 'gray',
}

export const StatusBadge = ({ status }) => <Badge tone={STATUS_TONE[status] || 'gray'}>{status}</Badge>

export function Stars({ value, count }) {
  if (value == null) return <span className="muted-sm">No reviews yet</span>
  return (
    <span className="stars-sm" title={`${value} out of 5`}>
      {'★'.repeat(Math.round(value))}{'☆'.repeat(5 - Math.round(value))} <b>{value}</b>{count != null && <span className="muted-sm"> ({count})</span>}
    </span>
  )
}

export function Notice({ tone = 'info', children, action }) {
  return (
    <div className={`notice ${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      <div>{children}</div>
      {action}
    </div>
  )
}

export function Empty({ title, children, to, cta }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      <p>{children}</p>
      {to && <Link to={to} className="btn btn-primary" style={{ marginTop: 18 }}>{cta}</Link>}
    </div>
  )
}

export function Loading() {
  return <div className="loading">Loading…</div>
}

export function PageHead({ title, sub, children }) {
  return (
    <section className="page-head">
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'end', flexWrap: 'wrap' }}>
        <div>
          <h1>{title}</h1>
          {sub && <p>{sub}</p>}
        </div>
        {children}
      </div>
    </section>
  )
}
