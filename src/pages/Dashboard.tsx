import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, Plus, ChevronRight, X, Eye, Calendar,
  Percent, Zap, Globe, AlertTriangle, Info, CheckCircle,
  ArrowUpRight, Activity, Bell
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

/* ── types ─────────────────────────────────────────────────────────────── */
interface Profile { first_name: string; last_name: string; email: string; plan: string }
interface MockLead { type: 'lead' | 'view' | 'book' | 'publish'; title: string; property: string; time: string; day: 'today' | 'yesterday' }

/* ── mock data ──────────────────────────────────────────────────────────── */
const MOCK_ACTIVITY: MockLead[] = [
  { type: 'lead',    title: 'Ahmed Al-Rashid submitted a lead',      property: 'Marina Heights 4B',    time: '9:14 AM',  day: 'today' },
  { type: 'view',    title: 'Your page was viewed 12 times',          property: 'Palm Residences 7A',   time: '8:41 AM',  day: 'today' },
  { type: 'book',    title: 'Sarah Chen booked a viewing',            property: 'Downtown Studio 2C',   time: '7:55 AM',  day: 'today' },
  { type: 'lead',    title: 'Khalid Mansoor submitted a lead',        property: 'JBR Sea View 1A',      time: '11:20 PM', day: 'yesterday' },
  { type: 'publish', title: 'You published a new listing',            property: 'DIFC Penthouse 18F',   time: '4:05 PM',  day: 'yesterday' },
  { type: 'view',    title: 'Your page was viewed 7 times',           property: 'Marina Heights 4B',    time: '2:30 PM',  day: 'yesterday' },
]

const MOCK_TOP: { name: string; leads: number; views: number; color: string }[] = [
  { name: 'Marina Heights 4B',  leads: 18, views: 312, color: '#2ab695' },
  { name: 'Palm Residences 7A', leads: 11, views: 204, color: '#c9a84c' },
  { name: 'Downtown Studio 2C', leads:  8, views: 167, color: '#6366f1' },
  { name: 'JBR Sea View 1A',    leads:  5, views: 98,  color: '#f97316' },
]

const MOCK_ATTENTION = [
  { icon: AlertTriangle, color: '#f59e0b', title: '2 properties missing WhatsApp',    desc: 'Connect WhatsApp to capture leads instantly.' },
  { icon: Info,          color: '#6366f1', title: 'Profile photo not uploaded',        desc: 'Profiles with photos get 3× more leads.' },
  { icon: Bell,          color: '#ef4444', title: '3 leads haven\'t been followed up', desc: 'Leads go cold after 48h. Reply now.' },
]

/* chart points for 7-day view (views + leads) */
const CHART_VIEWS  = [42, 58, 51, 74, 89, 102, 95]
const CHART_LEADS  = [ 3,  5,  4,  8,  9,  12, 10]
const CHART_DAYS   = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function buildPath(data: number[], w: number, h: number, max: number) {
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - (v / max) * h
    return `${x},${y}`
  })
  return `M${pts.join(' L')}`
}

function buildArea(data: number[], w: number, h: number, max: number) {
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - (v / max) * h
    return `${x},${y}`
  })
  return `M0,${h} L${pts.join(' L')} L${w},${h} Z`
}

/* ── activity icon config ────────────────────────────────────────────────── */
function ActivityIcon({ type }: { type: MockLead['type'] }) {
  const cfg = {
    lead:    { icon: Users,     bg: '#d1fae5', color: '#059669' },
    view:    { icon: Eye,       bg: '#dbeafe', color: '#2563eb' },
    book:    { icon: Calendar,  bg: '#fef3c7', color: '#d97706' },
    publish: { icon: Globe,     bg: '#ede9fe', color: '#7c3aed' },
  }[type]
  const Icon = cfg.icon
  return (
    <div style={{ width: 32, height: 32, borderRadius: 9, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={15} color={cfg.color} />
    </div>
  )
}


/* ══════════════════════════════════════════════════════════════════════════
   EMPTY STATE
═══════════════════════════════════════════════════════════════════════════ */
function EmptyState({ firstName }: { firstName: string }) {
  const steps = [
    { label: 'Create your account', done: true,  to: null },
    { label: 'Set up your agent profile', done: false, to: '/onboarding' },
    { label: 'Add your first property', done: false, to: '/properties/new' },
    { label: 'Connect WhatsApp', done: false, to: '/settings' },
  ]
  const done = steps.filter(s => s.done).length
  const pct = (done / steps.length) * 100

  return (
    <div style={{ padding: '40px 32px', maxWidth: 860, margin: '0 auto' }}>
      {/* Greeting */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.5px', marginBottom: 4 }}>
          Welcome, <span style={{ color: '#2ab695' }}>{firstName}.</span>
        </h1>
        <p style={{ fontSize: 14, color: '#888' }}>Let's get your first property page live.</p>
      </div>

      {/* Hero card */}
      <div style={{
        background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 60%, #fde68a 100%)',
        border: '1px solid #fde68a', borderRadius: 16,
        padding: '28px 32px', marginBottom: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Get started</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.3px', marginBottom: 16, lineHeight: 1.3 }}>
            Your first page goes live<br />in under 5 minutes.
          </h2>
          <Link to="/properties/new" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: '#1a1a1a', color: '#fff',
            padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            textDecoration: 'none', transition: 'opacity 0.15s'
          }}>
            <Plus size={14} />
            Add your first property
          </Link>
        </div>
        {/* Mini preview — hidden on mobile via class */}
        <div className="hero-preview" style={{
          width: 180, flexShrink: 0,
          background: '#fff', borderRadius: 12, padding: '14px',
          border: '1px solid #e5e7eb', boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
        }}>
          <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #2ab695, #1d9478)', borderRadius: 8, marginBottom: 10 }} />
          <div style={{ height: 8, background: '#f0f0f0', borderRadius: 4, marginBottom: 6 }} />
          <div style={{ height: 6, background: '#f0f0f0', borderRadius: 4, width: '70%', marginBottom: 12 }} />
          <div style={{ height: 80, background: 'linear-gradient(135deg, #e0f2fe, #bfdbfe)', borderRadius: 8, marginBottom: 10 }} />
          <div style={{ height: 6, background: '#f0f0f0', borderRadius: 4, marginBottom: 4 }} />
          <div style={{ height: 6, background: '#f0f0f0', borderRadius: 4, width: '60%' }} />
        </div>
      </div>

      {/* Checklist */}
      <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 16, padding: '24px 28px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>Getting started</h3>
          <span style={{ fontSize: 12, color: '#888' }}>{done}/{steps.length} completed</span>
        </div>
        <div style={{ height: 4, background: '#f0f0f0', borderRadius: 99, marginBottom: 20, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: '#2ab695', borderRadius: 99, transition: 'width 0.4s' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {steps.map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: step.done ? '#2ab695' : '#f0f0f0',
                border: `2px solid ${step.done ? '#2ab695' : '#e5e7eb'}`
              }}>
                {step.done && <CheckCircle size={12} color="#fff" />}
              </div>
              <span style={{ fontSize: 13, color: step.done ? '#aaa' : '#1a1a1a', textDecoration: step.done ? 'line-through' : 'none', flex: 1 }}>
                {step.label}
              </span>
              {!step.done && step.to && (
                <Link to={step.to} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#2ab695', textDecoration: 'none', fontWeight: 500 }}>
                  Start <ChevronRight size={12} />
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Feature cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }} className="feature-grid">
        {[
          { icon: Zap,      color: '#8b5cf6', bg: '#ede9fe', title: 'AI descriptions',     desc: 'Generate compelling property copy in seconds.' },
          { icon: Globe,    color: '#2ab695', bg: '#d1fae5', title: 'Memorable URLs',       desc: 'Share clean links like agentpages.io/p/you/apt.' },
          { icon: Activity, color: '#f97316', bg: '#ffedd5', title: 'Leads 3 ways',         desc: 'WhatsApp, form, and call — all in one place.' },
        ].map(({ icon: Icon, color, bg, title, desc }, i) => (
          <div key={i} style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 14, padding: '20px 20px' }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Icon size={17} color={color} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', marginBottom: 4 }}>{title}</div>
            <div style={{ fontSize: 12, color: '#888', lineHeight: 1.5 }}>{desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   ACTIVE STATE
═══════════════════════════════════════════════════════════════════════════ */
function ActiveState({ firstName, leadsCount }: {
  firstName: string; propertiesCount: number; leadsCount: number
}) {
  const [tipDismissed, setTipDismissed] = useState(false)
  const [chartTab, setChartTab] = useState<'7' | '30' | '90'>('7')

  const kpis = [
    { label: 'New leads',       value: leadsCount > 0 ? leadsCount : 9,  icon: Users,     iconBg: '#d1fae5', iconColor: '#059669', trend: '+3',  footer: 'vs. yesterday' },
    { label: 'Page views',      value: 312,  icon: Eye,       iconBg: '#dbeafe', iconColor: '#2563eb', trend: '+18%', footer: 'last 7 days' },
    { label: 'Viewings booked', value: 4,    icon: Calendar,  iconBg: '#fef3c7', iconColor: '#d97706', trend: '+2',  footer: 'this week' },
    { label: 'Lead conversion', value: '2.9%', icon: Percent, iconBg: '#fff7ed', iconColor: '#ea580c', trend: '+0.4%', footer: 'vs. last month' },
  ]

  const maxViewVal = Math.max(...CHART_VIEWS) * 1.15
  const W = 480; const H = 90

  const todayActivity = MOCK_ACTIVITY.filter(a => a.day === 'today')
  const yestActivity  = MOCK_ACTIVITY.filter(a => a.day === 'yesterday')

  return (
    <div style={{ padding: '40px 32px' }}>
      {/* Greeting */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.5px', marginBottom: 4 }}>
          Welcome back, {firstName}.
        </h1>
        <p style={{ fontSize: 13, color: '#888' }}>
          Here's what's happened since yesterday · <strong style={{ color: '#2ab695' }}>+3 new leads</strong>, <strong style={{ color: '#2563eb' }}>47 views.</strong>
        </p>
      </div>

      {/* Tip banner */}
      {!tipDismissed && (
        <div style={{
          background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 12,
          padding: '12px 16px', marginBottom: 24,
          display: 'flex', alignItems: 'center', gap: 12
        }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Zap size={14} color="#059669" />
          </div>
          <span style={{ fontSize: 13, color: '#065f46', flex: 1 }}>
            <strong>Tip:</strong> Properties with a video tour get <strong>2.4× more leads</strong>. Add one to your top listings.
          </span>
          <button onClick={() => setTipDismissed(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6ee7b7', padding: 4, display: 'flex' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }} className="kpi-grid">
        {kpis.map(({ label, value, icon: Icon, iconBg, iconColor, trend, footer }, i) => (
          <div key={i} style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 14, padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={15} color={iconColor} />
              </div>
              <span style={{
                fontSize: 11, fontWeight: 600,
                background: '#ecfdf5', color: '#059669',
                padding: '2px 7px', borderRadius: 100
              }}>{trend}</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.5px', marginBottom: 2 }}>{value}</div>
            <div style={{ fontSize: 12, fontWeight: 500, color: '#888' }}>{label}</div>
            <div style={{ fontSize: 11, color: '#bbb', marginTop: 2 }}>{footer}</div>
          </div>
        ))}
      </div>

      {/* Body grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, alignItems: 'start' }} className="body-grid">
        {/* LEFT col */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Activity feed */}
          <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid #f5f5f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>Activity</span>
              <Link to="/leads" style={{ fontSize: 12, color: '#2ab695', textDecoration: 'none', fontWeight: 500 }}>View all</Link>
            </div>
            <div style={{ padding: '0 22px 4px' }}>
              {[{ label: 'Today', items: todayActivity }, { label: 'Yesterday', items: yestActivity }].map(group => (
                <div key={group.label}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '14px 0 8px' }}>{group.label}</div>
                  {group.items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: i < group.items.length - 1 ? '1px solid #f9f9f9' : 'none' }}>
                      <ActivityIcon type={item.type} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.title.split(item.property)[0]}
                          <Link to="/properties" style={{ color: '#2ab695', textDecoration: 'none', fontWeight: 600 }}>{item.property}</Link>
                          {item.title.split(item.property)[1]}
                        </div>
                      </div>
                      <span style={{ fontSize: 11, color: '#bbb', flexShrink: 0 }}>{item.time}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Performance chart */}
          <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '18px 22px 12px', borderBottom: '1px solid #f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>Performance</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {(['7', '30', '90'] as const).map(t => (
                  <button key={t} onClick={() => setChartTab(t)} style={{
                    padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer',
                    background: chartTab === t ? '#1a1a1a' : 'transparent',
                    color: chartTab === t ? '#fff' : '#888'
                  }}>{t}d</button>
                ))}
              </div>
            </div>
            <div style={{ padding: '16px 22px' }}>
              {/* Stats row */}
              <div style={{ display: 'flex', gap: 28, marginBottom: 16 }}>
                {[
                  { label: 'Views', value: '312', color: '#2563eb' },
                  { label: 'Leads', value: '9',   color: '#2ab695' },
                  { label: 'Conversion', value: '2.9%', color: '#d97706' },
                ].map(s => (
                  <div key={s.label}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.3px' }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: '#aaa', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* SVG chart */}
              <div style={{ position: 'relative', overflowX: 'auto' }}>
                <svg viewBox={`0 0 ${W} ${H + 24}`} style={{ width: '100%', minWidth: 260 }}>
                  <defs>
                    <linearGradient id="gv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="gl" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2ab695" stopOpacity="0.22" />
                      <stop offset="100%" stopColor="#2ab695" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {/* grid lines */}
                  {[0, 0.33, 0.66, 1].map((r, i) => (
                    <line key={i} x1="0" y1={H * r} x2={W} y2={H * r} stroke="#f0f0f0" strokeWidth="1" />
                  ))}
                  {/* views area */}
                  <path d={buildArea(CHART_VIEWS, W, H, maxViewVal)} fill="url(#gv)" />
                  <path d={buildPath(CHART_VIEWS, W, H, maxViewVal)} fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  {/* leads area (scaled independently) */}
                  <path d={buildArea(CHART_LEADS, W, H, Math.max(...CHART_LEADS) * 1.5)} fill="url(#gl)" />
                  <path d={buildPath(CHART_LEADS, W, H, Math.max(...CHART_LEADS) * 1.5)} fill="none" stroke="#2ab695" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  {/* day labels */}
                  {CHART_DAYS.map((d, i) => (
                    <text key={i} x={(i / (CHART_DAYS.length - 1)) * W} y={H + 18} textAnchor="middle" fontSize="10" fill="#bbb">{d}</text>
                  ))}
                </svg>
              </div>
              {/* Legend */}
              <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                {[{ color: '#2563eb', label: 'Views' }, { color: '#2ab695', label: 'Leads' }].map(l => (
                  <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#888' }}>
                    <div style={{ width: 16, height: 2, background: l.color, borderRadius: 1 }} />
                    {l.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT col */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Needs attention */}
          <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid #f5f5f5' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>Needs attention</span>
            </div>
            <div style={{ padding: '4px 0' }}>
              {MOCK_ATTENTION.map(({ icon: Icon, color, title, desc }, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 22px',
                  borderBottom: i < MOCK_ATTENTION.length - 1 ? '1px solid #f9f9f9' : 'none',
                  cursor: 'pointer'
                }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={15} color={color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{title}</div>
                    <div style={{ fontSize: 11, color: '#aaa', marginTop: 1 }}>{desc}</div>
                  </div>
                  <ChevronRight size={14} color="#ccc" style={{ flexShrink: 0 }} />
                </div>
              ))}
            </div>
          </div>

          {/* Top performing */}
          <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid #f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>Top pages</span>
              <Link to="/properties" style={{ fontSize: 12, color: '#2ab695', textDecoration: 'none', fontWeight: 500 }}>See all</Link>
            </div>
            <div style={{ padding: '8px 0' }}>
              {MOCK_TOP.map(({ name, leads, views, color }, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 22px' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: '#1a1a1a', flex: 1, fontWeight: 500 }}>{name}</span>
                  <span style={{ fontSize: 11, color: '#2ab695', fontWeight: 600 }}>{leads} leads</span>
                  <span style={{ fontSize: 11, color: '#aaa' }}>{views}v</span>
                  <span style={{ fontSize: 11, color: '#ccc', minWidth: 16, textAlign: 'right' }}>#{i + 1}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Add property CTA */}
          <Link to="/properties/new" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: '#1a1a1a', color: '#fff',
            padding: '12px', borderRadius: 12, fontSize: 13, fontWeight: 600,
            textDecoration: 'none', transition: 'opacity 0.15s'
          }}>
            <Plus size={15} />
            Add property
            <ArrowUpRight size={13} style={{ opacity: 0.6 }} />
          </Link>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   ROOT COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [propertiesCount, setPropertiesCount] = useState(0)
  const [leadsCount, setLeadsCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.from('profiles').select('first_name, last_name, email, plan').eq('id', user.id).single(),
      supabase.from('properties').select('id', { count: 'exact' }).eq('agent_id', user.id),
      supabase.from('leads').select('id', { count: 'exact' }).eq('agent_id', user.id),
    ]).then(([p, props, leads]) => {
      setProfile(p.data as Profile)
      setPropertiesCount(props.count ?? 0)
      setLeadsCount(leads.count ?? 0)
      setLoading(false)
    })
  }, [user])

  const firstName = profile?.first_name ?? 'there'

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 979px) {
          .kpi-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .body-grid { grid-template-columns: 1fr !important; }
          .feature-grid { grid-template-columns: 1fr !important; }
          .hero-preview { display: none !important; }
        }
      `}</style>
      <div style={{ background: '#f9f9f9', minHeight: 'calc(100vh - 60px)' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 60px)' }}>
            <div style={{ width: 24, height: 24, border: '2px solid #e5e7eb', borderTopColor: '#2ab695', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          </div>
        ) : propertiesCount === 0 ? (
          <EmptyState firstName={firstName} />
        ) : (
          <ActiveState firstName={firstName} propertiesCount={propertiesCount} leadsCount={leadsCount} />
        )}
      </div>
    </>
  )
}
