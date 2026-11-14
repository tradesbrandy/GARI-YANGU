import { Link } from 'react-router-dom'
import CarPhoto from './CarPhoto.jsx'
import { hasDealerPhoto } from '../vehiclePhotos.js'
import { formatKES, formatKm, cap, monthlyEstimate } from '../utils.js'

export default function CarCard({ car }) {
  return (
    <Link to={`/cars/${car.id}`} className="car-card">
      <div className="car-media">
        {car.verified && <span className="car-tag green">✔ Verified dealer</span>}
        <CarPhoto car={car} className="car-photo" />
        {!hasDealerPhoto(car) && <span className="photo-source-note">Representative photo</span>}
      </div>
      <div className="car-body">
        <h3 className="car-title">{car.year} {car.make} {car.model}</h3>
        <div className="car-meta">
          <span>{formatKm(car.mileage_km)}</span>
          <span>{cap(car.fuel)}</span>
          <span>{cap(car.transmission)}</span>
        </div>
        <div>
          <div className="car-price">{formatKES(car.price)}</div>
          <div className="car-monthly">from ~{formatKES(monthlyEstimate(car.price))}/month*</div>
        </div>
        <div className="car-foot">
          <strong>{car.dealer}</strong>
          <span>📍 {car.county}</span>
        </div>
      </div>
    </Link>
  )
}
