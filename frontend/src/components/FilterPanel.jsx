import { MAKES, BODY_TYPES, FUELS, TRANSMISSIONS, COUNTIES } from '../mockData.js'
import { formatKES, cap } from '../utils.js'

export const DEFAULT_FILTERS = {
  make: '', body: '', fuel: '', transmission: '', county: '', maxPrice: 8000000, minYear: 2010,
}

export default function FilterPanel({ filters, onChange, onReset, className = '' }) {
  const set = (k, v) => onChange({ ...filters, [k]: v })
  const toggle = (k, v) => set(k, filters[k] === v ? '' : v)

  return (
    <aside className={`filters ${className}`}>
      <h3>
        Filters
        <button className="link-btn" onClick={onReset}>Reset</button>
      </h3>

      <div className="field">
        <label htmlFor="f-make">Make</label>
        <select id="f-make" value={filters.make} onChange={(e) => set('make', e.target.value)}>
          <option value="">All makes</option>
          {MAKES.map((m) => <option key={m}>{m}</option>)}
        </select>
      </div>

      <div className="field">
        <label>Body type</label>
        <div className="pill-row">
          {BODY_TYPES.map((b) => (
            <button key={b} className={`pill ${filters.body === b ? 'on' : ''}`} onClick={() => toggle('body', b)}>{cap(b)}</button>
          ))}
        </div>
      </div>

      <div className="field">
        <label htmlFor="f-price">Max price · <span className="range-val">{formatKES(filters.maxPrice)}</span></label>
        <input id="f-price" type="range" min="500000" max="8000000" step="100000" value={filters.maxPrice} onChange={(e) => set('maxPrice', Number(e.target.value))} />
      </div>

      <div className="field">
        <label htmlFor="f-year">Year from · <span className="range-val">{filters.minYear}</span></label>
        <input id="f-year" type="range" min="2010" max="2022" step="1" value={filters.minYear} onChange={(e) => set('minYear', Number(e.target.value))} />
      </div>

      <div className="field">
        <label>Fuel</label>
        <div className="pill-row">
          {FUELS.map((f) => (
            <button key={f} className={`pill ${filters.fuel === f ? 'on' : ''}`} onClick={() => toggle('fuel', f)}>{cap(f)}</button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>Transmission</label>
        <div className="pill-row">
          {TRANSMISSIONS.map((t) => (
            <button key={t} className={`pill ${filters.transmission === t ? 'on' : ''}`} onClick={() => toggle('transmission', t)}>{cap(t)}</button>
          ))}
        </div>
      </div>

      <div className="field">
        <label htmlFor="f-county">County</label>
        <select id="f-county" value={filters.county} onChange={(e) => set('county', e.target.value)}>
          <option value="">All counties</option>
          {COUNTIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
    </aside>
  )
}
