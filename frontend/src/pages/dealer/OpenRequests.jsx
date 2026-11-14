import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../AuthContext.jsx'
import { openRequests, submitOffer, withdrawOffer, dealerListings } from '../../api.js'
import { Badge, Empty, Loading, Notice, PageHead, StatusBadge } from '../../components/ui.jsx'
import { daysLeft, describeRequest, formatKES, timeAgo } from '../../utils.js'
import { DealerStatusNotice } from './Dashboard.jsx'

function OfferForm({ request, listings, disabled, onDone, onError }) {
  const [price, setPrice] = useState(request.max_price ? String(Math.round(request.max_price * 0.97)) : '')
  const [listingId, setListingId] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const { user } = useAuth()

  const submit = async (e) => {
    e.preventDefault(); setBusy(true)
    try { await submitOffer(user.id, { request_id: request.id, price, message, listing_id: listingId }); onDone() }
    catch (err) { onError(err.message); setBusy(false) }
  }

  return (
    <form className="offer-form" onSubmit={submit}>
      <div className="form-grid">
        <div className="field">
          <label htmlFor={`p${request.id}`}>Your price (KES)</label>
          <input id={`p${request.id}`} type="number" min="1" required value={price} onChange={(e) => setPrice(e.target.value)} />
          {Number(price) > request.max_price && <span className="hint warn">Above the buyer's budget of {formatKES(request.max_price)}</span>}
        </div>
        <div className="field">
          <label htmlFor={`l${request.id}`}>Car from your stock <span className="opt">(optional)</span></label>
          <select id={`l${request.id}`} value={listingId} onChange={(e) => setListingId(e.target.value)}>
            <option value="">I'll source one</option>
            {listings.map((l) => <option key={l.id} value={l.id}>{l.year} {l.make} {l.model} · {formatKES(l.price)}</option>)}
          </select>
        </div>
        <div className="field full">
          <label htmlFor={`m${request.id}`}>Message to buyer</label>
          <textarea id={`m${request.id}`} rows={3} placeholder="Condition, service history, viewing times…" value={message} onChange={(e) => setMessage(e.target.value)} />
        </div>
      </div>
      <button className="btn btn-green" disabled={busy || disabled}>{busy ? 'Sending…' : 'Send offer'}</button>
    </form>
  )
}

export default function OpenRequests() {
  const { user, refresh } = useAuth()
  const [reqs, setReqs] = useState(null)
  const [listings, setListings] = useState([])
  const [onlyMine, setOnlyMine] = useState(false)
  const [openId, setOpenId] = useState(null)
  const [msg, setMsg] = useState(null)

  const load = useCallback(async () => {
    await refresh()
    const [r, l] = await Promise.all([openRequests(user.id), dealerListings(user.id)])
    setReqs(r); setListings(l.filter((x) => x.status === 'active'))
  }, [user.id, refresh])
  useEffect(() => { load() }, [load])

  if (!reqs) return <Loading />
  const approved = user.dealer?.status === 'approved'
  const county = user.dealer?.county
  const shown = reqs.filter((r) => !onlyMine || r.county === county)

  const withdraw = async (id) => {
    try { await withdrawOffer(user.id, id); await load() } catch (e) { setMsg({ tone: 'error', text: e.message }) }
  }

  return (
    <>
      <PageHead title="Open requests" sub="Buyers who are ready to purchase. Send your best price." />
      <div className="container page-body">
        <DealerStatusNotice dealer={user.dealer} />
        {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}

        <div className="results-bar">
          <strong>{shown.length} request{shown.length === 1 ? '' : 's'}</strong>
          <div className="pill-row">
            <button className={`pill ${!onlyMine ? 'on' : ''}`} onClick={() => setOnlyMine(false)}>All counties</button>
            <button className={`pill ${onlyMine ? 'on' : ''}`} onClick={() => setOnlyMine(true)}>{county || 'My county'} only</button>
          </div>
        </div>

        {shown.length === 0 && <Empty title="No requests here right now">Try “All counties”, or check back later.</Empty>}

        {shown.map((r) => (
          <section className="card req" key={r.id}>
            <div className="req-head">
              <div>
                <h2 className="h3">{r.title}</h2>
                <div className="muted-sm">{describeRequest(r)}</div>
                {r.notes && <div className="muted-sm" style={{ marginTop: 4 }}>📝 {r.notes}</div>}
                <div className="muted-sm" style={{ marginTop: 4 }}>From {r.buyer_name} · posted {timeAgo(r.created_at)} · {daysLeft(r.expires_at)} days left</div>
              </div>
              <div className="req-side">
                <Badge tone="gray">{r.offer_count} offer{r.offer_count === 1 ? '' : 's'}</Badge>
              </div>
            </div>

            {r.my_offer ? (
              <div className="my-offer">
                <div>You offered <strong>{formatKES(r.my_offer.price)}</strong> <StatusBadge status={r.my_offer.status} /></div>
                {r.my_offer.status === 'pending' && <button className="link-btn" onClick={() => withdraw(r.my_offer.id)}>Withdraw offer</button>}
              </div>
            ) : openId === r.id ? (
              <OfferForm request={r} listings={listings} disabled={!approved}
                onDone={() => { setOpenId(null); setMsg({ tone: 'success', text: 'Offer sent! The buyer has been notified.' }); load() }}
                onError={(t) => setMsg({ tone: 'error', text: t })} />
            ) : (
              <button className="btn btn-primary" disabled={!approved} title={approved ? '' : 'Available once your account is approved'} onClick={() => { setMsg(null); setOpenId(r.id) }}>Send an offer</button>
            )}
          </section>
        ))}
      </div>
    </>
  )
}
