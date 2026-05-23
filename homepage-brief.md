# OpenClaw build prompt — Agent Pages homepage

## What this is

You're building the **public marketing homepage** for **Agent Pages** — a paid product that lets Dubai real estate agents publish their property listings as polished public-facing landing pages with AI-written descriptions, custom URLs, lead capture, and a leads inbox.

This is **not** the logged-in product. This is **agentpages.io** (or whatever the root domain ends up being) — the page a Dubai agent lands on after clicking an ad, getting a referral, or seeing the brand mentioned. The single goal of this page is to make that agent **sign up for a free account or start a Pro trial**.

The full HTML design has been delivered separately (`agent-pages-landing.html`). Match it pixel-for-pixel. This brief explains what the page **is**, what it **does**, and how to **wire it up**.

---

## Source of truth

You have one reference file:

**`agent-pages-landing.html`** — the complete static design. Inter font, the full colour system (deep emerald `#2d5a4f` accent, warm paper backgrounds, cream highlight band, soft slate-blue sharing band), all section layouts, all SVG icons, all responsive rules.

Treat this file as the **spec**. Don't reinterpret the design, don't swap colours, don't change copy without checking. If something looks ambiguous in the brief, the HTML is the answer.

---

## Architecture

### Where it lives

- **Root domain** — this is the homepage at `/` (e.g. `agentpages.io`).
- **No auth required** to view. Public, fast, SEO-optimised.
- Separate from the logged-in product (which lives at `/agent/*` — that's a different Vega build, do not touch it).
- Stand-alone Next.js or Astro project preferred (static-first, server-rendered for SEO). Tailwind permitted but the design uses raw CSS in the reference file — port it cleanly, don't bloat with utility-class noise.

### Pages to build in this project

| Route | Purpose |
|---|---|
| `/` | The homepage (this brief) |
| `/login` | Redirect to the logged-in product's login page |
| `/signup` | Redirect to the logged-in product's signup page, pre-selecting "Starter (free)" tier |
| `/terms`, `/privacy`, `/rera-disclosure` | Standard legal pages (placeholder content for now) |

Everything else (dashboard, properties, leads, portfolio) is the other Vega build. Do not build those here.

---

## Page sections — what they are and what they do

Sections appear in this exact order in the HTML. Build them all, in order, with the visuals and copy matching the reference file.

### 1. Nav (sticky)
- Logo + "Agent Pages" brand mark on the left
- Nav links: The shift, AI & SEO, Sharing, Leads, Pricing — these are **anchor links** scrolling to the corresponding section IDs (`#shift`, `#ai`, `#share`, `#leads`, `#pricing`)
- "Log in" → routes to `/login`
- "Start free" → routes to `/signup`

### 2. Hero
- Headline: *"Your listings are on the portals. Now **build your agent brand**."*
- Subhead + two CTAs: primary **"Start free — no card needed"** → `/signup`; secondary **"See a live page"** → for now, open a modal or scroll to the demo preview below
- Trust line: *"14-day Pro trial · No setup · Cancel anytime"*

### 3. Discovery bar
- Seven platforms with logos: Google, ChatGPT, Claude, Gemini, Perplexity, Copilot, Grok
- Static. No links. Just establishes credibility for where pages get found.

### 4. Rich demo preview
- The browser-chrome mockup showing a sample property page at `4bedroomvillainmeadows.com`
- The mock content is **The Meadows · 4BR Villa** listed by **Sarah Bennett** (this is a placeholder — do not change to real names; if a real agent is needed for screenshots later, swap then)
- All static — gallery cells, AI description, features grid, specs strip, sold pricing block, map mock, nearby places, lead capture card
- No interactions needed in v1

### 5. Shift block (#shift)
- Headline: *"The portals get you listed. **This is how you build a brand.**"*
- Three numbered pillar cards: Control the presentation / Own where they live / Compound a reputation

### 6. AI & SEO section (#ai)
- Eyebrow with pulsing dot: "Only on Agent Pages"
- Three flow cards with internal animated mockups:
  - **Step 1**: URL paste field + "12 fields auto-filled" success + 4 chips
  - **Step 2**: AI document with **animated typing bars** (CSS keyframe — leave it as-is from the reference, it already works)
  - **Step 3**: 3×2 grid of all six AI logos with green ticks
- A dashed horizontal line connecting the three cards through the middle (pseudo-element on `.ai-flow-v2::before` — already wired in CSS)
- "Where your properties appear" panel below with all six logos and status indicators

### 7. Sharing section (#share)
- Two-panel layout: **URL examples** (left) and **Analytics mock** (right)
- URL examples list: `4bedroomvillainmeadows.com`, `burjvista38thfloor.com`, and a default `agentpages.io/sarah-bennett/burj-vista-2br`
- Analytics: 3 KPI boxes (Views 847, Leads 12, Avg time 3:42), a real SVG area chart, and 2 activity rows

### 8. Leads section (#leads)
- Three layers:
  1. **Notification stack** — three rows showing WhatsApp / Email / Push channels; top one has a pulsing live dot
  2. **Inbox mockup** — full product UI: tabs (All/New/Contacted/Viewing booked/Closed), lead list (5 sample leads with avatars, names, tags, properties, sources, statuses), and a lead detail panel on the right
  3. **Capabilities grid** — 4 cards: One-tap actions, Track the pipeline, See the full source, Notes & history
- All static. No JS interactions.

### 9. Problem section
- "Your listings are working hard. You aren't seeing the leads."
- 4 problem cards in a 2×2 list

### 10. Features
- 3 feature cards: Individual property pages / Your portfolio page / Your leads, your way

### 11. Portfolio tease
- Unlock tag: "Unlocks at 3 live properties"
- Mock portfolio card showing avatar (initials **SB**), name **Sarah Bennett**, headline, 3 property thumbnails

### 12. Pricing (#pricing)
- 4-column grid with usage-based tiers (see below — this is **important**)

### 13. FAQ
- 7 FAQ items, expand-on-click optional (can be open-by-default for v1)

### 14. Final CTA
- *"Your listings are working hard. Now make them work for you."*
- Single CTA button → `/signup`

### 15. Footer
- Brand mark left, links right (Privacy, Terms, RERA disclosure, Contact)

---

## Pricing — exact tiers (this is the critical bit)

The page sells on usage-based pricing. **Do not change the structure, the numbers, or the order.** All prices in USD.

| Tier | Range | Price | Effective per property |
|---|---|---|---|
| **STARTER** | 1 property | **$0/month** | Free forever |
| **GROWTH** | 2–9 properties | **$10/property/month** | e.g. 5 properties = $50/mo |
| **PRO** *(featured)* | 10–19 properties | **$100/month flat** | As low as $5 per property |
| **STUDIO** | 20–30 properties | **$150/month flat** | As low as $5 per property |

Above the cards: a green "Pay for what you use" promise box: *"Volume pricing that scales with your business. Listing 5 properties? You pay for 5. Listing 30? Better rate. Listing zero? Pay nothing."*

Below the cards: footnote text — *"Need more than 30 properties? Talk to us about Enterprise. · All prices in USD · Pause or downgrade anytime — your tier auto-adjusts when you remove properties."*

CTA buttons on the cards:
- Starter → "Start free" → `/signup?tier=starter`
- Growth → "Start 14-day trial" → `/signup?tier=growth`
- Pro (featured) → "Start 14-day trial" → `/signup?tier=pro`
- Studio → "Start 14-day trial" → `/signup?tier=studio`

The `tier` query param will be picked up by the signup flow in the other Vega build to pre-select the plan.

---

## SEO requirements

This is a public landing page. SEO matters.

### Meta
- **Title**: "Agent Pages — Get found everywhere your buyers are looking"
- **Meta description**: "Property pages that rank on Google, get indexed by ChatGPT, Claude and Gemini, and send every lead directly to you. Built for Dubai real estate agents."
- **OG image**: needs creating — for now, screenshot the hero section at 1200×630 as a placeholder
- **Twitter card**: `summary_large_image`
- **Canonical URL**: the root domain
- **Favicon**: emerald square with white "a" — match the nav logo

### Structured data
Add JSON-LD for:
- **SoftwareApplication** — product name, description, offers (the pricing tiers), aggregateRating placeholder
- **Organization** — Agent Pages, with foundingDate, sameAs links (LinkedIn etc when those exist)
- **FAQPage** — generated from the FAQ section content

### Performance budget
- LCP under 2.0s on 4G
- Total page weight under 250KB (the design has no real images, just gradients and inline SVG, so this is achievable)
- All fonts use `font-display: swap`
- Inline critical CSS in `<head>` for the hero, defer the rest

---

## Tracking & analytics

Wire up before launch:
- **Plausible** or **PostHog** (your call — pick one, install snippet in `<head>`)
- Track these events:
  - `signup_clicked` — fires on every CTA → `/signup` click, capture `source` (hero / pricing-starter / pricing-growth / pricing-pro / pricing-studio / final-cta)
  - `login_clicked` — nav login button
  - `demo_viewed` — when the demo preview enters viewport (intersection observer, 50% threshold)
  - `section_viewed` — fired once per page-load for each major section
  - `nav_clicked` — capture which nav link was clicked

Do **not** add Google Analytics. We want first-party analytics only.

---

## Build order

Strict sequence. Confirm each step works before moving to the next:

1. **Project scaffold** — Next.js or Astro, Tailwind optional, set up `/` route
2. **Copy the HTML in** — bring across the full reference file, port styles to your framework's pattern (CSS modules, styled-components, or Tailwind utility classes — pick one and stick to it)
3. **Make it responsive** — verify all the breakpoints from the reference file work
4. **Wire CTAs** — all signup/login routes, anchor-link nav, pricing tier param
5. **SEO meta + JSON-LD** — title, description, OG, Twitter, canonical, structured data
6. **Analytics** — install snippet, fire events
7. **Performance pass** — Lighthouse audit, inline critical CSS, defer fonts, optimise
8. **Deploy to staging** — share URL, confirm works
9. **Legal pages** — placeholder Terms / Privacy / RERA disclosure
10. **DNS** — point production domain, SSL, redirect www → apex

Do **not** build steps in parallel. Confirm each step renders correctly before the next.

---

## Things to never do

- Do not change copy without checking the reference HTML. Headlines, sub-heads, button labels, FAQ answers — all final.
- Do not rename any sample agent or property in the demo. **Sarah Bennett** + **The Meadows · 4BR Villa** + **Burj Vista · 2BR** stay as the placeholders.
- Do not reference any specific property portal (Bayut, Property Finder, Dubizzle) anywhere on the page. The copy is intentionally portal-agnostic.
- Do not add stock photos, hero images, or any photo-realistic imagery. The design uses CSS gradients in place of photos throughout — keep it that way until we have approved brand photography.
- Do not change the colour system. Inter only. No gold-on-white CTAs (deep emerald primary, white outlines secondary).
- Do not add live demo data — every number and lead in the page is hard-coded illustrative content.
- Do not connect Stripe or any payment system on this page. Pricing CTAs route to `/signup` with the tier param. Billing happens after signup in the logged-in product.
- Do not build the logged-in product. That's Vega's job in the other repo.

---

## What to confirm with Mark before deploy

- Final root domain (agentpages.io? agentpages.ae? something else?)
- Confirm USD vs AED pricing — the design uses USD, confirm that's the final call
- Whether the OG image needs custom design or screenshot-of-hero is fine for v1
- Plausible vs PostHog choice
- Whether to launch with all 4 pricing tiers visible or hide Studio for v1
