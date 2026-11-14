import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../AuthContext.jsx'
import { dealerListings, saveListing, setListingStatus, deleteListing, uploadListingImages, setPrimaryListingImage, deleteListingImage, mediaUrl } from '../../api.js'
import { MAKES, BODY_TYPES, FUELS, TRANSMISSIONS, COUNTIES, COLORS } from '../../mockData.js'
import CarPhoto from '../../components/CarPhoto.jsx'
import { hasDealerPhoto } from '../../vehiclePhotos.js'
import { Empty, Loading, Notice, PageHead, StatusBadge } from '../../components/ui.jsx'
import { cap, formatKES } from '../../utils.js'
import { DealerStatusNotice } from './Dashboard.jsx'

const blank = (county) => ({
  make: 'Toyota', model: '', year: 2018, price: '', mileage_km: '', fuel: 'petrol', transmission: 'automatic',
  body_type: 'suv', color: COLORS[0].hex, county: county || 'Nairobi', description: '', status: 'active',
})
const STATUSES = ['active', 'draft', 'hidden', 'sold']

function ListingForm({ initial, onSave, onCancel, busy, error, photoBusy, photoError, onUpload, onDeletePhoto, onPrimaryPhoto }) {
  const [f, setF] = useState(initial)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [previews, setPreviews] = useState([])
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const images = f.images || []
  const pickFiles = (event) => {
    const picked = Array.from(event.target.files || [])
    const combined = [...selectedFiles, ...picked].slice(0, Math.max(0, 10 - images.length))
    setSelectedFiles(combined)
    setPreviews(combined.map((file) => ({ name: file.name, url: URL.createObjectURL(file) })))
    event.target.value = ''
  }
  const removeSelected = (index) => {
    URL.revokeObjectURL(previews[index]?.url)
    const next = selectedFiles.filter((_, i) => i !== index)
    setSelectedFiles(next)
    setPreviews(next.map((file) => ({ name: file.name, url: URL.createObjectURL(file) })))
  }
  return (
    <form className="card form-card" onSubmit={async (e) => { e.preventDefault(); const saved = await onSave({ ...f, pendingImages: selectedFiles }); if (saved?.id) setF(saved) }}>
      <h2 className="h3" style={{ marginBottom: 16 }}>{f.id ? 'Edit listing' : 'Add a listing'}</h2>
      {error && <Notice tone="error">{error}</Notice>}
      <section className="photo-upload-section">
        <div className="photo-upload-heading"><div><h3>Vehicle photos</h3><p className="muted-sm">Add up to 10 real photos. The first photo becomes the cover.</p></div><span className="photo-count">{images.length + selectedFiles.length}/10</span></div>
        <label className="photo-dropzone">
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={pickFiles} disabled={images.length + selectedFiles.length >= 10} />
          <span className="photo-drop-icon">＋</span><strong>Choose photos from your device</strong><span className="muted-sm">JPG, PNG or WebP · up to 5 MB each · minimum 320 × 200 px</span>
        </label>
        {photoError && <Notice tone="error">{photoError}</Notice>}
        {(images.length > 0 || previews.length > 0) && <div className="photo-manager-grid">
          {images.map((photo) => <div className="photo-manager-item" key={photo.id}><img src={mediaUrl(photo.url)} alt="Vehicle" /><div className="photo-manager-actions">{photo.is_primary ? <span className="photo-primary-label">Cover photo</span> : <button type="button" className="link-btn" onClick={async () => { const updated = await onPrimaryPhoto(f.id, photo.id); if (updated) setF(updated) }}>Make cover</button>}<button type="button" className="link-btn danger" onClick={async () => { const updated = await onDeletePhoto(f.id, photo.id); if (updated) setF(updated) }}>Remove</button></div></div>)}
          {previews.map((photo, index) => <div className="photo-manager-item" key={`${photo.name}-${index}`}><img src={photo.url} alt={photo.name} /><div className="photo-manager-actions"><span className="muted-sm">New photo</span><button type="button" className="link-btn danger" onClick={() => removeSelected(index)}>Remove</button></div></div>)}
        </div>}
        {selectedFiles.length > 0 && <button type="button" className="btn btn-ghost" disabled={photoBusy || !f.id} onClick={async () => { const updated = await onUpload(f.id, selectedFiles); if (updated) { setF(updated); setSelectedFiles([]); previews.forEach((p) => URL.revokeObjectURL(p.url)); setPreviews([]) } }}>{photoBusy ? 'Uploading photos…' : `Upload ${selectedFiles.length} selected photo${selectedFiles.length > 1 ? 's' : ''}`}</button>}
        {!f.id && selectedFiles.length > 0 && <p className="muted-sm">Save the listing first, then upload the selected photos.</p>}
      </section>
      <div className="form-grid three">
        <div className="field"><label htmlFor="lf-make">Make</label>
          <select id="lf-make" value={f.make} onChange={set('make')}>{MAKES.map((m) => <option key={m}>{m}</option>)}</select></div>
        <div className="field"><label htmlFor="lf-model">Model</label>
          <input id="lf-model" required value={f.model} onChange={set('model')} placeholder="e.g. Harrier Premium" /></div>
        <div className="field"><label htmlFor="lf-year">Year</label>
          <input id="lf-year" type="number" required min="1990" max="2026" value={f.year} onChange={set('year')} /></div>
        <div className="field"><label htmlFor="lf-price">Price (KES)</label>
          <input id="lf-price" type="number" required min="50000" value={f.price} onChange={set('price')} /></div>
        <div className="field"><label htmlFor="lf-km">Mileage (km)</label>
          <input id="lf-km" type="number" min="0" value={f.mileage_km ?? ''} onChange={set('mileage_km')} /></div>
        <div className="field"><label htmlFor="lf-county">County</label>
          <select id="lf-county" value={f.county} onChange={set('county')}>{COUNTIES.map((c) => <option key={c}>{c}</option>)}</select></div>
        <div className="field"><label htmlFor="lf-fuel">Fuel</label>
          <select id="lf-fuel" value={f.fuel} onChange={set('fuel')}>{FUELS.map((x) => <option key={x} value={x}>{cap(x)}</option>)}</select></div>
        <div className="field"><label htmlFor="lf-tr">Transmission</label>
          <select id="lf-tr" value={f.transmission} onChange={set('transmission')}>{TRANSMISSIONS.map((x) => <option key={x} value={x}>{cap(x)}</option>)}</select></div>
        <div className="field"><label htmlFor="lf-body">Body type</label>
          <select id="lf-body" value={f.body_type} onChange={set('body_type')}>{BODY_TYPES.map((x) => <option key={x} value={x}>{cap(x)}</option>)}</select></div>
        <div className="field full"><label>Colour</label>
          <div className="swatches">
            {COLORS.map((c) => (
              <button type="button" key={c.hex} title={c.name} aria-label={c.name} aria-pressed={f.color === c.hex}
                className={f.color === c.hex ? 'on' : ''} style={{ background: c.hex }} onClick={() => setF({ ...f, color: c.hex })} />
            ))}
          </div></div>
        <div className="field full"><label htmlFor="lf-desc">Description</label>
          <textarea id="lf-desc" rows={3} value={f.description} onChange={set('description')} /></div>
        <div className="field"><label htmlFor="lf-status">Status</label>
          <select id="lf-status" value={f.status} onChange={set('status')}>{STATUSES.map((x) => <option key={x} value={x}>{cap(x)}</option>)}</select></div>
      </div>
      <div className="row-gap">
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save listing'}</button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}

export default function ManageListings() {
  const { user, refresh } = useAuth()
  const [rows, setRows] = useState(null)
  const [editing, setEditing] = useState(null) // listing object or {} for new
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [photoBusy, setPhotoBusy] = useState(false)
  const [photoError, setPhotoError] = useState('')

  const load = useCallback(async () => { await refresh(); const data = await dealerListings(user.id); setRows(data); return data }, [user.id, refresh])
  useEffect(() => { load() }, [load])

  const save = async (f) => {
    setBusy(true); setError('')
    try {
      const { pendingImages = [], ...listingData } = f
      const saved = await saveListing(user.id, listingData)
      if (pendingImages.length) {
        setEditing(saved)
        setMsg('Listing saved. Upload your selected photos below.')
      } else {
        setEditing(null)
        setMsg(f.id ? 'Listing updated.' : 'Listing added.')
      }
      await load()
      return saved
    } catch (e) { setError(e.message); return null }
    finally { setBusy(false) }
  }
  const uploadPhotos = async (id, files, done) => {
    setPhotoBusy(true); setPhotoError('')
    try { await uploadListingImages(id, files); done?.(); setMsg('Photos uploaded successfully.'); const updated = await load(); const listing = updated.find((r) => r.id === id); setEditing((current) => current?.id === id ? listing || current : current); return listing }
    catch (e) { setPhotoError(e.message); return null }
    finally { setPhotoBusy(false) }
  }
  const removePhoto = async (id, imageId) => {
    try { await deleteListingImage(id, imageId); setMsg('Photo removed.'); const updated = await load(); const listing = updated.find((r) => r.id === id); setEditing((current) => current?.id === id ? listing : current); return listing }
    catch (e) { setPhotoError(e.message); return null }
  }
  const makePrimary = async (id, imageId) => {
    try { await setPrimaryListingImage(id, imageId); const updated = await load(); const listing = updated.find((r) => r.id === id); setEditing((current) => current?.id === id ? listing : current); return listing }
    catch (e) { setPhotoError(e.message); return null }
  }
  const status = async (id, s) => { try { await setListingStatus(user.id, id, s); await load() } catch (e) { setMsg(e.message) } }
  const remove = async (id) => { if (window.confirm('Delete this listing?')) { await deleteListing(user.id, id); setMsg('Listing deleted.'); await load() } }

  if (!rows) return <Loading />
  return (
    <>
      <PageHead title="Manage listings" sub="Cars you list can be attached to your offers and shown in Browse.">
        {!editing && <button className="btn btn-green" onClick={() => { setMsg(''); setEditing(blank(user.dealer?.county)) }}>+ Add listing</button>}
      </PageHead>
      <div className="container page-body">
        <DealerStatusNotice dealer={user.dealer} />
        {msg && <Notice tone="success">{msg}</Notice>}

        {editing && <ListingForm initial={editing.id ? editing : blank(user.dealer?.county)} {...{ busy, error, photoBusy, photoError }} onUpload={uploadPhotos} onDeletePhoto={removePhoto} onPrimaryPhoto={makePrimary} onSave={save} onCancel={() => { setEditing(null); setError(''); setPhotoError('') }} />}

        {rows.length === 0 && !editing ? (
          <Empty title="No listings yet">Add your first car to get started.</Empty>
        ) : (
          <div className="listing-rows">
            {rows.map((l) => (
              <div className="listing-row card" key={l.id}>
                <div className="lr-art"><CarPhoto car={l} alt={`${l.make} ${l.model}`} />{!hasDealerPhoto(l) && <span className="lr-photo-hint">Add your photos</span>}</div>
                <div className="lr-main">
                  <strong>{l.year} {l.make} {l.model}</strong>
                  <div className="muted-sm">{formatKES(l.price)} · {l.county}</div>
                </div>
                <div className="lr-status">
                  <StatusBadge status={l.status} />
                  <select aria-label="Change status" value={l.status} onChange={(e) => status(l.id, e.target.value)}>
                    {STATUSES.map((s) => <option key={s} value={s}>{cap(s)}</option>)}
                  </select>
                </div>
                <div className="row-gap">
                  <button className="btn btn-ghost" onClick={() => { setMsg(''); setEditing(l); window.scrollTo(0, 0) }}>Edit</button>
                  <button className="link-btn danger" onClick={() => remove(l.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
