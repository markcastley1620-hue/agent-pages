import { useState } from 'react'
import { Link } from 'react-router-dom'
import '../styles/homepage.css'
import BrandLogo from '../components/BrandLogo'

const faqData = [
  {
    q: 'How does the custom URL work?',
    a: 'When you publish a property on Pro or Studio, you can buy and connect a custom domain for that specific listing — like 4bedroomvillainmeadows.com or burjvista38thfloor.com. We handle the DNS, SSL, and setup. Use it on flyers, business cards, or read it out on the phone. Default URLs work the same way without a custom domain.',
  },
  {
    q: 'How does the AI description work?',
    a: "When you publish a property, we generate a unique, search-optimised description based on the property's specs, location, and features. Every description is different — no duplicate content across your listings or anyone else's. You can edit it before publishing.",
  },
  {
    q: 'How do you get my properties into ChatGPT, Claude, and Gemini?',
    a: "We submit your pages through the publicly available indexing channels each AI provider supports, and structure your page content so AI crawlers can ingest it cleanly. As AI models update their indexes, your properties become discoverable when buyers ask questions about your area.",
  },
  {
    q: 'Where does the sold pricing data come from?',
    a: "Sold pricing is pulled from official Dubai Land Department transaction records — verified, real, and updated regularly. You can toggle this on for any listing if you want to show buyers what comparable properties have sold for. Studio plans get priority refresh.",
  },
  {
    q: 'What can I see in the analytics?',
    a: "For every property page: total views, unique visitors, time on page, where the traffic came from (direct, WhatsApp, Instagram, search), what they clicked (call, WhatsApp, viewing form), and full lead source attribution.",
  },
  {
    q: 'Do I need to be a registered agent in Dubai?',
    a: "Yes. Agent Pages is built for RERA-certified agents and brokerages in the UAE. You'll be asked for your RERA number on signup — this appears on your pages for compliance.",
  },
  {
    q: 'What if I cancel?',
    a: "Your account stays active until the end of your billing period. After that, your pages go offline but your data is preserved for 90 days. No long-term contracts, no cancellation fees.",
  },
]

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="hp-root">
      {/* NAV */}
      <nav className="nav">
        <div className="nav-brand">
          <BrandLogo size={28} />
          <div className="nav-name">Agent <span>Pages</span></div>
        </div>
        <div className="nav-links">
          <a href="#shift" onClick={(e) => handleSmoothScroll(e, 'shift')}>The shift</a>
          <a href="#ai" onClick={(e) => handleSmoothScroll(e, 'ai')}>AI &amp; SEO</a>
          <a href="#share" onClick={(e) => handleSmoothScroll(e, 'share')}>Sharing</a>
          <a href="#leads" onClick={(e) => handleSmoothScroll(e, 'leads')}>Leads</a>
          <a href="#pricing" onClick={(e) => handleSmoothScroll(e, 'pricing')}>Pricing</a>
        </div>
        <div className="nav-cta">
          <Link to="/login" className="nav-btn">Log in</Link>
          <Link to="/signup" className="nav-btn primary">Start free</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-eyebrow">
          <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg>
          Built for Dubai real estate agents
        </div>
        <h1 className="hero-title">Your listings are on the portals.<br />Now <em>build your agent brand</em>.</h1>
        <p className="hero-sub">Property pages that rank on Google, get indexed by ChatGPT, Claude and Gemini, and convert every viewer into a lead — under your name, on your URL, never shared. Share one listing or your full portfolio directly to clients and track every view.</p>
        <div className="hero-actions">
          <Link to="/signup" className="btn-primary-lg">Start free — no card needed</Link>
          <a href="#preview" className="btn-secondary-lg" onClick={(e) => handleSmoothScroll(e, 'preview')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            See a live page
          </a>
        </div>
        <div className="hero-trust"><strong>14-day Pro trial</strong> · No setup · Cancel anytime</div>
      </section>

      {/* DISCOVERY BAR */}
      <div className="discovery-bar">
        <div className="disc-label">Your properties get discovered on</div>
        <div className="disc-track">
          <div className="disc-item">
            <svg viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Google
          </div>
          <div className="disc-item">
            <svg viewBox="0 0 24 24" fill="#10A37F"><path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073z"/></svg>
            ChatGPT
          </div>
          <div className="disc-item">
            <svg viewBox="0 0 24 24" fill="#D77655"><circle cx="12" cy="12" r="10"/></svg>
            Claude
          </div>
          <div className="disc-item">
            <svg viewBox="0 0 24 24"><defs><linearGradient id="gem-grad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#4285F4"/><stop offset="0.5" stopColor="#9B72CB"/><stop offset="1" stopColor="#D96570"/></linearGradient></defs><path d="M12 2L9 9l-7 3 7 3 3 7 3-7 7-3-7-3z" fill="url(#gem-grad)"/></svg>
            Gemini
          </div>
          <div className="disc-item">
            <svg viewBox="0 0 24 24" fill="#5436DA"><path d="M12.745 0c4.71 0 9.116 2.81 11.099 7.082l-.745-.349C20.94 2.89 17.069.524 12.745.524 6.022.524.524 6.022.524 12.745.524 19.469 6.022 24.967 12.745 24.967c5.864 0 10.74-4.156 11.842-9.667h-7.057c-.853 2.413-3.139 4.156-5.871 4.156-3.451 0-6.243-2.792-6.243-6.243s2.792-6.243 6.243-6.243c2.732 0 5.018 1.743 5.871 4.156h7.057c-1.102-5.511-5.978-9.667-11.842-9.667z"/></svg>
            Perplexity
          </div>
          <div className="disc-item">
            <svg viewBox="0 0 24 24" fill="#0078D4"><path d="M5.5 3l4 13L14 11l4 5 1-2-7-11z"/></svg>
            Copilot
          </div>
          <div className="disc-item">
            <svg viewBox="0 0 24 24" fill="#000"><path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"/></svg>
            Grok
          </div>
        </div>
      </div>

      {/* RICH DEMO PREVIEW */}
      <div className="preview" id="preview">
        <div className="preview-frame">
          <div className="preview-window">
            <div className="preview-bar">
              <div className="preview-dot"></div>
              <div className="preview-dot"></div>
              <div className="preview-dot"></div>
              <div className="preview-url-wrap">
                <svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
                <span><strong>4bedroomvillainmeadows.com</strong></span>
              </div>
            </div>
            <div className="mini">
              <div className="mini-title">4-bedroom villa with private pool · The Meadows 7</div>
              <div className="mini-meta">
                <span className="mini-star">★ 4.9</span>
                <span className="mini-meta-dot"></span>
                <a>Listed by Sarah Bennett</a>
                <span className="mini-meta-dot"></span>
                <span>The Meadows, Dubai</span>
                <span className="mini-meta-dot"></span>
                <span>Vacant on transfer</span>
              </div>

              <div className="mini-gallery">
                <div className="mini-cell main">
                  <div className="mini-cell-label">Front elevation</div>
                </div>
                <div className="mini-cell c1"><div className="mini-cell-label">Living room</div></div>
                <div className="mini-cell c2"><div className="mini-cell-label">Pool &amp; garden</div></div>
                <div className="mini-cell c3"><div className="mini-cell-label">Master suite</div></div>
                <div className="mini-cell c4"><div className="mini-cell-label">Kitchen</div></div>
                <div className="mini-show-all">Show all 12 photos</div>
              </div>

              <div className="mini-body">
                <div>
                  <div className="mini-section-title">
                    About this property
                    <span className="mini-ai-tag">AI-written</span>
                  </div>
                  <div className="mini-desc">A landscaped four-bedroom Type 7 villa in The Meadows with private pool, mature gardens, and a re-tiled finish throughout. The ground floor opens onto an east-facing pool terrace ideal for morning sun. Walking distance to Meadows Village, Sunmarke School, and the lake circuit. Type 7 layout is the most sought-after in the community for resale.</div>

                  <div className="mini-features">
                    <div className="mini-feature">
                      <div className="mini-feature-icon"><svg viewBox="0 0 24 24"><path d="M2 12h20M6 12v6a2 2 0 002 2h8a2 2 0 002-2v-6"/></svg></div>
                      <div className="mini-feature-text"><strong>Private pool</strong>Heated, refinished</div>
                    </div>
                    <div className="mini-feature">
                      <div className="mini-feature-icon"><svg viewBox="0 0 24 24"><path d="M3 9.5L12 3l9 6.5V21H3V9.5z"/></svg></div>
                      <div className="mini-feature-text"><strong>Type 7 layout</strong>Most popular floorplan</div>
                    </div>
                    <div className="mini-feature">
                      <div className="mini-feature-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/></svg></div>
                      <div className="mini-feature-text"><strong>Vacant on transfer</strong>Move in immediately</div>
                    </div>
                    <div className="mini-feature">
                      <div className="mini-feature-icon"><svg viewBox="0 0 24 24"><path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg></div>
                      <div className="mini-feature-text"><strong>School catchment</strong>Sunmarke + DBS</div>
                    </div>
                  </div>

                  <div className="mini-specs">
                    <div className="mini-spec"><div className="mini-spec-val">4</div><div className="mini-spec-lab">Beds</div></div>
                    <div className="mini-spec"><div className="mini-spec-val">5</div><div className="mini-spec-lab">Baths</div></div>
                    <div className="mini-spec"><div className="mini-spec-val">3,850</div><div className="mini-spec-lab">Sqft</div></div>
                    <div className="mini-spec"><div className="mini-spec-val">5,200</div><div className="mini-spec-lab">Plot</div></div>
                  </div>

                  <div className="mini-sold">
                    <div className="mini-sold-head">
                      <div className="mini-sold-title">
                        <svg viewBox="0 0 24 24"><path d="M3 3v18h18M7 14l4-4 3 3 5-6"/></svg>
                        Sold pricing · The Meadows · Type 7 villas
                      </div>
                      <span className="mini-sold-tag">DLD · Live</span>
                    </div>
                    <div className="mini-sold-grid">
                      <div className="mini-sold-cell">
                        <div className="mini-sold-val">8.6<span className="unit">M AED</span></div>
                        <div className="mini-sold-lab">Median (90d)</div>
                      </div>
                      <div className="mini-sold-cell">
                        <div className="mini-sold-val">2,180<span className="unit"> /sqft</span></div>
                        <div className="mini-sold-lab">Avg psqft</div>
                      </div>
                      <div className="mini-sold-cell">
                        <div className="mini-sold-val">12</div>
                        <div className="mini-sold-lab">Recent sales</div>
                      </div>
                    </div>
                  </div>

                  <div className="mini-section-title">Location</div>
                  <div className="mini-map">
                    <div className="mini-map-grid"></div>
                    <div className="mini-map-road"></div>
                    <div className="mini-map-road-2"></div>
                    <div className="mini-map-attr mini-map-attr-1">Meadows Village</div>
                    <div className="mini-map-attr mini-map-attr-3">Sunmarke School</div>
                    <div className="mini-map-attr mini-map-attr-2">Lake circuit</div>
                    <div className="mini-map-pin">
                      <div className="mini-map-pin-inner">
                        <svg viewBox="0 0 24 24"><path d="M3 9.5L12 3l9 6.5V21H3V9.5z"/></svg>
                      </div>
                    </div>
                  </div>

                  <div className="mini-section-title">What's nearby</div>
                  <div className="mini-nearby">
                    <div className="mini-nearby-item">
                      <div className="mini-nearby-icon"><svg viewBox="0 0 24 24"><path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg></div>
                      <div className="mini-nearby-text"><strong>Sunmarke School</strong><span>4 min drive</span></div>
                    </div>
                    <div className="mini-nearby-item">
                      <div className="mini-nearby-icon"><svg viewBox="0 0 24 24"><path d="M3 12h18M12 3v18"/></svg></div>
                      <div className="mini-nearby-text"><strong>Meadows Village</strong><span>3 min walk</span></div>
                    </div>
                    <div className="mini-nearby-item">
                      <div className="mini-nearby-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg></div>
                      <div className="mini-nearby-text"><strong>Dubai Marina</strong><span>15 min drive</span></div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="mini-card">
                    <div className="mini-card-price">AED 8,500,000</div>
                    <div className="mini-card-psqft">AED 2,208 psqft</div>
                    <div className="mini-card-cta-title">Book a viewing</div>
                    <div className="mini-input">Full name</div>
                    <div className="mini-input">Phone</div>
                    <div className="mini-input">Cash buyer ⌄</div>
                    <button className="mini-cta-btn">Request viewing</button>
                    <div className="mini-trust">
                      <span><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>RERA</span>
                      <span><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>Verified</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SHIFT BLOCK */}
      <section className="shift" id="shift">
        <div className="shift-inner">
          <div className="shift-head">
            <div className="shift-eyebrow">The shift</div>
            <h2 className="shift-title">The portals get you listed. <em>This is how you build a brand.</em></h2>
            <p className="shift-sub">Portal traffic is rented. Your name on a portal listing is a footnote next to the building. The agents who win in the next decade are the ones who control how their listings are presented, where their listings live, and who their listings build a reputation for. Agent Pages gives you all three.</p>
          </div>
          <div className="shift-pillars">
            <div className="shift-pillar">
              <div className="shift-pillar-num">01</div>
              <div className="shift-pillar-icon">
                <svg viewBox="0 0 24 24"><path d="M3 9.5L12 3l9 6.5V21H3V9.5z"/></svg>
              </div>
              <h4>Control the presentation</h4>
              <p>Your listings shown the way you want — full photos, AI-written descriptions, location context, community pricing data. No portal layout dictating what comes first.</p>
            </div>
            <div className="shift-pillar">
              <div className="shift-pillar-num">02</div>
              <div className="shift-pillar-icon">
                <svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
              </div>
              <h4>Own where they live</h4>
              <p>Your own URL. Your own brand. Share to WhatsApp, Instagram, email, or print on a flyer — the buyer lands on your page, not a directory of competitors.</p>
            </div>
            <div className="shift-pillar">
              <div className="shift-pillar-num">03</div>
              <div className="shift-pillar-icon">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a4 4 0 014-4h8a4 4 0 014 4v2"/></svg>
              </div>
              <h4>Compound a reputation</h4>
              <p>Every listing reinforces your name. Every share builds your audience. Every closed deal grows a portfolio page that becomes your strongest pitch to the next seller.</p>
            </div>
          </div>
        </div>
      </section>

      {/* AI SECTION */}
      <section className="ai-section" id="ai">
        <div className="ai-inner">
          <div className="ai-head">
            <div className="ai-eyebrow">
              <span className="ai-eyebrow-pulse"></span>
              Only on Agent Pages
            </div>
            <h2 className="ai-title">Unique AI descriptions that help you rank — on Google and inside AI models.</h2>
            <p className="ai-sub">Every property gets a unique, search-optimised description written by AI. We then submit your listings to the major AI models so when buyers ask ChatGPT or Claude about properties in your area, your listings show up.</p>
          </div>

          <div className="ai-flow-v2">
            <div className="flow-card">
              <div className="flow-card-head">
                <div className="flow-card-step">
                  <span className="flow-card-step-num">1</span>
                  Property in
                </div>
                <div className="flow-card-title">Paste a listing URL</div>
                <div className="flow-card-desc">Drop in your existing listing URL and we'll pull everything we need automatically.</div>
              </div>
              <div className="flow-card-visual">
                <div className="flow-url-input">
                  <svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
                  https://[your-listing-url]
                </div>
                <div className="flow-success">
                  <svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
                  12 fields auto-filled
                </div>
                <div className="flow-success-row">
                  <span className="flow-chip">4 beds</span>
                  <span className="flow-chip">3,850 sqft</span>
                  <span className="flow-chip gold">Pool</span>
                  <span className="flow-chip">+9 more</span>
                </div>
              </div>
            </div>

            <div className="flow-card">
              <div className="flow-card-head">
                <div className="flow-card-step">
                  <span className="flow-card-step-num">2</span>
                  AI writes it up
                </div>
                <div className="flow-card-title">Unique, SEO-optimised</div>
                <div className="flow-card-desc">No duplicate-content penalty. Every property gets its own one-of-a-kind description.</div>
              </div>
              <div className="flow-card-visual">
                <div className="flow-ai-doc">
                  <div className="flow-ai-header">
                    <div className="flow-ai-dot">
                      <svg viewBox="0 0 24 24"><path d="M12 2L9 9l-7 .8 5.2 4.6L5 22l7-4 7 4-1.2-7.6L23 9.8 16 9z"/></svg>
                    </div>
                    <div className="flow-ai-label">Writing description...</div>
                  </div>
                  <div className="flow-ai-line"></div>
                  <div className="flow-ai-line"></div>
                  <div className="flow-ai-line"></div>
                  <div className="flow-ai-line"></div>
                </div>
              </div>
            </div>

            <div className="flow-card">
              <div className="flow-card-head">
                <div className="flow-card-step">
                  <span className="flow-card-step-num">3</span>
                  Submitted everywhere
                </div>
                <div className="flow-card-title">Google + all major AI models</div>
                <div className="flow-card-desc">Indexed and submitted in seconds. Your listing becomes discoverable across every major search surface.</div>
              </div>
              <div className="flow-card-visual">
                <div className="flow-submit-grid">
                  <div className="flow-submit-cell">
                    <svg viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    Google
                    <span className="check"><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg></span>
                  </div>
                  <div className="flow-submit-cell">
                    <svg viewBox="0 0 24 24" fill="#10A37F"><circle cx="12" cy="12" r="10"/></svg>
                    GPT
                    <span className="check"><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg></span>
                  </div>
                  <div className="flow-submit-cell">
                    <svg viewBox="0 0 24 24" fill="#D77655"><circle cx="12" cy="12" r="10"/></svg>
                    Claude
                    <span className="check"><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg></span>
                  </div>
                  <div className="flow-submit-cell">
                    <svg viewBox="0 0 24 24"><defs><linearGradient id="g2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#4285F4"/><stop offset="1" stopColor="#D96570"/></linearGradient></defs><circle cx="12" cy="12" r="10" fill="url(#g2)"/></svg>
                    Gemini
                    <span className="check"><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg></span>
                  </div>
                  <div className="flow-submit-cell">
                    <svg viewBox="0 0 24 24" fill="#5436DA"><circle cx="12" cy="12" r="10"/></svg>
                    Perplexity
                    <span className="check"><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg></span>
                  </div>
                  <div className="flow-submit-cell">
                    <svg viewBox="0 0 24 24" fill="#0078D4"><circle cx="12" cy="12" r="10"/></svg>
                    Copilot
                    <span className="check"><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg></span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="ai-outputs">
            <div className="ai-outputs-title">Where your properties appear</div>
            <div className="ai-outputs-grid">
              <div className="ai-output">
                <div className="ai-output-logo">
                  <svg viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                </div>
                <div className="ai-output-name">Google</div>
                <div className="ai-output-status">Indexed</div>
              </div>
              <div className="ai-output">
                <div className="ai-output-logo">
                  <svg viewBox="0 0 24 24" fill="#10A37F"><path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073z"/></svg>
                </div>
                <div className="ai-output-name">ChatGPT</div>
                <div className="ai-output-status">Submitted</div>
              </div>
              <div className="ai-output">
                <div className="ai-output-logo">
                  <svg viewBox="0 0 24 24" fill="#D77655"><circle cx="12" cy="12" r="10"/></svg>
                </div>
                <div className="ai-output-name">Claude</div>
                <div className="ai-output-status">Submitted</div>
              </div>
              <div className="ai-output">
                <div className="ai-output-logo">
                  <svg viewBox="0 0 24 24"><defs><linearGradient id="g-grad-out" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#4285F4"/><stop offset="0.5" stopColor="#9B72CB"/><stop offset="1" stopColor="#D96570"/></linearGradient></defs><path d="M12 2L9 9l-7 3 7 3 3 7 3-7 7-3-7-3z" fill="url(#g-grad-out)"/></svg>
                </div>
                <div className="ai-output-name">Gemini</div>
                <div className="ai-output-status">Submitted</div>
              </div>
              <div className="ai-output">
                <div className="ai-output-logo">
                  <svg viewBox="0 0 24 24" fill="#5436DA"><circle cx="12" cy="12" r="10"/></svg>
                </div>
                <div className="ai-output-name">Perplexity</div>
                <div className="ai-output-status">Submitted</div>
              </div>
              <div className="ai-output">
                <div className="ai-output-logo">
                  <svg viewBox="0 0 24 24" fill="#0078D4"><path d="M5.5 3l4 13L14 11l4 5 1-2-7-11z"/></svg>
                </div>
                <div className="ai-output-name">Copilot</div>
                <div className="ai-output-status">Submitted</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SHARING SECTION */}
      <section className="share-section" id="share">
        <div className="share-inner">
          <div className="share-head">
            <div className="share-eyebrow">
              <svg className="share-eyebrow-icon" viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
              Built for sharing
            </div>
            <h2 className="share-title">Share unique links direct to clients. <em>Keep them on your page. Track every view.</em></h2>
            <p className="share-sub">Memorable, address-level URLs you can drop into a WhatsApp message or read out on a call. Every visit tracked — who viewed, how long, where they came from, what they clicked. Your client sees the property the way you want it presented, without ever leaving your page.</p>
          </div>

          <div className="share-grid">
            <div className="url-panel">
              <div className="url-panel-title">Your URLs</div>
              <div className="url-panel-headline">Address-level URLs that buyers actually remember</div>
              <div className="url-list">
                <div className="url-row">
                  <div className="url-row-icon"><svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg></div>
                  <div className="url-row-text"><strong>4bedroomvillainmeadows.com</strong></div>
                  <div className="url-row-badge">Premium</div>
                </div>
                <div className="url-row">
                  <div className="url-row-icon"><svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg></div>
                  <div className="url-row-text"><strong>burjvista38thfloor.com</strong></div>
                  <div className="url-row-badge">Premium</div>
                </div>
                <div className="url-row">
                  <div className="url-row-icon"><svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg></div>
                  <div className="url-row-text">agentpages.io/sarah-bennett/<strong>burj-vista-2br</strong></div>
                  <div className="url-row-badge">Default</div>
                </div>
              </div>
              <div className="url-note">
                Every property gets a clean default URL on Agent Pages — and on <strong>Pro and above</strong>, you can buy and connect a dedicated domain per listing. Use a URL you can read out on a call or print on a flyer.
              </div>
            </div>

            <div className="analytics-panel">
              <div className="analytics-panel-title">Page analytics</div>
              <div className="analytics-panel-headline">See exactly how your property is performing</div>
              <div className="kpi-row">
                <div className="kpi-box">
                  <div className="kpi-val">847</div>
                  <div className="kpi-lab">Views</div>
                  <div className="kpi-delta">+34% this week</div>
                </div>
                <div className="kpi-box">
                  <div className="kpi-val">12</div>
                  <div className="kpi-lab">Leads</div>
                  <div className="kpi-delta">+5 this week</div>
                </div>
                <div className="kpi-box">
                  <div className="kpi-val">3:42</div>
                  <div className="kpi-lab">Avg time</div>
                  <div className="kpi-delta">Above benchmark</div>
                </div>
              </div>
              <div className="chart-mock">
                <svg viewBox="0 0 280 70" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chartGrad" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#4a6fa5" stopOpacity="0.25"/>
                      <stop offset="100%" stopColor="#4a6fa5" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  <path d="M 0 55 L 30 50 L 60 45 L 90 38 L 120 42 L 150 32 L 180 28 L 210 20 L 240 18 L 280 12 L 280 70 L 0 70 Z" fill="url(#chartGrad)"/>
                  <path d="M 0 55 L 30 50 L 60 45 L 90 38 L 120 42 L 150 32 L 180 28 L 210 20 L 240 18 L 280 12" fill="none" stroke="#4a6fa5" strokeWidth="2" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="activity-list">
                <div className="activity-row">
                  <div className="activity-icon"><svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></div>
                  <div className="activity-text">Viewed 4× from <strong>WhatsApp link</strong></div>
                  <div className="activity-time">2h ago</div>
                </div>
                <div className="activity-row">
                  <div className="activity-icon"><svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.37 1.9.72 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0122 16.92z"/></svg></div>
                  <div className="activity-text">Click on <strong>WhatsApp</strong> button</div>
                  <div className="activity-time">3h ago</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LEADS MANAGEMENT SECTION */}
      <section className="leads-section" id="leads">
        <div className="leads-inner">
          <div className="leads-head">
            <div className="leads-eyebrow">
              <svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/></svg>
              Leads management
            </div>
            <h2 className="leads-title">Every lead, <em>delivered three ways</em> — managed in one inbox.</h2>
            <p className="leads-sub">The moment a buyer fills your form or hits a CTA, you hear about it. WhatsApp ping, email, push notification. Then everything lands in your Agent Pages inbox — qualified, sourced, and ready to action.</p>
          </div>

          <div className="notif-stack">
            <div className="notif-stack-label">⚡ New lead just came in — here's how you hear about it</div>
            <div className="notif-row fresh">
              <div className="notif-channel whatsapp">
                <svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </div>
              <div className="notif-body">
                <div className="notif-title"><strong>Sarah Mendoza</strong> just enquired about <strong>The Meadows villa</strong></div>
                <div className="notif-meta">Cash buyer · prefers weekend viewing</div>
              </div>
              <div className="notif-time">Just now</div>
            </div>
            <div className="notif-row">
              <div className="notif-channel email">
                <svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/></svg>
              </div>
              <div className="notif-body">
                <div className="notif-title">Lead summary sent to <strong>sarah@bennett.ae</strong></div>
                <div className="notif-meta">Full form data + page they came from</div>
              </div>
              <div className="notif-time">Just now</div>
            </div>
            <div className="notif-row">
              <div className="notif-channel push">
                <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
              </div>
              <div className="notif-body">
                <div className="notif-title">Push to your phone <strong>+ desktop</strong></div>
                <div className="notif-meta">Reply directly from the notification</div>
              </div>
              <div className="notif-time">Just now</div>
            </div>
          </div>

          <div className="inbox-wrap">
            <div className="inbox-window">
              <div className="inbox-topbar">
                <div className="inbox-tabs">
                  <div className="inbox-tab active">All<span className="inbox-tab-count">23</span></div>
                  <div className="inbox-tab">New<span className="inbox-tab-count">5</span></div>
                  <div className="inbox-tab">Contacted<span className="inbox-tab-count">9</span></div>
                  <div className="inbox-tab">Viewing booked<span className="inbox-tab-count">4</span></div>
                  <div className="inbox-tab">Closed<span className="inbox-tab-count">5</span></div>
                </div>
                <div className="inbox-actions">
                  <div className="inbox-search">
                    <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg>
                    Search leads
                  </div>
                </div>
              </div>

              <div className="inbox-grid">
                <div className="lead-list">
                  <div className="lead-row new-lead selected" style={{paddingLeft: '19px'}}>
                    <div className="lead-avatar">SM</div>
                    <div className="lead-body">
                      <div className="lead-name-row">
                        <div className="lead-name">Sarah Mendoza</div>
                        <div className="lead-tag cash">Cash</div>
                      </div>
                      <div className="lead-prop"><strong>The Meadows · 4BR Villa</strong> · AED 8.5M</div>
                      <div className="lead-source">
                        <div className="lead-source-icon"><svg viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884"/></svg></div>
                        via WhatsApp share
                      </div>
                    </div>
                    <div className="lead-meta">
                      <div className="lead-time">Just now</div>
                      <div className="lead-status new-status">New</div>
                    </div>
                  </div>

                  <div className="lead-row new-lead" style={{paddingLeft: '22px'}}>
                    <div className="lead-avatar c2">JK</div>
                    <div className="lead-body">
                      <div className="lead-name-row">
                        <div className="lead-name">James Khalifa</div>
                        <div className="lead-tag mortgage">Mortgage</div>
                      </div>
                      <div className="lead-prop"><strong>Burj Vista · 2BR Apartment</strong> · AED 3.2M</div>
                      <div className="lead-source">
                        <div className="lead-source-icon"><svg viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg></div>
                        via Google Search
                      </div>
                    </div>
                    <div className="lead-meta">
                      <div className="lead-time">12m ago</div>
                      <div className="lead-status new-status">New</div>
                    </div>
                  </div>

                  <div className="lead-row">
                    <div className="lead-avatar c3">PR</div>
                    <div className="lead-body">
                      <div className="lead-name-row">
                        <div className="lead-name">Priya Raghavan</div>
                        <div className="lead-tag investor">Investor</div>
                      </div>
                      <div className="lead-prop"><strong>Palm Frond M · Beachfront</strong> · AED 24M</div>
                      <div className="lead-source">
                        <div className="lead-source-icon"><svg viewBox="0 0 24 24" fill="#10A37F"><circle cx="12" cy="12" r="10"/></svg></div>
                        via ChatGPT
                      </div>
                    </div>
                    <div className="lead-meta">
                      <div className="lead-time">2h ago</div>
                      <div className="lead-status contacted">Contacted</div>
                    </div>
                  </div>

                  <div className="lead-row">
                    <div className="lead-avatar c4">DC</div>
                    <div className="lead-body">
                      <div className="lead-name-row">
                        <div className="lead-name">David Chen</div>
                        <div className="lead-tag cash">Cash</div>
                      </div>
                      <div className="lead-prop"><strong>Emirates Hills · 6BR Estate</strong> · POR</div>
                      <div className="lead-source">
                        <div className="lead-source-icon"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" fill="none" stroke="#4a6fa5" strokeWidth="2"/><path d="M21 21l-4.3-4.3" fill="none" stroke="#4a6fa5" strokeWidth="2"/></svg></div>
                        via Instagram bio link
                      </div>
                    </div>
                    <div className="lead-meta">
                      <div className="lead-time">Yesterday</div>
                      <div className="lead-status viewing">Viewing</div>
                    </div>
                  </div>

                  <div className="lead-row">
                    <div className="lead-avatar c5">AH</div>
                    <div className="lead-body">
                      <div className="lead-name-row">
                        <div className="lead-name">Amelia Hartley</div>
                        <div className="lead-tag browsing">Browsing</div>
                      </div>
                      <div className="lead-prop"><strong>Dubai Hills · 5BR Townhouse</strong> · AED 6.8M</div>
                      <div className="lead-source">
                        <div className="lead-source-icon"><svg viewBox="0 0 24 24" fill="#D77655"><circle cx="12" cy="12" r="10"/></svg></div>
                        via Claude
                      </div>
                    </div>
                    <div className="lead-meta">
                      <div className="lead-time">2d ago</div>
                      <div className="lead-status cold">Cold</div>
                    </div>
                  </div>
                </div>

                <div className="lead-detail">
                  <div className="lead-detail-head">
                    <div className="lead-detail-avatar">SM</div>
                    <div>
                      <div className="lead-detail-name">Sarah Mendoza</div>
                      <div className="lead-detail-tagline">Cash buyer · just enquired</div>
                    </div>
                  </div>

                  <div className="lead-detail-prop">
                    <div className="lead-detail-prop-thumb"></div>
                    <div className="lead-detail-prop-info">
                      <div className="lead-detail-prop-name">The Meadows · 4BR Villa</div>
                      <div className="lead-detail-prop-meta">AED 8,500,000 · Live listing</div>
                    </div>
                  </div>

                  <div className="lead-detail-fields">
                    <div className="lead-field">
                      <div className="lead-field-label">Phone</div>
                      <div className="lead-field-value"><a>+971 50 248 9412</a></div>
                    </div>
                    <div className="lead-field">
                      <div className="lead-field-label">Email</div>
                      <div className="lead-field-value">sarah.m@gmail.com</div>
                    </div>
                    <div className="lead-field">
                      <div className="lead-field-label">Buyer type</div>
                      <div className="lead-field-value">Cash buyer</div>
                    </div>
                    <div className="lead-field">
                      <div className="lead-field-label">When</div>
                      <div className="lead-field-value">This weekend</div>
                    </div>
                    <div className="lead-field">
                      <div className="lead-field-label">Source</div>
                      <div className="lead-field-value">WhatsApp share</div>
                    </div>
                  </div>

                  <div className="lead-detail-actions">
                    <button className="lead-action-btn primary">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.37 1.9.72 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0122 16.92z"/></svg>
                      Call
                    </button>
                    <button className="lead-action-btn whatsapp">
                      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/></svg>
                      WhatsApp
                    </button>
                    <button className="lead-action-btn outline">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18"/></svg>
                      Book viewing
                    </button>
                  </div>

                  <div className="lead-status-bar">
                    <div className="lead-status-step active">New</div>
                    <div className="lead-status-step">Contacted</div>
                    <div className="lead-status-step">Viewing</div>
                    <div className="lead-status-step">Offer</div>
                    <div className="lead-status-step">Closed</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lead-caps">
            <div className="lead-cap">
              <div className="lead-cap-icon">
                <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.37 1.9.72 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0122 16.92z"/></svg>
              </div>
              <h5>One-tap actions</h5>
              <p>Call, WhatsApp, email — all triggered from the lead card. No copy-pasting numbers, no app-switching.</p>
            </div>
            <div className="lead-cap">
              <div className="lead-cap-icon">
                <svg viewBox="0 0 24 24"><path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
              </div>
              <h5>Track the pipeline</h5>
              <p>New → Contacted → Viewing → Offer → Closed. Move leads through the stages with one click, never lose track.</p>
            </div>
            <div className="lead-cap">
              <div className="lead-cap-icon">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              </div>
              <h5>See the full source</h5>
              <p>WhatsApp share, Google, Instagram, ChatGPT — every lead tagged with where it came from so you know what's working.</p>
            </div>
            <div className="lead-cap">
              <div className="lead-cap-icon">
                <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>
              </div>
              <h5>Notes &amp; history</h5>
              <p>Add private notes, log conversations, and keep a complete history of every interaction in one timeline.</p>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="problem">
        <div className="problem-inner">
          <div className="problem-grid">
            <div className="problem-text">
              <h3>Your listings are working hard.<br />You aren't seeing the leads.</h3>
              <p>Portals work. They get eyeballs. But the moment a buyer enquires, they're shown four or five other listings from other agents in the same building — so you're competing for attention before the call has even started.</p>
              <p>Your social posts go to a portal page that doesn't have your name on it. And every listing description is the same copy-paste template — which Google penalises and AI models ignore.</p>
            </div>
            <div className="problem-list">
              <div className="problem-item">
                <div className="problem-item-icon">
                  <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </div>
                <div className="problem-item-text"><strong>Your buyer is shown 4–5 competing listings</strong> the moment they land on your page.</div>
              </div>
              <div className="problem-item">
                <div className="problem-item-icon">
                  <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </div>
                <div className="problem-item-text"><strong>Duplicate descriptions</strong> kill your Google ranking before you start.</div>
              </div>
              <div className="problem-item">
                <div className="problem-item-icon">
                  <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </div>
                <div className="problem-item-text"><strong>You're invisible in ChatGPT, Claude, and Gemini</strong> when buyers research areas there.</div>
              </div>
              <div className="problem-item">
                <div className="problem-item-icon">
                  <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </div>
                <div className="problem-item-text"><strong>No way to track</strong> who's looked at your listing, or how many times.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="section" id="features">
        <div className="section-eyebrow">What you get</div>
        <h2 className="section-title">Three pages that build your brand and pipeline</h2>
        <p className="section-sub">Designed for Dubai agents who want their listings to convert — and their name to compound.</p>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-box">
              <svg viewBox="0 0 24 24"><path d="M3 9.5L12 3l9 6.5V21H3V9.5z"/><path d="M9 21v-8h6v8"/></svg>
            </div>
            <h4>Individual property pages</h4>
            <p>One clean landing page per listing — gallery, AI description, full specs, location, sold pricing data, and a lead form that goes straight to your phone.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon-box">
              <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a4 4 0 014-4h8a4 4 0 014 4v2"/></svg>
            </div>
            <h4>Your portfolio page</h4>
            <p>An "about me" page with your bio, languages, specialisms, and every live property in one place. Unlocks once you have three listings live.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon-box">
              <svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/></svg>
            </div>
            <h4>Your leads, your way</h4>
            <p>Every lead goes straight to your inbox — never shared, never split. Manage them in one dashboard, track status from new through to viewing booked.</p>
          </div>
        </div>
      </section>

      {/* PORTFOLIO TEASE */}
      <section className="portfolio-tease">
        <div className="portfolio-inner">
          <div className="portfolio-grid">
            <div className="portfolio-text">
              <div className="unlock-tag">
                <svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                Unlocks at 3 live properties
              </div>
              <h3>Your own portfolio page. Free, once you've earned it.</h3>
              <p>Once you've got three listings live, your personal portfolio page activates automatically. Bio, photo, languages, specialisms, every property — all on one URL that's just yours.</p>
              <p>The page you put on your business card. The one you link from your Instagram bio. The one you send to every new client.</p>
            </div>
            <div>
              <div className="portfolio-mock">
                <div className="portfolio-mock-hero">
                  <div className="portfolio-mock-avatar">SB</div>
                  <div>
                    <div className="portfolio-mock-name">Sarah Bennett</div>
                    <div className="portfolio-mock-headline">Downtown Dubai specialist · 127 deals</div>
                  </div>
                </div>
                <div className="portfolio-mock-grid">
                  <div className="portfolio-mock-prop"></div>
                  <div className="portfolio-mock-prop"></div>
                  <div className="portfolio-mock-prop"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="section" id="pricing">
        <div className="section-eyebrow">Pricing</div>
        <h2 className="section-title">Pay only for what you use</h2>
        <p className="section-sub">Start with one property free. Add more only when you have more to sell. No flat fees, no wasted spend.</p>

        <div className="pricing-promise">
          <div className="pricing-promise-icon">
            <svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
          </div>
          <div className="pricing-promise-text">
            <strong>Volume pricing that scales with your business.</strong> Listing 5 properties? You pay for 5. Listing 30? Better rate. Listing zero? Pay nothing.
          </div>
        </div>

        <div className="pricing-grid">
          <div className="price-card">
            <div className="price-name">STARTER</div>
            <div className="price-tier-range">1 property</div>
            <div className="price-amount">$0<span className="price-per"> / month</span></div>
            <div className="price-effective free">Free forever</div>
            <div className="price-features">
              <div className="price-feature"><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>1 live property page</div>
              <div className="price-feature"><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>AI-written description</div>
              <div className="price-feature"><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>Unlimited leads to your inbox</div>
              <div className="price-feature"><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>Lead inbox &amp; pipeline tracking</div>
              <div className="price-feature dim"><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>AI model submission</div>
              <div className="price-feature dim"><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>Custom address URLs</div>
            </div>
            <Link to="/signup?tier=starter" className="price-btn outline">Start free</Link>
          </div>

          <div className="price-card">
            <div className="price-name">GROWTH</div>
            <div className="price-tier-range">2–9 properties</div>
            <div className="price-amount">$10<span className="price-per"> / property / mo</span></div>
            <div className="price-effective">e.g. 5 properties = $50/mo</div>
            <div className="price-features">
              <div className="price-feature"><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>Up to 9 live property pages</div>
              <div className="price-feature"><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>AI descriptions, all listings</div>
              <div className="price-feature"><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg><strong>Submission to all AI models</strong></div>
              <div className="price-feature"><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>View &amp; click tracking</div>
              <div className="price-feature"><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>Custom address URLs (add-on)</div>
              <div className="price-feature"><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>Portfolio page (unlocks at 3)</div>
            </div>
            <Link to="/signup?tier=growth" className="price-btn outline">Start 14-day trial</Link>
          </div>

          <div className="price-card featured">
            <div className="price-name">PRO</div>
            <div className="price-tier-range">10–19 properties</div>
            <div className="price-amount">$100<span className="price-per"> flat / mo</span></div>
            <div className="price-effective">As low as $5 per property</div>
            <div className="price-features">
              <div className="price-feature"><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg><strong>Up to 19 live property pages</strong></div>
              <div className="price-feature"><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>Everything in Growth</div>
              <div className="price-feature"><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg><strong>3 custom URLs included</strong></div>
              <div className="price-feature"><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>Community sold pricing data</div>
              <div className="price-feature"><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>Priority lead notifications</div>
              <div className="price-feature"><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>Portfolio page included</div>
            </div>
            <Link to="/signup?tier=pro" className="price-btn primary">Start 14-day trial</Link>
          </div>

          <div className="price-card">
            <div className="price-name">STUDIO</div>
            <div className="price-tier-range">20–30 properties</div>
            <div className="price-amount">$150<span className="price-per"> flat / mo</span></div>
            <div className="price-effective">As low as $5 per property</div>
            <div className="price-features">
              <div className="price-feature"><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg><strong>Up to 30 live property pages</strong></div>
              <div className="price-feature"><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>Everything in Pro</div>
              <div className="price-feature"><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg><strong>Unlimited custom URLs</strong></div>
              <div className="price-feature"><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>Priority AI re-indexing</div>
              <div className="price-feature"><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>Remove "Powered by" footer</div>
              <div className="price-feature"><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>Priority support</div>
            </div>
            <Link to="/signup?tier=studio" className="price-btn outline">Start 14-day trial</Link>
          </div>
        </div>

        <div className="pricing-footnote">
          Need more than 30 properties? <a href="#">Talk to us</a> about Enterprise. · All prices in USD · Pause or downgrade anytime — your tier auto-adjusts when you remove properties.
        </div>
      </section>

      {/* FAQ */}
      <section className="faq" id="faq">
        <div className="section-eyebrow">FAQ</div>
        <h2 className="section-title">Questions, answered</h2>
        <div className="faq-list">
          {faqData.map((item, i) => (
            <div
              key={i}
              className={`faq-item${openFaq === i ? ' open' : ''}`}
            >
              <div className="faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                {item.q}
                <span className="faq-toggle">+</span>
              </div>
              {openFaq === i && (
                <div className="faq-a">{item.a}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="final-cta">
        <div className="final-cta-inner">
          <h2>Your listings are working hard.<br />Now make them <em>work for you</em>.</h2>
          <p>Set up your first property page in under 5 minutes. AI description included. Custom URL available. No credit card needed.</p>
          <Link to="/signup" className="final-cta-btn">Start free — get your first page live today</Link>
          <div className="final-cta-trust">14-day Pro trial · Cancel anytime</div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <BrandLogo size={28} />
            <span>Agent <strong>Pages</strong></span>
          </div>
          <div className="footer-links">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">RERA disclosure</a>
            <a href="#">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
