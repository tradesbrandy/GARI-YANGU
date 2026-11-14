import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../AuthContext.jsx'
import { dealerOffers, dealerStats, withdrawOffer } from '../../api.js'
import { Empty, Loading, Notice, PageHead, StatusBadge, Stars } from '../../components/ui.jsx'
import { formatKES, timeAgo } from '../../utils.js'

export function DealerStatusNotice({ dealer }) {
  if (dealer?.status === 'pending') return <Notice tone="warn">Your dealer account is <b>awaiting verification</b>. You can manage listings now, but you can only send offers once an admin approves your KRA PIN.</Notice>
  if (dealer?.status === 'rejected') return <Notice tone="error">Your dealer application was rejected{dealer.rejection_reason ? `: ${dealer.rejection_reason}` : '.'} Contact support to resubmit.</Notice>
  return null
}

export default function Dashboard() {
  const { user, refresh } = useAuth()
  const [stats, setStats] = useState(null)
  const [offers, setOffers] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    await refresh()
    const [s, o] = await Promise.all([dealerStats(user.id), dealerOffers(user.id)])
    setStats(s); setOffers(o)
  }, [user.id, refresh])
  useEffect(() => { load() }, [load])

  const withdraw = async (id) => {
    setError('')
    try { await withdrawOffer(user.id, id); await load() } catch (e) { setError(e.message) }
  }

  if (!stats || !offers) return <Loading />
  const tiles = [
    ['Active listings', stats.active_listings, '/dealer/listings'],
    [`Open requests in ${user.dealer?.county || 'your county'}`, stats.open_requests, '/dealer/requests'],
    ['Offers sent', stats.offers_sent],
    ['Offers accepted', stats.accepted],
  ]

  return (
    <>
      <PageHead title={user.dealer?.business_name || 'Dealer dashboard'} sub="Your offers, listings and buyer requests at a glance.">
        <Link to="/dealer/requests" className="btn btn-green">Browse open requests</Link>
      </PageHead>
      <div className="container page-body">
        <DealerStatusNotice dealer={user.dealer} />
        {error && <Notice tone="error">{error}</Notice>}

        <div className="stat-grid">
          {tiles.map(([label, value, to]) => {
            const inner = <><strong>{value}</strong><span>{label}</span></>
            return to ? <Link to={to} className="stat" key={label}>{inner}</Link> : <div className="stat" key={label}>{inner}</div>
          })}
        </div>
        <div className="muted-sm" style={{ margin: '-8px 0 24px' }}>Your rating: <Stars value={stats.rating} /></div>

        <h2 className="h3" style={{ marginBottom: 14 }}>Your offers</h2>
        {offers.length === 0 ? (
          <Empty title="No offers yet" to="/dealer/requests" cta="Find requests">Open requests from buyers are waiting for your best price.</Empty>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Request</th><th>County</th><th>Your price</th><th>Status</th><th>Sent</th><th /></tr></thead>
              <tbody>
                {offers.map((o) => (
                  <tr key={o.id}>
                    <td data-label="Request"><strong>{o.request_title}</strong>{o.listing && <div className="muted-sm">with {o.listing.title}</div>}</td>
                    <td data-label="County">{o.request_county}</td>
                    <td data-label="Your price">{formatKES(o.price)}</td>
                    <td data-label="Status"><StatusBadge status={o.status} /></td>
                    <td data-label="Sent">{timeAgo(o.created_at)}</td>
                    <td className="right">
                      {o.status === 'pending' && <button className="link-btn" onClick={() => withdraw(o.id)}>Withdraw</button>}
                      {o.status === 'accepted' && <span className="muted-sm">Buyer will call you</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
