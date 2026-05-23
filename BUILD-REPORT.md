# Agent Pages — Build Report

**Date:** 2026-05-23  
**Status:** ✅ Built, compiled, committed, pushed

---

## What was built

### Setup
- Vite 8 + React 19 + TypeScript + Tailwind CSS v4 (`@tailwindcss/vite` plugin)
- React Router v7 for all routing
- Supabase JS v2 client — hardcoded with anon key (schema: `agent_pages`)
- Font: Inter (Google Fonts via CSS import)
- Design tokens: `#ffffff` bg · `#1a1a1a` ink · `#c9a84c` gold · `#2ab695` teal

---

## Routes

### Agent-facing (authenticated via `ProtectedRoute`)
| Route | Component | Description |
|---|---|---|
| `/login` | `Login.tsx` | Email + password auth |
| `/signup` | `Signup.tsx` | Register + auto-create profile + pro trial entitlement (14 days) |
| `/dashboard` | `Dashboard.tsx` | Stats (properties, live, leads, views), quick actions, portfolio lock notice |
| `/properties` | `Properties.tsx` | Table with status, price, views, leads |
| `/properties/new` | `PropertyNew.tsx` | 3-step flow (URL check → Details → Media + Publish) |
| `/properties/:id` | `PropertyDetail.tsx` | Workspace — photos, details, publish toggle, performance |
| `/properties/:id/edit` | `PropertyEdit.tsx` | Full edit form |
| `/portfolio/edit` | `PortfolioEdit.tsx` | Bio, phone, publish toggle — locked until 3 live listings |
| `/leads` | `Leads.tsx` | Table + side drawer, status filters, status updates |
| `/settings` | `Settings.tsx` | Profile, slug, company |

### Public (no auth)
| Route | Component | Description |
|---|---|---|
| `/:agentSlug` | `PublicPortfolio.tsx` | Agent portfolio — hero, stats, listing grid, contact |
| `/:agentSlug/:propertySlug` | `PublicProperty.tsx` | Property page — photo gallery, specs, lead form |

---

## Property creation flow (`/properties/new`)

Three sections on one page with tab navigation:
1. **URL** — Paste a listing URL → calls Supabase edge function `match-listing-url` → green/grey confirmation. Pre-fills form on match. Gold background (`#fdf8e9`) on pre-filled fields.
2. **Details** — Basics, Location, Commercial, Features (beds/baths/sqft/floor/parking/furnished/view/description), Compliance (RERA, permit number)
3. **Media & Publish** — 5 photo upload slots → Supabase storage bucket `agent-pages` (public). Community pricing toggle, show price toggle. Save draft / Publish buttons.

---

## Public pages

### Portfolio (`/:agentSlug`)
- Dark hero with agent name, bio, phone CTA
- Only visible when `portfolio_published = true` AND agent has ≥3 live properties
- Listings grid with photo, type, location, price
- Contact section with phone/email

### Property landing (`/:agentSlug/:propertySlug`)
- Only shows `status = 'live'` properties
- Full-width photo gallery with chevron navigation + dot indicator
- Thumbnail strip
- Specs grid, description, compliance section
- Agent card (name, company, phone, email)
- Lead capture form → POSTs to `agent_pages.leads` via anon key + RLS
- Records page view to `agent_pages.page_views` on load

---

## Supabase

- **Schema:** `agent_pages`
- **URL:** `https://bwzrbneskvvddukivphk.supabase.co`
- **Anon key:** hardcoded in `src/lib/supabase.ts`
- **Storage bucket:** `agent-pages` (public read, already existed)
- **Photo uploads:** `{agent_id}/{timestamp}-{filename}` path
- **Lead inserts:** anon key, RLS expected to allow anon insert for `leads`

---

## Key rules enforced

- ✅ No portal names (Bayut, PropertyFinder) in any public UI
- ✅ Never auto-publish — all publishing is explicit agent action
- ✅ Portfolio locked until `portfolio_published = true` AND ≥3 live properties
- ✅ AOS design tokens only (Inter, 4 colour tokens)

---

## Build output

```
dist/index.html                   0.45 kB
dist/assets/index-*.css          31.13 kB │ gzip: 6.33 kB
dist/assets/index-*.js          522.81 kB │ gzip: 141.92 kB
```

Build: `npm run build` → clean ✅

---

## Git

- Branch: `master`
- Commit: `feat: Agent Pages initial build`
- Remote: `https://github.com/markcastley1620-hue/agent-pages`
- Author: `Vega <vega@activateos.com>`

---

## Next steps

1. **Deploy** — Set up Cloudflare Pages or Vercel pointing to this repo
2. **Custom domain** — Map `agentpages.io` or similar
3. **RLS policies** — Verify `agent_pages.leads` allows anon insert, `agent_pages.page_views` allows anon insert
4. **Edge function** — `match-listing-url` needs to be deployed (query `public.market_listings` by URL)
5. **Env vars** — Move Supabase keys to environment variables for production
6. **Email notifications** — Notify agents on new lead (Supabase webhook → edge function)
