import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useState } from 'react'
import BrandLogo from './BrandLogo'

const ADMIN_EMAILS = ['test-agent@agentpages.io', 'mark@activateos.com', 'mark@chatdxb.com']

interface AppShellProps {
  children: React.ReactNode
  activeNav?: 'dashboard' | 'properties' | 'leads' | 'portfolio' | 'analytics' | 'settings'
  variant?: 'standard' | 'breadcrumb'
  breadcrumb?: { parent: string; parentHref: string; current: string }
  rightActions?: React.ReactNode
}

const NAV_ITEMS = [
  { key: 'dashboard',  label: 'Dashboard',  to: '/dashboard' },
  { key: 'properties', label: 'Properties', to: '/properties' },
  { key: 'leads',      label: 'Leads',      to: '/leads' },
  { key: 'portfolio',  label: 'Portfolio',  to: '/portfolio/edit' },
  { key: 'analytics',  label: 'Analytics',  to: '/analytics' },
]

function getInitials(email?: string, firstName?: string, lastName?: string): string {
  if (firstName && lastName) return (firstName[0] + lastName[0]).toUpperCase()
  if (firstName) return firstName.substring(0, 2).toUpperCase()
  if (!email) return 'U'
  const parts = email.split('@')[0].split(/[._-]/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return email.substring(0, 2).toUpperCase()
}

export default function AppShell({
  children,
  activeNav,
  variant = 'standard',
  breadcrumb,
  rightActions,
}: AppShellProps) {
  const { user, signOut } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false)
  const initials = getInitials(user?.email)

  return (
    <>
      <style>{`
        .appshell-nav { display: flex; }
        .appshell-crumb { display: flex; }
        .appshell-hamburger { display: none; }
        .appshell-mobile-menu { display: none; }
        @media (max-width: 979px) {
          .appshell-nav { display: none !important; }
          .appshell-crumb { display: none !important; }
          .appshell-hamburger { display: flex !important; }
          .appshell-mobile-menu.open { display: flex !important; }
        }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--paper-warm, #fbfaf7)' }}>
        {/* Topbar */}
        <header style={{
          height: 60, background: '#fff',
          borderBottom: '1px solid var(--line-soft, #f0f2f4)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 32px', position: 'sticky', top: 0, zIndex: 50,
          flexShrink: 0,
        }}>
          {/* Left */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Logo + wordmark */}
            <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
              <BrandLogo size={26} />
              <span style={{ fontSize: 14.5, letterSpacing: '-0.015em' }}>
                <span style={{ fontWeight: 700, color: 'var(--ink, #0f1419)' }}>Agent</span>
                <span style={{ fontWeight: 400, color: 'var(--muted, #5a6470)', marginLeft: 3 }}>Pages</span>
              </span>
            </Link>

            {/* Divider */}
            <div style={{ width: 1, height: 24, background: 'var(--line-soft, #f0f2f4)', marginLeft: 0 }} />

            {/* Standard nav */}
            {variant === 'standard' && (
              <nav className="appshell-nav" style={{ paddingLeft: 0, gap: 4 }}>
                {NAV_ITEMS.map(item => {
                  const isActive = activeNav === item.key
                  return (
                    <Link
                      key={item.key}
                      to={item.to}
                      style={{
                        padding: '7px 12px',
                        fontSize: 13,
                        fontWeight: isActive ? 600 : 500,
                        borderRadius: 7,
                        textDecoration: 'none',
                        color: isActive ? '#fff' : 'var(--muted, #5a6470)',
                        background: isActive ? 'var(--ink, #0f1419)' : 'transparent',
                        transition: 'background 0.12s, color 0.12s',
                      }}
                      onMouseEnter={e => {
                        if (!isActive) {
                          (e.currentTarget as HTMLElement).style.background = 'var(--line-soft, #f0f2f4)'
                          ;(e.currentTarget as HTMLElement).style.color = 'var(--ink, #0f1419)'
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isActive) {
                          (e.currentTarget as HTMLElement).style.background = 'transparent'
                          ;(e.currentTarget as HTMLElement).style.color = 'var(--muted, #5a6470)'
                        }
                      }}
                    >
                      {item.label}
                    </Link>
                  )
                })}
              </nav>
            )}

            {/* Breadcrumb nav */}
            {variant === 'breadcrumb' && breadcrumb && (
              <div className="appshell-crumb" style={{ alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--muted, #5a6470)' }}>
                <Link to={breadcrumb.parentHref} style={{ color: 'var(--muted, #5a6470)', textDecoration: 'none', fontWeight: 500 }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--ink, #0f1419)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--muted, #5a6470)'}
                >
                  {breadcrumb.parent}
                </Link>
                <span style={{ color: 'var(--line-soft, #f0f2f4)', fontWeight: 400 }}>/</span>
                <span style={{ color: 'var(--ink, #0f1419)', fontWeight: 500 }}>{breadcrumb.current}</span>
              </div>
            )}
          </div>

          {/* Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* rightActions (breadcrumb variant) */}
            {rightActions && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {rightActions}
              </div>
            )}

            {/* Admin link — only for admin emails */}
            {user && ADMIN_EMAILS.includes(user.email || '') && (
              <Link
                to="/admin"
                title="Admin Panel"
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 10px', borderRadius: 7,
                  border: '1px solid #fee2e2', background: '#fef2f2',
                  color: '#dc2626', fontSize: 12, fontWeight: 600,
                  textDecoration: 'none', transition: 'background 0.12s',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#fee2e2'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#fef2f2'}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                Admin
              </Link>
            )}

            {/* Bell */}
            <button style={{
              width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer',
              background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', transition: 'background 0.12s',
            }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--line-soft, #f0f2f4)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink, #0f1419)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
              {/* Notification dot */}
              <div style={{
                position: 'absolute', top: 7, right: 8,
                width: 7, height: 7, borderRadius: '50%',
                background: 'var(--accent-bright, #3d8a76)',
                border: '1.5px solid #fff',
              }} />
            </button>

            {/* Avatar + dropdown */}
            <div style={{ position: 'relative' }}>
              <div
                onClick={() => setAvatarMenuOpen(o => !o)}
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--accent, #2d5a4f), #1d4030)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0,
                }}
              >
                {initials}
              </div>
              {avatarMenuOpen && (
                <>
                  <div onClick={() => setAvatarMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 98 }} />
                  <div style={{
                    position: 'absolute', top: 40, right: 0, width: 200,
                    background: '#fff', border: '1px solid #e6e8eb', borderRadius: 10,
                    boxShadow: '0 8px 24px rgba(15,20,25,0.1)', zIndex: 99,
                    padding: '6px', overflow: 'hidden',
                  }}>
                    <div style={{ padding: '10px 12px', borderBottom: '1px solid #f0f2f4', marginBottom: 4 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0f1419' }}>{user?.email?.split('@')[0]}</div>
                      <div style={{ fontSize: 11, color: '#8b95a0' }}>{user?.email}</div>
                    </div>
                    {[{ label: 'Settings', to: '/settings' }, { label: 'Domain', to: '/settings/domain' }].map(item => (
                      <Link key={item.to} to={item.to} onClick={() => setAvatarMenuOpen(false)} style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                        fontSize: 13, fontWeight: 500, color: '#2c343d', textDecoration: 'none',
                        borderRadius: 6, transition: 'background 0.1s',
                      }} onMouseEnter={e => (e.currentTarget.style.background = '#f0f2f4')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        {item.label}
                      </Link>
                    ))}
                    <div style={{ height: 1, background: '#f0f2f4', margin: '4px 0' }} />
                    <button onClick={() => { setAvatarMenuOpen(false); signOut() }} style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', width: '100%',
                      fontSize: 13, fontWeight: 500, color: '#c2603a', background: 'transparent',
                      border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
                      transition: 'background 0.1s', textAlign: 'left',
                    }} onMouseEnter={e => (e.currentTarget.style.background = '#fbeee7')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      Log out
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Hamburger */}
            <button
              className="appshell-hamburger"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'none', alignItems: 'center', justifyContent: 'center', color: 'var(--ink, #0f1419)' }}
              onClick={() => setMobileMenuOpen(o => !o)}
              aria-label="Menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>
        </header>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className={`appshell-mobile-menu open`} style={{
            position: 'fixed', top: 60, left: 0, right: 0, bottom: 0,
            background: '#fff', zIndex: 49, flexDirection: 'column',
            borderTop: '1px solid var(--line-soft, #f0f2f4)', padding: '12px 0',
          }}>
            {NAV_ITEMS.map(item => {
              const isActive = activeNav === item.key
              return (
                <Link
                  key={item.key}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    padding: '12px 24px', fontSize: 15, fontWeight: isActive ? 600 : 400,
                    textDecoration: 'none', color: isActive ? 'var(--accent, #2d5a4f)' : 'var(--ink, #0f1419)',
                    borderBottom: '1px solid var(--line-soft, #f0f2f4)',
                  }}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>
        )}

        {/* Page content */}
        <main style={{ flex: 1, minWidth: 0 }}>
          {children}
        </main>
      </div>
    </>
  )
}
