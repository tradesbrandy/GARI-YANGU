import { useState } from 'react'
import { StatusBadge, Stars, Badge } from './ui.jsx'
import { formatKES, formatKm, timeAgo } from '../utils.js'

// One dealer offer, as the buyer sees it.
export default function OfferCard({ offer, best, canAct, busy, onAccept, onDecline, onReview }) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const d = offer.dealer

  return (
    <div className={`offer ${offer.status === 'accepted' ? 'accepted' : ''}`}>
      <div className="offer-top">
        <div>
          <div className="dealer-name">
            {d.name} {d.verified && <span className="verified-chip">✔ Verified</span>}
          </div>
          <Stars value={d.rating} count={d.review_count} />
          <div className="muted-sm">📍 {d.county} · {timeAgo(offer.created_at)}</div>
        </div>
        <div className="offer-price">
          {best && <Badge tone="green">Best price</Badge>}
          <strong>{formatKES(offer.price)}</strong>
          <StatusBadge status={offer.status} />
        </div>
      </div>

      {offer.listing && (
        <div className="offer-car">🚗 {offer.listing.title} · {formatKm(offer.listing.mileage_km)}</div>
      )}
      {offer.message && <p className="offer-msg">“{offer.message}”</p>}

      {canAct && offer.status === 'pending' && (
        <div className="row-gap">
          <button className="btn btn-green" disabled={busy} onClick={() => onAccept(offer.id)}>Accept offer</button>
          <button className="btn btn-ghost" disabled={busy} onClick={() => onDecline(offer.id)}>Decline</button>
        </div>
      )}

      {offer.status === 'accepted' && (
        <div className="accepted-box">
          <strong>🎉 Offer accepted.</strong> Call {d.name} to arrange a viewing:{' '}
          {d.phone ? <a className="link" href={`tel:${d.phone.replace(/\s/g, '')}`}>{d.phone}</a> : '—'}
          {!offer.reviewed ? (
            <form className="review-form" onSubmit={(e) => { e.preventDefault(); onReview(offer.id, rating, comment) }}>
              <span className="muted-sm">Rate this dealer:</span>
              <div className="star-input" role="radiogroup" aria-label="Rating">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button type="button" key={n} role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? 's' : ''}`} className={n <= rating ? 'on' : ''} onClick={() => setRating(n)}>★</button>
                ))}
              </div>
              <input placeholder="Add a comment (optional)" value={comment} onChange={(e) => setComment(e.target.value)} />
              <button className="btn btn-primary" disabled={busy}>Submit review</button>
            </form>
          ) : <div className="muted-sm" style={{ marginTop: 8 }}>Thanks — you've reviewed this dealer.</div>}
        </div>
      )}
    </div>
  )
}
