import { mediaUrl } from './api.js'

// Real photographic images used only as representative demo imagery when a dealer
// has not uploaded photos for that exact vehicle. Dealer-uploaded photos always win.
export const BODY_TYPE_PHOTOS = {
  suv: 'https://images.unsplash.com/photo-1678900180940-121aa913c35a?auto=format&fit=crop&w=1000&q=82',
  sedan: 'https://images.unsplash.com/photo-1658662160331-62f7e52e63de?auto=format&fit=crop&w=1000&q=82',
  hatchback: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1000&q=82',
  pickup: 'https://images.unsplash.com/photo-1630265928002-f77575fb279e?auto=format&fit=crop&w=1000&q=82',
  van: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1000&q=82',
  wagon: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1000&q=82',
  coupe: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1000&q=82',
}

// Exact-model examples where a suitable public photo is available. All other
// cars use a body-type representative photo until their seller uploads originals.
const MODEL_PHOTOS = [
  { match: /land cruiser prado/i, url: 'https://upload.wikimedia.org/wikipedia/commons/6/65/Toyota_Land_Cruiser_Prado_Front.JPG' },
  { match: /cx-?5/i, url: 'https://images.unsplash.com/photo-1643142311296-304953706775?auto=format&fit=crop&w=1200&q=82' },
]

export function hasDealerPhoto(car) {
  return Boolean(car?.image_url || car?.images?.length)
}

export function getCarPhoto(car) {
  const uploaded = car?.images?.find((image) => image.is_primary)?.url || car?.images?.[0]?.url || car?.image_url
  if (uploaded) return mediaUrl(uploaded)

  const model = `${car?.make || ''} ${car?.model || ''}`
  const exact = MODEL_PHOTOS.find((entry) => entry.match.test(model))
  return exact?.url || BODY_TYPE_PHOTOS[car?.body_type] || BODY_TYPE_PHOTOS.suv
}

export const HERO_CAR_PHOTO = 'https://images.unsplash.com/photo-1678900180940-121aa913c35a?auto=format&fit=crop&w=1400&q=88'
