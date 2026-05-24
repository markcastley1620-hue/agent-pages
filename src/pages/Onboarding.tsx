import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Check, ChevronRight, User, Building2, Palette, Bell,
  ArrowRight, Globe, Home, Bed,
  Bath, Maximize2, Camera, Upload
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import LocationPicker, { type LocationValue } from '../components/LocationPicker'
import { useAuth } from '../hooks/useAuth'

// ── Design tokens ─────────────────────────────────────────────────────────────
const COLORS = [
  { id: 'emerald', label: 'Emerald', hex: '#2d5a4f' },
  { id: 'navy', label: 'Navy', hex: '#1e3a5f' },
  { id: 'ruby', label: 'Ruby', hex: '#8b1a2c' },
  { id: 'amber', label: 'Amber', hex: '#b45309' },
  { id: 'violet', label: 'Violet', hex: '#5b21b6' },
  { id: 'slate', label: 'Slate', hex: '#334155' },
  { id: 'rose', label: 'Rose', hex: '#9f1239' },
]

const LANGUAGES = ['English', 'Arabic', 'French', 'Russian', 'Chinese', 'Hindi', 'Urdu']

const STEPS = [
  { id: 1, label: 'About You', icon: User },
  { id: 2, label: 'Brokerage', icon: Building2 },
  { id: 3, label: 'Brand', icon: Palette },
  { id: 4, label: 'Contact & Leads', icon: Bell },
]

interface ProfileForm {
  first_name: string
  last_name: string
  role: string
  tagline: string
  brokerage_name: string
  rera_number: string
  orn: string
  accent_color: string
  slug: string
  phone: string
  email: string
  languages: string[]
  areas: string[]
  whatsapp_alerts: boolean
  email_alerts: boolean
  push_alerts: boolean
}

// ── Welcome Screen ─────────────────────────────────────────────────────────────
function WelcomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <div style={{ minHeight: '100vh', background: '#fbfaf7', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', padding: '40px 24px' }}>
      <div style={{ width: 52, height: 52, borderRadius: 14, background: '#2d5a4f', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
        <Home size={24} color="#fff" />
      </div>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0f1419', letterSpacing: '-0.025em', marginBottom: 12, textAlign: 'center', margin: '0 0 12px' }}>
        Welcome to Agent Pages
      </h1>
      <p style={{ fontSize: 15, color: '#5a6470', maxWidth: 420, textAlign: 'center', lineHeight: 1.6, margin: '0 0 36px' }}>
        Let's set up your professional agent profile. It takes about 3 minutes and you'll have a live property page ready to share.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 40, width: '100%', maxWidth: 360 }}>
        {['Professional profile with your brand colours', 'Public portfolio page at your custom URL', 'Instant lead alerts via WhatsApp and email'].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#fff', borderRadius: 10, border: '1px solid #e6e8eb' }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: '#e8f0ed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Check size={12} color="#2d5a4f" />
            </div>
            <span style={{ fontSize: 13.5, color: '#0f1419', fontWeight: 500 }}>{item}</span>
          </div>
        ))}
      </div>
      <button
        onClick={onStart}
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 28px', background: '#2d5a4f', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.01em' }}
      >
        Get started <ArrowRight size={16} />
      </button>
    </div>
  )
}

// ── Live Preview ───────────────────────────────────────────────────────────────
function LivePreview({ form }: { form: ProfileForm }) {
  const accent = COLORS.find(c => c.id === form.accent_color)?.hex ?? '#2d5a4f'
  const name = [form.first_name, form.last_name].filter(Boolean).join(' ') || 'Your Name'
  const role = form.role || 'Real Estate Agent'
  const brokerage = form.brokerage_name || 'Your Brokerage'
  const slug = form.slug || 'yourname'

  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e6e8eb', overflow: 'hidden', fontFamily: 'Inter, sans-serif', fontSize: 13 }}>
      {/* Header */}
      <div style={{ background: accent, padding: '20px 20px 40px' }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 12, fontWeight: 500 }}>agentpages.io/{slug}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <User size={20} color="rgba(255,255,255,0.8)" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', letterSpacing: '-0.015em' }}>{name}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 1 }}>{role} · {brokerage}</div>
          </div>
        </div>
        {form.tagline && (
          <div style={{ marginTop: 12, fontSize: 12.5, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5, fontStyle: 'italic' }}>"{form.tagline}"</div>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', borderBottom: '1px solid #f0f2f4', padding: '0' }}>
        {[{ n: '24', l: 'Listings' }, { n: '98%', l: 'Satisfaction' }, { n: '12yr', l: 'Experience' }].map((s, i) => (
          <div key={i} style={{ flex: 1, padding: '12px 16px', textAlign: 'center', borderRight: i < 2 ? '1px solid #f0f2f4' : 'none' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f1419' }}>{s.n}</div>
            <div style={{ fontSize: 11, color: '#8b95a0', marginTop: 1 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Sample property card */}
      <div style={{ padding: '16px' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#8b95a0', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Featured Listing</div>
        <div style={{ borderRadius: 10, border: '1px solid #e6e8eb', overflow: 'hidden' }}>
          <div style={{ height: 80, background: 'linear-gradient(135deg, #f0f2f4, #e6e8eb)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Home size={24} color="#8b95a0" />
          </div>
          <div style={{ padding: '10px 12px' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#0f1419', marginBottom: 2 }}>2BR Apartment, Dubai Marina</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: accent, marginBottom: 6 }}>AED 2,400,000</div>
            <div style={{ display: 'flex', gap: 10, color: '#8b95a0', fontSize: 11 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Bed size={10} /> 2</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Bath size={10} /> 2</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Maximize2 size={10} /> 1,200 sqft</span>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: '0 16px 16px' }}>
        <button style={{ width: '100%', padding: '10px', background: accent, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
          Contact {form.first_name || 'Agent'}
        </button>
      </div>
    </div>
  )
}

// ── Chip input ────────────────────────────────────────────────────────────────
function ChipInput({ label, options, value, onChange }: {
  label: string
  options: string[]
  value: string[]
  onChange: (v: string[]) => void
}) {
  const toggle = (item: string) => {
    onChange(value.includes(item) ? value.filter(x => x !== item) : [...value, item])
  }
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#0f1419', marginBottom: 10, letterSpacing: '-0.005em' }}>{label}</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
        {options.map(opt => {
          const active = value.includes(opt)
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              style={{ padding: '6px 12px', borderRadius: 20, fontSize: 12.5, fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.15s', border: active ? '1.5px solid #2d5a4f' : '1.5px solid #e6e8eb', background: active ? '#e8f0ed' : '#fff', color: active ? '#2d5a4f' : '#5a6470' }}
            >
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Field ─────────────────────────────────────────────────────────────────────
// ── AreasPicker ───────────────────────────────────────────────────────────────
function AreasPicker({ label, value, onChange }: {
  label: string
  value: string[]
  onChange: (v: string[]) => void
}) {
  const [adding, setAdding] = useState(false)

  const remove = (area: string) => onChange(value.filter(a => a !== area))

  const handleSelect = (loc: LocationValue | null) => {
    if (!loc) return
    const name = loc.name
    if (!value.includes(name)) onChange([...value, name])
    setAdding(false)
  }

  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#0f1419', marginBottom: 10, letterSpacing: '-0.005em' }}>{label}</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 10 }}>
        {value.map(area => (
          <span key={area} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px 6px 12px',
            background: '#e8f0ed', borderRadius: 20, fontSize: 12.5, fontWeight: 500,
            color: '#2d5a4f', border: '1.5px solid #2d5a4f',
          }}>
            {area}
            <button
              type="button"
              onClick={() => remove(area)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2d5a4f', lineHeight: 1, padding: 0, fontSize: 14, display: 'flex', alignItems: 'center' }}
            >×</button>
          </span>
        ))}
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            style={{
              padding: '6px 12px', borderRadius: 20, fontSize: 12.5, fontWeight: 500,
              cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              border: '1.5px dashed #e6e8eb', background: '#fff', color: '#8b95a0',
            }}
          >+ Add area</button>
        )}
      </div>
      {adding && (
        <div>
          <LocationPicker
            value={null}
            onChange={handleSelect}
            filterTypes={['N', 'C']}
            placeholder="Search communities & sub-communities…"
          />
          <button
            type="button"
            onClick={() => setAdding(false)}
            style={{ marginTop: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#8b95a0', padding: 0, fontFamily: 'Inter, sans-serif' }}
          >Cancel</button>
        </div>
      )}
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#0f1419', marginBottom: hint ? 4 : 8, letterSpacing: '-0.005em' }}>{label}</label>
      {hint && <div style={{ fontSize: 12, color: '#8b95a0', marginBottom: 8 }}>{hint}</div>}
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 13px', border: '1.5px solid #e6e8eb', borderRadius: 9, fontSize: 13.5, color: '#0f1419', background: '#fff', fontFamily: 'Inter, sans-serif', outline: 'none', transition: 'border-color 0.15s', boxSizing: 'border-box'
}

// ── Step panels ───────────────────────────────────────────────────────────────
function StepAboutYou({ form, update }: { form: ProfileForm; update: (k: keyof ProfileForm, v: any) => void }) {
  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f1419', letterSpacing: '-0.02em', marginBottom: 6, margin: '0 0 6px' }}>About You</h2>
      <p style={{ fontSize: 13.5, color: '#5a6470', marginBottom: 28, margin: '0 0 28px' }}>Tell us a bit about yourself so we can set up your profile.</p>

      {/* Photo upload */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#0f1419', marginBottom: 10 }}>Profile photo</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f0f2f4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Camera size={22} color="#8b95a0" />
          </div>
          <div>
            <button type="button" style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', border: '1.5px solid #e6e8eb', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', background: '#fff', color: '#0f1419', fontFamily: 'Inter, sans-serif' }}>
              <Upload size={14} /> Upload photo
            </button>
            <div style={{ fontSize: 11.5, color: '#8b95a0', marginTop: 5 }}>JPG or PNG, max 5MB. Square crops work best.</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
        <Field label="First name">
          <input value={form.first_name} onChange={e => update('first_name', e.target.value)} style={inputStyle} placeholder="Sarah" />
        </Field>
        <Field label="Last name">
          <input value={form.last_name} onChange={e => update('last_name', e.target.value)} style={inputStyle} placeholder="Johnson" />
        </Field>
      </div>

      <Field label="Role / Title">
        <input value={form.role} onChange={e => update('role', e.target.value)} style={inputStyle} placeholder="Senior Property Consultant" />
      </Field>

      <Field label="Tagline" hint="A short line that appears under your name on your public page.">
        <textarea value={form.tagline} onChange={e => update('tagline', e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Helping families find their dream home in Dubai since 2012" />
      </Field>

      <ChipInput label="Languages spoken" options={LANGUAGES} value={form.languages} onChange={v => update('languages', v)} />
      <AreasPicker label="Areas you cover" value={form.areas} onChange={v => update('areas', v)} />
    </div>
  )
}

function StepBrokerage({ form, update }: { form: ProfileForm; update: (k: keyof ProfileForm, v: any) => void }) {
  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f1419', letterSpacing: '-0.02em', marginBottom: 6, margin: '0 0 6px' }}>Brokerage Details</h2>
      <p style={{ fontSize: 13.5, color: '#5a6470', marginBottom: 28, margin: '0 0 28px' }}>Add your brokerage and compliance information.</p>

      <Field label="Brokerage name">
        <input value={form.brokerage_name} onChange={e => update('brokerage_name', e.target.value)} style={inputStyle} placeholder="Luxury Properties LLC" />
      </Field>

      {/* Brokerage logo */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#0f1419', marginBottom: 10 }}>Brokerage logo</label>
        <div style={{ border: '1.5px dashed #e6e8eb', borderRadius: 10, padding: '20px', textAlign: 'center', background: '#fbfaf7' }}>
          <Upload size={20} color="#8b95a0" style={{ margin: '0 auto 8px' }} />
          <div style={{ fontSize: 13, color: '#5a6470', marginBottom: 4 }}>Drag & drop or click to upload</div>
          <div style={{ fontSize: 11.5, color: '#8b95a0' }}>PNG, SVG or JPG, transparent background preferred</div>
          <button type="button" style={{ marginTop: 12, padding: '7px 14px', border: '1.5px solid #e6e8eb', borderRadius: 7, fontSize: 12.5, cursor: 'pointer', background: '#fff', color: '#0f1419', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>Browse files</button>
        </div>
      </div>

      <div style={{ background: '#fbeee7', borderRadius: 10, padding: '14px 16px', marginBottom: 24, border: '1px solid #f5d5c8' }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: '#8b2500', marginBottom: 4 }}>RERA Compliance</div>
        <div style={{ fontSize: 12, color: '#a03520', lineHeight: 1.5 }}>These details will appear on your public page as required by RERA regulations.</div>
      </div>

      <Field label="RERA BRN" hint="Your individual Broker Registration Number">
        <input value={form.rera_number} onChange={e => update('rera_number', e.target.value)} style={inputStyle} placeholder="12345" />
      </Field>

      <Field label="ORN" hint="Office Registration Number of your brokerage">
        <input value={form.orn} onChange={e => update('orn', e.target.value)} style={inputStyle} placeholder="ORN-12345" />
      </Field>
    </div>
  )
}

function StepBrand({ form, update }: { form: ProfileForm; update: (k: keyof ProfileForm, v: any) => void }) {
  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f1419', letterSpacing: '-0.02em', marginBottom: 6, margin: '0 0 6px' }}>Brand & URL</h2>
      <p style={{ fontSize: 13.5, color: '#5a6470', marginBottom: 28, margin: '0 0 28px' }}>Choose your brand colour and the URL people will use to find you.</p>

      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#0f1419', marginBottom: 12 }}>Brand colour</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
          {COLORS.map(c => {
            const active = form.accent_color === c.id
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => update('accent_color', c.id)}
                title={c.label}
                style={{ aspectRatio: '1', borderRadius: 10, background: c.hex, border: active ? `3px solid ${c.hex}` : '3px solid transparent', outline: active ? '2px solid #fff' : '2px solid transparent', outlineOffset: -1, cursor: 'pointer', boxShadow: active ? `0 0 0 3px ${c.hex}` : 'none', transition: 'all 0.15s', position: 'relative' }}
              >
                {active && <Check size={14} color="#fff" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />}
              </button>
            )
          })}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          {COLORS.map(c => (
            <span key={c.id} style={{ fontSize: 11.5, color: form.accent_color === c.id ? '#0f1419' : '#8b95a0', fontWeight: form.accent_color === c.id ? 600 : 400 }}>{c.label}</span>
          ))}
        </div>
      </div>

      <Field label="Your page URL" hint="This is where people will find your public profile.">
        <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #e6e8eb', borderRadius: 9, overflow: 'hidden', background: '#fff' }}>
          <div style={{ padding: '10px 12px', background: '#f0f2f4', borderRight: '1.5px solid #e6e8eb', fontSize: 13, color: '#8b95a0', whiteSpace: 'nowrap', flexShrink: 0 }}>
            agentpages.io/
          </div>
          <input
            value={form.slug}
            onChange={e => update('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            style={{ ...inputStyle, border: 'none', borderRadius: 0, flex: 1 }}
            placeholder="sarah-johnson"
          />
        </div>
      </Field>

      {form.slug && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#e8f0ed', borderRadius: 8, marginTop: -8 }}>
          <Globe size={13} color="#2d5a4f" />
          <span style={{ fontSize: 12.5, color: '#2d5a4f', fontWeight: 500 }}>agentpages.io/{form.slug}</span>
          <span style={{ fontSize: 12, color: '#5a8f7c', marginLeft: 'auto' }}>✓ Available</span>
        </div>
      )}
    </div>
  )
}

function StepContact({ form, update }: { form: ProfileForm; update: (k: keyof ProfileForm, v: any) => void }) {
  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f1419', letterSpacing: '-0.02em', marginBottom: 6, margin: '0 0 6px' }}>Contact & Lead Alerts</h2>
      <p style={{ fontSize: 13.5, color: '#5a6470', marginBottom: 28, margin: '0 0 28px' }}>How should visitors reach you, and how do you want to receive leads?</p>

      <Field label="Phone / WhatsApp">
        <input value={form.phone} onChange={e => update('phone', e.target.value)} style={inputStyle} placeholder="+971 50 123 4567" />
      </Field>

      <Field label="Email address">
        <input value={form.email} onChange={e => update('email', e.target.value)} type="email" style={inputStyle} placeholder="sarah@luxuryproperties.ae" />
      </Field>

      <div style={{ marginTop: 24, marginBottom: 8 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0f1419', marginBottom: 4 }}>Lead notifications</div>
        <div style={{ fontSize: 12.5, color: '#5a6470', marginBottom: 16 }}>Get notified instantly when someone enquires through your page.</div>
        {[
          { key: 'whatsapp_alerts', label: 'WhatsApp alerts', desc: 'Instant message for every new lead', icon: '💬' },
          { key: 'email_alerts', label: 'Email digest', desc: 'Daily summary of all leads', icon: '📧' },
          { key: 'push_alerts', label: 'Browser push', desc: 'Desktop notifications (when online)', icon: '🔔' },
        ].map(({ key, label, desc, icon }) => {
          const val = form[key as keyof ProfileForm] as boolean
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', border: '1.5px solid', borderColor: val ? '#2d5a4f' : '#e6e8eb', borderRadius: 10, marginBottom: 10, background: val ? '#f7fbf9' : '#fff', cursor: 'pointer', transition: 'all 0.15s' }} onClick={() => update(key as keyof ProfileForm, !val)}>
              <span style={{ fontSize: 18, marginRight: 12 }}>{icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0f1419' }}>{label}</div>
                <div style={{ fontSize: 12, color: '#8b95a0', marginTop: 1 }}>{desc}</div>
              </div>
              <div style={{ width: 40, height: 22, borderRadius: 11, background: val ? '#2d5a4f' : '#e6e8eb', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: val ? 20 : 2, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Completion screen ──────────────────────────────────────────────────────────
function CompletionScreen({ form, onDashboard }: { form: ProfileForm; onDashboard: () => void }) {
  const accent = COLORS.find(c => c.id === form.accent_color)?.hex ?? '#2d5a4f'
  return (
    <div style={{ minHeight: '100vh', background: '#fbfaf7', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', padding: '40px 24px' }}>
      <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#e8f0ed', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        <Check size={28} color="#2d5a4f" />
      </div>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0f1419', letterSpacing: '-0.025em', textAlign: 'center', margin: '0 0 10px' }}>
        You're all set, {form.first_name || 'Agent'}!
      </h1>
      <p style={{ fontSize: 14.5, color: '#5a6470', maxWidth: 380, textAlign: 'center', lineHeight: 1.6, margin: '0 0 32px' }}>
        Your profile is live. Share it, add listings, and start collecting leads.
      </p>

      {form.slug && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', background: '#fff', borderRadius: 10, border: '1.5px solid #e6e8eb', marginBottom: 28 }}>
          <Globe size={16} color={accent} />
          <span style={{ fontSize: 14, fontWeight: 600, color: '#0f1419' }}>agentpages.io/{form.slug}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, maxWidth: 520, width: '100%', marginBottom: 32 }}>
        {[
          { icon: '🏠', label: 'Add your first property', href: '/properties/new' },
          { icon: '🎨', label: 'Customise your portfolio', href: '/portfolio/edit' },
          { icon: '📊', label: 'View your dashboard', href: '/dashboard' },
        ].map((item, i) => (
          <a key={i} href={item.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 12px', background: '#fff', borderRadius: 10, border: '1.5px solid #e6e8eb', textDecoration: 'none', color: '#0f1419', transition: 'border-color 0.15s' }}>
            <span style={{ fontSize: 24 }}>{item.icon}</span>
            <span style={{ fontSize: 12, fontWeight: 500, textAlign: 'center', lineHeight: 1.4 }}>{item.label}</span>
          </a>
        ))}
      </div>

      <button
        onClick={onDashboard}
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: accent, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
      >
        Go to Dashboard <ArrowRight size={15} />
      </button>
    </div>
  )
}

// ── Main Onboarding Component ─────────────────────────────────────────────────
export default function Onboarding() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [phase, setPhase] = useState<'welcome' | 'wizard' | 'done'>('welcome')
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<ProfileForm>({
    first_name: '',
    last_name: '',
    role: '',
    tagline: '',
    brokerage_name: '',
    rera_number: '',
    orn: '',
    accent_color: 'emerald',
    slug: '',
    phone: '',
    email: user?.email ?? '',
    languages: [],
    areas: [],
    whatsapp_alerts: true,
    email_alerts: true,
    push_alerts: false,
  })

  useEffect(() => {
    if (user?.email) update('email', user.email)
  }, [user])

  function update(k: keyof ProfileForm, v: any) {
    setForm(f => ({ ...f, [k]: v }))
  }

  async function handleNext() {
    if (step < 4) {
      setStep(s => s + 1)
    } else {
      await handleSave()
    }
  }

  async function handleSave() {
    if (!user) return
    setSaving(true)
    await supabase.from('profiles').upsert({
      id: user.id,
      first_name: form.first_name,
      last_name: form.last_name,
      role: form.role,
      tagline: form.tagline,
      brokerage_name: form.brokerage_name,
      rera_number: form.rera_number,
      orn: form.orn,
      accent_color: form.accent_color,
      slug: form.slug || `${form.first_name}-${form.last_name}`.toLowerCase().replace(/\s+/g, '-') || user.id,
      phone: form.phone,
      email: form.email,
      languages: form.languages,
      areas: form.areas,
      whatsapp_alerts: form.whatsapp_alerts,
      email_alerts: form.email_alerts,
      push_alerts: form.push_alerts,
      onboarding_complete: true,
    })
    setSaving(false)
    setPhase('done')
  }

  if (phase === 'welcome') return <WelcomeScreen onStart={() => setPhase('wizard')} />
  if (phase === 'done') return <CompletionScreen form={form} onDashboard={() => navigate('/dashboard')} />

  const completedSteps = step - 1
  const progress = (completedSteps / STEPS.length) * 100

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', background: '#fbfaf7', fontFamily: 'Inter, sans-serif', color: '#0f1419' }}>
      {/* Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', minHeight: 'calc(100vh - 60px)' }} className="wiz-grid">
        {/* Rail */}
        <div style={{ background: '#fff', borderRight: '1px solid #f0f2f4', padding: '32px 0', position: 'sticky', top: 0, alignSelf: 'start', height: 'calc(100vh - 60px)', overflowY: 'auto' }}>
          <div style={{ padding: '0 24px 20px', borderBottom: '1px solid #f0f2f4', marginBottom: 16 }}>
            <div style={{ fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8b95a0', fontWeight: 600, marginBottom: 4 }}>Setup progress</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#0f1419', letterSpacing: '-0.015em' }}>Profile wizard</div>
          </div>
          {/* Progress bar */}
          <div style={{ padding: '0 16px 20px', borderBottom: '1px solid #f0f2f4', marginBottom: 8 }}>
            <div style={{ height: 4, background: '#f0f2f4', borderRadius: 4 }}>
              <div style={{ height: '100%', background: '#2d5a4f', borderRadius: 4, width: `${progress}%`, transition: 'width 0.4s' }} />
            </div>
            <div style={{ fontSize: 11.5, color: '#8b95a0', marginTop: 6 }}>{completedSteps} of {STEPS.length} steps complete</div>
          </div>
          {/* Steps */}
          {STEPS.map(s => {
            const done = step > s.id
            const active = step === s.id
            const Icon = s.icon
            return (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', marginBottom: 2, borderRadius: 8, margin: '2px 8px', background: active ? '#f7fbf9' : 'transparent', cursor: done ? 'pointer' : 'default' }} onClick={() => done && setStep(s.id)}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: done ? '#2d5a4f' : active ? '#e8f0ed' : '#f0f2f4', border: active ? '2px solid #2d5a4f' : 'none' }}>
                  {done ? <Check size={13} color="#fff" /> : <Icon size={13} color={active ? '#2d5a4f' : '#8b95a0'} />}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: active ? 600 : 500, color: active ? '#0f1419' : done ? '#0f1419' : '#8b95a0' }}>{s.label}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Main split */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 0, alignItems: 'start' }} className="wiz-main-split">
          {/* Form */}
          <div style={{ padding: '40px', maxWidth: 560 }}>
            {step === 1 && <StepAboutYou form={form} update={update} />}
            {step === 2 && <StepBrokerage form={form} update={update} />}
            {step === 3 && <StepBrand form={form} update={update} />}
            {step === 4 && <StepContact form={form} update={update} />}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 24, borderTop: '1px solid #f0f2f4', marginTop: 8 }}>
              {step > 1 ? (
                <button onClick={() => setStep(s => s - 1)} style={{ padding: '10px 18px', border: '1.5px solid #e6e8eb', borderRadius: 9, fontSize: 13.5, fontWeight: 500, cursor: 'pointer', background: '#fff', color: '#0f1419', fontFamily: 'Inter, sans-serif' }}>
                  Back
                </button>
              ) : <div />}
              <button
                onClick={handleNext}
                disabled={saving}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 22px', background: '#2d5a4f', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', opacity: saving ? 0.7 : 1 }}
              >
                {saving ? 'Saving…' : step === 4 ? 'Finish setup' : <>Continue <ChevronRight size={15} /></>}
              </button>
            </div>
          </div>

          {/* Preview panel */}
          <div style={{ padding: '40px 32px 40px 0', position: 'sticky', top: 60 }} className="wiz-preview">
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8b95a0', marginBottom: 12 }}>Live preview</div>
            <LivePreview form={form} />
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1100px) {
          .wiz-grid { grid-template-columns: 1fr !important; }
          .wiz-grid > div:first-child { display: none; }
          .wiz-main-split { grid-template-columns: 1fr !important; }
          .wiz-preview { display: none; }
        }
        @media (max-width: 600px) {
          .wiz-grid > div:nth-child(2) > div { padding: 24px 16px !important; }
        }
      `}</style>
    </div>
  )
}
