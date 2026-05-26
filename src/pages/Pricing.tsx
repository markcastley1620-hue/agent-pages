import { useState } from 'react'
import { Link } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'

/* ─── helpers ─── */
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 4 }}>
    <path d="M20 6L9 17l-5-5" />
  </svg>
)

const CheckIconWhite = () => (
  <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 4 }}>
    <path d="M20 6L9 17l-5-5" />
  </svg>
)

/* ─── pricing data ─── */
interface Tier {
  key: string
  name: string
  tagline: string
  monthlyPrice: number | null
  annualPrice: number | null
  annualTotal: number | null
  billedLine: (annual: boolean) => string
  ctaLabel: string
  ctaVariant: 'filled' | 'outline'
  credits: number
  creditLabel: string
  splitLabel: string
  splitSep: string
  teaserLabel: string
  featuresHeading: string
  features: Array<{ text: string; bold?: string }>
  featured?: boolean
}

const TIERS: Tier[] = [
  {
    key: 'starter',
    name: 'Starter',
    tagline: 'Try the product. No card needed.',
    monthlyPrice: null,
    annualPrice: null,
    annualTotal: null,
    billedLine: () => 'Forever — no time limit',
    ctaLabel: 'Get started →',
    ctaVariant: 'outline',
    credits: 1,
    creditLabel: 'credit',
    splitLabel: '1 listing or 1 development',
    splitSep: 'or',
    teaserLabel: '+ 1 TEASER FREE',
    featuresHeading: "What's included",
    features: [
      { text: 'Your portfolio page' },
      { text: 'AI search visibility on Google + 6 LLMs' },
      { text: 'Lead inbox + WhatsApp templates' },
      { text: 'Agent Pages subdomain' },
    ],
  },
  {
    key: 'solo',
    name: 'Solo',
    tagline: 'For agents running a few deals at a time.',
    monthlyPrice: 29,
    annualPrice: 23,
    annualTotal: 279,
    billedLine: (annual) => annual ? 'Billed annually · $279/yr' : 'Billed monthly · cancel any time',
    ctaLabel: 'Start free trial',
    ctaVariant: 'outline',
    credits: 10,
    creditLabel: 'credits',
    splitLabel: 'Listings + Developments',
    splitSep: '+',
    teaserLabel: '+ UNLIMITED TEASERS',
    featuresHeading: 'Everything in Starter, plus',
    features: [
      { text: 'Live Links (curated shortlists)' },
      { text: 'Auto-generated answer pages' },
      { text: 'Analytics dashboard' },
      { text: 'Lead funnel stages' },
    ],
  },
  {
    key: 'active',
    name: 'Active',
    tagline: 'The sweet spot for most working agents.',
    monthlyPrice: 79,
    annualPrice: 63,
    annualTotal: 759,
    billedLine: (annual) => annual ? 'Includes custom domain · $759/yr' : 'Includes custom domain',
    ctaLabel: 'Start free trial',
    ctaVariant: 'filled',
    credits: 25,
    creditLabel: 'credits',
    splitLabel: 'Listings + Developments',
    splitSep: '+',
    teaserLabel: '+ UNLIMITED TEASERS',
    featuresHeading: 'Everything in Solo, plus',
    features: [
      { text: '1 custom domain included', bold: '1 custom domain' },
      { text: 'Developer credibility cards' },
      { text: 'Priority WhatsApp templates' },
      { text: 'Advanced analytics + tagging' },
    ],
    featured: true,
  },
  {
    key: 'studio',
    name: 'Studio',
    tagline: 'For high-volume agents & specialists.',
    monthlyPrice: 149,
    annualPrice: 119,
    annualTotal: 1429,
    billedLine: (annual) => annual ? 'Best value for serious portfolios · $1,429/yr' : 'Best value for serious portfolios',
    ctaLabel: 'Start free trial',
    ctaVariant: 'outline',
    credits: 50,
    creditLabel: 'credits',
    splitLabel: 'Listings + Developments',
    splitSep: '+',
    teaserLabel: '+ UNLIMITED TEASERS',
    featuresHeading: 'Everything in Active, plus',
    features: [
      { text: 'Per-page custom domains' },
      { text: 'Priority support & onboarding' },
      { text: 'Advanced AI search optimisation' },
      { text: 'Bulk import from CSV / Bayut' },
    ],
  },
]

const FAQ = [
  {
    q: 'Why do listings and developments share one credit pool?',
    a: 'Because forcing you to split your allowance between two buckets is bad pricing — especially when most agents specialise in one or the other. <strong>A listing is 1 credit. A development is 1 credit.</strong> Whether you sell only secondary, only off-plan, or a mix — every credit you pay for is one you can actually use.',
  },
  {
    q: 'Why are Teasers free until I upgrade?',
    a: 'A Teaser is a lead-capture page with minimal content — no brochure, no floor plans, no payment plan. It costs us less to host and serve. We\'d rather you launch teasers the day a developer announces anything, capture early interest, and pay us when you actually have something to sell. <strong>Every Teaser auto-archives after 12 months of inactivity</strong> to keep your workspace clean.',
  },
  {
    q: 'What happens when I hit my credit limit?',
    a: 'We\'ll show you a clear upgrade prompt before you hit the cap, and you can upgrade to the next tier instantly with proration — only paying the difference for the remainder of the month. <strong>No surprise overflow charges</strong>, no hidden meters. Just simple tier upgrades when you outgrow your plan.',
  },
  {
    q: 'Can I switch between tiers?',
    a: 'Yes, any time. Upgrading is instant. Downgrading takes effect at the next billing cycle, and we\'ll warn you if downgrading would put you over the new tier\'s limits so you can archive items first.',
  },
  {
    q: 'What\'s included in the custom domain on Active?',
    a: 'Buy a new domain through us (~AED 44/year for .com, charged at-cost via Cloudflare Registrar) or point an existing one. Auto-configured DNS, automatic SSL, automatic SEO migration — your portfolio goes live on <em>yourname.com</em> in about 60 seconds. <strong>The domain is registered in your name</strong>, so if you ever leave, you take it with you.',
  },
  {
    q: 'Do you offer team / brokerage plans?',
    a: 'Yes — talk to us. Brokerage plans cover multiple agents under one billing relationship, with shared developer pages, centralised analytics, and optional white-label. Pricing is custom based on team size.',
  },
  {
    q: 'Annual billing — what\'s the actual savings?',
    a: '20% off. Solo annual = $279 (vs $348 monthly). Active annual = $759 (vs $948 monthly). Studio annual = $1,429 (vs $1,788 monthly).',
  },
]

/* ══════════════════════════════════════════════════════════════ */
export default function Pricing() {
  const [annual, setAnnual] = useState(false)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Fraunces:opsz,wght@9..144,400;9..144,500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --ink: #0f1419; --ink-soft: #2c343d; --muted: #5a6470; --quiet: #8b95a0;
          --line: #e6e8eb; --line-soft: #f0f2f4; --paper: #ffffff; --paper-warm: #fbfaf7;
          --accent: #2d5a4f; --accent-hover: #234a40; --accent-soft: #e8f0ed; --accent-bright: #3d8a76;
          --highlight: #f6f1e8; --highlight-line: #ebe3d2; --highlight-text: #8b6f3a;
        }

        .pricing-page { font-family: 'Inter', sans-serif; background: var(--paper-warm); color: var(--ink); -webkit-font-smoothing: antialiased; letter-spacing: -0.01em; line-height: 1.5; }

        .pr-topbar { padding: 18px 32px; display: flex; align-items: center; justify-content: space-between; background: #fff; border-bottom: 1px solid var(--line-soft); position: sticky; top: 0; z-index: 50; }
        .pr-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .pr-brand-name { font-size: 15px; font-weight: 700; color: var(--ink); }
        .pr-nav { display: flex; align-items: center; gap: 8px; }
        .pr-nav-link { font-size: 13px; color: var(--muted); text-decoration: none; padding: 7px 12px; border-radius: 7px; font-weight: 500; transition: all .12s; }
        .pr-nav-link:hover { background: var(--line-soft); color: var(--ink); }
        .pr-nav-link.active { color: var(--ink); background: var(--paper-warm); font-weight: 600; }
        .pr-nav-cta { padding: 8px 16px; background: var(--accent); color: #fff; border-radius: 8px; font-size: 13px; font-weight: 600; text-decoration: none; margin-left: 8px; transition: background .12s; }
        .pr-nav-cta:hover { background: var(--accent-hover); }

        .pr-hero { padding: 80px 32px 48px; max-width: 1240px; margin: 0 auto; text-align: center; }
        .pr-eyebrow { font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--accent); font-weight: 700; margin-bottom: 18px; }
        .pr-title { font-family: 'Fraunces', serif; font-size: 60px; font-weight: 400; color: var(--ink); letter-spacing: -0.03em; line-height: 1.02; margin-bottom: 18px; max-width: 780px; margin-left: auto; margin-right: auto; }
        .pr-title em { font-style: italic; color: var(--accent); }
        .pr-sub { font-size: 17px; color: var(--muted); line-height: 1.65; max-width: 620px; margin: 0 auto 32px; }
        .pr-sub strong { color: var(--ink); font-weight: 600; }

        .pr-model-explainer { max-width: 820px; margin: 0 auto 32px; padding: 24px 28px; background: #fff; border: 1px solid var(--line-soft); border-radius: 14px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
        .pr-model-item { display: flex; flex-direction: column; gap: 4px; text-align: left; padding-right: 20px; border-right: 1px solid var(--line-soft); }
        .pr-model-item:last-child { border-right: none; padding-right: 0; }
        .pr-model-icon { width: 30px; height: 30px; border-radius: 7px; background: var(--accent-soft); display: flex; align-items: center; justify-content: center; margin-bottom: 10px; }
        .pr-model-icon svg { width: 15px; height: 15px; stroke: var(--accent); stroke-width: 2; fill: none; }
        .pr-model-label { font-size: 12px; font-weight: 700; color: var(--ink); }
        .pr-model-credit { font-size: 11px; color: var(--accent); font-weight: 700; padding: 2px 7px; background: var(--accent-soft); border-radius: 4px; display: inline-block; margin-top: 2px; margin-bottom: 4px; align-self: flex-start; letter-spacing: 0.04em; }
        .pr-model-credit.free { background: #fff; border: 1px solid #c9dcd6; }
        .pr-model-desc { font-size: 11.5px; color: var(--muted); line-height: 1.5; }

        .pr-toggle { display: inline-flex; padding: 4px; background: #fff; border: 1px solid var(--line-soft); border-radius: 100px; }
        .pr-toggle-btn { padding: 8px 18px; font-size: 13px; font-weight: 600; color: var(--muted); cursor: pointer; border-radius: 100px; border: none; background: transparent; font-family: inherit; transition: all .12s; }
        .pr-toggle-btn.active { background: var(--ink); color: #fff; }
        .pr-toggle-badge { font-size: 10px; padding: 2px 7px; background: var(--accent-soft); color: var(--accent); border-radius: 100px; margin-left: 6px; font-weight: 700; letter-spacing: 0.04em; }
        .pr-toggle-btn.active .pr-toggle-badge { background: rgba(255,255,255,0.15); color: var(--accent-bright); }

        .pr-grid { max-width: 1240px; margin: 0 auto; padding: 0 32px 80px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }

        .pr-tier { background: #fff; border: 1px solid var(--line-soft); border-radius: 16px; padding: 30px 28px; display: flex; flex-direction: column; position: relative; transition: all .15s; }
        .pr-tier:hover { transform: translateY(-2px); box-shadow: 0 16px 40px rgba(15,20,25,0.05); }
        .pr-tier.featured { border-color: var(--accent); border-width: 2px; background: linear-gradient(180deg, #fff 0%, var(--accent-soft) 100%); box-shadow: 0 20px 50px rgba(45,90,79,0.12); transform: translateY(-6px); }
        .pr-tier.featured:hover { transform: translateY(-8px); }
        .pr-tier-badge { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); padding: 5px 14px; background: var(--accent); color: #fff; border-radius: 100px; font-size: 10.5px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; white-space: nowrap; }
        .pr-tier-name { font-size: 14px; font-weight: 700; color: var(--accent); letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 8px; }
        .pr-tier-tagline { font-size: 13px; color: var(--muted); line-height: 1.5; margin-bottom: 22px; min-height: 38px; }
        .pr-tier-price { display: flex; align-items: baseline; gap: 4px; margin-bottom: 4px; }
        .pr-tier-price-currency { font-size: 18px; color: var(--ink); font-weight: 500; padding-top: 6px; }
        .pr-tier-price-amount { font-family: 'Fraunces', serif; font-size: 56px; font-weight: 500; color: var(--ink); letter-spacing: -0.035em; line-height: 1; }
        .pr-tier-price-amount.free { color: var(--accent); }
        .pr-tier-price-period { font-size: 13px; color: var(--muted); margin-left: 4px; }
        .pr-tier-billed { font-size: 11.5px; color: var(--quiet); margin-bottom: 22px; min-height: 16px; }
        .pr-tier-cta { padding: 12px 18px; background: var(--accent); color: #fff; border: none; border-radius: 10px; font-size: 13.5px; font-weight: 600; cursor: pointer; font-family: inherit; margin-bottom: 24px; transition: all .12s; }
        .pr-tier-cta:hover { background: var(--accent-hover); }
        .pr-tier-cta.outline { background: #fff; color: var(--ink); border: 1px solid var(--line); }
        .pr-tier-cta.outline:hover { border-color: var(--ink); background: var(--ink); color: #fff; }
        .pr-tier-credits { padding: 20px 20px 18px; background: var(--paper-warm); border: 1px solid var(--line-soft); border-radius: 12px; margin-bottom: 22px; text-align: center; }
        .pr-tier.featured .pr-tier-credits { background: rgba(255,255,255,0.7); border-color: rgba(45,90,79,0.18); }
        .pr-tier-credits-value { font-family: 'Fraunces', serif; font-size: 42px; font-weight: 500; color: var(--ink); letter-spacing: -0.025em; line-height: 1; margin-bottom: 4px; }
        .pr-tier-credits-value em { font-style: italic; color: var(--accent); }
        .pr-tier-credits-label { font-size: 11.5px; color: var(--muted); font-weight: 500; letter-spacing: 0.02em; margin-bottom: 12px; }
        .pr-tier-credits-split { display: flex; align-items: center; justify-content: center; gap: 8px; padding-top: 12px; border-top: 1px solid var(--line-soft); font-size: 11.5px; color: var(--ink-soft); font-weight: 500; }
        .pr-tier.featured .pr-tier-credits-split { border-top-color: rgba(45,90,79,0.15); }
        .pr-tier-credits-teasers { margin-top: 8px; font-size: 11px; color: var(--accent); font-weight: 700; letter-spacing: 0.04em; }
        .pr-tier-features-label { font-size: 10.5px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--quiet); font-weight: 700; margin-bottom: 12px; }
        .pr-tier-features { display: flex; flex-direction: column; gap: 9px; }
        .pr-tier-feature { display: flex; align-items: flex-start; gap: 8px; font-size: 12.5px; color: var(--ink-soft); line-height: 1.5; }
        .pr-tier-feature svg { stroke: var(--accent-bright); }
        .pr-tier-feature strong { color: var(--ink); font-weight: 600; }

        .pr-teaser-section { max-width: 1240px; margin: 0 auto 80px; padding: 0 32px; }
        .pr-teaser-inner {
          background: radial-gradient(ellipse at 80% 20%, rgba(61,138,118,0.18) 0%, transparent 55%), linear-gradient(170deg, #0a0e13 0%, #14201d 60%, #1a2a26 100%);
          border-radius: 18px; padding: 44px 48px; position: relative; overflow: hidden;
          display: grid; grid-template-columns: 1.2fr 1fr; gap: 44px; align-items: center;
        }
        .pr-teaser-left { position: relative; z-index: 1; }
        .pr-teaser-eyebrow { display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; background: rgba(61,138,118,0.15); border: 1px solid rgba(61,138,118,0.32); border-radius: 100px; font-size: 10.5px; font-weight: 700; color: var(--accent-bright); letter-spacing: 0.16em; text-transform: uppercase; margin-bottom: 18px; }
        .pr-teaser-title { font-family: 'Fraunces', serif; font-size: 34px; font-weight: 400; color: #fff; letter-spacing: -0.025em; line-height: 1.08; margin-bottom: 14px; }
        .pr-teaser-title em { font-style: italic; background: linear-gradient(110deg, #c4ad8a 0%, var(--accent-bright) 100%); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
        .pr-teaser-sub { font-size: 15px; color: rgba(255,255,255,0.7); line-height: 1.7; margin-bottom: 22px; }
        .pr-teaser-sub strong { color: #fff; font-weight: 600; }
        .pr-teaser-points { display: flex; flex-direction: column; gap: 12px; }
        .pr-teaser-point { display: flex; align-items: flex-start; gap: 10px; font-size: 13.5px; color: rgba(255,255,255,0.85); line-height: 1.55; }
        .pr-teaser-point svg { width: 13px; height: 13px; stroke: var(--accent-bright); stroke-width: 2.4; fill: none; flex-shrink: 0; margin-top: 4px; }
        .pr-teaser-point strong { color: #fff; font-weight: 600; }
        .pr-teaser-right { position: relative; z-index: 1; }
        .pr-math-card { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.14); backdrop-filter: blur(14px); border-radius: 14px; padding: 26px; }
        .pr-math-eyebrow { font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(255,255,255,0.6); font-weight: 700; margin-bottom: 16px; }
        .pr-math-row { display: flex; justify-content: space-between; align-items: center; padding: 11px 0; border-bottom: 1px solid rgba(255,255,255,0.1); font-size: 13px; }
        .pr-math-row:last-of-type { border-bottom: none; }
        .pr-math-label { color: rgba(255,255,255,0.7); }
        .pr-math-value { color: #fff; font-weight: 600; }
        .pr-math-divider { height: 1px; background: rgba(255,255,255,0.15); margin: 8px 0; }
        .pr-math-total { display: flex; justify-content: space-between; align-items: baseline; padding-top: 14px; }
        .pr-math-total-label { font-size: 12px; color: rgba(255,255,255,0.6); }
        .pr-math-total-value { font-family: 'Fraunces', serif; font-size: 36px; font-weight: 500; color: var(--accent-bright); letter-spacing: -0.025em; line-height: 1; }
        .pr-math-aux { font-size: 11.5px; color: rgba(255,255,255,0.55); margin-top: 10px; line-height: 1.55; }
        .pr-math-aux strong { color: rgba(255,255,255,0.9); font-weight: 600; }

        .pr-examples-section { max-width: 1240px; margin: 0 auto 80px; padding: 0 32px; }
        .pr-examples-head { text-align: center; margin-bottom: 36px; }
        .pr-examples-eyebrow { font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--accent); font-weight: 700; margin-bottom: 10px; }
        .pr-examples-title { font-family: 'Fraunces', serif; font-size: 38px; font-weight: 400; color: var(--ink); letter-spacing: -0.025em; line-height: 1.15; max-width: 620px; margin: 0 auto 12px; }
        .pr-examples-title em { font-style: italic; color: var(--accent); }
        .pr-examples-sub { font-size: 14.5px; color: var(--muted); line-height: 1.6; max-width: 520px; margin: 0 auto; }
        .pr-examples-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .pr-example { background: #fff; border: 1px solid var(--line-soft); border-radius: 14px; padding: 26px 28px; }
        .pr-example-persona { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
        .pr-example-avatar { width: 38px; height: 38px; border-radius: 50%; background: linear-gradient(135deg, var(--accent), var(--accent-hover)); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 13px; font-weight: 700; flex-shrink: 0; }
        .pr-example-name { font-size: 13.5px; font-weight: 600; color: var(--ink); line-height: 1.3; }
        .pr-example-role { font-size: 11.5px; color: var(--accent); font-weight: 600; }
        .pr-example-portfolio { font-size: 13px; color: var(--ink-soft); line-height: 1.65; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid var(--line-soft); }
        .pr-example-portfolio strong { color: var(--ink); font-weight: 600; }
        .pr-usage-bar { margin-bottom: 14px; }
        .pr-usage-bar-label-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
        .pr-usage-bar-label { font-size: 10.5px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--quiet); font-weight: 700; }
        .pr-usage-bar-count { font-size: 11.5px; color: var(--ink); font-weight: 600; }
        .pr-usage-bar-track { height: 8px; background: var(--line-soft); border-radius: 4px; overflow: hidden; display: flex; }
        .pr-usage-bar-listings { background: var(--accent); height: 100%; }
        .pr-usage-bar-devs { background: var(--accent-bright); height: 100%; }
        .pr-usage-bar-legend { display: flex; gap: 12px; margin-top: 6px; font-size: 10.5px; color: var(--muted); }
        .pr-usage-bar-legend-item { display: inline-flex; align-items: center; gap: 5px; }
        .pr-usage-bar-legend-dot { width: 8px; height: 8px; border-radius: 2px; }
        .pr-usage-bar-legend-dot.l { background: var(--accent); }
        .pr-usage-bar-legend-dot.d { background: var(--accent-bright); }
        .pr-example-tier-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; padding-top: 12px; border-top: 1px solid var(--line-soft); }
        .pr-example-tier-name { font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--quiet); font-weight: 700; }
        .pr-example-tier-pill { padding: 3px 9px; background: var(--accent-soft); color: var(--accent); border-radius: 4px; font-size: 11px; font-weight: 700; }
        .pr-example-cost { display: flex; align-items: baseline; gap: 4px; margin-bottom: 4px; }
        .pr-example-cost-value { font-family: 'Fraunces', serif; font-size: 40px; font-weight: 500; color: var(--ink); letter-spacing: -0.025em; line-height: 1; }
        .pr-example-cost-period { font-size: 13px; color: var(--muted); }
        .pr-example-cost-breakdown { font-size: 12px; color: var(--muted); line-height: 1.6; margin-top: 10px; }
        .pr-example-cost-breakdown strong { color: var(--ink); font-weight: 600; }
        .pr-example-takeaway { margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--line-soft); font-size: 12px; color: var(--ink-soft); font-style: italic; line-height: 1.55; }
        .pr-example-takeaway strong { color: var(--accent); font-style: normal; font-weight: 600; }

        .pr-faq-section { max-width: 800px; margin: 0 auto 80px; padding: 0 32px; }
        .pr-faq-head { text-align: center; margin-bottom: 36px; }
        .pr-faq-title { font-family: 'Fraunces', serif; font-size: 34px; font-weight: 400; color: var(--ink); letter-spacing: -0.025em; line-height: 1.2; }
        .pr-faq-title em { font-style: italic; color: var(--accent); }
        .pr-faq-list { display: flex; flex-direction: column; }
        .pr-faq-item { padding: 22px 0; border-bottom: 1px solid var(--line-soft); }
        .pr-faq-item:last-child { border-bottom: none; }
        .pr-faq-q { font-size: 15px; font-weight: 600; color: var(--ink); letter-spacing: -0.01em; margin-bottom: 8px; line-height: 1.4; }
        .pr-faq-a { font-size: 14px; color: var(--ink-soft); line-height: 1.7; }
        .pr-faq-a strong { color: var(--ink); font-weight: 600; }
        .pr-faq-a em { font-style: italic; color: var(--accent); }

        .pr-footer { padding: 40px 32px 32px; text-align: center; font-size: 12px; color: var(--quiet); border-top: 1px solid var(--line-soft); background: #fff; }
        .pr-footer strong { color: var(--accent); font-weight: 700; }

        @media (max-width: 1200px) { .pr-grid { grid-template-columns: repeat(2, 1fr); } .pr-examples-grid { grid-template-columns: 1fr; } }
        @media (max-width: 820px) {
          .pr-hero { padding: 48px 20px 36px; }
          .pr-title { font-size: 40px; }
          .pr-model-explainer { grid-template-columns: 1fr; gap: 14px; padding: 20px 22px; }
          .pr-model-item { padding-right: 0; padding-bottom: 14px; border-right: none; border-bottom: 1px solid var(--line-soft); }
          .pr-model-item:last-child { padding-bottom: 0; border-bottom: none; }
          .pr-grid { grid-template-columns: 1fr; padding: 0 20px 32px; }
          .pr-tier.featured { transform: none; }
          .pr-teaser-section { padding: 0 20px; }
          .pr-teaser-inner { grid-template-columns: 1fr; padding: 28px 24px; gap: 28px; }
          .pr-teaser-title { font-size: 26px; }
          .pr-examples-section { padding: 0 20px; }
          .pr-examples-title { font-size: 28px; }
          .pr-faq-title { font-size: 26px; }
        }
      `}</style>

      <div className="pricing-page">
        {/* ── TOPBAR ── */}
        <header className="pr-topbar">
          <Link to="/" className="pr-brand">
            <BrandLogo size={28} />
            <span className="pr-brand-name">Agent Pages</span>
          </Link>
          <nav className="pr-nav">
            <a className="pr-nav-link" href="#">Product</a>
            <a className="pr-nav-link active" href="/pricing">Pricing</a>
            <a className="pr-nav-link" href="#">Examples</a>
            <Link className="pr-nav-link" to="/login">Log in</Link>
            <Link className="pr-nav-cta" to="/signup">Start free</Link>
          </nav>
        </header>

        {/* ── HERO ── */}
        <section className="pr-hero">
          <div className="pr-eyebrow">Pricing</div>
          <h1 className="pr-title">One pool of credits.<br />Use them <em>any way you sell.</em></h1>
          <p className="pr-sub">
            Listings and developments draw from the same credit pool.{' '}
            <strong>Mix them however your business runs.</strong> Teasers stay free until you upgrade them.
          </p>

          {/* Model explainer */}
          <div className="pr-model-explainer">
            <div className="pr-model-item">
              <div className="pr-model-icon">
                <svg viewBox="0 0 24 24"><path d="M3 9.5L12 3l9 6.5V21H3V9.5z" /></svg>
              </div>
              <div className="pr-model-label">Listing</div>
              <div className="pr-model-credit">1 credit</div>
              <div className="pr-model-desc">A secondary property — villa, apartment, townhouse.</div>
            </div>
            <div className="pr-model-item">
              <div className="pr-model-icon">
                <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>
              </div>
              <div className="pr-model-label">Development</div>
              <div className="pr-model-credit">1 credit</div>
              <div className="pr-model-desc">A Full Info off-plan launch with brochure + prices.</div>
            </div>
            <div className="pr-model-item">
              <div className="pr-model-icon">
                <svg viewBox="0 0 24 24"><path d="M12 2L9 9l-7 .8 5.2 4.6L5 22l7-4 7 4-1.2-7.6L23 9.8 16 9z" /></svg>
              </div>
              <div className="pr-model-label">Teaser</div>
              <div className="pr-model-credit free">Free</div>
              <div className="pr-model-desc">Costs nothing until you upgrade to Full Info.</div>
            </div>
          </div>

          {/* Billing toggle */}
          <div className="pr-toggle">
            <button className={`pr-toggle-btn${!annual ? ' active' : ''}`} onClick={() => setAnnual(false)}>Monthly</button>
            <button className={`pr-toggle-btn${annual ? ' active' : ''}`} onClick={() => setAnnual(true)}>
              Annual <span className="pr-toggle-badge">Save 20%</span>
            </button>
          </div>
        </section>

        {/* ── TIER CARDS ── */}
        <section className="pr-grid">
          {TIERS.map(tier => {
            const price = annual ? tier.annualPrice : tier.monthlyPrice
            const isStarter = tier.monthlyPrice === null
            return (
              <div key={tier.key} className={`pr-tier${tier.featured ? ' featured' : ''}`}>
                {tier.featured && <div className="pr-tier-badge">Most popular</div>}
                <div className="pr-tier-name">{tier.name}</div>
                <div className="pr-tier-tagline">{tier.tagline}</div>

                {/* Price */}
                <div className="pr-tier-price">
                  {isStarter ? (
                    <span className="pr-tier-price-amount free">Free</span>
                  ) : (
                    <>
                      <span className="pr-tier-price-currency">$</span>
                      <span className="pr-tier-price-amount">{price}</span>
                      <span className="pr-tier-price-period">/ mo</span>
                    </>
                  )}
                </div>
                <div className="pr-tier-billed">{tier.billedLine(annual)}</div>

                <button className={`pr-tier-cta${tier.ctaVariant === 'outline' ? ' outline' : ''}`}>
                  {tier.ctaLabel}
                </button>

                {/* Credits card */}
                <div className="pr-tier-credits">
                  <div className="pr-tier-credits-value"><em>{tier.credits}</em></div>
                  <div className="pr-tier-credits-label">{tier.creditLabel}</div>
                  <div className="pr-tier-credits-split">
                    {tier.splitSep === 'or' ? (
                      <>
                        <span>1 listing</span>
                        <span style={{ color: 'var(--quiet)', fontWeight: 600 }}>or</span>
                        <span>1 development</span>
                      </>
                    ) : (
                      <>
                        <span>Listings</span>
                        <span style={{ color: 'var(--quiet)', fontWeight: 600 }}>+</span>
                        <span>Developments</span>
                      </>
                    )}
                  </div>
                  <div className="pr-tier-credits-teasers">{tier.teaserLabel}</div>
                </div>

                {/* Features */}
                <div className="pr-tier-features-label">{tier.featuresHeading}</div>
                <div className="pr-tier-features">
                  {tier.features.map((f, i) => (
                    <div key={i} className="pr-tier-feature">
                      <CheckIcon />
                      <span>
                        {f.bold ? (
                          <><strong>{f.bold}</strong>{f.text.replace(f.bold, '')}</>
                        ) : f.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </section>

        {/* ── TEASER POLICY ── */}
        <section className="pr-teaser-section">
          <div className="pr-teaser-inner">
            <div className="pr-teaser-left">
              <div className="pr-teaser-eyebrow">★ Teaser pages</div>
              <h2 className="pr-teaser-title">Launch unlimited Teasers.<br /><em>Pay only when you convert.</em></h2>
              <p className="pr-teaser-sub">
                Saw a developer announcement on LinkedIn this morning? Launch a Teaser in 3 minutes.{' '}
                <strong>It doesn't count against your credits until you upgrade to Full Info</strong>{' '}
                — meaning until the brochure drops and you actually have something to sell.
              </p>
              <div className="pr-teaser-points">
                {[
                  { bold: 'Unlimited Teasers', rest: ' on every paid plan' },
                  { bold: 'Capture priority list leads', rest: ' before the public launch' },
                  { bold: 'Auto-notify your list', rest: ' when you upgrade to Full Info — warm leads, ready to book' },
                  { bold: null, rest: 'Teasers auto-archive after 12 months of no activity' },
                ].map((p, i) => (
                  <div key={i} className="pr-teaser-point">
                    <svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" /></svg>
                    <div>{p.bold ? <><strong>{p.bold}</strong>{p.rest}</> : p.rest}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pr-teaser-right">
              <div className="pr-math-card">
                <div className="pr-math-eyebrow">Example portfolio · Active tier</div>
                {[
                  { label: 'Listings', value: '3 credits' },
                  { label: 'Developments', value: '2 credits' },
                  { label: 'Teaser pages', value: '12 (free)' },
                  { label: 'Custom domain', value: '1 included' },
                ].map((row, i) => (
                  <div key={i} className="pr-math-row">
                    <span className="pr-math-label">{row.label}</span>
                    <span className="pr-math-value">{row.value}</span>
                  </div>
                ))}
                <div className="pr-math-divider" />
                <div className="pr-math-total">
                  <span className="pr-math-total-label">Total / month</span>
                  <span className="pr-math-total-value">$79</span>
                </div>
                <div className="pr-math-aux">
                  5 credits used of 25 — <strong>20 still available</strong> for whatever you take on next.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── WORKED EXAMPLES ── */}
        <section className="pr-examples-section">
          <div className="pr-examples-head">
            <div className="pr-examples-eyebrow">Worked examples</div>
            <h2 className="pr-examples-title">Different agents, <em>same simple model.</em></h2>
            <p className="pr-examples-sub">Three real scenarios — secondary, off-plan, and mixed — all using the same credit pool.</p>
          </div>

          <div className="pr-examples-grid">
            {/* Rashid */}
            <div className="pr-example">
              <div className="pr-example-persona">
                <div className="pr-example-avatar">RK</div>
                <div>
                  <div className="pr-example-name">Rashid K.</div>
                  <div className="pr-example-role">Secondary only</div>
                </div>
              </div>
              <div className="pr-example-portfolio">
                Resale specialist in Dubai Marina. Holds <strong>7 listings</strong>, no off-plan.
              </div>
              <div className="pr-usage-bar">
                <div className="pr-usage-bar-label-row">
                  <span className="pr-usage-bar-label">Credits used</span>
                  <span className="pr-usage-bar-count"><strong>7</strong> / 10</span>
                </div>
                <div className="pr-usage-bar-track">
                  <div className="pr-usage-bar-listings" style={{ width: '70%' }} />
                </div>
                <div className="pr-usage-bar-legend">
                  <span className="pr-usage-bar-legend-item"><span className="pr-usage-bar-legend-dot l" />7 listings</span>
                </div>
              </div>
              <div className="pr-example-tier-row">
                <span className="pr-example-tier-name">Best tier</span>
                <span className="pr-example-tier-pill">Solo</span>
              </div>
              <div className="pr-example-cost">
                <span className="pr-example-cost-value">$29</span>
                <span className="pr-example-cost-period">/ mo</span>
              </div>
              <div className="pr-example-cost-breakdown">7 credits used, <strong>3 free</strong> for the next deals.</div>
              <div className="pr-example-takeaway"><strong>Why this works:</strong> simple pricing, no allowance wasted on off-plan he doesn't sell.</div>
            </div>

            {/* Faisal */}
            <div className="pr-example" style={{ borderColor: 'var(--accent)', borderWidth: 2 }}>
              <div className="pr-example-persona">
                <div className="pr-example-avatar">FT</div>
                <div>
                  <div className="pr-example-name">Faisal T.</div>
                  <div className="pr-example-role">Off-plan only</div>
                </div>
              </div>
              <div className="pr-example-portfolio">
                Authorised broker on <strong>22 active launches</strong> across Emaar &amp; Damac. <strong>15 Teasers</strong> running.
              </div>
              <div className="pr-usage-bar">
                <div className="pr-usage-bar-label-row">
                  <span className="pr-usage-bar-label">Credits used</span>
                  <span className="pr-usage-bar-count"><strong>22</strong> / 25</span>
                </div>
                <div className="pr-usage-bar-track">
                  <div className="pr-usage-bar-devs" style={{ width: '88%' }} />
                </div>
                <div className="pr-usage-bar-legend">
                  <span className="pr-usage-bar-legend-item"><span className="pr-usage-bar-legend-dot d" />22 developments</span>
                </div>
              </div>
              <div className="pr-example-tier-row">
                <span className="pr-example-tier-name">Best tier</span>
                <span className="pr-example-tier-pill">Active</span>
              </div>
              <div className="pr-example-cost">
                <span className="pr-example-cost-value">$79</span>
                <span className="pr-example-cost-period">/ mo</span>
              </div>
              <div className="pr-example-cost-breakdown">22 credits as developments. <strong>15 Teasers cost nothing.</strong> Custom domain included.</div>
              <div className="pr-example-takeaway"><strong>Why this works:</strong> off-plan-only agents don't subsidise listings they don't use.</div>
            </div>

            {/* Sarah */}
            <div className="pr-example">
              <div className="pr-example-persona">
                <div className="pr-example-avatar">SB</div>
                <div>
                  <div className="pr-example-name">Sarah B.</div>
                  <div className="pr-example-role">Mixed portfolio</div>
                </div>
              </div>
              <div className="pr-example-portfolio">
                Established broker with <strong>3 listings + 2 developments</strong>. <strong>12 Teasers</strong> waiting for brochures.
              </div>
              <div className="pr-usage-bar">
                <div className="pr-usage-bar-label-row">
                  <span className="pr-usage-bar-label">Credits used</span>
                  <span className="pr-usage-bar-count"><strong>5</strong> / 25</span>
                </div>
                <div className="pr-usage-bar-track">
                  <div className="pr-usage-bar-listings" style={{ width: '12%' }} />
                  <div className="pr-usage-bar-devs" style={{ width: '8%' }} />
                </div>
                <div className="pr-usage-bar-legend">
                  <span className="pr-usage-bar-legend-item"><span className="pr-usage-bar-legend-dot l" />3 listings</span>
                  <span className="pr-usage-bar-legend-item"><span className="pr-usage-bar-legend-dot d" />2 developments</span>
                </div>
              </div>
              <div className="pr-example-tier-row">
                <span className="pr-example-tier-name">Best tier</span>
                <span className="pr-example-tier-pill">Active</span>
              </div>
              <div className="pr-example-cost">
                <span className="pr-example-cost-value">$79</span>
                <span className="pr-example-cost-period">/ mo</span>
              </div>
              <div className="pr-example-cost-breakdown">5 of 25 credits used. <strong>Mix shifts month to month, price doesn't.</strong></div>
              <div className="pr-example-takeaway"><strong>Why this works:</strong> one tier handles any business mix.</div>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="pr-faq-section">
          <div className="pr-faq-head">
            <h2 className="pr-faq-title">Common <em>questions</em></h2>
          </div>
          <div className="pr-faq-list">
            {FAQ.map((item, i) => (
              <div key={i} className="pr-faq-item">
                <div className="pr-faq-q">{item.q}</div>
                <div className="pr-faq-a" dangerouslySetInnerHTML={{ __html: item.a }} />
              </div>
            ))}
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="pr-footer">
          Powered by <strong>Agent Pages</strong> · Built for Dubai's authorised brokers
        </footer>
      </div>
    </>
  )
}

// Silence unused import
void CheckIconWhite
