import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  :root {
    --ink: #0f1419;
    --muted: #5a6470;
    --quiet: #8b95a0;
    --line: #e6e8eb;
    --line-soft: #f0f2f4;
    --paper-warm: #fbfaf7;
    --accent: #2d5a4f;
    --accent-hover: #234a40;
    --accent-soft: #e8f0ed;
    --signal: #c2603a;
  }
  .signup-page * { box-sizing: border-box; font-family: 'Inter', sans-serif; }
  .signup-page {
    min-height: 100vh; display: grid; grid-template-columns: 1fr 1.05fr;
  }
  /* ── LEFT PANEL ── */
  .signup-left {
    background: #fff; display: flex; flex-direction: column;
    align-items: center; justify-content: center; padding: 48px 32px;
    min-height: 100vh;
  }
  .signup-form-wrap { width: 100%; max-width: 440px; }
  .trial-pill {
    display: inline-flex; align-items: center; gap: 7px;
    background: #edf7f0; border: 1px solid #c3e6ce; border-radius: 99px;
    padding: 5px 12px; font-size: 12.5px; color: #1e6e3e; font-weight: 500;
    margin-bottom: 22px;
  }
  .trial-pill-dot { color: #22a855; font-size: 14px; }
  .signup-eyebrow {
    font-size: 11px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase;
    color: var(--accent); margin-bottom: 6px;
  }
  .signup-title {
    font-size: 32px; font-weight: 800; color: var(--ink); letter-spacing: -0.025em;
    margin: 0 0 24px; line-height: 1.15;
  }
  .signup-title .accent-word { color: var(--accent); }
  .sso-btn {
    width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px;
    border: 1.5px solid var(--line); border-radius: 9px; background: #fff;
    padding: 11px 16px; font-size: 14px; font-weight: 500; color: var(--ink);
    cursor: pointer; transition: border-color 0.15s, box-shadow 0.15s;
    margin-bottom: 10px;
  }
  .sso-btn:hover { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(45,90,79,0.07); }
  .divider {
    display: flex; align-items: center; gap: 12px; margin: 18px 0;
  }
  .divider-line { flex: 1; height: 1px; background: var(--line); }
  .divider-text { font-size: 12px; color: var(--quiet); white-space: nowrap; }
  .field { margin-bottom: 14px; }
  .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px; }
  .field-label { font-size: 13px; font-weight: 500; color: var(--ink); margin-bottom: 6px; display: block; }
  .field input[type="email"], .field input[type="text"], .field input[type="password"] {
    width: 100%; border: 1.5px solid var(--line); border-radius: 9px;
    padding: 10px 14px; font-size: 14px; color: var(--ink);
    outline: none; background: #fff; transition: border-color 0.15s, box-shadow 0.15s;
  }
  .field input:focus {
    border-color: var(--accent); box-shadow: 0 0 0 3px rgba(45,90,79,0.08);
  }
  .field input::placeholder { color: var(--quiet); }
  .field input.has-toggle { padding-right: 44px; }
  .input-wrap { position: relative; }
  .toggle-btn {
    position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer; color: var(--quiet);
    padding: 2px; display: flex; align-items: center;
  }
  .toggle-btn:hover { color: var(--muted); }
  /* Password strength bars */
  .strength-bars { display: flex; gap: 4px; margin-top: 7px; }
  .strength-bar {
    flex: 1; height: 3px; border-radius: 2px; background: var(--line-soft);
    transition: background 0.2s;
  }
  .strength-bar.weak { background: var(--signal); }
  .strength-bar.medium { background: #e2a630; }
  .strength-bar.strong { background: var(--accent); }
  /* URL handle field */
  .url-input-wrap {
    display: flex; align-items: stretch; border: 1.5px solid var(--line);
    border-radius: 9px; overflow: hidden; transition: border-color 0.15s, box-shadow 0.15s;
  }
  .url-input-wrap:focus-within {
    border-color: var(--accent); box-shadow: 0 0 0 3px rgba(45,90,79,0.08);
  }
  .url-prefix {
    background: var(--line-soft); border-right: 1.5px solid var(--line);
    padding: 10px 12px; font-size: 13px; color: var(--quiet); white-space: nowrap;
    display: flex; align-items: center;
  }
  .url-input-wrap input {
    flex: 1; border: none !important; border-radius: 0 !important;
    box-shadow: none !important; outline: none; padding: 10px 12px;
    font-size: 14px; color: var(--ink); background: #fff;
  }
  .submit-btn {
    width: 100%; background: var(--accent); color: #fff; border: none;
    border-radius: 9px; padding: 12px 20px; font-size: 15px; font-weight: 600;
    cursor: pointer; transition: background 0.15s, box-shadow 0.18s, transform 0.12s;
    letter-spacing: -0.01em; margin-top: 4px;
  }
  .submit-btn:hover:not(:disabled) {
    background: var(--accent-hover);
    box-shadow: 0 4px 16px rgba(45,90,79,0.22);
    transform: translateY(-1px);
  }
  .submit-btn:active:not(:disabled) { transform: translateY(0); }
  .submit-btn:disabled { opacity: 0.55; cursor: not-allowed; }
  .terms-text { font-size: 12px; color: var(--quiet); text-align: center; margin-top: 12px; line-height: 1.6; }
  .terms-text a { color: var(--muted); text-decoration: underline; }
  .signin-link { text-align: center; margin-top: 16px; font-size: 13.5px; color: var(--muted); }
  .signin-link a { color: var(--accent); font-weight: 500; text-decoration: none; }
  .signin-link a:hover { text-decoration: underline; }
  .error-box {
    background: #fef2f0; border: 1px solid #fad4cc; color: var(--signal);
    font-size: 13.5px; padding: 10px 14px; border-radius: 9px; margin-bottom: 14px;
  }
  /* ── RIGHT PANEL ── */
  .signup-right {
    background: linear-gradient(145deg, #1a2e28 0%, #0f1f1a 55%, #142920 100%);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 60px 48px; position: relative; overflow: hidden;
  }
  .signup-right::before {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(ellipse 60% 50% at 80% 20%, rgba(45,90,79,0.35) 0%, transparent 70%);
    pointer-events: none;
  }
  .signup-right-inner { position: relative; z-index: 1; max-width: 420px; width: 100%; }
  .right-eyebrow {
    display: flex; align-items: center; gap: 8px;
    font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.55);
    letter-spacing: 0.04em; text-transform: uppercase; margin-bottom: 16px;
  }
  .pulse-dot {
    width: 8px; height: 8px; border-radius: 50%; background: #22c55e;
    box-shadow: 0 0 0 0 rgba(34,197,94,0.4);
    animation: pulse-anim 2s ease-in-out infinite;
  }
  @keyframes pulse-anim {
    0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.4); }
    50% { box-shadow: 0 0 0 6px rgba(34,197,94,0); }
  }
  .right-headline {
    font-size: 30px; font-weight: 700; color: #fff; line-height: 1.25;
    letter-spacing: -0.02em; margin: 0 0 28px;
  }
  /* Preview card */
  .preview-card {
    background: #fff; border-radius: 14px; overflow: hidden;
    box-shadow: 0 8px 40px rgba(0,0,0,0.4); margin-bottom: 28px;
  }
  .preview-hero {
    height: 100px;
    background: linear-gradient(135deg, #2d5a4f 0%, #1a3d35 50%, #0f2820 100%);
    position: relative; display: flex; align-items: flex-end; padding: 12px;
  }
  .preview-hero-text { color: rgba(255,255,255,0.9); font-size: 12px; font-weight: 600; }
  .preview-hero-sub { color: rgba(255,255,255,0.6); font-size: 10px; margin-top: 1px; }
  .preview-avatar {
    position: absolute; top: 12px; right: 12px;
    width: 36px; height: 36px; border-radius: 50%; background: #e8f0ed;
    border: 2px solid rgba(255,255,255,0.3);
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; font-weight: 700; color: var(--accent);
  }
  .preview-body { padding: 12px 14px; }
  .preview-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
  .preview-label { font-size: 11px; color: var(--quiet); font-weight: 500; }
  .preview-value { font-size: 11px; color: var(--ink); font-weight: 600; }
  .preview-dots { display: flex; gap: 4px; margin-top: 4px; }
  .preview-dot { width: 20px; height: 3px; border-radius: 2px; background: var(--accent); opacity: 0.3; }
  .preview-dot:first-child { opacity: 1; }
  /* Feature bullets */
  .feature-list { list-style: none; padding: 0; margin: 0 0 24px; display: flex; flex-direction: column; gap: 10px; }
  .feature-item { display: flex; align-items: center; gap: 10px; color: rgba(255,255,255,0.78); font-size: 13.5px; }
  .feature-check {
    width: 20px; height: 20px; border-radius: 50%; background: rgba(45,90,79,0.5);
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .feature-check svg { color: #6ee7b7; }
  /* Discoverable row */
  .discoverable-label { font-size: 11px; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 10px; }
  .discoverable-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .disc-badge {
    background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.12);
    border-radius: 6px; padding: 5px 10px; font-size: 11.5px; color: rgba(255,255,255,0.65); font-weight: 500;
  }
  @media (max-width: 900px) {
    .signup-page { grid-template-columns: 1fr; }
    .signup-right { display: none; }
  }
  @media (max-width: 600px) {
    .signup-left { padding: 32px 16px; }
  }
`

function getStrength(pw: string): 0 | 1 | 2 | 3 {
  if (!pw) return 0
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
  if (/[0-9]/.test(pw) && /[^a-zA-Z0-9]/.test(pw)) score++
  return score as 0 | 1 | 2 | 3
}

function slugify(name: string) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export default function Signup() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    slug: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))
  }

  const strength = getStrength(form.password)
  const barClasses = (bar: number) => {
    if (strength === 0) return 'strength-bar'
    if (strength === 1) return bar === 1 ? 'strength-bar weak' : 'strength-bar'
    if (strength === 2) return bar <= 2 ? 'strength-bar medium' : 'strength-bar'
    return 'strength-bar strong'
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    })
    if (authError) { setError(authError.message); setLoading(false); return }

    const userId = authData.user?.id ?? authData.session?.user?.id
    if (!userId) { setError('Signup succeeded but could not retrieve user. Please try logging in.'); setLoading(false); return }

    const slug = form.slug || slugify(`${form.firstName} ${form.lastName}`)

    const { error: profileError } = await supabase.from('profiles').insert({
      id: userId,
      display_name: `${form.firstName} ${form.lastName}`.trim(),
      email: form.email,
      slug,
    })
    if (profileError && profileError.code !== '23505') {
      setError(profileError.message); setLoading(false); return
    }

    const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    await supabase.from('entitlements').insert({
      agent_id: userId,
      plan: 'pro',
      property_limit: 999,
      portfolio_enabled: true,
      trial_ends_at: trialEnd,
      active: true,
    })

    setLoading(false)
    navigate('/onboarding')
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="signup-page">
        {/* ── LEFT ── */}
        <div className="signup-left">
          <div className="signup-form-wrap">
            <div className="trial-pill">
              <span className="trial-pill-dot">✓</span>
              14-day Pro trial · no card required
            </div>
            <div className="signup-eyebrow">Welcome to Agent Pages</div>
            <h1 className="signup-title">
              Build your <span className="accent-word">agent brand.</span>
            </h1>

            {/* SSO */}
            <button type="button" className="sso-btn" onClick={() => {}}>
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-3.59-13.46-8.83l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Continue with Google
            </button>
            <button type="button" className="sso-btn" onClick={() => {}}>
              <svg width="18" height="18" viewBox="0 0 814 1000" fill="currentColor">
                <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 630.4 0 504.5 0 383.8c0-193.7 126.4-296.1 250.8-296.1 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"/>
              </svg>
              Continue with Apple
            </button>

            <div className="divider">
              <div className="divider-line" />
              <span className="divider-text">or with email</span>
              <div className="divider-line" />
            </div>

            <form onSubmit={handleSubmit}>
              {error && <div className="error-box">{error}</div>}

              {/* Name row */}
              <div className="field-row">
                <div>
                  <label className="field-label">First name</label>
                  <div className="input-wrap">
                    <input
                      type="text"
                      value={form.firstName}
                      onChange={set('firstName')}
                      required
                      placeholder="James"
                      style={{border: '1.5px solid var(--line)', borderRadius: '9px', padding: '10px 14px', fontSize: '14px', width: '100%', outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s'}}
                      onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(45,90,79,0.08)' }}
                      onBlur={e => { e.target.style.borderColor = 'var(--line)'; e.target.style.boxShadow = 'none' }}
                    />
                  </div>
                </div>
                <div>
                  <label className="field-label">Last name</label>
                  <div className="input-wrap">
                    <input
                      type="text"
                      value={form.lastName}
                      onChange={set('lastName')}
                      required
                      placeholder="Wilson"
                      style={{border: '1.5px solid var(--line)', borderRadius: '9px', padding: '10px 14px', fontSize: '14px', width: '100%', outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s'}}
                      onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(45,90,79,0.08)' }}
                      onBlur={e => { e.target.style.borderColor = 'var(--line)'; e.target.style.boxShadow = 'none' }}
                    />
                  </div>
                </div>
              </div>

              <div className="field">
                <label className="field-label">Work email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  required
                  placeholder="you@agency.com"
                />
              </div>

              <div className="field">
                <label className="field-label">Password</label>
                <div className="input-wrap">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={set('password')}
                    required
                    minLength={8}
                    placeholder="Min 8 characters"
                    className="has-toggle"
                  />
                  <button
                    type="button"
                    className="toggle-btn"
                    onClick={() => setShowPassword(v => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
                {form.password.length > 0 && (
                  <div className="strength-bars">
                    <div className={barClasses(1)} />
                    <div className={barClasses(2)} />
                    <div className={barClasses(3)} />
                    <div className={barClasses(4)} />
                  </div>
                )}
              </div>

              <div className="field">
                <label className="field-label">Your Agent Pages URL</label>
                <div className="url-input-wrap">
                  <span className="url-prefix">agentpages.io/</span>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={set('slug')}
                    placeholder={form.firstName ? slugify(`${form.firstName}-${form.lastName}`) : 'your-name'}
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? 'Creating your account…' : 'Create your account →'}
              </button>
            </form>

            <p className="terms-text">
              By creating an account you agree to our{' '}
              <a href="/terms">Terms of Service</a> and{' '}
              <a href="/privacy">Privacy Policy</a>.
            </p>
            <div className="signin-link">
              Already have an account? <Link to="/login">Sign in instead</Link>
            </div>
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div className="signup-right">
          <div className="signup-right-inner">
            <div className="right-eyebrow">
              <span className="pulse-dot" />
              Live in Dubai
            </div>
            <h2 className="right-headline">
              Your listings are on the portals. Now build your brand.
            </h2>

            {/* Mini preview card */}
            <div className="preview-card">
              <div className="preview-hero">
                <div>
                  <div className="preview-hero-text">Marina Heights 2BR</div>
                  <div className="preview-hero-sub">Dubai Marina · AED 2,850,000</div>
                </div>
                <div className="preview-avatar">JW</div>
              </div>
              <div className="preview-body">
                <div className="preview-row">
                  <span className="preview-label">Beds</span><span className="preview-value">2</span>
                </div>
                <div className="preview-row">
                  <span className="preview-label">Area</span><span className="preview-value">1,240 sqft</span>
                </div>
                <div className="preview-row">
                  <span className="preview-label">Price/sqft</span><span className="preview-value">AED 2,298</span>
                </div>
                <div className="preview-dots">
                  <div className="preview-dot" /><div className="preview-dot" /><div className="preview-dot" />
                </div>
              </div>
            </div>

            {/* Features */}
            <ul className="feature-list">
              {[
                'Professional agent profile & portfolio',
                'Every listing with its own SEO page',
                'Lead capture & inquiry management',
                'Found by AI: ChatGPT, Claude & more',
              ].map(f => (
                <li key={f} className="feature-item">
                  <div className="feature-check">
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  {f}
                </li>
              ))}
            </ul>

            {/* Discoverable row */}
            <div className="discoverable-label">Discoverable on</div>
            <div className="discoverable-row">
              {['Google', 'ChatGPT', 'Claude', 'Gemini', 'Perplexity', 'Copilot'].map(name => (
                <span key={name} className="disc-badge">{name}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
