import { useState } from 'react'
import { Download, Mail, ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react'

/* ── Mock data ─────────────────────────────────────────────────────────── */
const KPI_CARDS = [
  { key: 'views',      label: 'Total page views',  value: '0',     change: '—', period: '', icon: 'views',   iconBg: '#d1fae5', iconColor: '#059669' },
  { key: 'leads',      label: 'Leads captured',    value: '0',     change: '—', period: '', icon: 'leads',   iconBg: '#dbeafe', iconColor: '#2563eb' },
  { key: 'time',       label: 'Avg time on page',  value: '0:00',  change: '—', period: '', icon: 'time',    iconBg: '#fef3c7', iconColor: '#d97706' },
  { key: 'conversion', label: 'Conversion rate',   value: '0.0%',  change: '—', period: '', icon: 'conv',    iconBg: '#fff7ed', iconColor: '#ea580c' },
]

const CHART_DAYS = ['May 1','May 5','May 10','May 15','May 20','May 25','May 30']
const CHART_VIEWS = [0, 0, 0, 0, 0, 0, 0]
const CHART_LEADS = [0, 0, 0, 0, 0, 0, 0]
const CHART_PREV  = [0, 0, 0, 0, 0, 0, 0]

const TRAFFIC_SOURCES = [
  { label: 'Google Search', pct: 0, views: 0, leads: 0 },
  { label: 'WhatsApp',      pct: 0, views: 0, leads: 0 },
  { label: 'Direct',        pct: 0, views: 0, leads: 0 },
  { label: 'Instagram',     pct: 0, views: 0, leads: 0 },
  { label: 'AI models',     pct: 0, views: 0, leads: 0 },
  { label: 'Other',         pct: 0, views: 0, leads: 0 },
]

const AI_MODELS = [
  { name: 'ChatGPT',    citations: 0, indexed: true  },
  { name: 'Claude',     citations: 0, indexed: true  },
  { name: 'Gemini',     citations: 0, indexed: true  },
  { name: 'Perplexity', citations: 0, indexed: true  },
  { name: 'Copilot',    citations: 0, indexed: false },
  { name: 'Grok',       citations: 0, indexed: false },
]

const PROPERTY_ROWS: { title: string; community: string; views: number; leads: number; conv: string; avgTime: string; grad: string }[] = []

const ENGAGEMENT = [
  { label: 'Avg session',   value: '0:00' },
  { label: 'Scroll depth',  value: '0%'   },
  { label: 'Call clicks',   value: '0'    },
  { label: 'Page shares',   value: '0'    },
]

const SECTION_VIEWS = [
  { label: 'Photo gallery',   pct: 0 },
  { label: 'Specs',           pct: 0 },
  { label: 'AI description',  pct: 0 },
  { label: 'Sold pricing',    pct: 0 },
  { label: 'Map',             pct: 0 },
  { label: 'Nearby',          pct: 0 },
  { label: 'Lead form',       pct: 0 },
]

// COUNTRIES removed — no data yet

const FUNNEL = [
  { label: 'Viewed page',         count: 0 },
  { label: 'Form interactions',   count: 0 },
  { label: 'Leads submitted',     count: 0 },
  { label: 'Viewings booked',     count: 0 },
  { label: 'Offers made',         count: 0 },
]

/* ── SVG helpers ────────────────────────────────────────────────────────── */
function buildPath(data: number[], w: number, h: number, max: number) {
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`)
  return `M${pts.join(' L')}`
}
function buildArea(data: number[], w: number, h: number, max: number) {
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`)
  return `M0,${h} L${pts.join(' L')} L${w},${h} Z`
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const W = 64, H = 24
  const max = Math.max(...data) * 1.2
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <path d={buildPath(data, W, H, max)} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function KpiIcon({ icon }: { icon: string }) {
  if (icon === 'views') return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  )
  if (icon === 'leads') return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  )
  if (icon === 'time') return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  )
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
    </svg>
  )
}

/* ── Card wrapper ───────────────────────────────────────────────────────── */
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--line-soft,#f0f2f4)', borderRadius: 16, overflow: 'hidden', ...style }}>
      {children}
    </div>
  )
}

function CardHead({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--line-soft,#f0f2f4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink,#0f1419)' }}>{title}</span>
      {action}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   ANALYTICS PAGE
═══════════════════════════════════════════════════════════════════════════ */
export default function Analytics() {
  const [selectedKpi, setSelectedKpi] = useState('views')
  const [dateTab, setDateTab] = useState<'7d' | '30d' | '90d' | 'all'>('30d')
  const [sortCol, setSortCol] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const W = 560, H = 110
  const maxViews = 1000
  const maxLeads = 50

  function handleSort(col: string) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('desc') }
  }

  function SortIcon({ col }: { col: string }) {
    if (sortCol !== col) return <ChevronsUpDown size={12} style={{ opacity: 0.4 }} />
    return sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
  }

  return (
    <>
      <style>{`
        @media (max-width: 979px) {
          .analytics-kpi-grid { grid-template-columns: repeat(2,1fr) !important; }
          .analytics-two-col { grid-template-columns: 1fr !important; }
          .analytics-discovery { grid-template-columns: repeat(2,1fr) !important; }
          .analytics-table-conv { display: none !important; }
          .analytics-table-time { display: none !important; }
        }
      `}</style>

      <div style={{ padding: '40px 32px', maxWidth: 1160, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--ink,#0f1419)', letterSpacing: '-0.025em', marginBottom: 4 }}>Analytics</h1>
            <p style={{ fontSize: 14, color: 'var(--muted,#5a6470)' }}>Performance across all your property pages.</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', border: '1.5px solid var(--line,#e6e8eb)', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', background: '#fff', color: 'var(--ink,#0f1419)' }}>
              <Mail size={13} /> Email me weekly
            </button>
            <button style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'var(--accent,#2d5a4f)', color: '#fff' }}>
              <Download size={13} /> Export
            </button>
          </div>
        </div>

        {/* Filter strip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          {/* Property selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', border: '1.5px solid var(--line,#e6e8eb)', borderRadius: 8, cursor: 'pointer', background: '#fff', fontSize: 13, color: 'var(--ink,#0f1419)' }}>
            All properties <ChevronDown size={13} style={{ opacity: 0.5 }} />
          </div>
          {/* Date tabs */}
          <div style={{ display: 'flex', gap: 2, background: 'var(--line-soft,#f0f2f4)', padding: 3, borderRadius: 8 }}>
            {(['7d','30d','90d','all'] as const).map(t => (
              <button key={t} onClick={() => setDateTab(t)} style={{ padding: '5px 12px', borderRadius: 6, fontSize: 12.5, fontWeight: 500, border: 'none', cursor: 'pointer', background: dateTab === t ? '#fff' : 'transparent', color: dateTab === t ? 'var(--ink,#0f1419)' : 'var(--muted,#5a6470)', boxShadow: dateTab === t ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.12s' }}>
                {t === 'all' ? 'All time' : t}
              </button>
            ))}
          </div>
          {/* Date range */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', border: '1.5px solid var(--line,#e6e8eb)', borderRadius: 8, cursor: 'pointer', background: '#fff', fontSize: 13, color: 'var(--muted,#5a6470)' }}>
            May 1 – May 30, 2025 <ChevronDown size={13} style={{ opacity: 0.5 }} />
          </div>
          {/* Compare toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'var(--muted,#5a6470)', cursor: 'pointer' }}>
            <div style={{ width: 32, height: 18, borderRadius: 9, background: 'var(--line-soft,#f0f2f4)', position: 'relative' }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.15)', position: 'absolute', top: 2, left: 2 }} />
            </div>
            Compare
          </label>
        </div>

        {/* KPI cards */}
        <div className="analytics-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
          {KPI_CARDS.map(kpi => {
            const isSelected = selectedKpi === kpi.key
            return (
              <div key={kpi.key} onClick={() => setSelectedKpi(kpi.key)} style={{
                background: '#fff', border: `1.5px solid ${isSelected ? 'var(--accent,#2d5a4f)' : 'var(--line-soft,#f0f2f4)'}`,
                borderRadius: 14, padding: '18px 20px', cursor: 'pointer', position: 'relative', overflow: 'hidden',
                transition: 'border-color 0.15s',
              }}>
                {isSelected && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'var(--accent,#2d5a4f)', borderRadius: '0 0 14px 14px' }} />}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: kpi.iconBg, color: kpi.iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <KpiIcon icon={kpi.icon} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, background: '#f0f2f4', color: '#8b95a0', padding: '2px 7px', borderRadius: 100 }}>{kpi.change}</span>
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--ink,#0f1419)', letterSpacing: '-0.03em', marginBottom: 2 }}>{kpi.value}</div>
                <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--muted,#5a6470)' }}>{kpi.label}</div>
                <div style={{ fontSize: 11, color: '#bbb', marginTop: 2 }}>{kpi.period}</div>
              </div>
            )
          })}
        </div>

        {/* Performance chart */}
        <Card style={{ marginBottom: 24 }}>
          <CardHead title="Performance over time" action={
            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--muted,#5a6470)' }}>
              {[{ color: '#059669', label: 'Views' }, { color: '#2563eb', label: 'Leads' }, { color: '#d1d5db', label: 'Prev period', dashed: true }].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 20, height: 2, background: l.dashed ? 'transparent' : l.color, borderRadius: 1, borderTop: l.dashed ? '2px dashed #d1d5db' : undefined }} />
                  {l.label}
                </div>
              ))}
            </div>
          } />
          <div style={{ padding: '16px 22px 20px' }}>
            <svg viewBox={`0 0 ${W} ${H + 28}`} style={{ width: '100%', minWidth: 280 }}>
              <defs>
                <linearGradient id="ag-views" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#059669" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#059669" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="ag-leads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Y axis labels */}
              {[0,0.33,0.66,1].map((r,i) => (
                <g key={i}>
                  <line x1="32" y1={H * r} x2={W} y2={H * r} stroke="#f0f0f0" strokeWidth="1" />
                  <text x="28" y={H * r + 4} textAnchor="end" fontSize="9" fill="#bbb">{Math.round(maxViews * (1 - r))}</text>
                </g>
              ))}
              {/* Previous period dashed */}
              <path d={buildPath(CHART_PREV, W - 32, H, maxViews)} transform="translate(32,0)" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeDasharray="4 3" strokeLinecap="round" />
              {/* Views */}
              <path d={buildArea(CHART_VIEWS, W - 32, H, maxViews)} transform="translate(32,0)" fill="url(#ag-views)" />
              <path d={buildPath(CHART_VIEWS, W - 32, H, maxViews)} transform="translate(32,0)" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              {/* Leads */}
              <path d={buildArea(CHART_LEADS, W - 32, H, maxLeads)} transform="translate(32,0)" fill="url(#ag-leads)" />
              <path d={buildPath(CHART_LEADS, W - 32, H, maxLeads)} transform="translate(32,0)" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              {/* X axis labels */}
              {CHART_DAYS.map((d, i) => (
                <text key={i} x={32 + (i / (CHART_DAYS.length - 1)) * (W - 32)} y={H + 18} textAnchor="middle" fontSize="9.5" fill="#bbb">{d}</text>
              ))}
            </svg>
          </div>
        </Card>

        {/* Traffic + AI discovery */}
        <div className="analytics-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          {/* Traffic sources */}
          <Card>
            <CardHead title="Traffic sources" />
            <div style={{ padding: '12px 0' }}>
              {TRAFFIC_SOURCES.map((s, i) => (
                <div key={i} style={{ padding: '10px 22px', borderBottom: i < TRAFFIC_SOURCES.length - 1 ? '1px solid var(--line-soft,#f0f2f4)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink,#0f1419)' }}>{s.label}</span>
                    <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--muted,#5a6470)' }}>
                      <span>{s.views.toLocaleString()} views</span>
                      <span style={{ color: '#059669', fontWeight: 600 }}>{s.leads} leads</span>
                      <span style={{ fontWeight: 600, color: 'var(--ink,#0f1419)', minWidth: 28, textAlign: 'right' }}>{s.pct}%</span>
                    </div>
                  </div>
                  <div style={{ height: 4, background: 'var(--line-soft,#f0f2f4)', borderRadius: 99 }}>
                    <div style={{ height: '100%', width: `${s.pct}%`, background: 'var(--accent,#2d5a4f)', borderRadius: 99 }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* AI model discovery */}
          <Card>
            <CardHead title="AI model discovery" />
            <div className="analytics-discovery" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, padding: 1 }}>
              {AI_MODELS.map((m, i) => (
                <div key={i} style={{ padding: '16px', background: '#fff', display: 'flex', flexDirection: 'column', gap: 6, border: '1px solid var(--line-soft,#f0f2f4)', borderRadius: 8, margin: 3 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink,#0f1419)' }}>{m.name}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink,#0f1419)', letterSpacing: '-0.02em' }}>{m.citations}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted,#5a6470)' }}>citations</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 7px', borderRadius: 100, background: m.indexed ? '#d1fae5' : '#f0f2f4', fontSize: 10.5, fontWeight: 600, color: m.indexed ? '#059669' : '#8b95a0', width: 'fit-content' }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: m.indexed ? '#059669' : '#8b95a0' }} />
                    {m.indexed ? 'Indexed' : 'Unverified'}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Page performance table */}
        <Card style={{ marginBottom: 24 }}>
          <CardHead title="Page performance" />
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--line-soft,#f0f2f4)' }}>
                  {[
                    { key: 'title',   label: 'Property',    style: { padding: '10px 22px', textAlign: 'left' } },
                    { key: 'views',   label: 'Views',       style: { padding: '10px 14px', textAlign: 'right' } },
                    { key: 'leads',   label: 'Leads',       style: { padding: '10px 14px', textAlign: 'right' } },
                    { key: 'conv',    label: 'Conv.',       style: { padding: '10px 14px', textAlign: 'right' }, cls: 'analytics-table-conv' },
                    { key: 'avgTime', label: 'Avg time',    style: { padding: '10px 14px', textAlign: 'right' }, cls: 'analytics-table-time' },
                    { key: 'spark',   label: 'Trend',       style: { padding: '10px 22px 10px 8px', textAlign: 'right' } },
                  ].map(col => (
                    <th key={col.key} className={col.cls} style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted,#5a6470)', textTransform: 'uppercase', letterSpacing: '0.06em', cursor: col.key !== 'spark' ? 'pointer' : 'default', whiteSpace: 'nowrap', ...(col.style as React.CSSProperties) }} onClick={() => col.key !== 'spark' && handleSort(col.key)}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {col.label}
                        {col.key !== 'spark' && <SortIcon col={col.key} />}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PROPERTY_ROWS.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '40px 22px', textAlign: 'center', color: 'var(--muted,#5a6470)', fontSize: 13 }}>
                      No property pages yet — add your first property to see performance data here.
                    </td>
                  </tr>
                ) : PROPERTY_ROWS.map((row, i) => (
                  <tr key={i} style={{ borderBottom: i < PROPERTY_ROWS.length - 1 ? '1px solid var(--line-soft,#f0f2f4)' : 'none' }}>
                    <td style={{ padding: '12px 22px', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 28, borderRadius: 6, background: row.grad, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontWeight: 500, color: 'var(--ink,#0f1419)' }}>{row.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted,#5a6470)' }}>{row.community}</div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--ink,#0f1419)', fontWeight: 500 }}>{row.views.toLocaleString()}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', color: '#059669', fontWeight: 600 }}>{row.leads}</td>
                    <td className="analytics-table-conv" style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--muted,#5a6470)' }}>{row.conv}</td>
                    <td className="analytics-table-time" style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--muted,#5a6470)' }}>{row.avgTime}</td>
                    <td style={{ padding: '12px 22px 12px 8px', textAlign: 'right' }}>
                      <Sparkline data={[row.views * 0.6, row.views * 0.7, row.views * 0.75, row.views * 0.85, row.views * 0.92, row.views, row.views * 1.05].map(v => Math.round(v))} color="#059669" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Engagement + What buyers look at */}
        <div className="analytics-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          {/* Engagement quality */}
          <Card>
            <CardHead title="Engagement quality" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
              {ENGAGEMENT.map((e, i) => (
                <div key={i} style={{ padding: '20px', borderRight: i % 2 === 0 ? '1px solid var(--line-soft,#f0f2f4)' : 'none', borderBottom: i < 2 ? '1px solid var(--line-soft,#f0f2f4)' : 'none' }}>
                  <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink,#0f1419)', letterSpacing: '-0.02em', marginBottom: 4 }}>{e.value}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted,#5a6470)' }}>{e.label}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* What buyers look at */}
          <Card>
            <CardHead title="What buyers look at" />
            <div style={{ padding: '12px 0' }}>
              {SECTION_VIEWS.map((s, i) => (
                <div key={i} style={{ padding: '8px 22px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 12.5, color: 'var(--ink,#0f1419)', width: 120, flexShrink: 0 }}>{s.label}</span>
                  <div style={{ flex: 1, height: 6, background: 'var(--line-soft,#f0f2f4)', borderRadius: 99 }}>
                    <div style={{ height: '100%', width: `${s.pct}%`, background: 'var(--accent,#2d5a4f)', borderRadius: 99 }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted,#5a6470)', width: 36, textAlign: 'right' }}>{s.pct}%</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Geography + Lead funnel */}
        <div className="analytics-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 40 }}>
          {/* Geography */}
          <Card>
            <CardHead title="Where buyers are based" />
            <div style={{ padding: '40px 22px', textAlign: 'center', color: 'var(--muted,#5a6470)', fontSize: 13 }}>
              No data yet — add your first property to start tracking visitor locations.
            </div>
          </Card>

          {/* Lead funnel */}
          <Card>
            <CardHead title="Lead funnel" />
            <div style={{ padding: '20px 22px' }}>
              {FUNNEL.map((step, i) => {
                const maxCount = FUNNEL[0].count || 1
                const pct = Math.round((step.count / maxCount) * 100)
                return (
                  <div key={i} style={{ marginBottom: i < FUNNEL.length - 1 ? 14 : 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 12.5, color: 'var(--ink,#0f1419)' }}>{step.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink,#0f1419)' }}>{step.count.toLocaleString()}</span>
                    </div>
                    <div style={{ height: 28, background: 'var(--line-soft,#f0f2f4)', borderRadius: 6, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, var(--accent,#2d5a4f), var(--accent-bright,#3d8a76))`,
                        borderRadius: 6,
                        opacity: 1 - (i * 0.15),
                        display: 'flex', alignItems: 'center', paddingLeft: 8,
                      }}>
                        {pct > 15 && <span style={{ fontSize: 10.5, color: '#fff', fontWeight: 600 }}>{pct}%</span>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
