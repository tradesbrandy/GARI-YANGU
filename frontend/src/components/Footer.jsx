import { Link } from 'react-router-dom'
import { Logo } from './Navbar.jsx'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Logo />
            <p style={{ maxWidth: 300 }}>Tell us the car you want. Verified Kenyan dealers compete to give you their best price.</p>
          </div>
          <div>
            <h4>Buyers</h4>
            <ul>
              <li><Link to="/post-request">Get offers</Link></li>
              <li><Link to="/browse">Browse cars</Link></li>
              <li><Link to="/my-offers">My offers</Link></li>
            </ul>
          </div>
          <div>
            <h4>Dealers</h4>
            <ul>
              <li><Link to="/register">Become a dealer</Link></li>
              <li><Link to="/dealer">Dashboard</Link></li>
              <li><Link to="/dealer/requests">Open requests</Link></li>
            </ul>
          </div>
          <div>
            <h4>Company</h4>
            <ul>
              <li><a href="/#how-it-works">How it works</a></li>
              <li><a href="/#faq">FAQ</a></li>
              <li><a href="mailto:hello@gariyangu.co.ke">Contact</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Gari Yangu. Demo project.</span>
          <span>Made in Kenya 🇰🇪</span>
        </div>
      </div>
    </footer>
  )
}
