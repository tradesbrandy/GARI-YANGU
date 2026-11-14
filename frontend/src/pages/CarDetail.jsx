import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import CarPhoto from '../components/CarPhoto.jsx'
import { hasDealerPhoto } from '../vehiclePhotos.js'
import { mediaUrl } from '../api.js'
import CarCard from '../components/CarCard.jsx'
import { Loading, Stars, Empty } from '../components/ui.jsx'
import { getCar, listCars } from '../api.js'
import { formatKES, formatKm, cap, monthlyEstimate } from '../utils.js'

export default function CarDetail() {
  const { id } = useParams()
  const [car, setCar] = useState(undefined)
  const [similar, setSimilar] = useState([])
  const [showPhone, setShowPhone] = useState(false)
  const [activePhoto, setActivePhoto] = useState(0)

  useEffect(() => {
    setCar(undefined); setShowPhone(false); setActivePhoto(0)
    Promise.all([getCar(id), listCars()]).then(([c, all]) => {
      setCar(c)
      if (c) setSimilar(all.filter((x) => x.id !== c.id && (x.body_type === c.body_type || x.make === c.make)).slice(0, 3))
    })
  }, [id])

  if (car === undefined) return <Loading />
  if (!car) return <div className="container" style={{ padding: '60px 20px' }}><Empty title="Car not found" to="/browse" cta="Browse cars">It may have been sold or removed by the dealer.</Empty></div>

  const title = `${car.year} ${car.make} ${car.model}`
  const d = car.dealer_info
  const reqQuery = new URLSearchParams({ make: car.make, model: car.model.split(' ')[0], budget: String(car.price), county: car.county, body: car.body_type }).toString()
  const specs = [
    ['Year', car.year], ['Mileage', formatKm(car.mileage_km)], ['Fuel', cap(car.fuel)], ['Transmission', cap(car.transmission)],
    ['Body type', cap(car.body_type)], ['Location', car.county],
  ]

  return (
    <div className="container detail">
      <nav className="crumbs" aria-label="Breadcrumb"><Link to="/browse">Browse cars</Link> / <span>{title}</span></nav>
      <div className="detail-grid">
        <div>
          <div className="detail-gallery">
            <div className="detail-media">
              {car.verified && <span className="car-tag green">✔ Verified dealer</span>}
              {car.images?.length ? <img className="detail-photo" src={mediaUrl(car.images[activePhoto]?.url || car.image_url)} alt={`${title} photo ${activePhoto + 1}`} /> : <CarPhoto car={car} className="detail-photo" alt={title} />}
              {!hasDealerPhoto(car) && <span className="detail-photo-note">Representative photo · actual vehicle photos not yet supplied by seller</span>}
            </div>
            {car.images?.length > 1 && <div className="detail-thumbnails">{car.images.map((photo, index) => <button type="button" key={photo.id} className={`detail-thumb ${activePhoto === index ? 'active' : ''}`} onClick={() => setActivePhoto(index)} aria-label={`Show photo ${index + 1}`}><img src={mediaUrl(photo.url)} alt="" /></button>)}</div>}
          </div>
          <h1 className="detail-title">{title}</h1>
          <div className="spec-grid">
            {specs.map(([k, v]) => <div className="spec" key={k}><span>{k}</span><strong>{v}</strong></div>)}
          </div>
          <h2 className="h3">About this car</h2>
          <p className="muted" style={{ marginTop: 8 }}>{car.description || 'No description provided.'}</p>
        </div>

        <aside className="buy-card">
          <div className="car-price">{formatKES(car.price)}</div>
          <div className="car-monthly">from ~{formatKES(monthlyEstimate(car.price))}/month*</div>
          <Link to={`/post-request?${reqQuery}`} className="btn btn-green btn-lg btn-block" style={{ marginTop: 18 }}>Get offers on cars like this</Link>
          <p className="muted-sm" style={{ marginTop: 8 }}>Let dealers compete — you may find a lower price.</p>

          <div className="dealer-box">
            <div className="dealer-name">{d.name} {d.verified && <span className="verified-chip">✔ Verified</span>}</div>
            <Stars value={d.rating} count={d.review_count} />
            <div className="muted-sm">📍 {d.county}</div>
            {showPhone
              ? <a className="btn btn-primary btn-block" href={`tel:${d.phone.replace(/\s/g, '')}`}>📞 {d.phone}</a>
              : <button className="btn btn-ghost btn-block" onClick={() => setShowPhone(true)}>Show phone number</button>}
          </div>
          <p className="muted-sm" style={{ marginTop: 14 }}>*Illustrative: 20% deposit, 60 months at 14% p.a.</p>
        </aside>
      </div>

      {similar.length > 0 && (
        <section style={{ marginTop: 56 }}>
          <h2 className="h3" style={{ marginBottom: 18 }}>Similar cars</h2>
          <div className="cars-grid">{similar.map((c) => <CarCard key={c.id} car={c} />)}</div>
        </section>
      )}
    </div>
  )
}
