import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Globe, Search, ChevronRight, ChevronDown, ChevronUp,
  Shield, Zap, RefreshCw, ExternalLink, Check,
  AlertTriangle, ArrowRight, Lock, Users, Building2,
  Copy, Trash2, User, CreditCard, Settings,
} from 'lucide-react'
// supabase imported for future API calls
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import '../styles/domain-settings.css'

// ── Types ──────────────────────────────────────────────────────────────────────
type PageState =
  | 'empty'          // No domain — path picker
  | 'search'         // Buy: domain search
  | 'confirm'        // Buy: confirmation card
  | 'progress'       // Buy: animated registration progress
  | 'live'           // Domain active

interface DomainResult {
  name: string
  tld: string
  price: string
  available: boolean
  recommended?: boolean
}

interface ProgressStep {
  id: string
  label: string
  sublabel: string
  status: 'complete' | 'active' | 'pending'
}

// ── TLD pricing (approximate Cloudflare wholesale in AED) ─────────────────────
const TLD_PRICES: Record<string, string> = {
  '.com': 'AED 44', '.ae': 'AED 165', '.co': 'AED 100', '.io': 'AED 140',
  '.realestate': 'AED 160', '.properties': 'AED 160', '.homes': 'AED 120',
  '.estate': 'AED 129', '.realty': 'AED 169', '.casa': 'AED 60',
}

const TLDS = ['.com', '.ae', '.co', '.io', '.realestate', '.properties', '.homes', '.estate']

async function checkDomainAvailability(name: string, tld: string): Promise<boolean> {
  try {
    const domain = `${name}${tld}`
    const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=NS`)
    const data = await res.json()
    // Status 3 = NXDOMAIN (domain doesn't exist = available)
    // Status 0 = NOERROR (domain exists = taken)
    return data.Status === 3
  } catch {
    return false // assume taken on error
  }
}

const INITIAL_STEPS: ProgressStep[] = [
  { id: 'reserve',    label: 'Reserving domain',        sublabel: 'Checking availability with registry…',             status: 'active'  },
  { id: 'register',   label: 'Registering domain',      sublabel: 'Completing ICANN registration…',                    status: 'pending' },
  { id: 'dns',        label: 'Configuring DNS',         sublabel: 'Pointing your domain to Agent Pages servers…',      status: 'pending' },
  { id: 'ssl',        label: 'Provisioning SSL',        sublabel: 'Generating TLS certificate via Let\'s Encrypt…',    status: 'pending' },
  { id: 'activate',   label: 'Activating your page',    sublabel: 'Publishing your portfolio on the new domain…',      status: 'pending' },
]

// ── Sidebar ────────────────────────────────────────────────────────────────────
function SettingsSidebar({ navigate }: { navigate: (path: string) => void }) {
  return (
    <div className="ds-sidebar">
      <div className="ds-sidebar-section-label">Account</div>
      <button className="ds-nav-item" onClick={() => navigate('/settings')}>
        <User size={13} /> Profile
      </button>
      <button className="ds-nav-item" onClick={() => navigate('/settings')}>
        <Shield size={13} /> Security
      </button>
      <button className="ds-nav-item" onClick={() => navigate('/settings')}>
        <CreditCard size={13} /> Billing
      </button>

      <div className="ds-sidebar-section-label">Workspace</div>
      <button className="ds-nav-item" onClick={() => navigate('/settings')}>
        <Building2 size={13} /> Brokerage
      </button>
      <button className="ds-nav-item" onClick={() => navigate('/settings')}>
        <Users size={13} /> Members
      </button>
      <button className="ds-nav-item active" onClick={() => navigate('/settings/domain')}>
        <Globe size={13} /> Domain
      </button>
      <button className="ds-nav-item" onClick={() => navigate('/settings')}>
        <Zap size={13} /> Integrations
      </button>

      <div style={{ height: 1, background: 'var(--border-light)', margin: '10px 0' }} />

      <button className="ds-nav-item" onClick={() => navigate('/settings')}>
        <Settings size={13} /> All settings
      </button>
    </div>
  )
}

// ── Empty state ────────────────────────────────────────────────────────────────
function EmptyState({ onBuy, onByo }: { onBuy: () => void; onByo: () => void }) {
  return (
    <div className="ds-card">
      <div className="ds-hero">
        <div className="ds-hero-icon">
          <Globe size={26} color="#2d5a4f" />
        </div>
        <h1 className="ds-hero-title">
          Launch on your <em>own domain</em>
        </h1>
        <p className="ds-hero-subtitle">
          A custom domain makes your portfolio look professional, builds trust with buyers,
          and helps you rank higher in Google.
        </p>

        <div className="ds-path-grid">
          <button className="ds-path-card" onClick={onBuy}>
            <span className="ds-path-card-icon">🛒</span>
            <div className="ds-path-card-title">Buy a domain</div>
            <div className="ds-path-card-desc">
              Search and register a new domain. We handle DNS, SSL, and renewal automatically.
            </div>
            <span className="ds-path-card-badge">Recommended</span>
          </button>

          <button className="ds-path-card" onClick={onByo}>
            <span className="ds-path-card-icon">🔗</span>
            <div className="ds-path-card-title">Use your own domain</div>
            <div className="ds-path-card-desc">
              Already own a domain? Point it to Agent Pages with a simple DNS change.
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Domain search ──────────────────────────────────────────────────────────────
function SearchState({
  onBack,
  onSelect,
}: {
  onBack: () => void
  onSelect: (domain: DomainResult) => void
}) {
  const [query, setQuery] = useState('')
  const [activeTlds, setActiveTlds] = useState<string[]>(['.ae', '.com'])
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<DomainResult[]>([])
  const [searched, setSearched] = useState(false)

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return
    setSearching(true)
    const base = query.trim().toLowerCase().replace(/[^a-z0-9-]/g, '')
    const tldsToCheck = activeTlds.length > 0 ? activeTlds : TLDS
    const checks = await Promise.all(
      tldsToCheck.map(async (tld) => {
        const available = await checkDomainAvailability(base, tld)
        return {
          name: base,
          tld,
          price: TLD_PRICES[tld] || 'AED 99',
          available,
          recommended: tld === '.com' && available,
        } as DomainResult
      })
    )
    // Sort: available first, then by recommended, then by price
    checks.sort((a, b) => {
      if (a.available !== b.available) return a.available ? -1 : 1
      if (a.recommended !== b.recommended) return a.recommended ? -1 : 1
      return 0
    })
    setResults(checks)
    setSearched(true)
    setSearching(false)
  }, [query, activeTlds])

  const toggleTld = (tld: string) => {
    setActiveTlds(prev =>
      prev.includes(tld) ? prev.filter(t => t !== tld) : [...prev, tld]
    )
  }

  return (
    <div className="ds-card">
      <div className="ds-card-head">
        <button
          onClick={onBack}
          className="ds-btn ds-btn-ghost"
          style={{ padding: '4px 0', fontSize: 12.5, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}
        >
          ← Back
        </button>
        <div className="ds-card-head-title">Search for a domain</div>
        <div className="ds-card-head-desc">Find the perfect domain for your real estate portfolio</div>
      </div>

      <div className="ds-card-body">
        {/* Search bar */}
        <div className="ds-search-row">
          <div className="ds-search-input-wrap">
            <Search size={14} color="#8b95a0" style={{ marginLeft: 12, flexShrink: 0 }} />
            <input
              className="ds-search-input"
              type="text"
              placeholder="yourname or youragency"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button
            className="ds-btn ds-btn-primary ds-search-btn"
            onClick={handleSearch}
            disabled={searching || !query.trim()}
          >
            {searching ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <RefreshCw size={13} className="ds-spin" /> Searching…
              </span>
            ) : 'Search'}
          </button>
        </div>

        {/* TLD chips */}
        <div className="ds-tld-chips">
          {TLDS.map(tld => (
            <button
              key={tld}
              className={`ds-tld-chip${activeTlds.includes(tld) ? ' active' : ''}`}
              onClick={() => toggleTld(tld)}
            >
              {tld}
            </button>
          ))}
        </div>

        {/* Results */}
        {searched && !searching && (
          <div>
            {results.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--ink-muted)', fontSize: 13.5 }}>
                No results. Try different TLDs or a shorter name.
              </div>
            ) : (
              results.map((r, i) => (
                <div key={i} className="ds-result-row">
                  <div className="ds-result-domain">
                    {r.name}<span className="tld">{r.tld}</span>
                    {r.recommended && (
                      <span style={{ marginLeft: 8, fontSize: 10.5, fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-light)', padding: '2px 6px', borderRadius: 5, fontFamily: 'Inter, sans-serif' }}>
                        Best match
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="ds-result-price">{r.price}</span>
                    <span className="ds-result-period">/ yr</span>
                  </div>
                  {r.available ? (
                    <>
                      <span className="ds-result-avail available">Available</span>
                      <button
                        className={`ds-result-select${r.recommended ? ' primary' : ''}`}
                        onClick={() => onSelect(r)}
                      >
                        Select
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="ds-result-avail taken">Taken</span>
                      <button className="ds-result-select" disabled style={{ opacity: 0.4, cursor: 'not-allowed' }}>
                        Taken
                      </button>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {!searched && !searching && (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--ink-muted)', fontSize: 13.5 }}>
            Enter a name above to search available domains
          </div>
        )}
      </div>
    </div>
  )
}

// ── Confirm ────────────────────────────────────────────────────────────────────
function ConfirmState({
  domain,
  onBack,
  onConfirm,
}: {
  domain: DomainResult
  onBack: () => void
  onConfirm: () => void
}) {
  const fullDomain = `${domain.name}${domain.tld}`

  const features = [
    { icon: <Lock size={12} color="#2d5a4f" />, text: 'Free SSL certificate included' },
    { icon: <RefreshCw size={12} color="#2d5a4f" />, text: 'Auto-renews each year' },
    { icon: <Zap size={12} color="#2d5a4f" />, text: 'DNS configured automatically' },
    { icon: <Globe size={12} color="#2d5a4f" />, text: 'Includes WHOIS privacy protection' },
  ]

  return (
    <div className="ds-card">
      <div className="ds-card-head">
        <button
          onClick={onBack}
          className="ds-btn ds-btn-ghost"
          style={{ padding: '4px 0', fontSize: 12.5, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}
        >
          ← Back
        </button>
        <div className="ds-card-head-title">Confirm registration</div>
        <div className="ds-card-head-desc">Review the details before we register your domain</div>
      </div>

      {/* Domain + price */}
      <div className="ds-confirm-domain-display">
        <div className="ds-confirm-domain-name">{fullDomain}</div>
        <div className="ds-confirm-price-row">
          <span className="ds-confirm-price">{domain.price}</span>
          <span className="ds-confirm-price-sub">per year · auto-renews</span>
        </div>
      </div>

      {/* Feature list */}
      <div className="ds-confirm-features">
        {features.map((f, i) => (
          <div key={i} className="ds-confirm-feature">
            <div className="ds-confirm-feature-icon">{f.icon}</div>
            {f.text}
          </div>
        ))}
      </div>

      <div className="ds-info-banner info" style={{ margin: '0 20px 4px' }}>
        <div>
          <strong>Billed to your plan.</strong> Domain charges appear on your next invoice. You can manage or cancel auto-renew any time from this page.
        </div>
      </div>

      <div className="ds-confirm-actions">
        <button className="ds-btn ds-btn-primary" style={{ flex: 1 }} onClick={onConfirm}>
          Register {fullDomain} →
        </button>
        <button className="ds-btn ds-btn-secondary" onClick={onBack}>Cancel</button>
      </div>
    </div>
  )
}

// ── Progress ───────────────────────────────────────────────────────────────────
function ProgressState({ domain, onComplete }: { domain: DomainResult; onComplete: () => void }) {
  const [steps, setSteps] = useState<ProgressStep[]>(INITIAL_STEPS)

  useEffect(() => {
    let idx = 0
    const intervals = [1200, 1800, 2200, 2400, 1500]

    const advance = () => {
      idx++
      if (idx >= INITIAL_STEPS.length) {
        setSteps(s => s.map(step => ({ ...step, status: 'complete' })))
        setTimeout(onComplete, 800)
        return
      }
      setSteps(s =>
        s.map((step, i) => {
          if (i < idx) return { ...step, status: 'complete' }
          if (i === idx) return { ...step, status: 'active' }
          return { ...step, status: 'pending' }
        })
      )
      setTimeout(advance, intervals[idx] || 1500)
    }

    const timer = setTimeout(advance, intervals[0])
    return () => clearTimeout(timer)
  }, [onComplete])

  const fullDomain = `${domain.name}${domain.tld}`

  return (
    <div className="ds-card">
      <div className="ds-progress-wrap">
        <div className="ds-progress-title">Registering {fullDomain}</div>
        <div className="ds-progress-subtitle">This takes about 15 seconds. Don't close this page.</div>

        <div className="ds-progress-steps">
          {steps.map(step => (
            <div key={step.id} className="ds-progress-step">
              <div className={`ds-step-indicator ${step.status}`}>
                {step.status === 'complete' ? (
                  <Check size={13} />
                ) : step.status === 'active' ? (
                  <RefreshCw size={11} className="ds-spin" />
                ) : (
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'currentColor', display: 'block' }} />
                )}
              </div>
              <div>
                <div className="ds-step-label">{step.label}</div>
                <div className="ds-step-sublabel">{step.sublabel}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Live state ─────────────────────────────────────────────────────────────────
function LiveState({ domain, onRemove }: { domain: DomainResult; onRemove: () => void }) {
  const [dnsOpen, setDnsOpen] = useState(false)
  const fullDomain = `${domain.name}${domain.tld}`

  const dnsRecords = [
    { type: 'A',     name: '@',    value: '104.21.54.180',   ttl: '300' },
    { type: 'A',     name: '@',    value: '172.67.68.22',    ttl: '300' },
    { type: 'CNAME', name: 'www',  value: 'proxy.agentpages.io', ttl: '300' },
  ]

  return (
    <>
      {/* Domain status card */}
      <div className="ds-card">
        <div className="ds-live-header">
          <div className="ds-live-icon">
            <Globe size={22} color="#2d5a4f" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="ds-live-domain">{fullDomain}</div>
            <div className="ds-live-status">
              <div className="ds-status-dot" />
              <span style={{ color: '#22c55e', fontWeight: 600, fontSize: 12.5 }}>Live</span>
              <span style={{ color: 'var(--ink-muted)' }}>·</span>
              <span className="ds-ssl-chip">
                <Lock size={10} /> SSL active
              </span>
            </div>
          </div>
          <a
            href={`https://${fullDomain}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--ink-muted)', display: 'flex', alignItems: 'center' }}
          >
            <ExternalLink size={15} />
          </a>
        </div>

        {/* Stats */}
        <div className="ds-live-stats">
          <div className="ds-stat-item">
            <div className="ds-stat-value">7</div>
            <div className="ds-stat-label">Active pages</div>
          </div>
          <div className="ds-stat-item">
            <div className="ds-stat-value">2,140</div>
            <div className="ds-stat-label">Visits this month</div>
          </div>
          <div className="ds-stat-item">
            <div className="ds-stat-value">312d</div>
            <div className="ds-stat-label">Until renewal</div>
          </div>
        </div>

        {/* Actions */}
        <div className="ds-live-actions">
          <button
            className="ds-btn ds-btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 7 }}
            onClick={() => navigator.clipboard?.writeText(fullDomain)}
          >
            <Copy size={13} /> Copy domain
          </button>
          <button
            className="ds-btn ds-btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 7 }}
          >
            <RefreshCw size={13} /> Force SSL renew
          </button>
          <button
            className="ds-btn ds-btn-danger"
            style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 7 }}
            onClick={onRemove}
          >
            <Trash2 size={13} /> Remove domain
          </button>
        </div>

        {/* DNS expand */}
        <button className="ds-dns-toggle" onClick={() => setDnsOpen(o => !o)}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Shield size={13} /> DNS records
          </span>
          {dnsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {dnsOpen && (
          <div className="ds-dns-body">
            <div style={{ fontSize: 12.5, color: 'var(--ink-muted)', marginBottom: 12, lineHeight: 1.55 }}>
              These records are automatically managed by Agent Pages via Cloudflare. You should not need to edit them manually.
            </div>
            <table className="ds-dns-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Name</th>
                  <th>Value</th>
                  <th>TTL</th>
                </tr>
              </thead>
              <tbody>
                {dnsRecords.map((r, i) => (
                  <tr key={i}>
                    <td><strong>{r.type}</strong></td>
                    <td>{r.name}</td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.value}</td>
                    <td>{r.ttl}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Migration card */}
      <div className="ds-migration-card">
        <div className="ds-migration-head">
          <div className="ds-migration-icon">
            <AlertTriangle size={16} color="#b45309" />
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>Old agentpages.io URL</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-muted)', marginTop: 2 }}>
              Your original subdomain still works — both URLs serve your portfolio.
            </div>
          </div>
        </div>
        <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--border)' }}
          >
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12.5, color: 'var(--ink-secondary)' }}>
              agentpages.io/{domain.name}
            </span>
            <ArrowRight size={13} color="var(--ink-muted)" />
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12.5, color: 'var(--accent)', fontWeight: 500 }}>
              {fullDomain}
            </span>
          </div>
          <button className="ds-btn ds-btn-secondary" style={{ fontSize: 12.5, whiteSpace: 'nowrap' }}>
            Set up 301 redirect
          </button>
        </div>
      </div>
    </>
  )
}

// ── BYO domain ─────────────────────────────────────────────────────────────────
function ByoDomain({ onBack }: { onBack: () => void }) {
  const [cnameValue] = useState('proxy.agentpages.io')
  const [verifying, setVerifying] = useState(false)
  const [customDomain, setCustomDomain] = useState('')

  const handleVerify = async () => {
    if (!customDomain.trim()) return
    setVerifying(true)
    await new Promise(r => setTimeout(r, 1500))
    setVerifying(false)
    alert('Domain verified! (Mock — would now activate in real flow.)')
  }

  return (
    <div className="ds-card">
      <div className="ds-card-head">
        <button
          onClick={onBack}
          className="ds-btn ds-btn-ghost"
          style={{ padding: '4px 0', fontSize: 12.5, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}
        >
          ← Back
        </button>
        <div className="ds-card-head-title">Connect your existing domain</div>
        <div className="ds-card-head-desc">Follow these steps to point your domain to Agent Pages</div>
      </div>

      {/* Step 1 */}
      <div className="ds-instruction-step">
        <div className="ds-step-num">1</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>
            Add a CNAME record to your DNS
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-secondary)', lineHeight: 1.55, marginBottom: 10 }}>
            Log into your domain registrar (Namecheap, GoDaddy, etc.) and create the following DNS record:
          </div>
          <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 9, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Type', 'Name', 'Value', 'TTL'].map(h => (
                    <th key={h} style={{ padding: '7px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace' }}>CNAME</td>
                  <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace' }}>www</td>
                  <td style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{cnameValue}</span>
                    <button
                      onClick={() => navigator.clipboard?.writeText(cnameValue)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-muted)', display: 'flex' }}
                    >
                      <Copy size={12} />
                    </button>
                  </td>
                  <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace' }}>3600</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Step 2 */}
      <div className="ds-instruction-step">
        <div className="ds-step-num">2</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>
            Enter your domain below
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              type="text"
              value={customDomain}
              onChange={e => setCustomDomain(e.target.value)}
              placeholder="e.g. sarahjohnson.ae or www.sarahjohnson.com"
              style={{
                flex: 1, padding: '10px 13px', border: '1.5px solid var(--border)', borderRadius: 9,
                fontSize: 13.5, fontFamily: 'JetBrains Mono, monospace', color: 'var(--ink)',
                outline: 'none',
              }}
            />
            <button
              className="ds-btn ds-btn-primary"
              onClick={handleVerify}
              disabled={verifying || !customDomain.trim()}
              style={{ display: 'flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap' }}
            >
              {verifying ? (
                <><RefreshCw size={13} className="ds-spin" /> Verifying…</>
              ) : (
                <><Check size={13} /> Verify</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Step 3 */}
      <div className="ds-instruction-step" style={{ borderBottom: 'none' }}>
        <div className="ds-step-num">3</div>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', marginBottom: 3 }}>Wait for DNS propagation</div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-secondary)', lineHeight: 1.55 }}>
            DNS changes can take up to 24 hours, though it's usually under 30 minutes. We'll send you an email once your domain is live.
          </div>
        </div>
      </div>

      <div style={{ padding: '0 20px 20px' }}>
        <div className="ds-info-banner warning">
          <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <strong>Propagation delay:</strong> If verification fails, wait 15–30 minutes after adding the DNS record and try again.
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function DomainSettings() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [state, setPageState] = useState<PageState>('empty')
  const [byoMode, setByoMode] = useState(false)
  const [selectedDomain, setSelectedDomain] = useState<DomainResult | null>(null)

  const handleSelectDomain = (domain: DomainResult) => {
    setSelectedDomain(domain)
    setPageState('confirm')
  }

  const handleConfirm = async () => {
    if (!selectedDomain || !user) return
    setPageState('progress')
    // Save domain reservation to Supabase
    const fullDomain = `${selectedDomain.name}${selectedDomain.tld}`
    try {
      await supabase.from('workspace_domains').upsert({
        agent_id: user.id,
        domain: fullDomain,
        source: 'cloudflare_registrar',
        status: 'pending',
        auto_renew: true,
        whois_privacy: true,
        registration_price_usd: parseFloat(selectedDomain.price.replace(/[^0-9.]/g, '')) / 3.67,
      }, { onConflict: 'domain' })
    } catch (e) {
      console.error('Failed to save domain:', e)
    }
  }

  const handleProgressComplete = useCallback(async () => {
    if (!selectedDomain || !user) { setPageState('live'); return }
    const fullDomain = `${selectedDomain.name}${selectedDomain.tld}`
    // Mark as live (actual Cloudflare registration will be wired later)
    try {
      await supabase.from('workspace_domains')
        .update({ status: 'live', registered_at: new Date().toISOString() })
        .eq('agent_id', user.id)
        .eq('domain', fullDomain)
    } catch (e) {
      console.error('Failed to update domain status:', e)
    }
    setPageState('live')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDomain, user])

  // Load saved domain on mount
  useEffect(() => {
    if (!user) return
    supabase.from('workspace_domains')
      .select('*')
      .eq('agent_id', user.id)
      .eq('status', 'live')
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) {
          const parts = data.domain.match(/^([^.]+)(\..+)$/)
          if (parts) {
            setSelectedDomain({
              name: parts[1],
              tld: parts[2],
              price: TLD_PRICES[parts[2]] || 'AED 99',
              available: true,
            })
            setPageState('live')
          }
        }
      })
  }, [user])

  const handleRemoveDomain = async () => {
    if (!window.confirm('Remove your custom domain? Your portfolio will revert to your agentpages.io URL.')) return
    if (user && selectedDomain) {
      const fullDomain = `${selectedDomain.name}${selectedDomain.tld}`
      await supabase.from('workspace_domains').delete().eq('agent_id', user.id).eq('domain', fullDomain)
    }
    setSelectedDomain(null)
    setByoMode(false)
    setPageState('empty')
  }

  const renderContent = () => {
    if (byoMode && state === 'empty') {
      return <ByoDomain onBack={() => setByoMode(false)} />
    }

    switch (state) {
      case 'empty':
        return (
          <EmptyState
            onBuy={() => setPageState('search')}
            onByo={() => { setByoMode(true) }}
          />
        )
      case 'search':
        return (
          <SearchState
            onBack={() => setPageState('empty')}
            onSelect={handleSelectDomain}
          />
        )
      case 'confirm':
        return selectedDomain ? (
          <ConfirmState
            domain={selectedDomain}
            onBack={() => setPageState('search')}
            onConfirm={handleConfirm}
          />
        ) : null
      case 'progress':
        return selectedDomain ? (
          <ProgressState
            domain={selectedDomain}
            onComplete={handleProgressComplete}
          />
        ) : null
      case 'live':
        return selectedDomain ? (
          <LiveState
            domain={selectedDomain}
            onRemove={handleRemoveDomain}
          />
        ) : null
      default:
        return null
    }
  }

  const pageTitle =
    state === 'search'   ? 'Search domains' :
    state === 'confirm'  ? 'Confirm domain' :
    state === 'progress' ? 'Registering…'   :
    state === 'live'     ? 'Custom domain'  :
    byoMode              ? 'Connect domain' :
                           'Custom domain'

  return (
    <div className="ds-shell">
      <SettingsSidebar navigate={navigate} />

      <div className="ds-main">
        <div className="ds-content">
          {/* Breadcrumb */}
          <div className="ds-breadcrumb">
            <a href="/settings">Settings</a>
            <ChevronRight size={12} className="ds-breadcrumb-sep" />
            <a href="/settings">Workspace</a>
            <ChevronRight size={12} className="ds-breadcrumb-sep" />
            <span className="ds-breadcrumb-current">Domain</span>
          </div>

          {/* Page title */}
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em', margin: '0 0 4px' }}>
              {pageTitle}
            </h1>
            {state === 'live' && selectedDomain && (
              <div style={{ fontSize: 13, color: 'var(--ink-muted)' }}>
                Managing{' '}
                <span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--ink)', fontWeight: 500 }}>
                  {selectedDomain.name}{selectedDomain.tld}
                </span>
              </div>
            )}
          </div>

          {renderContent()}
        </div>
      </div>
    </div>
  )
}
