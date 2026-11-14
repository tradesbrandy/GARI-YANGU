import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth, homeFor } from '../AuthContext.jsx'
import { Notice } from '../components/ui.jsx'

const DEMOS = [
  ['Buyer', 'buyer@demo.com'],
  ['Dealer', 'dealer@demo.com'],
  ['Admin', 'admin@demo.com'],
]

export default function Login() {
  const { login } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setBusy(true)
    try {
      const u = await login(email, password)
      nav(loc.state?.from || homeFor(u), { replace: true })
    } catch (err) {
      setError(err.message); setBusy(false)
    }
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <h1>Welcome back</h1>
        <p className="muted">Log in to see your offers or manage your dealership.</p>
        {error && <Notice tone="error">{error}</Notice>}
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button className="btn btn-primary btn-lg btn-block" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
        <p className="muted center">New here? <Link to="/register" state={loc.state} className="link">Create an account</Link></p>
        <div className="demo-box">
          <strong>Demo accounts</strong> <span className="muted-sm">(password: demo1234)</span>
          <div className="pill-row" style={{ marginTop: 8 }}>
            {DEMOS.map(([label, em]) => (
              <button type="button" key={em} className="pill" onClick={() => { setEmail(em); setPassword('demo1234') }}>{label}</button>
            ))}
          </div>
        </div>
      </form>
    </div>
  )
}
