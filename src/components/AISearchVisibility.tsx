import { useState, useEffect } from 'react'

/* ── Types ── */
export interface AISearchVisibilityProps {
  mode: 'pre-publish' | 'post-publish'
  visibilityConfig: Record<string, boolean>
  onConfigChange: (config: Record<string, boolean>) => void
  publishedAt?: Date
}

/* ── Engine Definitions ── */
const ENGINES = [
  {
    key: 'google',
    name: 'Google Search',
    botId: 'Googlebot',
    logoBg: '#fff',
    mechanism: 'Search Console + IndexNow on publish',
    logo: <GoogleLogo />,
    postStatus: 'Submitted',
    postTiming: 'Submitted 3s after publish',
    statusType: 'submitted' as const,
  },
  {
    key: 'chatgpt',
    name: 'ChatGPT',
    botId: 'OAI-SearchBot',
    logoBg: '#e8f5f0',
    mechanism: 'Crawler allowlist + sitemap discovery',
    logo: <ChatGPTLogo />,
    postStatus: 'Crawled',
    postTiming: 'OAI-SearchBot visited 62s ago',
    statusType: 'crawled' as const,
  },
  {
    key: 'claude',
    name: 'Claude',
    botId: 'Claude-Web',
    logoBg: '#fbeee7',
    mechanism: 'Crawler allowlist + sitemap discovery',
    logo: <ClaudeLogo />,
    postStatus: 'Crawled',
    postTiming: 'Claude-Web visited 88s ago',
    statusType: 'crawled' as const,
  },
  {
    key: 'gemini',
    name: 'Google Gemini',
    botId: 'Google-Extended',
    logoBg: '#f0f3ff',
    mechanism: 'Inherits Google Search index',
    logo: <GeminiLogo />,
    postStatus: 'Submitted',
    postTiming: 'Inherits Google index submission',
    statusType: 'submitted' as const,
  },
  {
    key: 'perplexity',
    name: 'Perplexity',
    botId: 'PerplexityBot',
    logoBg: '#f3eef9',
    mechanism: 'Crawler allowlist + sitemap discovery',
    logo: <PerplexityLogo />,
    postStatus: 'Crawled',
    postTiming: 'PerplexityBot visited 74s ago',
    statusType: 'crawled' as const,
  },
  {
    key: 'bing',
    name: 'Bing & Copilot',
    botId: 'Bingbot',
    logoBg: '#e4f1fd',
    mechanism: 'IndexNow protocol — instant',
    logo: <BingLogo />,
    postStatus: 'Indexed',
    postTiming: 'First crawl 34s after publish',
    statusType: 'indexed' as const,
  },
  {
    key: 'grok',
    name: 'Grok',
    botId: 'X-AI crawler',
    logoBg: '#f5f5f5',
    mechanism: 'Crawler allowlist + sitemap discovery',
    logo: <GrokLogo />,
    postStatus: 'Crawled',
    postTiming: 'X-AI crawler visited 115s ago',
    statusType: 'crawled' as const,
  },
]

/* ── SVG Logos ── */
function GoogleLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

function ChatGPTLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#10a37f"/>
      <path d="M7 12a5 5 0 0 1 5-5 5 5 0 0 1 4.33 2.5M17 12a5 5 0 0 1-5 5 5 5 0 0 1-4.33-2.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="12" cy="12" r="2" fill="#fff"/>
    </svg>
  )
}

function ClaudeLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#c96a3c"/>
      <path d="M8 16l4-8 4 8" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9.5 13h5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function GeminiLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M12 2C12 2 14.5 9.5 22 12C14.5 14.5 12 22 12 22C12 22 9.5 14.5 2 12C9.5 9.5 12 2 12 2Z" fill="url(#gemini-grad)"/>
      <defs>
        <linearGradient id="gemini-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4285F4"/>
          <stop offset="1" stopColor="#8B5CF6"/>
        </linearGradient>
      </defs>
    </svg>
  )
}

function PerplexityLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#8b5cf6"/>
      <path d="M8 8h8M8 12h8M8 16h5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function BingLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M4 4v16l5-3 5 4V8l-5 2-5-6z" fill="#0078d4"/>
      <path d="M9 10v11l6-4-2-4-4-3z" fill="#00b4f0"/>
    </svg>
  )
}

function GrokLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#1a1a1a"/>
      <path d="M8 7l8 5-8 5V7z" fill="#fff"/>
    </svg>
  )
}

/* ── Toggle Switch ── */
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!on)}
      style={{
        width: 28, height: 16, borderRadius: 8, cursor: 'pointer', flexShrink: 0,
        background: on ? 'var(--accent-bright,#3d8a76)' : 'var(--line,#e6e8eb)',
        position: 'relative', transition: 'background .15s',
      }}
    >
      <div style={{
        position: 'absolute', top: 2, left: on ? 14 : 2,
        width: 12, height: 12, borderRadius: '50%', background: '#fff',
        transition: 'left .15s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
      }} />
    </div>
  )
}

/* ── Status Pill ── */
function StatusPill({ type, label }: { type: 'indexed' | 'crawled' | 'submitted' | 'queued'; label: string }) {
  const styles: Record<string, React.CSSProperties> = {
    indexed: { background: 'var(--accent-bright,#3d8a76)', color: '#fff' },
    crawled: { background: 'var(--accent-soft,#e8f0ed)', color: 'var(--accent,#2d5a4f)' },
    submitted: { background: '#dbeafe', color: '#1d4ed8' },
    queued: { background: 'var(--paper-warm,#fbfaf7)', color: 'var(--muted,#5a6470)', border: '1px solid var(--line,#e6e8eb)' },
  }
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 700,
      letterSpacing: '0.04em', textTransform: 'uppercase' as const,
      ...styles[type],
    }}>
      {type === 'submitted' && (
        <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#3b82f6', animation: 'aisv-pulse 2s infinite' }} />
      )}
      {(type === 'indexed' || type === 'crawled') && (
        <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
          <path d="M2 5l2.5 2.5 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
      {label}
    </div>
  )
}

/* ── Will Submit Pill ── */
function WillSubmitPill() {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', padding: '2px 7px',
      borderRadius: 4, fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
      textTransform: 'uppercase' as const,
      background: 'var(--paper-warm,#fbfaf7)', color: 'var(--muted,#5a6470)',
      border: '1px solid var(--line,#e6e8eb)',
    }}>
      Will submit
    </div>
  )
}

/* ── Elapsed Timer ── */
function ElapsedTimer({ since }: { since: Date }) {
  const [elapsed, setElapsed] = useState(Math.floor((Date.now() - since.getTime()) / 1000))
  useEffect(() => {
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - since.getTime()) / 1000)), 1000)
    return () => clearInterval(id)
  }, [since])
  const mins = Math.floor(elapsed / 60)
  const secs = elapsed % 60
  const label = mins > 0 ? `${mins}m ${secs}s ago` : `${secs}s ago`
  return <span>{label}</span>
}

/* ══════════════════════════════════════════════════════════════
   Main Component
══════════════════════════════════════════════════════════════ */
export default function AISearchVisibility({ mode, visibilityConfig, onConfigChange, publishedAt }: AISearchVisibilityProps) {
  const enabledCount = Object.values(visibilityConfig).filter(Boolean).length
  const allOn = enabledCount === ENGINES.length

  function setAll(val: boolean) {
    const next: Record<string, boolean> = {}
    ENGINES.forEach(e => { next[e.key] = val })
    onConfigChange(next)
  }

  function setEngine(key: string, val: boolean) {
    onConfigChange({ ...visibilityConfig, [key]: val })
  }

  return (
    <div style={{
      background: '#fff', border: '1px solid var(--line-soft,#f0f2f4)', borderRadius: 14,
      overflow: 'hidden', marginBottom: 24,
    }}>
      <style>{`
        @keyframes aisv-pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
        @keyframes aisv-dot-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }
      `}</style>

      {/* Publish confirmation strip (post-publish only) */}
      {mode === 'post-publish' && publishedAt && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 22px',
          background: 'var(--accent-soft,#e8f0ed)', borderBottom: '1px solid var(--line-soft,#f0f2f4)',
        }}>
          <div style={{
            width: 20, height: 20, borderRadius: '50%', background: 'var(--accent-bright,#3d8a76)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent,#2d5a4f)' }}>
            Published <ElapsedTimer since={publishedAt} />
          </span>
          <div style={{
            marginLeft: 'auto', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700,
            background: 'var(--accent,#2d5a4f)', color: '#fff', letterSpacing: '0.04em', textTransform: 'uppercase',
          }}>Live</div>
        </div>
      )}

      {/* Header */}
      <div style={{ padding: '18px 22px 16px', borderBottom: '1px solid var(--line-soft,#f0f2f4)' }}>
        {/* Eyebrow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px',
            background: 'var(--accent-soft,#e8f0ed)', color: 'var(--accent,#2d5a4f)',
            borderRadius: 4, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
          }}>
            <div style={{
              width: 5, height: 5, borderRadius: '50%', background: 'var(--accent-bright,#3d8a76)',
              animation: 'aisv-pulse 2s infinite', flexShrink: 0,
            }} />
            {mode === 'post-publish' ? 'AI SEARCH VISIBILITY · LIVE STATUS' : 'AI SEARCH VISIBILITY'}
          </div>
        </div>

        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            {mode === 'pre-publish' ? (
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink,#0f1419)', marginBottom: 4, lineHeight: 1.3 }}>
                Submit this property to{' '}
                <em style={{ fontFamily: 'Fraunces, Georgia, serif', fontStyle: 'italic', color: 'var(--accent,#2d5a4f)', fontWeight: 400 }}>
                  AI search &amp; engines
                </em>
              </div>
            ) : (
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink,#0f1419)', marginBottom: 4, lineHeight: 1.3 }}>
                <em style={{ fontFamily: 'Fraunces, Georgia, serif', fontStyle: 'italic', fontWeight: 400 }}>
                  Your listing is being indexed
                </em>
              </div>
            )}
            <div style={{ fontSize: 12, color: 'var(--muted,#5a6470)', lineHeight: 1.5 }}>
              {mode === 'pre-publish'
                ? 'Control which AI engines and search platforms receive this listing on publish.'
                : '5 of 7 engines have confirmed receipt. The rest are in queue.'}
            </div>
          </div>

          {/* Master toggle pill */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px',
            background: enabledCount > 0 ? 'var(--accent-soft,#e8f0ed)' : 'var(--line-soft,#f0f2f4)',
            borderRadius: 20, flexShrink: 0,
          }}>
            <Toggle on={allOn} onChange={setAll} />
            <span style={{ fontSize: 12, fontWeight: 600, color: enabledCount > 0 ? 'var(--accent,#2d5a4f)' : 'var(--muted,#5a6470)', whiteSpace: 'nowrap' }}>
              {mode === 'post-publish' ? `Active · ${enabledCount}/7` : `${enabledCount}/7`}
            </span>
          </div>
        </div>
      </div>

      {/* Engine rows */}
      <div>
        {ENGINES.map((engine, idx) => {
          const isOn = visibilityConfig[engine.key] ?? true
          const isLast = idx === ENGINES.length - 1

          return (
            <div
              key={engine.key}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 22px',
                borderBottom: isLast ? 'none' : '1px solid var(--line-soft,#f0f2f4)',
                opacity: isOn ? 1 : 0.55, transition: 'opacity .15s',
                cursor: 'default',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--paper-warm,#fbfaf7)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              {/* Logo tile */}
              <div style={{
                width: 32, height: 32, borderRadius: 8, background: engine.logoBg,
                border: '1px solid var(--line-soft,#f0f2f4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                {engine.logo}
              </div>

              {/* Name + bot ID */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink,#0f1419)', lineHeight: 1.3 }}>{engine.name}</div>
                <div style={{ fontSize: 11, color: 'var(--muted,#5a6470)', fontFamily: 'monospace' }}>{engine.botId}</div>
              </div>

              {/* Status pill (post-publish only) or mechanism text (pre-publish) */}
              <div style={{ flexShrink: 0, fontSize: 11, color: 'var(--muted,#5a6470)', lineHeight: 1.4, textAlign: 'right' as const }}>
                {mode === 'pre-publish' ? (
                  <span>{engine.mechanism}</span>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                    <StatusPill type={engine.statusType} label={engine.postStatus} />
                    <span style={{ fontSize: 10.5 }}>{engine.postTiming}</span>
                  </div>
                )}
              </div>

              {/* Toggle (pre-publish only per row) */}
              {mode === 'pre-publish' && (
                <Toggle on={isOn} onChange={v => setEngine(engine.key, v)} />
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div style={{
        padding: '14px 22px', background: 'var(--paper-warm,#fbfaf7)',
        borderTop: '1px solid var(--line-soft,#f0f2f4)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, color: 'var(--muted,#5a6470)' }}>
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M8 7v5M8 5h.01" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
        <span style={{ fontSize: 12, color: 'var(--muted,#5a6470)', lineHeight: 1.5, flex: 1 }}>
          {mode === 'pre-publish'
            ? 'Each engine receives a structured request with your listing URL, sitemap reference, and schema markup.'
            : `5 crawled · 2 awaiting first crawl · Sitemap submitted to all engines`}
        </span>
        <a href="#" style={{ fontSize: 12, color: 'var(--accent,#2d5a4f)', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
          {mode === 'pre-publish' ? 'Learn more' : 'Pipeline log'}
        </a>
      </div>
    </div>
  )
}

/* ── Dot Indicator (for Properties list) ── */
export function AIVisibilityDots({ config }: { config?: Record<string, boolean> }) {
  if (!config) return null
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
      {ENGINES.map(engine => {
        const on = config[engine.key] ?? true
        // Use accent colors for different states
        const color = on ? 'var(--accent-bright,#3d8a76)' : 'var(--line,#e6e8eb)'
        return (
          <div
            key={engine.key}
            title={`${engine.name}: ${on ? 'submitted' : 'skipped'}`}
            style={{
              width: 7, height: 7, borderRadius: '50%', background: color,
              transition: 'background .15s',
            }}
          />
        )
      })}
    </div>
  )
}
