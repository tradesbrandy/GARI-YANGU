import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth, homeFor } from '../AuthContext.jsx'
import { COUNTIES } from '../mockData.js'
import { KRA_PIN_RE } from '../utils.js'
import { Notice } from '../components/ui.jsx'

export default function Register() {
  const { register } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()
  const [f, setF] = useState({ role: 'buyer', full_name: '', email: '', phone: '', password: '', county: '', business_name: '', kra_pin: '', address: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const dealer = f.role === 'dealer'

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (f.password.length < 8) return setError('Password must be at least 8 characters.')
    if (dealer && !KRA_PIN_RE.test(f.kra_pin.trim())) return setError('KRA PIN looks wrong. It should be a letter, 9 digits and a letter, e.g. A123456789Z.')
    setBusy(true)
    try {
      const u = await register(f)
      nav(loc.state?.from || homeFor(u), { replace: true })
    } catch (err) {
      setError(err.message); setBusy(false)
    }
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card wide" onSubmit={submit}>
        <h1>Create your account</h1>
        <p className="muted">Free for buyers. Dealers are verified before they can send offers.</p>

        <div className="seg" role="tablist" aria-label="Account type">
          <button type="button" role="tab" aria-selected={!dealer} className={!dealer ? 'on' : ''} onClick={() => setF({ ...f, role: 'buyer' })}>I'm buying a car</button>
          <button type="button" role="tab" aria-selected={dealer} className={dealer ? 'on' : ''} onClick={() => setF({ ...f, role: 'dealer' })}>I'm a dealer</button>
        </div>

        {error && <Notice tone="error">{error}</Notice>}

        <div className="form-grid">
          <div className="field">
            <label htmlFor="full_name">Full name</label>
            <input id="full_name" required value={f.full_name} onChange={set('full_name')} />
          </div>
          <div className="field">
            <label htmlFor="phone">Phone</label>
            <input id="phone" type="tel" placeholder="07xx xxx xxx" required value={f.phone} onChange={set('phone')} />
          </div>
          <div className="field">
            <label htmlFor="r-email">Email</label>
            <input id="r-email" type="email" autoComplete="email" required value={f.email} onChange={set('email')} />
          </div>
          <div className="field">
            <label htmlFor="r-pass">Password</label>
            <input id="r-pass" type="password" autoComplete="new-password" minLength={8} required value={f.password} onChange={set('password')} />
          </div>
          <div className="field">
            <label htmlFor="r-county">County</label>
            <select id="r-county" required value={f.county} onChange={set('county')}>
              <option value="">Select county</option>
              {COUNTIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          {dealer && (
            <>
              <div className="field">
                <label htmlFor="biz">Business name</label>
                <input id="biz" required value={f.business_name} onChange={set('business_name')} />
              </div>
              <div className="field">
                <label htmlFor="kra">KRA PIN</label>
                <input id="kra" required placeholder="A123456789Z" maxLength={11} value={f.kra_pin} onChange={set('kra_pin')} style={{ textTransform: 'uppercase' }} />
              </div>
              <div className="field">
                <label htmlFor="addr">Yard address</label>
                <input id="addr" value={f.address} onChange={set('address')} />
              </div>
            </>
          )}
        </div>

        {dealer && <Notice>After signing up, our team reviews your KRA PIN. You can set up listings straight away, but can only send offers once approved.</Notice>}

        <button className="btn btn-primary btn-lg btn-block" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
        <p className="muted center">Already registered? <Link to="/login" state={loc.state} className="link">Log in</Link></p>
      </form>
    </div>
  )
}
