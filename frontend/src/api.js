// Real API client for the Flask backend (see /backend). Same function names and return shapes as the
// old localStorage mock, so the pages are unchanged. The signed-in user is identified by a JWT sent as
// a Bearer token; the first `userId` argument some functions still take is ignored (the server uses the token).
//
// Dev: vite proxies /api -> http://localhost:8000. For a separately hosted API set VITE_API_URL
// (e.g. VITE_API_URL=https://api.example.com) when building.
const API_ORIGIN = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
const BASE = API_ORIGIN + '/api'
export const mediaUrl = (path) => !path ? '' : (/^https?:\/\//i.test(path) ? path : API_ORIGIN + path)
const TOKEN_KEY = 'gariyangu_token'

const getToken = () => { try { return localStorage.getItem(TOKEN_KEY) } catch { return null } }
const setToken = (t) => { try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY) } catch { /* ignore */ } }

async function request(method, path, body) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const token = getToken()
  if (token) headers.Authorization = 'Bearer ' + token
  let res
  try {
    res = await fetch(BASE + path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined })
  } catch {
    throw new Error('Cannot reach the server. Is the backend running on port 8000?')
  }
  let data = null
  try { data = await res.json() } catch { /* empty / non-JSON body */ }
  if (!res.ok) {
    if (res.status === 401 && token && !path.startsWith('/auth/login')) setToken(null) // expired session
    const err = new Error(data?.error || `Request failed (${res.status})`)
    err.status = res.status
    throw err
  }
  return data
}
const get = (p) => request('GET', p)
async function uploadRequest(path, formData) {
  const headers = {}
  const token = getToken()
  if (token) headers.Authorization = 'Bearer ' + token
  let res
  try { res = await fetch(BASE + path, { method: 'POST', headers, body: formData }) }
  catch { throw new Error('Cannot reach the server. Is the backend running on port 8000?') }
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error || `Upload failed (${res.status})`)
  return data
}
const post = (p, b = {}) => request('POST', p, b)

/* ---------------- auth ---------------- */
export async function login(email, password) {
  const { token, user } = await post('/auth/login', { email, password })
  setToken(token)
  return user
}
export async function register(data) {
  const { token, user } = await post('/auth/register', data)
  setToken(token)
  return user
}
export const logout = () => setToken(null)
export const getUser = () => get('/auth/me')

/* ---------------- cars ---------------- */
export const listCars = () => get('/cars')
export async function getCar(id) {
  try { return await get(`/cars/${id}`) } catch (e) { if (e.status === 404) return null; throw e }
}

/* ---------------- buyer: requests & offers ---------------- */
export const createRequest = (_buyerId, f) => post('/requests', f)
export const myRequests = () => get('/requests/mine')
export const closeRequest = (_buyerId, requestId) => post(`/requests/${requestId}/close`)
export const acceptOffer = (_buyerId, offerId) => post(`/offers/${offerId}/accept`)
export const declineOffer = (_buyerId, offerId) => post(`/offers/${offerId}/decline`)
export const addReview = (_buyerId, offerId, rating, comment) => post(`/offers/${offerId}/review`, { rating, comment })

/* ---------------- dealer ---------------- */
export const openRequests = () => get('/dealer/requests')
export const submitOffer = (_dealerId, data) => post('/dealer/offers', data)
export const withdrawOffer = (_dealerId, offerId) => post(`/dealer/offers/${offerId}/withdraw`)
export const dealerOffers = () => get('/dealer/offers')
export const dealerStats = () => get('/dealer/stats')
export const dealerListings = () => get('/dealer/listings')
export const saveListing = (_ownerId, data) =>
  data.id ? request('PUT', `/dealer/listings/${data.id}`, data) : post('/dealer/listings', data)
export const setListingStatus = (_ownerId, id, status) => post(`/dealer/listings/${id}/status`, { status })
export const deleteListing = (_ownerId, id) => request('DELETE', `/dealer/listings/${id}`)
export const uploadListingImages = (listingId, files) => {
  const form = new FormData()
  files.forEach((file) => form.append('images', file))
  return uploadRequest(`/dealer/listings/${listingId}/images`, form)
}
export const setPrimaryListingImage = (listingId, imageId) => post(`/dealer/listings/${listingId}/images/${imageId}/primary`)
export const deleteListingImage = (listingId, imageId) => request('DELETE', `/dealer/listings/${listingId}/images/${imageId}`)

/* ---------------- admin ---------------- */
export const allDealers = () => get('/admin/dealers')
export const reviewDealer = (userId, decision, reason = '') => post(`/admin/dealers/${userId}/review`, { decision, reason })
