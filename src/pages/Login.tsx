import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import BrandLogo from '../components/BrandLogo'

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
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
  .login-page * { box-sizing: border-box; font-family: 'Inter', sans-serif; }
  .login-page { min-height: 100vh; background: var(--paper-warm); display: flex; flex-direction: column; }
  .login-topbar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 32px; border-bottom: 1px solid var(--line-soft);
    background: var(--paper-warm);
  }
  .login-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
  .login-logo-mark { display: flex; }
  .login-logo-name { font-size: 15px; font-weight: 600; color: var(--ink); letter-spacing: -0.01em; }
  .login-topbar-link { font-size: 13.5px; color: var(--muted); text-decoration: none; }
  .login-topbar-link a { color: var(--accent); font-weight: 500; text-decoration: none; }
  .login-topbar-link a:hover { text-decoration: underline; }
  .login-center { flex: 1; display: flex; align-items: center; justify-content: center; padding: 40px 16px; }
  .login-card {
    background: #fff; border-radius: 16px; border: 1px solid var(--line);
    box-shadow: 0 2px 24px rgba(15,20,25,0.06);
    width: 100%; max-width: 420px; padding: 40px 36px;
  }
  .login-brand-mark { display: flex; margin-bottom: 20px; }
  .login-eyebrow {
    font-size: 11px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase;
    color: var(--accent); margin-bottom: 6px;
  }
  .login-title { font-size: 28px; font-weight: 700; color: var(--ink); letter-spacing: -0.02em; margin: 0 0 6px; }
  .login-subtitle { font-size: 14.5px; color: var(--muted); margin: 0 0 28px; }
  .sso-btn {
    width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px;
    border: 1.5px solid var(--line); border-radius: 9px; background: #fff;
    padding: 11px 16px; font-size: 14px; font-weight: 500; color: var(--ink);
    cursor: pointer; transition: border-color 0.15s, box-shadow 0.15s;
    margin-bottom: 10px;
  }
  .sso-btn:hover { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(45,90,79,0.07); }
  .sso-btn svg { flex-shrink: 0; }
  .divider {
    display: flex; align-items: center; gap: 12px; margin: 18px 0;
  }
  .divider-line { flex: 1; height: 1px; background: var(--line); }
  .divider-text { font-size: 12px; color: var(--quiet); white-space: nowrap; }
  .field { margin-bottom: 14px; }
  .field-label {
    display: flex; align-items: center; justify-content: space-between;
    font-size: 13px; font-weight: 500; color: var(--ink); margin-bottom: 6px;
  }
  .field-label-link { font-size: 12.5px; color: var(--accent); text-decoration: none; font-weight: 400; }
  .field-label-link:hover { text-decoration: underline; }
  .input-wrap { position: relative; }
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
  .toggle-btn {
    position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer; color: var(--quiet);
    padding: 2px; display: flex; align-items: center;
  }
  .toggle-btn:hover { color: var(--muted); }
  .check-row { display: flex; align-items: center; gap: 9px; margin: 14px 0 18px; }
  .custom-checkbox { position: relative; width: 18px; height: 18px; flex-shrink: 0; cursor: pointer; }
  .custom-checkbox input { position: absolute; opacity: 0; width: 0; height: 0; }
  .custom-checkbox-box {
    width: 18px; height: 18px; border: 1.5px solid var(--line); border-radius: 5px;
    background: #fff; display: flex; align-items: center; justify-content: center;
    transition: border-color 0.15s, background 0.15s;
  }
  .custom-checkbox input:checked ~ .custom-checkbox-box {
    background: var(--accent); border-color: var(--accent);
  }
  .custom-checkbox-box svg { display: none; }
  .custom-checkbox input:checked ~ .custom-checkbox-box svg { display: block; }
  .check-label { font-size: 13.5px; color: var(--muted); cursor: pointer; user-select: none; }
  .submit-btn {
    width: 100%; background: var(--accent); color: #fff; border: none;
    border-radius: 9px; padding: 12px 20px; font-size: 15px; font-weight: 600;
    cursor: pointer; transition: background 0.15s, box-shadow 0.18s, transform 0.12s;
    letter-spacing: -0.01em;
  }
  .submit-btn:hover:not(:disabled) {
    background: var(--accent-hover);
    box-shadow: 0 4px 16px rgba(45,90,79,0.22);
    transform: translateY(-1px);
  }
  .submit-btn:active:not(:disabled) { transform: translateY(0); }
  .submit-btn:disabled { opacity: 0.55; cursor: not-allowed; }
  .card-footer { text-align: center; margin-top: 20px; font-size: 13.5px; color: var(--muted); }
  .card-footer a { color: var(--accent); font-weight: 500; text-decoration: none; }
  .card-footer a:hover { text-decoration: underline; }
  .help-row { text-align: center; margin-top: 16px; font-size: 13px; color: var(--quiet); }
  .help-row a { color: var(--muted); text-decoration: none; border-bottom: 1px solid var(--line); }
  .help-row a:hover { color: var(--ink); }
  .error-box {
    background: #fef2f0; border: 1px solid #fad4cc; color: var(--signal);
    font-size: 13.5px; padding: 10px 14px; border-radius: 9px; margin-bottom: 14px;
  }
  @media (max-width: 600px) {
    .login-topbar { padding: 14px 16px; }
    .login-card { padding: 28px 20px; }
  }
`

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [keepSignedIn, setKeepSignedIn] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) { setError(error.message); return }
    navigate('/dashboard')
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="login-page">
        {/* Top bar */}
        <div className="login-topbar">
          <a href="/" className="login-logo">
            <div className="login-logo-mark"><BrandLogo size={32} /></div>
            <span className="login-logo-name">Agent Pages</span>
          </a>
          <span className="login-topbar-link">
            New here? <Link to="/signup">Create account</Link>
          </span>
        </div>

        {/* Centered card */}
        <div className="login-center">
          <div className="login-card">
            <div className="login-brand-mark"><BrandLogo size={44} /></div>
            <div className="login-eyebrow">Welcome Back</div>
            <h1 className="login-title">Sign in to Agent Pages</h1>
            <p className="login-subtitle">Pick up where you left off.</p>

            {/* SSO buttons */}
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

              <div className="field">
                <div className="field-label"><span>Email</span></div>
                <div className="input-wrap">
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div className="field">
                <div className="field-label">
                  <span>Password</span>
                  <a href="/forgot-password" className="field-label-link">Forgot password?</a>
                </div>
                <div className="input-wrap">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
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
              </div>

              <div className="check-row">
                <label className="custom-checkbox">
                  <input
                    type="checkbox"
                    checked={keepSignedIn}
                    onChange={e => setKeepSignedIn(e.target.checked)}
                  />
                  <div className="custom-checkbox-box">
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </label>
                <span className="check-label" onClick={() => setKeepSignedIn(v => !v)}>Keep me signed in</span>
              </div>

              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? 'Signing in…' : 'Sign in →'}
              </button>
            </form>

            <div className="card-footer">
              Don't have an account yet?{' '}
              <Link to="/signup">Start a free trial</Link>
            </div>
          </div>

          <div className="help-row">
            Trouble signing in? <a href="/help">Get help</a>
          </div>
        </div>
      </div>
    </>
  )
}
