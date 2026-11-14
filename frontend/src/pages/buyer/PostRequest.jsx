import { useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../AuthContext.jsx'
import { createRequest } from '../../api.js'
import { MAKES, BODY_TYPES, FUELS, COUNTIES } from '../../mockData.js'
import { cap, formatKES } from '../../utils.js'
import { Notice, PageHead } from '../../components/ui.jsx'

const YEARS = Array.from({ length: 14 }, (_, i) => 2024 - i)

export default function PostRequest() {
  const { user } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()
  const [q] = useSearchParams()

  const [f, setF] = useState({
    make: q.get('make') || '', model: q.get('model') || '', min_year: '', max_price: q.get('budget') || '',
    fuel: '', body_type: q.get('body') || '', county: q.get('county') || user?.county || '', notes: '', days: '30',
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!(Number(f.max_price) >= 100000)) return setError('Enter your maximum budget in KES (at least 100,000).')
    if (!f.county) return setError('Choose your county so nearby dealers can find you.')
    setBusy(true)
    try {
      await createRequest(user.id, f)
      nav('/my-offers', { state: { posted: true } })
    } catch (err) {
      setError(err.message); setBusy(false)
    }
  }

  return (
    <>
      <PageHead title="Tell dealers what you want" sub="Free, takes two minutes. Verified dealers will send you their best offers." />
      <div className="container form-page">
        {!user && (
          <Notice tone="info" action={
            <div className="row-gap">
              <Link to="/login" state={{ from: loc.pathname + loc.search }} className="btn btn-primary">Log in</Link>
              <Link to="/register" state={{ from: loc.pathname + loc.search }} className="btn btn-ghost">Sign up</Link>
            </div>
          }>
            You'll need an account to receive offers. Fill in the form, then log in or sign up to post it.
          </Notice>
        )}
        {user && user.role !== 'buyer' && <Notice tone="warn">You're signed in as a {user.role}. Only buyers can post requests — dealers can send offers from <Link to="/dealer/requests" className="link">Open requests</Link>.</Notice>}

        <form className="card form-card" onSubmit={submit}>
          {error && <Notice tone="error">{error}</Notice>}
          <div className="form-grid">
            <div className="field">
              <label htmlFor="pr-make">Make</label>
              <select id="pr-make" value={f.make} onChange={set('make')}>
                <option value="">Any make</option>
                {MAKES.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="pr-model">Model <span className="opt">(optional)</span></label>
              <input id="pr-model" placeholder="e.g. Harrier" value={f.model} onChange={set('model')} />
            </div>
            <div className="field">
              <label htmlFor="pr-price">Max budget (KES)</label>
              <input id="pr-price" type="number" inputMode="numeric" min="100000" step="50000" required placeholder="3000000" value={f.max_price} onChange={set('max_price')} />
              {Number(f.max_price) > 0 && <span className="hint">{formatKES(f.max_price)}</span>}
            </div>
            <div className="field">
              <label htmlFor="pr-year">Year from</label>
              <select id="pr-year" value={f.min_year} onChange={set('min_year')}>
                <option value="">Any year</option>
                {YEARS.map((y) => <option key={y} value={y}>{y} or newer</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="pr-body">Body type</label>
              <select id="pr-body" value={f.body_type} onChange={set('body_type')}>
                <option value="">Any</option>
                {BODY_TYPES.map((b) => <option key={b} value={b}>{cap(b)}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="pr-fuel">Fuel</label>
              <select id="pr-fuel" value={f.fuel} onChange={set('fuel')}>
                <option value="">Any</option>
                {FUELS.map((x) => <option key={x} value={x}>{cap(x)}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="pr-county">Your county</label>
              <select id="pr-county" required value={f.county} onChange={set('county')}>
                <option value="">Select county</option>
                {COUNTIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="pr-days">Keep my request open for</label>
              <select id="pr-days" value={f.days} onChange={set('days')}>
                <option value="14">14 days</option><option value="30">30 days</option><option value="60">60 days</option>
              </select>
            </div>
            <div className="field full">
              <label htmlFor="pr-notes">Anything else? <span className="opt">(optional)</span></label>
              <textarea id="pr-notes" rows={4} placeholder="Colour, mileage, must-have features…" value={f.notes} onChange={set('notes')} />
            </div>
          </div>
          <button className="btn btn-green btn-lg" disabled={busy || !user || user.role !== 'buyer'}>
            {busy ? 'Posting…' : 'Post my request'}
          </button>
          <p className="muted-sm" style={{ marginTop: 10 }}>Your phone number stays private until you accept an offer.</p>
        </form>
      </div>
    </>
  )
}
