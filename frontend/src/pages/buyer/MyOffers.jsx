import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../AuthContext.jsx'
import { myRequests, acceptOffer, declineOffer, closeRequest, addReview } from '../../api.js'
import OfferCard from '../../components/OfferCard.jsx'
import { Badge, Empty, Loading, Notice, PageHead, StatusBadge } from '../../components/ui.jsx'
import { daysLeft, describeRequest, timeAgo } from '../../utils.js'

const TABS = [['open', 'Open'], ['fulfilled', 'Fulfilled'], ['closed', 'Closed']]

export default function MyOffers() {
  const { user } = useAuth()
  const loc = useLocation()
  const [reqs, setReqs] = useState(null)
  const [tab, setTab] = useState('open')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(loc.state?.posted ? { tone: 'success', text: 'Your request is live! Dealers will start sending offers.' } : null)

  const load = useCallback(() => myRequests(user.id).then(setReqs), [user.id])
  useEffect(() => { load() }, [load])

  const act = async (fn, okText) => {
    setBusy(true); setMsg(null)
    try { await fn(); await load(); if (okText) setMsg({ tone: 'success', text: okText }) }
    catch (e) { setMsg({ tone: 'error', text: e.message }) }
    setBusy(false)
  }

  if (!reqs) return <Loading />
  const status = (r) => (r.expired ? 'closed' : r.status)
  const shown = reqs.filter((r) => status(r) === tab)
  const count = (t) => reqs.filter((r) => status(r) === t).length

  return (
    <>
      <PageHead title="My offers" sub="Compare offers from verified dealers, then pick the winner.">
        <Link to="/post-request" className="btn btn-green">+ New request</Link>
      </PageHead>
      <div className="container page-body">
        {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}

        <div className="tabs" role="tablist">
          {TABS.map(([k, label]) => (
            <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>
              {label} <span className="count">{count(k)}</span>
            </button>
          ))}
        </div>

        {shown.length === 0 ? (
          <Empty title={tab === 'open' ? 'No open requests' : `No ${tab} requests`} to={tab === 'open' ? '/post-request' : undefined} cta="Post a request">
            {tab === 'open' ? 'Tell dealers what you want and offers will appear here.' : 'Requests will show up here once they change status.'}
          </Empty>
        ) : shown.map((r) => (
          <section className="card req" key={r.id}>
            <div className="req-head">
              <div>
                <h2 className="h3">{r.title}</h2>
                <div className="muted-sm">{describeRequest(r)}</div>
                {r.notes && <div className="muted-sm" style={{ marginTop: 4 }}>📝 {r.notes}</div>}
              </div>
              <div className="req-side">
                <StatusBadge status={status(r)} />
                {r.status === 'open' && !r.expired && <Badge tone="gray">{daysLeft(r.expires_at)} days left</Badge>}
                <span className="muted-sm">Posted {timeAgo(r.created_at)}</span>
              </div>
            </div>

            {r.offers.length === 0 ? (
              <div className="no-offers">No offers yet. Dealers in your area have been notified — check back soon.</div>
            ) : (
              <div className="offer-list">
                <div className="muted-sm">{r.offers.length} offer{r.offers.length > 1 ? 's' : ''}, cheapest first</div>
                {r.offers.map((o, i) => (
                  <OfferCard
                    key={o.id} offer={o} best={i === 0 && r.offers.length > 1 && o.status === 'pending'}
                    canAct={r.status === 'open' && !r.expired} busy={busy}
                    onAccept={(id) => act(async () => { await acceptOffer(user.id, id); setTab('fulfilled') }, 'Offer accepted! The dealer’s phone number is now visible.')}
                    onDecline={(id) => act(() => declineOffer(user.id, id))}
                    onReview={(id, rating, comment) => act(() => addReview(user.id, id, rating, comment), 'Thanks for your review.')}
                  />
                ))}
              </div>
            )}

            {r.status === 'open' && !r.expired && (
              <div style={{ marginTop: 16 }}>
                <button className="link-btn" disabled={busy} onClick={() => window.confirm('Close this request? Pending offers will be declined.') && act(async () => { await closeRequest(user.id, r.id); setTab('closed') }, 'Request closed.')}>
                  Close this request
                </button>
              </div>
            )}
          </section>
        ))}
      </div>
    </>
  )
}
