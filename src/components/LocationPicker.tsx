import { useState, useEffect, useRef, useCallback } from 'react'

/* ── Types ── */
interface LocationEntry {
  n: string  // name
  t: string  // type: N=Neighbourhood, C=Cluster, B=Building, E=Emirate
  h: string  // hierarchy path e.g. "Dubai>Emirates Living>The Meadows>Meadows 7"
}

export interface LocationValue {
  name: string
  hierarchy: string
  type: string
}

export interface LocationPickerProps {
  value: LocationValue | null
  onChange: (loc: LocationValue | null) => void
  required?: boolean
  /** Filter to only show certain types. e.g. ['N','C'] for communities only */
  filterTypes?: string[]
  placeholder?: string
}

/* ── Singleton data cache ── */
let _cache: LocationEntry[] | null = null
let _loading = false
const _listeners: Array<() => void> = []

function loadLocations(): Promise<LocationEntry[]> {
  if (_cache) return Promise.resolve(_cache)
  if (_loading) {
    return new Promise(resolve => {
      _listeners.push(() => resolve(_cache!))
    })
  }
  _loading = true
  return fetch('/locations.json')
    .then(r => {
      if (!r.ok) throw new Error(`Failed to load locations: ${r.status}`)
      return r.json()
    })
    .then(data => {
      if (!Array.isArray(data)) throw new Error('locations.json is not an array')
      _cache = data.filter((d: LocationEntry) => d && d.n && d.h)
      _listeners.forEach(fn => fn())
      _listeners.length = 0
      return _cache!
    })
    .catch(err => {
      console.error('Failed to load locations:', err)
      _loading = false
      _cache = []
      _listeners.forEach(fn => fn())
      _listeners.length = 0
      return []
    })
}

/* ── Type label map ── */
const TYPE_LABELS: Record<string, string> = {
  E: 'Emirate',
  N: 'Community',
  C: 'Sub-community',
  B: 'Building',
}

/* ── Fuzzy search ── */
function search(
  entries: LocationEntry[],
  query: string,
  filterTypes?: string[],
  maxResults = 8
): LocationEntry[] {
  const q = query.toLowerCase().trim()
  if (!q) return []

  const filtered = filterTypes
    ? entries.filter(e => filterTypes.includes(e.t))
    : entries

  const exact: LocationEntry[] = []
  const startsWith: LocationEntry[] = []
  const contains: LocationEntry[] = []
  const hierarchyMatch: LocationEntry[] = []
  const seen = new Set<string>()

  for (const entry of filtered) {
    const key = entry.h
    if (seen.has(key)) continue

    const name = entry.n.toLowerCase()
    const hier = entry.h.toLowerCase()

    if (name === q) {
      exact.push(entry)
      seen.add(key)
    } else if (name.startsWith(q)) {
      startsWith.push(entry)
      seen.add(key)
    } else if (name.includes(q)) {
      contains.push(entry)
      seen.add(key)
    } else if (hier.includes(q)) {
      hierarchyMatch.push(entry)
      seen.add(key)
    }

    if (exact.length + startsWith.length + contains.length + hierarchyMatch.length >= maxResults * 3) break
  }

  return [...exact, ...startsWith, ...contains, ...hierarchyMatch].slice(0, maxResults)
}

/* ── Breadcrumb display from hierarchy ── */
function formatHierarchy(h: string): string {
  return h.split('>').join(' › ')
}

function parentHierarchy(h: string): string {
  const parts = h.split('>')
  return parts.slice(0, -1).join(' › ')
}

/* ── Component ── */
export default function LocationPicker({
  value,
  onChange,
  required,
  filterTypes,
  placeholder = 'Start typing community, area, or tower…',
}: LocationPickerProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<LocationEntry[]>([])
  const [open, setOpen] = useState(false)
  const [entries, setEntries] = useState<LocationEntry[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [highlightIdx, setHighlightIdx] = useState(0)
  const [customMode, setCustomMode] = useState(false)
  const [customName, setCustomName] = useState('')

  const inputRef = useRef<HTMLInputElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)
  const customRef = useRef<HTMLInputElement>(null)

  /* Load data once */
  useEffect(() => {
    setLoading(true)
    loadLocations().then(data => {
      setEntries(data)
      setLoading(false)
    })
  }, [])

  /* Search on query change — debounced to prevent crash on fast typing */
  useEffect(() => {
    if (!entries || query.length < 2) {
      setResults([])
      if (query.length < 2) setOpen(false)
      return
    }
    const timer = setTimeout(() => {
      try {
        const found = search(entries, query, filterTypes)
        setResults(found)
        setOpen(true)
        setHighlightIdx(0)
      } catch (err) {
        console.error('LocationPicker search error:', err)
        setResults([])
      }
    }, 100)
    return () => clearTimeout(timer)
  }, [query, entries, filterTypes])

  /* Close dropdown on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        dropRef.current && !dropRef.current.contains(target) &&
        inputRef.current && !inputRef.current.contains(target)
      ) {
        setOpen(false)
        setCustomMode(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const select = useCallback((entry: LocationEntry) => {
    onChange({ name: entry.n, hierarchy: entry.h, type: entry.t })
    setQuery('')
    setOpen(false)
    setCustomMode(false)
  }, [onChange])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightIdx(i => Math.min(i + 1, results.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightIdx(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && results[highlightIdx]) { e.preventDefault(); select(results[highlightIdx]) }
    if (e.key === 'Escape') { setOpen(false); setCustomMode(false) }
  }

  const handleCustomSubmit = () => {
    const name = customName.trim()
    if (!name) return
    onChange({ name, hierarchy: `Dubai>Custom>${name}`, type: 'N' })
    setCustomName('')
    setCustomMode(false)
    setQuery('')
    setOpen(false)
  }

  const clear = () => {
    onChange(null)
    setQuery('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  /* ── Render selected ── */
  if (value) {
    const breadcrumb = formatHierarchy(value.hierarchy)
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12, padding: '10px 14px',
        background: 'var(--accent-soft, #e8f0ed)',
        borderRadius: 10, border: '1px solid var(--accent, #2d5a4f)',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink, #0f1419)', marginBottom: 2 }}>
            {value.name}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--muted, #5a6470)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {breadcrumb}
          </div>
        </div>
        <button
          onClick={clear}
          style={{
            padding: '4px 10px', borderRadius: 6, border: '1px solid var(--accent, #2d5a4f)',
            background: 'transparent', color: 'var(--accent, #2d5a4f)', fontSize: 12, fontWeight: 500,
            cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0,
          }}
        >
          × Change
        </button>
      </div>
    )
  }

  /* ── Render input + dropdown ── */
  return (
    <div style={{ position: 'relative' }}>
      {/* Input */}
      <div style={{ position: 'relative' }}>
        {/* Search icon */}
        <svg
          width="15" height="15" viewBox="0 0 24 24" fill="none"
          stroke="var(--quiet, #8b95a0)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', flexShrink: 0 }}
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          ref={inputRef}
          className="pnw-input"
          style={{ paddingLeft: 36 }}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => { if (query.length >= 2) setOpen(true) }}
          onKeyDown={handleKeyDown}
          placeholder={loading ? 'Loading locations…' : placeholder}
          required={required && !value}
          disabled={loading}
          autoComplete="off"
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div
          ref={dropRef}
          style={{
            position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
            background: '#fff', border: '1px solid var(--line-soft, #f0f2f4)',
            borderRadius: 10, boxShadow: '0 8px 24px rgba(15,20,25,0.10)',
            maxHeight: 320, overflowY: 'auto', zIndex: 1000,
          }}
        >
          {results.length === 0 && !customMode && (
            <div style={{ padding: '14px 16px', color: 'var(--muted, #5a6470)', fontSize: 13 }}>
              No results for "<strong>{query}</strong>"
            </div>
          )}

          {results.map((entry, i) => {
            const parent = parentHierarchy(entry.h)
            const typeLabel = TYPE_LABELS[entry.t] ?? entry.t
            const isHighlighted = i === highlightIdx
            return (
              <div
                key={entry.h}
                onMouseDown={() => select(entry)}
                onMouseEnter={() => setHighlightIdx(i)}
                style={{
                  padding: '12px 14px',
                  borderBottom: '1px solid var(--line-soft, #f0f2f4)',
                  background: isHighlighted ? 'var(--paper-warm, #fbfaf7)' : '#fff',
                  cursor: 'pointer',
                  transition: 'background .08s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 2 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink, #0f1419)' }}>{entry.n}</span>
                  <span style={{ fontSize: 11, color: 'var(--quiet, #8b95a0)', fontWeight: 500 }}>{typeLabel}</span>
                </div>
                {parent && (
                  <div style={{ fontSize: 11.5, color: 'var(--muted, #5a6470)' }}>{parent}</div>
                )}
              </div>
            )
          })}

          {/* Custom entry */}
          {!customMode ? (
            results.length < 3 && (
              <div style={{ padding: '10px 14px', borderTop: results.length > 0 ? '1px solid var(--line-soft, #f0f2f4)' : undefined }}>
                <button
                  onMouseDown={e => { e.preventDefault(); setCustomMode(true); setTimeout(() => customRef.current?.focus(), 50) }}
                  style={{
                    background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                    fontSize: 12.5, color: 'var(--accent, #2d5a4f)', fontFamily: 'inherit', fontWeight: 500,
                  }}
                >
                  Can't find it? Enter manually →
                </button>
              </div>
            )
          ) : (
            <div style={{ padding: '10px 14px', borderTop: '1px solid var(--line-soft, #f0f2f4)', display: 'flex', gap: 8 }}>
              <input
                ref={customRef}
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleCustomSubmit(); if (e.key === 'Escape') setCustomMode(false) }}
                placeholder="Type location name…"
                style={{
                  flex: 1, padding: '7px 10px', border: '1px solid var(--line, #e6e8eb)',
                  borderRadius: 7, fontSize: 13, fontFamily: 'inherit', outline: 'none',
                  color: 'var(--ink, #0f1419)',
                }}
              />
              <button
                onMouseDown={e => { e.preventDefault(); handleCustomSubmit() }}
                style={{
                  padding: '7px 12px', borderRadius: 7, border: 'none',
                  background: 'var(--accent, #2d5a4f)', color: '#fff',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >Add</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
