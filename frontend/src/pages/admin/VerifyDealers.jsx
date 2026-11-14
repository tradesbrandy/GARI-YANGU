import { useCallback, useEffect, useState } from 'react'
import { allDealers, reviewDealer } from '../../api.js'
import { Empty, Loading, Notice, PageHead, StatusBadge } from '../../components/ui.jsx'
import { formatDate } from '../../utils.js'

const TABS = ['pending', 'approved', 'rejected']

export default function VerifyDealers() {
  const [dealers, setDealers] = useState(null)
  const [tab, setTab] = useState('pending')
  const [rejecting, setRejecting] = useState(null)
  const [reason, setReason] = useState('')
  const [msg, setMsg] = useState(null)

  const load = useCallback(() => allDealers().then(setDealers), [])
  useEffect(() => { load() }, [load])

  const decide = async (id, decision, why) => {
    try {
      await reviewDealer(id, decision, why)
      setMsg({ tone: 'success', text: decision === 'approved' ? 'Dealer approved.' : 'Dealer rejected.' })
      setRejecting(null); setReason(''); await load()
    } catch (e) { setMsg({ tone: 'error', text: e.message }) }
  }

  if (!dealers) return <Loading />
  const shown = dealers.filter((d) => d.dealer.status === tab)

  return (
    <>
      <PageHead title="Verify dealers" sub="Check each KRA PIN before approving. Approved dealers get the verified badge and can send offers." />
      <div className="container page-body">
        {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
        <div className="tabs" role="tablist">
          {TABS.map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>
              {t[0].toUpperCase() + t.slice(1)} <span className="count">{dealers.filter((d) => d.dealer.status === t).length}</span>
            </button>
          ))}
        </div>

        {shown.length === 0 ? <Empty title={`No ${tab} dealers`}>Nothing to review here.</Empty> : shown.map((u) => (
          <section className="card req" key={u.id}>
            <div className="req-head">
              <div>
                <h2 className="h3">{u.dealer.business_name}</h2>
                <div className="kv">
                  <span>KRA PIN</span><b>{u.dealer.kra_pin}</b>
                  <span>County</span><b>{u.dealer.county}</b>
                  <span>Address</span><b>{u.dealer.address || '—'}</b>
                  <span>Contact</span><b>{u.full_name} · {u.phone || '—'}</b>
                  <span>Email</span><b>{u.email}</b>
                  <span>Joined</span><b>{formatDate(u.created_at)}</b>
                  {u.dealer.rejection_reason && <><span>Reason</span><b>{u.dealer.rejection_reason}</b></>}
                </div>
              </div>
              <div className="req-side"><StatusBadge status={u.dealer.status} /></div>
            </div>

            {rejecting === u.id ? (
              <form className="row-gap wrap" onSubmit={(e) => { e.preventDefault(); decide(u.id, 'rejected', reason) }}>
                <input className="inline-input" required autoFocus placeholder="Reason for rejection" value={reason} onChange={(e) => setReason(e.target.value)} />
                <button className="btn btn-primary">Confirm reject</button>
                <button type="button" className="btn btn-ghost" onClick={() => setRejecting(null)}>Cancel</button>
              </form>
            ) : (
              <div className="row-gap">
                {u.dealer.status !== 'approved' && <button className="btn btn-green" onClick={() => decide(u.id, 'approved')}>Approve</button>}
                {u.dealer.status !== 'rejected' && <button className="btn btn-ghost" onClick={() => { setRejecting(u.id); setReason('') }}>Reject</button>}
              </div>
            )}
          </section>
        ))}
      </div>
    </>
  )
}
