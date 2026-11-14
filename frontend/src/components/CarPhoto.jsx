import { useEffect, useState } from 'react'
import { BODY_TYPE_PHOTOS, getCarPhoto } from '../vehiclePhotos.js'

export default function CarPhoto({ car, className = '', alt, loading = 'lazy' }) {
  const source = getCarPhoto(car)
  const fallback = BODY_TYPE_PHOTOS[car?.body_type] || BODY_TYPE_PHOTOS.suv
  const [src, setSrc] = useState(source)

  useEffect(() => setSrc(source), [source])

  return (
    <img
      className={className}
      src={src}
      alt={alt || `${car?.year || ''} ${car?.make || ''} ${car?.model || 'vehicle'}`.trim()}
      loading={loading}
      onError={() => { if (src !== fallback) setSrc(fallback) }}
    />
  )
}
