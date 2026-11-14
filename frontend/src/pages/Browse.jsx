import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import CarCard from '../components/CarCard.jsx'
import FilterPanel, { DEFAULT_FILTERS } from '../components/FilterPanel.jsx'
import { listCars } from '../api.js'

const SORTS = {
  newest: { label: 'Newest first', fn: (a, b) => b.year - a.year },
  priceAsc: { label: 'Price: low to high', fn: (a, b) => a.price - b.price },
  priceDesc: { label: 'Price: high to low', fn: (a, b) => b.price - a.price },
  mileage: { label: 'Lowest mileage', fn: (a, b) => a.mileage_km - b.mileage_km },
}

export default function Browse() {
  const [params] = useSearchParams()
  const [cars, setCars] = useState([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState('newest')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    ...DEFAULT_FILTERS,
    make: params.get('make') || '',
    body: params.get('body') || '',
    county: params.get('county') || '',
  })

  useEffect(() => { listCars().then((c) => { setCars(c); setLoading(false) }) }, [])

  const results = useMemo(() => {
    return cars
      .filter((c) =>
        (!filters.make || c.make === filters.make) &&
        (!filters.body || c.body_type === filters.body) &&
        (!filters.fuel || c.fuel === filters.fuel) &&
        (!filters.transmission || c.transmission === filters.transmission) &&
        (!filters.county || c.county === filters.county) &&
        c.price <= filters.maxPrice &&
        c.year >= filters.minYear)
      .sort(SORTS[sort].fn)
  }, [cars, filters, sort])

  return (
    <>
      <section className="page-head">
        <div className="container">
          <h1>Browse cars</h1>
          <p>Cars listed by verified dealers across Kenya.</p>
        </div>
      </section>
      <div className="container browse">
        <FilterPanel filters={filters} onChange={setFilters} onReset={() => setFilters(DEFAULT_FILTERS)} className={showFilters ? 'open' : ''} />
        <div>
          <div className="results-bar">
            <strong>{loading ? 'Loading…' : `${results.length} car${results.length === 1 ? '' : 's'}`}</strong>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button className="btn btn-ghost filter-open" onClick={() => setShowFilters((s) => !s)}>
                {showFilters ? 'Hide filters' : 'Filters'}
              </button>
              <div className="field">
                <label htmlFor="sort">Sort</label>
                <select id="sort" value={sort} onChange={(e) => setSort(e.target.value)}>
                  {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
            </div>
          </div>
          {!loading && results.length === 0 ? (
            <div className="empty">
              <h3>No cars match your filters</h3>
              <p>Try widening your budget or clearing a filter — or post a request and let dealers come to you.</p>
            </div>
          ) : (
            <div className="cars-grid">
              {results.map((c) => <CarCard key={c.id} car={c} />)}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
