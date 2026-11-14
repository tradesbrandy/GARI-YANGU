import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext.jsx'

export function Logo({ to = '/' }) {
  return (
    <Link to={to} className="logo" aria-label="Gari Yangu home">
      <span className="logo-mark">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 15l2-5a2 2 0 012-1.4h10A2 2 0 0119 10l2 5v3H3z" />
          <circle cx="7.5" cy="17.5" r="1.2" fill="#fff" />
          <circle cx="16.5" cy="17.5" r="1.2" fill="#fff" />
        </svg>
      </span>
      <span>GARI <b>YANGU</b><small className="brand-kicker">DRIVE YOUR WAY</small></span>
    </Link>
  )
}

function links(role) {
  if (role === 'dealer') return [['/dealer', 'Dashboard', true], ['/dealer/requests', 'Open requests'], ['/dealer/listings', 'My listings'], ['/browse', 'Browse cars']]
  if (role === 'admin') return [['/admin/dealers', 'Verify dealers'], ['/browse', 'Browse cars']]
  if (role === 'buyer') return [['/browse', 'Browse cars'], ['/post-request', 'Get offers'], ['/my-offers', 'My offers']]
  return [['/browse', 'Browse cars'], ['/post-request', 'Get offers'], ['/#how-it-works', 'How it works', false, true], ['/register', 'For dealers']]
}

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const close = () => setOpen(false)

  return (
    <header className={`nav ${open ? 'open' : ''}`}>
      <div className="container nav-inner">
        <Logo />
        <nav className="nav-links" onClick={close}>
          {links(user?.role).map(([to, label, end, plain]) =>
            plain ? <a key={to} href={to}>{label}</a> : <NavLink key={to} to={to} end={end}>{label}</NavLink>
          )}
        </nav>
        <div className="nav-cta" onClick={close}>
          {user ? (
            <>
              <span className="nav-user">{user.full_name} · {user.role}</span>
              <button className="btn btn-ghost" onClick={() => { logout(); nav('/') }}>Log out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">Log in</Link>
              <Link to="/register" className="btn btn-primary">Sign up</Link>
            </>
          )}
        </div>
        <button className="nav-toggle" aria-label="Menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>
    </header>
  )
}
