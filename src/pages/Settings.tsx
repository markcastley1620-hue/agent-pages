import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User, Building2, Palette, Bell, Mail, CreditCard,
  FileText, Users, Zap, Key, Shield, HelpCircle, LogOut,
  Check, Upload, Camera, Globe, ChevronRight, Plus, ExternalLink,
  AlertTriangle, Trash2, RefreshCw, Copy
} from 'lucide-react'

import { supabase } from '../lib/supabase'
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
  { id: 'teal', label: 'Teal', hex: '#0d9488' },
  { id: 'indigo', label: 'Indigo', hex: '#4f46e5' },
  { id: 'fuchsia', label: 'Fuchsia', hex: '#a21caf' },
  { id: 'orange', label: 'Orange', hex: '#ea580c' },
  { id: 'cyan', label: 'Cyan', hex: '#0891b2' },
  { id: 'lime', label: 'Lime', hex: '#65a30d' },
  { id: 'pink', label: 'Pink', hex: '#db2777' },
  { id: 'gold', label: 'Gold', hex: '#b08f3a' },
  { id: 'charcoal', label: 'Charcoal', hex: '#1c1917' },
  { id: 'sky', label: 'Sky', hex: '#0284c7' },
  { id: 'forest', label: 'Forest', hex: '#166534' },
  { id: 'burgundy', label: 'Burgundy', hex: '#7f1d1d' },
  { id: 'cobalt', label: 'Cobalt', hex: '#1d4ed8' },
  { id: 'coral', label: 'Coral', hex: '#ef4444' },
]

const LANGUAGES = ['English', 'Arabic', 'French', 'Russian', 'Chinese', 'Hindi', 'Urdu']
const AREAS = ['Dubai Marina', 'Downtown Dubai', 'Palm Jumeirah', 'Business Bay', 'JBR', 'DIFC', 'Arabian Ranches', 'Meydan', 'Jumeirah', 'Al Barsha']

interface Profile {
  id?: string
  first_name: string
  last_name: string
  role: string
  tagline: string
  brokerage_name: string
  rera_number: string
  orn: string
  accent_color: string
  custom_color?: string
  slug: string
  phone: string
  email: string
  languages: string[]
  areas: string[]
  photo_url: string
  brokerage_logo_url: string
  hide_brokerage: boolean
  email_alerts: boolean
  push_alerts: boolean
}

const NAV_SECTIONS = [
  { id: 'profile', label: 'Profile & branding', icon: User },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'billing', label: 'Plan & billing', icon: CreditCard },
  { id: 'invoices', label: 'Invoices', icon: FileText },
  { id: 'leads', label: 'Lead alerts', icon: Bell },
  { id: 'email-prefs', label: 'Email prefs', icon: Mail },
  { id: 'team', label: 'Team members', icon: Users },
  { id: 'domain', label: 'Domain', icon: Globe },
  { id: 'integrations', label: 'Integrations', icon: Zap },
  { id: 'api', label: 'API', icon: Key },
  { id: 'rera', label: 'RERA compliance', icon: Building2 },
  { id: 'help', label: 'Help', icon: HelpCircle },
]

// ── Shared helpers ─────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', border: '1.5px solid #e6e8eb', borderRadius: 8, fontSize: 13.5,
  color: '#0f1419', background: '#fff', fontFamily: 'Inter, sans-serif', outline: 'none',
  transition: 'border-color 0.15s', boxSizing: 'border-box',
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e6e8eb', marginBottom: 16, overflow: 'hidden' }}>{children}</div>
}

function SectionHead({ title, desc }: { title: string; desc?: string }) {
  return (
    <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #f0f2f4' }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#0f1419', letterSpacing: '-0.01em' }}>{title}</div>
      {desc && <div style={{ fontSize: 12.5, color: '#8b95a0', marginTop: 2 }}>{desc}</div>}
    </div>
  )
}

function Field({ label, hint, children, half }: { label: string; hint?: string; children: React.ReactNode; half?: boolean }) {
  return (
    <div style={{ marginBottom: 16, flex: half ? '0 0 calc(50% - 8px)' : undefined }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#5a6470', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>
      {hint && <div style={{ fontSize: 12, color: '#8b95a0', marginBottom: 6 }}>{hint}</div>}
      {children}
    </div>
  )
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div onClick={() => onChange(!value)} style={{ width: 40, height: 22, borderRadius: 11, background: value ? '#2d5a4f' : '#e6e8eb', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: value ? 20 : 2, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
    </div>
  )
}

function ChipInput({ label, options, value, onChange }: { label: string; options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  const toggle = (item: string) => onChange(value.includes(item) ? value.filter(x => x !== item) : [...value, item])
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#5a6470', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
        {options.map(opt => {
          const active = value.includes(opt)
          return (
            <button key={opt} type="button" onClick={() => toggle(opt)} style={{ padding: '5px 11px', borderRadius: 20, fontSize: 12.5, fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.12s', border: active ? '1.5px solid #2d5a4f' : '1.5px solid #e6e8eb', background: active ? '#e8f0ed' : '#fff', color: active ? '#2d5a4f' : '#5a6470' }}>
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Profile section ────────────────────────────────────────────────────────────
function SectionProfile({ profile, update, onSave, saving, saved }: { profile: Profile; update: (k: keyof Profile, v: any) => void; onSave: () => void; saving: boolean; saved: boolean }) {
  return (
    <>
      {/* Identity */}
      <SectionCard>
        <SectionHead title="Identity" desc="Your name, photo, and public-facing description" />
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid #f0f2f4' }}>
            <div style={{ position: 'relative' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#f0f2f4', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {profile.photo_url ? <img src={profile.photo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Profile" /> : <Camera size={24} color="#8b95a0" />}
              </div>
            </div>
            <div>
              <button type="button" onClick={() => {
                const fileInput = document.createElement('input')
                fileInput.type = 'file'
                fileInput.accept = 'image/*'
                fileInput.onchange = async (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0]
                  if (!file) return
                  const ext = file.name.split('.').pop()
                  const path = `avatars/${profile.id}.${ext}`
                  const { error } = await supabase.storage.from('agent-assets').upload(path, file, { upsert: true })
                  if (!error) {
                    const { data: { publicUrl } } = supabase.storage.from('agent-assets').getPublicUrl(path)
                    update('photo_url', publicUrl)
                  }
                }
                fileInput.click()
              }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', border: '1.5px solid #e6e8eb', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', background: '#fff', color: '#0f1419', fontFamily: 'Inter, sans-serif', marginBottom: 6 }}>
                <Upload size={13} /> Change photo
              </button>
              <div style={{ fontSize: 11.5, color: '#8b95a0' }}>Square JPG or PNG, max 5MB</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
            <Field label="First name" half>
              <input value={profile.first_name} onChange={e => update('first_name', e.target.value)} style={inputStyle} placeholder="Sarah" />
            </Field>
            <Field label="Last name" half>
              <input value={profile.last_name} onChange={e => update('last_name', e.target.value)} style={inputStyle} placeholder="Johnson" />
            </Field>
          </div>
          <Field label="Role / Title">
            <input value={profile.role} onChange={e => update('role', e.target.value)} style={inputStyle} placeholder="Senior Property Consultant" />
          </Field>
          <Field label="Tagline">
            <textarea value={profile.tagline} onChange={e => update('tagline', e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Helping families find their dream home in Dubai since 2012" />
          </Field>
          <ChipInput label="Languages" options={LANGUAGES} value={profile.languages ?? []} onChange={v => update('languages', v)} />
          <ChipInput label="Areas" options={AREAS} value={profile.areas ?? []} onChange={v => update('areas', v)} />
        </div>
      </SectionCard>

      {/* Brokerage */}
      <SectionCard>
        <SectionHead title="Brokerage & Compliance" />
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid #f0f2f4' }}>
            <div style={{ width: 64, height: 40, borderRadius: 8, background: '#f0f2f4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={18} color="#8b95a0" />
            </div>
            <button type="button" onClick={() => {
                const fileInput = document.createElement('input')
                fileInput.type = 'file'
                fileInput.accept = 'image/*'
                fileInput.onchange = async (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0]
                  if (!file) return
                  const ext = file.name.split('.').pop()
                  const path = `logos/${profile.id}.${ext}`
                  const { error } = await supabase.storage.from('agent-assets').upload(path, file, { upsert: true })
                  if (!error) {
                    const { data: { publicUrl } } = supabase.storage.from('agent-assets').getPublicUrl(path)
                    update('brokerage_logo_url', publicUrl)
                  }
                }
                fileInput.click()
              }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', border: '1.5px solid #e6e8eb', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', background: '#fff', color: '#0f1419', fontFamily: 'Inter, sans-serif' }}>
              <Upload size={13} /> Upload brokerage logo
            </button>
          </div>
          <Field label="Brokerage name">
            <input value={profile.brokerage_name} onChange={e => update('brokerage_name', e.target.value)} style={inputStyle} placeholder="Luxury Properties LLC" />
          </Field>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f0f2f4', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 500, color: '#0f1419' }}>Hide brokerage info on public pages</div>
              <div style={{ fontSize: 12, color: '#8b95a0', marginTop: 1 }}>Hides brokerage name and logo from your portfolio page</div>
            </div>
            <Toggle value={profile.hide_brokerage} onChange={v => update('hide_brokerage', v)} />
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <Field label="RERA BRN" half>
              <input value={profile.rera_number} onChange={e => update('rera_number', e.target.value)} style={inputStyle} placeholder="12345" />
            </Field>
            <Field label="ORN" half>
              <input value={profile.orn} onChange={e => update('orn', e.target.value)} style={inputStyle} placeholder="ORN-12345" />
            </Field>
          </div>
        </div>
      </SectionCard>

      {/* Brand & URL */}
      <SectionCard>
        <SectionHead title="Brand & URL" />
        <div style={{ padding: '20px' }}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#5a6470', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Accent colour</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {COLORS.map(c => {
                const active = profile.accent_color === c.id
                return (
                  <button key={c.id} type="button" onClick={() => update('accent_color', c.id)} title={c.label} style={{ width: 32, height: 32, borderRadius: 8, background: c.hex, border: active ? `3px solid ${c.hex}` : '3px solid transparent', outline: active ? '2px solid #fff' : '2px solid transparent', outlineOffset: -1, cursor: 'pointer', boxShadow: active ? `0 0 0 3px ${c.hex}` : 'none', transition: 'all 0.15s', position: 'relative' }}>
                    {active && <Check size={13} color="#fff" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />}
                  </button>
                )
              })}
              <input
                type="color"
                title="Custom color"
                value={profile.custom_color ?? '#000000'}
                onChange={e => { update('custom_color', e.target.value); update('accent_color', 'custom') }}
                style={{ width: 32, height: 32, borderRadius: 8, border: profile.accent_color === 'custom' ? '3px solid #555' : '1.5px solid #e6e8eb', cursor: 'pointer', padding: 2, background: '#fff' }}
              />
            </div>
          </div>
          <Field label="Your page URL">
            <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #e6e8eb', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
              <div style={{ padding: '9px 12px', background: '#f0f2f4', borderRight: '1.5px solid #e6e8eb', fontSize: 13, color: '#8b95a0', whiteSpace: 'nowrap', flexShrink: 0 }}>agentpages.io/</div>
              <input value={profile.slug} onChange={e => update('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} style={{ ...inputStyle, border: 'none', borderRadius: 0, flex: 1 }} placeholder="sarah-johnson" />
            </div>
          </Field>
          {profile.slug && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#e8f0ed', borderRadius: 8 }}>
              <Globe size={13} color="#2d5a4f" />
              <span style={{ fontSize: 12.5, color: '#2d5a4f', fontWeight: 500, flex: 1 }}>agentpages.io/{profile.slug}</span>
              <a href={`/p/${profile.slug}`} target="_blank" rel="noopener noreferrer" style={{ color: '#2d5a4f' }}><ExternalLink size={13} /></a>
            </div>
          )}
        </div>
      </SectionCard>

      {/* Contact */}
      <SectionCard>
        <SectionHead title="Contact details" />
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', gap: 16 }}>
            <Field label="Phone / WhatsApp" half>
              <input value={profile.phone} onChange={e => update('phone', e.target.value)} style={inputStyle} placeholder="+971 50 123 4567" />
            </Field>
            <Field label="Public email" half>
              <input value={profile.email} onChange={e => update('email', e.target.value)} type="email" style={inputStyle} placeholder="sarah@agency.ae" />
            </Field>
          </div>
        </div>
      </SectionCard>

      <SaveBar saving={saving} saved={saved} onSave={onSave} />
    </>
  )
}

// ── Security section ───────────────────────────────────────────────────────────
function SectionSecurity() {
  return (
    <>
      <SectionCard>
        <SectionHead title="Change password" />
        <div style={{ padding: '20px' }}>
          <Field label="Current password"><input type="password" style={inputStyle} placeholder="••••••••" /></Field>
          <Field label="New password"><input type="password" style={inputStyle} placeholder="Min. 8 characters" /></Field>
          <Field label="Confirm new password"><input type="password" style={inputStyle} placeholder="••••••••" /></Field>
          <button style={{ padding: '9px 18px', background: '#2d5a4f', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Update password</button>
        </div>
      </SectionCard>
      <SectionCard>
        <SectionHead title="Two-factor authentication" desc="Add an extra layer of security to your account" />
        <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 500, color: '#0f1419' }}>Authenticator app</div>
            <div style={{ fontSize: 12.5, color: '#8b95a0', marginTop: 2 }}>Not enabled</div>
          </div>
          <button style={{ padding: '8px 16px', border: '1.5px solid #e6e8eb', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', background: '#fff', color: '#0f1419', fontFamily: 'Inter, sans-serif' }}>Enable 2FA</button>
        </div>
      </SectionCard>
      <SectionCard>
        <SectionHead title="Active sessions" />
        <div style={{ padding: '20px' }}>
          {[{ device: 'MacBook Pro · Dubai', time: 'Current session', active: true }, { device: 'iPhone 15 · Dubai', time: '2 hours ago', active: false }].map((s, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < 1 ? '1px solid #f0f2f4' : 'none' }}>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 500, color: '#0f1419' }}>{s.device}</div>
                <div style={{ fontSize: 12, color: '#8b95a0', marginTop: 1 }}>{s.time}</div>
              </div>
              {s.active ? <span style={{ fontSize: 11.5, fontWeight: 600, color: '#2d5a4f', background: '#e8f0ed', padding: '3px 8px', borderRadius: 6 }}>Current</span>
                : <button style={{ fontSize: 12.5, color: '#c2603a', cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'Inter, sans-serif' }}>Sign out</button>}
            </div>
          ))}
        </div>
      </SectionCard>
    </>
  )
}

// ── Appearance section ─────────────────────────────────────────────────────────
function SectionAppearance({ profile, update, onSave, saving, saved }: { profile: Profile; update: (k: keyof Profile, v: any) => void; onSave: () => void; saving: boolean; saved: boolean }) {
  return (
    <>
      <SectionCard>
        <SectionHead title="Theme colour" desc="Used on your public portfolio page" />
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginBottom: 16 }}>
            {COLORS.map(c => {
              const active = profile.accent_color === c.id
              return (
                <button key={c.id} type="button" onClick={() => update('accent_color', c.id)} title={c.label} style={{ aspectRatio: '1', borderRadius: 10, background: c.hex, border: active ? `3px solid ${c.hex}` : '3px solid transparent', outline: active ? '2px solid #fff' : '2px solid transparent', outlineOffset: -1, cursor: 'pointer', boxShadow: active ? `0 0 0 3px ${c.hex}` : 'none', transition: 'all 0.15s', position: 'relative' }}>
                  {active && <Check size={14} color="#fff" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />}
                </button>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {COLORS.map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: c.hex }} />
                <span style={{ fontSize: 12, color: profile.accent_color === c.id ? '#0f1419' : '#8b95a0', fontWeight: profile.accent_color === c.id ? 600 : 400 }}>{c.label}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#5a6470', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>Custom hex</label>
            <input
              type="color"
              value={profile.custom_color ?? '#000000'}
              onChange={e => { update('custom_color', e.target.value); update('accent_color', 'custom') }}
              style={{ width: 36, height: 36, border: '1.5px solid #e6e8eb', borderRadius: 8, cursor: 'pointer', padding: 2, background: '#fff' }}
            />
            <input
              type="text"
              placeholder="#1a2b3c"
              value={profile.accent_color === 'custom' ? (profile.custom_color ?? '') : ''}
              onChange={e => { const v = e.target.value; update('custom_color', v); if (/^#[0-9a-fA-F]{6}$/.test(v)) update('accent_color', 'custom') }}
              style={{ ...inputStyle, width: 110 }}
            />
            {profile.accent_color === 'custom' && profile.custom_color && (
              <div style={{ width: 32, height: 32, borderRadius: 8, background: profile.custom_color, border: '2px solid #e6e8eb', flexShrink: 0 }} />
            )}
          </div>
        </div>
      </SectionCard>
      <SaveBar saving={saving} saved={saved} onSave={onSave} />
    </>
  )
}

// ── Billing section ────────────────────────────────────────────────────────────
function SectionBilling() {
  return (
    <>
      <SectionCard>
        <SectionHead title="Current plan" />
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#0f1419', letterSpacing: '-0.02em' }}>Pro</div>
              <div style={{ fontSize: 13, color: '#5a6470', marginTop: 2 }}>AED 199 / month · Renews Jun 24, 2026</div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#2d5a4f', background: '#e8f0ed', padding: '4px 10px', borderRadius: 20 }}>Active</span>
          </div>
          {/* Usage */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12.5, color: '#5a6470' }}>Listings used</span>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: '#0f1419' }}>12 / 50</span>
            </div>
            <div style={{ height: 6, background: '#f0f2f4', borderRadius: 4 }}>
              <div style={{ height: '100%', width: '24%', background: '#2d5a4f', borderRadius: 4 }} />
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12.5, color: '#5a6470' }}>Lead credits</span>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: '#0f1419' }}>148 / 500</span>
            </div>
            <div style={{ height: 6, background: '#f0f2f4', borderRadius: 4 }}>
              <div style={{ height: '100%', width: '30%', background: '#2d5a4f', borderRadius: 4 }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={{ padding: '9px 16px', background: '#2d5a4f', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Upgrade plan</button>
            <button style={{ padding: '9px 16px', border: '1.5px solid #e6e8eb', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', background: '#fff', color: '#0f1419', fontFamily: 'Inter, sans-serif' }}>Cancel plan</button>
          </div>
        </div>
      </SectionCard>

      <SectionCard>
        <SectionHead title="Payment method" />
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', border: '1.5px solid #e6e8eb', borderRadius: 10, marginBottom: 12 }}>
            <div style={{ width: 40, height: 28, background: '#f0f2f4', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#5a6470' }}>VISA</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 500, color: '#0f1419' }}>Visa ending 4242</div>
              <div style={{ fontSize: 12, color: '#8b95a0', marginTop: 1 }}>Expires 12/27</div>
            </div>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: '#2d5a4f', background: '#e8f0ed', padding: '3px 8px', borderRadius: 6 }}>Default</span>
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 14px', border: '1.5px solid #e6e8eb', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', background: '#fff', color: '#0f1419', fontFamily: 'Inter, sans-serif' }}>
            <Plus size={14} /> Add payment method
          </button>
        </div>
      </SectionCard>
    </>
  )
}

// ── Invoices section ───────────────────────────────────────────────────────────
function SectionInvoices() {
  const invoices = [
    { date: 'May 24, 2026', amount: 'AED 199', status: 'Paid', id: 'INV-0024' },
    { date: 'Apr 24, 2026', amount: 'AED 199', status: 'Paid', id: 'INV-0023' },
    { date: 'Mar 24, 2026', amount: 'AED 199', status: 'Paid', id: 'INV-0022' },
  ]
  return (
    <SectionCard>
      <SectionHead title="Recent invoices" />
      <div>
        {invoices.map((inv, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', borderBottom: i < invoices.length - 1 ? '1px solid #f0f2f4' : 'none' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 500, color: '#0f1419' }}>{inv.id}</div>
              <div style={{ fontSize: 12, color: '#8b95a0', marginTop: 1 }}>{inv.date}</div>
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0f1419', marginRight: 16 }}>{inv.amount}</div>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: '#2d5a4f', background: '#e8f0ed', padding: '3px 8px', borderRadius: 6, marginRight: 12 }}>{inv.status}</span>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8b95a0', padding: 4 }}><ExternalLink size={14} /></button>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}

// ── Lead alerts section ────────────────────────────────────────────────────────
function SectionLeads({ profile, update, onSave, saving, saved }: { profile: Profile; update: (k: keyof Profile, v: any) => void; onSave: () => void; saving: boolean; saved: boolean }) {
  return (
    <>
      <SectionCard>
        <SectionHead title="Notification channels" desc="Choose how you receive lead alerts" />
        <div style={{ padding: '20px' }}>
          {[
            { key: 'push_alerts', label: 'Push notification', desc: 'Instant alerts via the app (requires PWA install)', icon: '🔔' },
            { key: 'email_alerts', label: 'Email notification', desc: 'HTML email alert for every new lead', icon: '📧' },
          ].map(({ key, label, desc, icon }, idx, arr) => {
            const val = profile[key as keyof Profile] as boolean
            return (
              <div key={key} style={{ display: 'flex', alignItems: 'center', padding: '14px 0', borderBottom: idx < arr.length - 1 ? '1px solid #f0f2f4' : 'none' }}>
                <span style={{ fontSize: 20, marginRight: 14 }}>{icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500, color: '#0f1419' }}>{label}</div>
                  <div style={{ fontSize: 12, color: '#8b95a0', marginTop: 1 }}>{desc}</div>
                </div>
                <Toggle value={val} onChange={v => update(key as keyof Profile, v)} />
              </div>
            )
          })}
        </div>
      </SectionCard>
      <SaveBar saving={saving} saved={saved} onSave={onSave} />
    </>
  )
}

// ── Email prefs ────────────────────────────────────────────────────────────────
function SectionEmailPrefs() {
  const [prefs, setPrefs] = useState({ product: true, tips: false, blog: false, security: true })
  const toggle = (k: keyof typeof prefs) => setPrefs(p => ({ ...p, [k]: !p[k] }))
  return (
    <SectionCard>
      <SectionHead title="Email preferences" desc="Control which emails you receive from Agent Pages" />
      <div style={{ padding: '20px' }}>
        {[
          { k: 'product', label: 'Product updates', desc: 'New features and improvements' },
          { k: 'tips', label: 'Tips & tricks', desc: 'How to get more leads from your page' },
          { k: 'blog', label: 'Dubai market insights', desc: 'Weekly market reports' },
          { k: 'security', label: 'Security alerts', desc: 'Important account security notifications' },
        ].map(({ k, label, desc }, i, arr) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', padding: '14px 0', borderBottom: i < arr.length - 1 ? '1px solid #f0f2f4' : 'none' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 500, color: '#0f1419' }}>{label}</div>
              <div style={{ fontSize: 12, color: '#8b95a0', marginTop: 1 }}>{desc}</div>
            </div>
            <Toggle value={prefs[k as keyof typeof prefs]} onChange={() => toggle(k as keyof typeof prefs)} />
          </div>
        ))}
      </div>
    </SectionCard>
  )
}

// ── Team members ───────────────────────────────────────────────────────────────
function SectionTeam() {
  const members = [
    { name: 'You (Owner)', email: 'sarah@agency.ae', role: 'Owner', initials: 'SJ' },
    { name: 'James Kim', email: 'james@agency.ae', role: 'Editor', initials: 'JK' },
  ]
  return (
    <>
      <SectionCard>
        <SectionHead title="Team members" desc="Manage who has access to your Agent Pages account" />
        <div>
          {members.map((m, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', borderBottom: i < members.length - 1 ? '1px solid #f0f2f4' : 'none' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#e8f0ed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, fontWeight: 700, color: '#2d5a4f', marginRight: 12, flexShrink: 0 }}>{m.initials}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 500, color: '#0f1419' }}>{m.name}</div>
                <div style={{ fontSize: 12, color: '#8b95a0', marginTop: 1 }}>{m.email}</div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: m.role === 'Owner' ? '#2d5a4f' : '#5a6470', background: m.role === 'Owner' ? '#e8f0ed' : '#f0f2f4', padding: '3px 10px', borderRadius: 20, marginRight: 12 }}>{m.role}</span>
              {m.role !== 'Owner' && <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c2603a', fontSize: 12.5, fontFamily: 'Inter, sans-serif' }}>Remove</button>}
            </div>
          ))}
        </div>
        <div style={{ padding: '16px 20px', borderTop: '1px solid #f0f2f4' }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', background: '#2d5a4f', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
            <Plus size={14} /> Invite member
          </button>
        </div>
      </SectionCard>
      <SectionCard>
        <SectionHead title="Role permissions" />
        <div style={{ padding: '20px' }}>
          {[
            { role: 'Owner', perms: 'Full access · billing · team management · danger zone' },
            { role: 'Editor', perms: 'Edit listings · manage leads · update profile' },
            { role: 'Viewer', perms: 'View only · no edits' },
          ].map((r, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: i < 2 ? '1px solid #f0f2f4' : 'none' }}>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: '#0f1419', width: 60, flexShrink: 0 }}>{r.role}</span>
              <span style={{ fontSize: 12.5, color: '#5a6470' }}>{r.perms}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </>
  )
}

// ── Integrations ───────────────────────────────────────────────────────────────
function SectionIntegrations() {
  const integrations = [
    { name: 'WhatsApp Business', desc: 'Show a WhatsApp button on your page and receive lead messages', icon: '💬', connected: true, color: '#25d366' },
    { name: 'Google Search Console', desc: 'See how your page ranks in search results', icon: '🔍', connected: false, color: '#4285f4' },
    { name: 'Google Calendar', desc: 'Sync property viewings with your calendar', icon: '📅', connected: false, color: '#0f9d58' },
    { name: 'Zapier', desc: 'Connect to 5,000+ apps and automate your workflow', icon: '⚡', connected: false, color: '#ff4a00' },
    { name: 'Stripe', desc: 'Accept rental deposits and booking fees online', icon: '💳', connected: false, color: '#635bff' },
  ]
  return (
    <SectionCard>
      <SectionHead title="Integrations" desc="Connect your favourite tools" />
      <div>
        {integrations.map((int, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: i < integrations.length - 1 ? '1px solid #f0f2f4' : 'none' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${int.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginRight: 14, flexShrink: 0 }}>{int.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0f1419' }}>{int.name}</div>
              <div style={{ fontSize: 12, color: '#8b95a0', marginTop: 1 }}>{int.desc}</div>
            </div>
            {int.connected ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: '#2d5a4f', background: '#e8f0ed', padding: '3px 8px', borderRadius: 6 }}>Connected</span>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8b95a0', fontSize: 12, fontFamily: 'Inter, sans-serif' }}>Disconnect</button>
              </div>
            ) : (
              <button style={{ padding: '8px 16px', border: '1.5px solid #e6e8eb', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', background: '#fff', color: '#0f1419', fontFamily: 'Inter, sans-serif' }}>Connect</button>
            )}
          </div>
        ))}
      </div>
    </SectionCard>
  )
}

// ── API section ────────────────────────────────────────────────────────────────
function SectionAPI() {
  const [revealed, setRevealed] = useState(false)
  const apiKey = 'sk_live_ap_••••••••••••••••••••••••••••••••'
  return (
    <>
      <SectionCard>
        <SectionHead title="API key" desc="Use the Agent Pages API to build custom integrations" />
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ flex: 1, padding: '10px 14px', background: '#f0f2f4', borderRadius: 8, fontFamily: 'monospace', fontSize: 13, color: '#5a6470', letterSpacing: '0.02em' }}>
              {revealed ? 'sk_live_ap_abcdef123456789012345678901234' : apiKey}
            </div>
            <button onClick={() => setRevealed(r => !r)} style={{ padding: '9px 14px', border: '1.5px solid #e6e8eb', borderRadius: 8, fontSize: 13, cursor: 'pointer', background: '#fff', color: '#0f1419', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
              {revealed ? 'Hide' : 'Reveal'}
            </button>
            <button style={{ padding: '9px', border: '1.5px solid #e6e8eb', borderRadius: 8, cursor: 'pointer', background: '#fff', color: '#5a6470', display: 'flex', alignItems: 'center' }}>
              <Copy size={14} />
            </button>
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', border: '1.5px solid #fbeee7', borderRadius: 8, fontSize: 13, cursor: 'pointer', background: '#fbeee7', color: '#c2603a', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
            <RefreshCw size={13} /> Regenerate key
          </button>
          <div style={{ marginTop: 12, fontSize: 12, color: '#8b95a0' }}>Keep this key secret. If compromised, regenerate it immediately.</div>
        </div>
      </SectionCard>
      <SectionCard>
        <SectionHead title="API docs" />
        <div style={{ padding: '20px' }}>
          <a href="https://docs.agentpages.io/api" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: '#2d5a4f', fontWeight: 500, textDecoration: 'none' }}>
            <ExternalLink size={15} /> View API documentation
          </a>
        </div>
      </SectionCard>
    </>
  )
}

// ── RERA section ───────────────────────────────────────────────────────────────
function SectionRERA({ profile, update, onSave, saving, saved }: { profile: Profile; update: (k: keyof Profile, v: any) => void; onSave: () => void; saving: boolean; saved: boolean }) {
  return (
    <>
      <div style={{ background: '#fbeee7', borderRadius: 10, padding: '14px 16px', marginBottom: 16, border: '1px solid #f5d5c8', display: 'flex', gap: 10 }}>
        <AlertTriangle size={16} color="#c2603a" style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#8b2500', marginBottom: 3 }}>Required by law</div>
          <div style={{ fontSize: 12.5, color: '#a03520', lineHeight: 1.5 }}>Your RERA BRN and brokerage ORN must be displayed on all property marketing materials, including your Agent Pages portfolio.</div>
        </div>
      </div>
      <SectionCard>
        <SectionHead title="RERA credentials" />
        <div style={{ padding: '20px' }}>
          <Field label="Broker Registration Number (BRN)" hint="Your individual RERA registration number">
            <input value={profile.rera_number} onChange={e => update('rera_number', e.target.value)} style={inputStyle} placeholder="12345" />
          </Field>
          <Field label="Office Registration Number (ORN)" hint="Your brokerage's registration number">
            <input value={profile.orn} onChange={e => update('orn', e.target.value)} style={inputStyle} placeholder="ORN-12345" />
          </Field>
          <Field label="Brokerage name (as registered)">
            <input value={profile.brokerage_name} onChange={e => update('brokerage_name', e.target.value)} style={inputStyle} placeholder="Luxury Properties LLC" />
          </Field>
        </div>
      </SectionCard>
      <SaveBar saving={saving} saved={saved} onSave={onSave} />
    </>
  )
}

// ── Help section ───────────────────────────────────────────────────────────────
function SectionHelp() {
  return (
    <SectionCard>
      <SectionHead title="Help & support" />
      <div>
        {[
          { icon: '📖', label: 'Documentation', desc: 'Browse guides and tutorials', href: '#' },
          { icon: '💬', label: 'Live chat', desc: 'Chat with our support team', href: '#' },
          { icon: '📧', label: 'Email support', desc: 'support@agentpages.io', href: '#' },
          { icon: '🎥', label: 'Video tutorials', desc: 'Watch how-to videos', href: '#' },
        ].map((item, i, arr) => (
          <a key={i} href={item.href} style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', borderBottom: i < arr.length - 1 ? '1px solid #f0f2f4' : 'none', textDecoration: 'none', color: 'inherit' }}>
            <span style={{ fontSize: 20, marginRight: 14 }}>{item.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 500, color: '#0f1419' }}>{item.label}</div>
              <div style={{ fontSize: 12, color: '#8b95a0', marginTop: 1 }}>{item.desc}</div>
            </div>
            <ChevronRight size={15} color="#8b95a0" />
          </a>
        ))}
      </div>
    </SectionCard>
  )
}

// ── Save bar ───────────────────────────────────────────────────────────────────
function SaveBar({ saving, saved, onSave }: { saving: boolean; saved: boolean; onSave: () => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 0 16px' }}>
      <button onClick={onSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', background: saved ? '#2d5a4f' : '#2d5a4f', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', opacity: saving ? 0.7 : 1, transition: 'all 0.2s' }}>
        {saving ? <><RefreshCw size={14} className="animate-spin" /> Saving…</> : saved ? <><Check size={14} /> Saved!</> : 'Save changes'}
      </button>
    </div>
  )
}

// ── Danger zone ────────────────────────────────────────────────────────────────
function DangerZone() {
  return (
    <div style={{ marginTop: 32, borderRadius: 12, border: '1.5px solid #fad4c8', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', background: '#fbeee7', borderBottom: '1px solid #fad4c8' }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: '#8b2500' }}>Danger zone</div>
      </div>
      <div style={{ padding: '20px', background: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 500, color: '#0f1419' }}>Close account</div>
            <div style={{ fontSize: 12.5, color: '#8b95a0', marginTop: 2 }}>Permanently delete your account, all listings, and leads. This cannot be undone.</div>
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', border: '1.5px solid #fad4c8', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', background: '#fff', color: '#c2603a', fontFamily: 'Inter, sans-serif' }}>
            <Trash2 size={13} /> Close account
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Settings component ────────────────────────────────────────────────────
export default function Settings() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [profile, setProfile] = useState<Profile>({
    first_name: '', last_name: '', role: '', tagline: '',
    brokerage_name: '', rera_number: '', orn: '',
    accent_color: 'emerald', slug: '', phone: '', email: '',
    languages: [], areas: [],
    photo_url: '', brokerage_logo_url: '',
    hide_brokerage: false, email_alerts: true, push_alerts: false,
  })

  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
      if (data) {
        setProfile(prev => ({
          ...prev,
          first_name: data.first_name ?? '',
          last_name: data.last_name ?? '',
          role: data.role ?? '',
          tagline: data.tagline ?? '',
          brokerage_name: data.brokerage_name ?? '',
          rera_number: data.rera_number ?? '',
          orn: data.orn ?? '',
          accent_color: data.accent_color ?? 'emerald',
          slug: data.slug ?? '',
          phone: data.phone ?? '',
          email: data.email ?? user.email ?? '',
          languages: data.languages ?? [],
          areas: data.areas ?? [],
          photo_url: data.photo_url ?? '',
          brokerage_logo_url: data.brokerage_logo_url ?? '',
          hide_brokerage: data.hide_brokerage ?? false,
          email_alerts: data.email_alerts ?? true,
          push_alerts: data.push_alerts ?? false,
        }))
      }
      setLoading(false)
    })
  }, [user])

  function update(k: keyof Profile, v: any) {
    setProfile(p => ({ ...p, [k]: v }))
  }

  async function handleSave() {
    if (!user) return
    setSaving(true)
    await supabase.from('profiles').upsert({
      id: user.id,
      first_name: profile.first_name,
      last_name: profile.last_name,
      role: profile.role,
      tagline: profile.tagline,
      brokerage_name: profile.brokerage_name,
      rera_number: profile.rera_number,
      orn: profile.orn,
      accent_color: profile.accent_color,
      slug: profile.slug,
      phone: profile.phone,
      email: profile.email,
      languages: profile.languages,
      areas: profile.areas,
      hide_brokerage: profile.hide_brokerage,
      email_alerts: profile.email_alerts,
      push_alerts: profile.push_alerts,
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px' }}>
        <div style={{ width: 24, height: 24, border: '2px solid #2d5a4f', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      </div>
    )
  }

  const renderSection = () => {
    const props = { profile, update, onSave: handleSave, saving, saved }
    switch (activeSection) {
      case 'profile': return <SectionProfile {...props} />
      case 'security': return <SectionSecurity />
      case 'appearance': return <SectionAppearance {...props} />
      case 'billing': return <SectionBilling />
      case 'invoices': return <SectionInvoices />
      case 'leads': return <SectionLeads {...props} />
      case 'email-prefs': return <SectionEmailPrefs />
      case 'team': return <SectionTeam />
      case 'integrations': return <SectionIntegrations />
      case 'api': return <SectionAPI />
      case 'rera': return <SectionRERA {...props} />
      case 'help': return <SectionHelp />
      default: return null
    }
  }

  const currentSection = NAV_SECTIONS.find(s => s.id === activeSection)

  return (
    <>
      <div style={{ display: 'flex', minHeight: '100%', fontFamily: 'Inter, sans-serif', color: '#0f1419' }}>
        {/* Settings sidebar */}
        <div className="settings-sidebar" style={{ width: 220, borderRight: '1px solid #f0f2f4', background: '#fff', flexShrink: 0, position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}>
          <div style={{ padding: '20px 16px 12px' }}>
            <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, color: '#8b95a0', marginBottom: 12 }}>Settings</div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {NAV_SECTIONS.map(({ id, label, icon: Icon }) => {
                const active = activeSection === id
                return (
                  <button
                    key={id}
                    onClick={() => { if (id === 'domain') { navigate('/settings/domain'); return; } setActiveSection(id); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, fontSize: 13, fontWeight: active ? 600 : 400, cursor: 'pointer', background: active ? '#e8f0ed' : 'transparent', color: active ? '#2d5a4f' : '#5a6470', border: 'none', fontFamily: 'Inter, sans-serif', textAlign: 'left', width: '100%', transition: 'all 0.12s' }}
                  >
                    <Icon size={14} />
                    {label}
                  </button>
                )
              })}
              <div style={{ height: 1, background: '#f0f2f4', margin: '8px 0' }} />
              <button onClick={handleSignOut} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, fontSize: 13, cursor: 'pointer', background: 'transparent', color: '#c2603a', border: 'none', fontFamily: 'Inter, sans-serif', textAlign: 'left', width: '100%', fontWeight: 400 }}>
                <LogOut size={14} /> Sign out
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 28px' }}>
            {/* Mobile header */}
            <div className="settings-mobile-header" style={{ display: 'none', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: '#0f1419', letterSpacing: '-0.015em', margin: 0 }}>{currentSection?.label}</h1>
              <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ padding: '7px 12px', border: '1.5px solid #e6e8eb', borderRadius: 8, fontSize: 12.5, cursor: 'pointer', background: '#fff', fontFamily: 'Inter, sans-serif', color: '#0f1419', fontWeight: 500 }}>Menu</button>
            </div>

            {/* Desktop header */}
            <div style={{ marginBottom: 28 }} className="settings-desktop-header">
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f1419', letterSpacing: '-0.02em', margin: '0 0 4px' }}>{currentSection?.label}</h1>
            </div>

            {renderSection()}

            {activeSection === 'profile' && <DangerZone />}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 980px) {
          .settings-sidebar { display: none !important; }
          .settings-mobile-header { display: flex !important; }
          .settings-desktop-header { display: none; }
        }
      `}</style>
    </>
  )
}
