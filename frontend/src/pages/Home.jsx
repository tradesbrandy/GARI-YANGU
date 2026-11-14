import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BODY_TYPE_PHOTOS, HERO_CAR_PHOTO } from '../vehiclePhotos.js'
import CarCard from '../components/CarCard.jsx'
import { listCars } from '../api.js'
import { MAKES, COUNTIES, BODY_TYPES, REVIEWS, FAQS } from '../mockData.js'
import { cap } from '../utils.js'

const Tick = () => (
  <span className="tick">
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-10" /></svg>
  </span>
)

const BUDGETS = [1000000, 1500000, 2000000, 3000000, 4000000, 6000000]

function SearchCard() {
  const nav = useNavigate()
  const [make, setMake] = useState('')
  const [budget, setBudget] = useState('')
  const [county, setCounty] = useState('')

  const submit = (e) => {
    e.preventDefault()
    const q = new URLSearchParams()
    if (make) q.set('make', make)
    if (budget) q.set('budget', budget)
    if (county) q.set('county', county)
    nav(`/post-request?${q.toString()}`)
  }

  return (
    <form className="search-card" onSubmit={submit}>
      <h3>Find the car that moves you</h3>
      <div className="search-row">
        <div className="field">
          <label htmlFor="h-make">Make</label>
          <select id="h-make" value={make} onChange={(e) => setMake(e.target.value)}>
            <option value="">Any make</option>
            {MAKES.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="h-budget">Max budget</label>
          <select id="h-budget" value={budget} onChange={(e) => setBudget(e.target.value)}>
            <option value="">Any budget</option>
            {BUDGETS.map((b) => <option key={b} value={b}>Up to KES {b.toLocaleString('en-KE')}</option>)}
          </select>
        </div>
        <div className="field" style={{ gridColumn: '1 / -1' }}>
          <label htmlFor="h-county">Your county</label>
          <select id="h-county" value={county} onChange={(e) => setCounty(e.target.value)}>
            <option value="">Select county</option>
            {COUNTIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <button className="btn btn-green btn-lg btn-block" type="submit">Find my next car  ↗</button>
    </form>
  )
}

export default function Home() {
  const [cars, setCars] = useState([])
  useEffect(() => { listCars().then((c) => setCars(c.slice(0, 6))) }, [])

  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <h1>Your next ride. <em>Your rules.</em></h1>
            <p className="hero-sub">Discover exceptional cars, connect with verified Kenyan dealers, and let the best offer come to you. The smarter way to find your next drive starts here.</p>
            <SearchCard />
            <div className="hero-checks">
              <span><Tick /> Free for buyers</span>
              <span><Tick /> KRA-verified dealers</span>
              <span><Tick /> No yard-hopping</span>
            </div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="glow" />
            <img className="hero-vehicle-photo" src={HERO_CAR_PHOTO} alt="Premium sports car photographed outdoors" loading="eager" />
            <div className="hero-badge b1">
              <span className="tick"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4"><path d="M5 12l5 5 9-10" /></svg></span>
              <div>Offer received<small>Toyota Harrier · KES 3.52M</small></div>
            </div>
            <div className="hero-badge b2">
              <span style={{ fontSize: 22 }}>💰</span>
              <div>You saved<small>KES 130,000 vs. listing</small></div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="trust">
        <div className="container trust-grid">
          {[
            ['🛡️', 'Verified dealers', 'KRA PIN checked'],
            ['💸', 'Best price', 'Dealers compete'],
            ['⏱️', 'Save time', 'Offers come to you'],
            ['🆓', '100% free', 'For every buyer'],
          ].map(([ico, t, s]) => (
            <div className="trust-item" key={t}>
              <div className="trust-ico" style={{ fontSize: 22 }}>{ico}</div>
              <div><strong>{t}</strong><span>{s}</span></div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section alt" id="how-it-works">
        <div className="container">
          <div className="section-head center">
            <div className="eyebrow">How it works</div>
            <h2>Big move. Three simple steps.</h2>
            <p>No more calling around. Post once, compare everything in one place.</p>
          </div>
          <div className="steps">
            {[
              ['Tell us what you want', 'Pick the make, budget, year and county. It takes about two minutes.'],
              ['Receive dealer offers', 'Verified dealers near you send their best price, often with a car from their stock.'],
              ['Pick the best one', 'Compare offers side by side, accept the winner and arrange your viewing.'],
            ].map(([t, d], i) => (
              <div className="step" key={t}>
                <div className="step-num">{i + 1}</div>
                <h3>{t}</h3>
                <p>{d}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 34 }}>
            <Link to="/post-request" className="btn btn-primary btn-lg">Start your request</Link>
          </div>
        </div>
      </section>

      {/* BODY TYPES */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <div className="eyebrow">Browse</div>
            <h2>Find your type of car</h2>
          </div>
          <div className="chips">
            {BODY_TYPES.map((b) => (
              <Link to={`/browse?body=${b}`} className="chip-card" key={b}>
                <img className="body-type-photo" src={BODY_TYPE_PHOTOS[b] || BODY_TYPE_PHOTOS.suv} alt="" loading="lazy" />
                <span>{cap(b)}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED */}
      <section className="section alt">
        <div className="container">
          <div className="section-head" style={{ maxWidth: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 20, flexWrap: 'wrap' }}>
            <div>
              <div className="eyebrow">Featured</div>
              <h2>Machines worth a closer look.</h2>
            </div>
            <Link to="/browse" className="btn btn-ghost">View all cars</Link>
          </div>
          <div className="cars-grid">
            {cars.map((c) => <CarCard key={c.id} car={c} />)}
          </div>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 18 }}>*Illustrative estimate: 20% deposit, 60 months at 14% p.a. Actual finance terms vary by lender.</p>
        </div>
      </section>

      {/* DEALER CTA */}
      <section className="section">
        <div className="container">
          <div className="cta-band">
            <div>
              <h2>Are you a car dealer?</h2>
              <p>Get in front of buyers who already know what they want. Browse open requests in your county and send offers — no ads, no tyre-kickers.</p>
              <div className="row">
                <Link to="/register" className="btn btn-light btn-lg">Become a dealer</Link>
                <Link to="/dealer/requests" className="btn btn-lg" style={{ color: '#fff', borderColor: '#ffffff66' }}>See open requests</Link>
              </div>
            </div>
            <div className="cta-stats">
              <div className="cta-stat"><b>47</b><span>counties covered</span></div>
              <div className="cta-stat"><b>0</b><span>listing fees (demo)</span></div>
              <div className="cta-stat"><b>1</b><span>offer per request</span></div>
              <div className="cta-stat"><b>✔</b><span>KRA-verified badge</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="section alt">
        <div className="container">
          <div className="section-head center">
            <div className="eyebrow">Buyer stories</div>
            <h2>Buyers love getting offers</h2>
            <p>Sample reviews for the demo.</p>
          </div>
          <div className="reviews">
            {REVIEWS.map((r) => (
              <div className="review" key={r.name}>
                <div className="stars" aria-label={`${r.rating} out of 5`}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                <p>“{r.text}”</p>
                <footer>{r.name} <span>· {r.county}</span></footer>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section" id="faq">
        <div className="container">
          <div className="section-head center">
            <div className="eyebrow">FAQ</div>
            <h2>Good questions</h2>
          </div>
          <div className="faq">
            {FAQS.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
