# Vega — Off-plan developments (full build)

Ship the off-plan developments feature for Agent Pages. This adds a second entity type alongside secondary `properties`, with its own admin flow, two render modes (Teaser, Full Info), and lifecycle (Teaser → Full Info upgrade).

## Source of truth

Three HTML files attached to this brief are the **design contract**. Build the React components to match these visually — same layout, same spacing, same typography rules, same micro-interactions:

- `agent-pages-offplan-admin.html` — the admin flow showing Payment + Thesis step
- `agent-pages-offplan-teaser.html` — published Teaser page
- `agent-pages-offplan-fullinfo.html` — published Full Info page

Do not improvise on visual treatment. If something looks ambiguous in the HTMLs, ask before guessing.

## What this is

Off-plan launches sold by authorised agents through Agent Pages. The agent is usually one of 100–200 authorised sub-agents distributing the same developer's launch — differentiation comes from the agent's brand, thesis, and the quality of the page itself.

A development is structurally different from a secondary property: it's a launch of unit *types* (1BR, 2BR, 3BR, PH), not a single unit. It has a payment plan structure. It has a developer profile. It evolves through stages: announcement → sales gallery → brochure release → public launch.

Two render modes cover the launch lifecycle:

- **Teaser** — early-stage announcement page when info is limited. Agent has the name, developer, location, property type, and approximate handover window. Page is designed to feel premium and capture leads on a "priority list" before the brochure drops.
- **Full Info** — launch-ready page when the brochure, payment plan, unit prices, and renders are all available. Page is built for AI search ranking and buyer self-qualification.

Agents pick the mode that matches what they have. **They can upgrade Teaser → Full Info at any time** when more info becomes available. All Teaser leads are auto-notified when this happens.

## Architecture

Off-plan is a **separate entity**, not a property type. Reasons documented in the prior spec (`vega-off-plan-developments-spec.md`) — short version: different data model, different routes, different page template, different lead funnel.

Both modes share the same underlying `developments` row. Mode is just a column.

## Data model

All tables in `agent_pages.*` schema inside the existing AOS Supabase instance.

```sql
CREATE TABLE agent_pages.developments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES agent_pages.workspaces(id) ON DELETE CASCADE,

  -- Identity
  name text NOT NULL,                          -- "Dubai Hills Estates"
  developer_id uuid REFERENCES agent_pages.developers(id),
  slug text NOT NULL,                          -- "dubai-hills-estates"

  -- Location (same Google Places model as listings)
  community_id uuid REFERENCES agent_pages.locations(id),
  sub_community_id uuid REFERENCES agent_pages.locations(id),
  google_place_id text,
  lat decimal(10,8),
  lng decimal(11,8),
  formatted_address text,

  -- Mode
  mode text NOT NULL DEFAULT 'teaser',          -- 'teaser' | 'full_info'
  mode_changed_at timestamptz,

  -- Off-plan specifics
  handover_quarter text,                        -- "Q3 2027" — required at Full Info, optional at Teaser
  handover_year int,                            -- "2028" — used at Teaser when quarter unknown
  property_type_label text NOT NULL,            -- "Apartments & penthouses", "Villas", etc.
  
  -- Description
  hero_pitch text,                              -- one-line teaser subtitle
  description text,                             -- AI-generated thesis paragraph(s)
  thesis_chips text[],                          -- ['strong_yields','established_community',...] for regeneration
  thesis_tone text DEFAULT 'analytical',        -- 'analytical' | 'warm' | 'punchy'
  
  -- Payment plan (Full Info only — null on Teaser)
  payment_plan_template text,                   -- '20_60_20' | '40_60' | '50_50_phpp' | '10_90_phpp' | 'custom'
  payment_plan_json jsonb,                      -- denormalised milestones for rendering
  
  -- Media
  hero_image_url text,
  gallery_image_urls text[],
  brochure_pdf_url text,                        -- Full Info only
  floor_plans_pdf_url text,                     -- Full Info only

  -- Display options
  show_prices_publicly boolean DEFAULT true,
  
  -- Status
  status text DEFAULT 'draft',                  -- 'draft' | 'live' | 'archived'
  published_at timestamptz,

  -- Visibility engine (reuse existing schema, same JSON shape as listings)
  visibility_config jsonb DEFAULT '{"google": true, "chatgpt": true, "claude": true, "gemini": true, "perplexity": true, "bing": true, "grok": true}',
  schema_json jsonb,
  visibility_status text DEFAULT 'draft',

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX developments_workspace_slug ON agent_pages.developments(workspace_id, slug);
CREATE INDEX developments_workspace_status ON agent_pages.developments(workspace_id, status);
CREATE INDEX developments_mode ON agent_pages.developments(mode) WHERE status = 'live';

-- Unit types (one row per 1BR, 2BR, 3BR, PH...)
CREATE TABLE agent_pages.unit_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  development_id uuid NOT NULL REFERENCES agent_pages.developments(id) ON DELETE CASCADE,
  
  label text NOT NULL,                          -- "1BR", "2BR", "PH" — agent-editable
  category text NOT NULL,                       -- 'studio' | 'apartment' | 'penthouse' | 'townhouse' | 'duplex'
  beds int,                                     -- null for studio
  baths int,
  beds_label text,                              -- "3–4 bedrooms" for penthouses with range
  
  sqft_from int,
  sqft_to int,
  
  price_from numeric(14,2),                     -- null when prices hidden or unavailable
  price_to numeric(14,2),
  price_currency text DEFAULT 'AED',
  
  display_order int NOT NULL DEFAULT 0,
  floor_plan_image_url text,
  child_page_slug text,                         -- "1-bed-apartments" → /{agent-slug}/{dev-slug}/1-bed-apartments
  
  -- Optional aux text shown on the page
  aux_text text,                                -- "Park-facing options", "Corner units available"
  beds_aux_text text,                           -- "1 bath · Balcony", "2 baths · Maid's room"
  
  created_at timestamptz DEFAULT now()
);

CREATE INDEX unit_types_dev_order ON agent_pages.unit_types(development_id, display_order);

-- Developers (shared across workspaces — Emaar is one row referenced by N agents)
CREATE TABLE agent_pages.developers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,                    -- "Emaar Properties"
  slug text NOT NULL UNIQUE,                    -- "emaar"
  short_code text,                              -- "EM" — for the logo tile
  logo_url text,
  
  tagline text,                                 -- "Founded 1997 · Listed DFM · Dubai-headquartered"
  bio text,                                     -- longer paragraph for Full Info developer card
  founded_year int,
  
  -- Stats for the developer card (Full Info only)
  years_operating int,
  units_delivered_label text,                   -- "85k+" — string because precision varies
  on_time_pct int,                              -- 96
  rera_rating text,                             -- "A+"
  
  verified boolean DEFAULT false,               -- official developer partnership
  
  created_at timestamptz DEFAULT now()
);

-- Pre-built payment plan templates (admin can extend later)
CREATE TABLE agent_pages.payment_plan_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key text NOT NULL UNIQUE,            -- '20_60_20', '40_60', etc.
  name text NOT NULL,                           -- "20 / 60 / 20"
  tag text NOT NULL,                            -- "Standard Emaar"
  description text,                             -- "Most common for standard Emaar launches"
  
  -- Milestones as JSON: [{phase, pct, when_label, description}]
  milestones jsonb NOT NULL,
  
  display_order int NOT NULL,
  active boolean DEFAULT true,
  
  created_at timestamptz DEFAULT now()
);

-- Thesis chip vocabulary (admin-extendable)
CREATE TABLE agent_pages.thesis_chips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chip_key text NOT NULL UNIQUE,                -- 'strong_yields'
  label text NOT NULL,                          -- "Strong rental yields"
  category text,                                -- 'financial' | 'community' | 'developer' | 'lifestyle'
  display_order int NOT NULL DEFAULT 0,
  active boolean DEFAULT true
);

-- Teaser leads — separate funnel from secondary
CREATE TABLE agent_pages.development_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  development_id uuid NOT NULL REFERENCES agent_pages.developments(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES agent_pages.workspaces(id),
  
  name text NOT NULL,
  email text,
  whatsapp text,
  
  -- Captured at form time
  source_mode text NOT NULL,                    -- 'teaser' | 'full_info'
  budget_range text,
  purpose text,                                 -- 'investment' | 'move_in' | 'holiday' | 'exploring'
  interested_unit_type text,                    -- Full Info only — captures unit_type label
  
  -- Funnel stage
  stage text DEFAULT 'registered',
    -- For teaser: 'registered' → 'notified_at_launch' → 'converted_to_full_info_lead'
    -- For full_info: 'brochure_requested' → 'pricing_shared' → 'unit_selected' → 'eoi_submitted' → 'booked'
  
  -- WhatsApp delivery tracking
  whatsapp_msg_sent boolean DEFAULT false,
  whatsapp_msg_sent_at timestamptz,
  
  -- Notification on Teaser → Full Info upgrade
  notified_of_full_info boolean DEFAULT false,
  notified_at timestamptz,
  
  created_at timestamptz DEFAULT now()
);

CREATE INDEX dev_leads_workspace ON agent_pages.development_leads(workspace_id, created_at DESC);
CREATE INDEX dev_leads_dev ON agent_pages.development_leads(development_id, created_at DESC);
```

### Seed data — payment plan templates

```sql
INSERT INTO agent_pages.payment_plan_templates (template_key, name, tag, description, milestones, display_order) VALUES
('20_60_20', '20 / 60 / 20', 'Standard Emaar', 'Most common for standard Emaar launches',
 '[{"phase":"booking","pct":20,"when":"On booking","desc":"Reserves your unit, locks price."},
   {"phase":"construction","pct":60,"when":"Construction","desc":"Six milestones over ~24 months."},
   {"phase":"handover","pct":20,"when":"Handover","desc":"Due on key collection."}]', 1),
('40_60', '40 / 60', 'Build / Handover', 'Lighter booking, larger handover',
 '[{"phase":"construction","pct":40,"when":"During construction","desc":"Milestones tied to build progress."},
   {"phase":"handover","pct":60,"when":"Handover","desc":"Due on key collection."}]', 2),
('50_50_phpp', '50 / 50 + 2yr PHPP', 'Post-handover', 'Buyer-friendly for self-occupiers',
 '[{"phase":"booking","pct":25,"when":"On booking","desc":"Reserves your unit."},
   {"phase":"construction","pct":25,"when":"Construction","desc":"Spread across construction milestones."},
   {"phase":"post","pct":50,"when":"24 months post-handover","desc":"Pay down after moving in."}]', 3),
('10_90_phpp', '10 / 90 over 5yr', 'Aggressive PHPP', 'Low entry, long tail — investor magnet',
 '[{"phase":"booking","pct":10,"when":"On booking","desc":"Minimal entry to secure unit."},
   {"phase":"post","pct":90,"when":"5 years post-handover","desc":"Long tail across 60 months."}]', 4);
```

### Seed data — thesis chips

14 starter chips: `strong_yields`, `established_community`, `below_resale_comps`, `top_tier_developer`, `limited_inventory`, `beachfront`, `best_in_community`, `high_capital_appreciation`, `str_friendly`, `family_oriented`, `below_market_entry`, `schools_nearby`, `metro_hub`, `investor_only_access`.

### Seed data — developers

Pre-seed at least Emaar, Damac, Sobha, Nakheel, Meraas, Aldar with `verified = false`. Agents adding new developments will pick from this list; if their developer doesn't exist, they can add it but it won't be `verified` until manually approved.

## Routes

### Authenticated (agent-facing)

- `/agent/developments` — list view (parallel to `/agent/properties`)
- `/agent/developments/new` — wizard entry
- `/agent/developments/[id]/edit` — wizard for an existing development (same component, different state)
- `/agent/developments/[id]/edit/step/[1-5]` — deep-linkable wizard steps

### Public

- `/[agent-slug]/[dev-slug]` — development page (Teaser OR Full Info, server-side decision based on `mode`)
- `/[agent-slug]/[dev-slug]/[unit-type-slug]` — Full Info only, auto-generated child page per unit type
- `/sitemap-developments.xml` — sitemap submission for all live developments

## The wizard — 5 steps

URL: `/agent/developments/new`. Pattern A topbar with breadcrumb `Developments › Add new`. Same auto-save indicator + exit button as the property wizard.

### Step 1 — Basics (~60s)
- Developer (autocomplete against `developers` table; "Can't find your developer? Add new" inline form)
- Development name (text)
- Location (Google Places Autocomplete → location tree mapping; same component as property wizard)
- Property type label (text, suggestions: "Apartments & penthouses", "Villas", "Townhouses", "Mixed-use")
- Handover (quarter+year picker, or year-only at teaser stage)
- **Mode selector** — Teaser vs Full Info cards (the `transition-note` at the bottom of admin HTML applies here)

### Step 2 — Unit mix (~60s)
- Table builder, no "available" column
- Columns: Type label (editable input), Size sqft range, Price from (AED)
- Add row / remove row
- Beds/baths captured per-row in expanded view (optional, can be auto-inferred from label)

### Step 3 — Payment + thesis (~75s)
This is the step shown in the admin HTML. Two halves:

**Payment plan** (Full Info only — disabled on Teaser mode, with hint "Add payment plan when you upgrade to Full Info")
- 5 cards from `payment_plan_templates` table (4 pre-built + Custom)
- Each card shows mini bar visualisation
- Selecting writes `payment_plan_template` and copies `milestones` into `payment_plan_json`
- "Custom" opens a milestone builder UI (defer to v1.1 — for now, "Custom" routes to a placeholder)

**Thesis builder**
- Chip grid from `thesis_chips` table
- Selection limit: 3–5 chips required (UI counter shows "X of 5")
- Below chips: AI-generated thesis preview with 3 tone tabs (Analytical / Warm / Punchy)
- "Regenerate" button re-calls the LLM with same chips, different temperature
- "Edit manually" opens a textarea overlay — saves to `description`, marks `thesis_manually_edited = true`

See AI thesis generation section below for the prompt.

### Step 4 — Gallery (~60s)
- Hero image upload (1 required)
- Gallery upload (up to 24)
- Brochure PDF (Full Info only)
- Floor plans PDF (Full Info only — separate from brochure for separate CTAs)

### Step 5 — URL & publish (~30s)
- URL slug (auto-generated, editable)
- AI Search Visibility Engine toggles (reuse existing component from listing wizard)
- "Auto-generate child pages for each unit type" — toggle, default ON (Full Info only)
- Publish CTA

## AI thesis generation

When the agent selects 3–5 chips and clicks "Generate" (or auto-generates on chip selection change after 1s debounce), call an LLM with:

```
You are writing an investment thesis for an off-plan Dubai property launch, in the voice of {agent_name}, an authorised broker with {years_in_market} years experience.

Development context:
- Name: {dev.name}
- Developer: {dev.developer.name}
- Location: {dev.community.name}, {dev.sub_community.name}
- Property type: {dev.property_type_label}
- Handover: {dev.handover_quarter or handover_year}
- Unit mix: {unit_types summary — e.g. "1BR from AED 1.25M, 2BR from AED 2.1M, 3BR from AED 3.4M, PH from AED 6.8M"}
- Payment plan: {payment_plan_template name and structure}

Selected reasons this launch is compelling:
{thesis_chips list with labels}

Write a 2-paragraph thesis (180–250 words total) that:
- Opens with the strongest reason from the chips
- References specific data points from the unit mix and location where possible
- Reads like an experienced agent's confident analysis, NOT marketing copy
- Avoids superlatives like "best", "amazing", "incredible"
- Uses one or two bold-worthy phrases (don't add the bold tags — those are added in the UI)
- Tone: {analytical|warm|punchy}
  - Analytical: data-led, dispassionate, focused on numbers and comparables
  - Warm: conversational, focused on lifestyle and the buyer's experience
  - Punchy: short sentences, direct, conviction-led
- Ends with a forward-looking statement about value at handover or yield

Do not include greetings, sign-offs, or meta-commentary. Output the two paragraphs only.
```

Store the raw output in `description`. Show it in the preview card. Re-generate on chip change or tone change. Marking `thesis_manually_edited = true` locks the field from regeneration unless the agent explicitly clicks "Regenerate" again.

## Live page rendering

### Mode router

Public URL `/[agent-slug]/[dev-slug]` → server fetches the development row → branches on `mode`:
- `mode = 'teaser'` → render `<TeaserDevelopmentPage>`
- `mode = 'full_info'` → render `<FullInfoDevelopmentPage>`

### Teaser page — content rules

Match `agent-pages-offplan-teaser.html` exactly. Key behavioural rules:

- **Hero attribute strip = 3 cells only:** Location · Type · Handover. No 4th.
- **Hero scarcity meter = 5-bar visual indicator, no number.** Logic: 0–10 registered = 2 bars filled, 11–30 = 3 bars, 31–60 = 4 bars, 61+ = 4 bars filled + "Filling up". Never display the raw count.
- **"What we know" section = 4 facts max:** Developer, Location, Property type, Handover. Each has a `Confirmed` (emerald pill) or `Coming soon` (highlight pill) status. Pull from the development row; status is derived (`handover_quarter` populated → Confirmed for Handover, else Coming).
- **Register card** — captures name, email, WhatsApp, budget range, purpose. Submits to `development_leads` with `source_mode = 'teaser'`, `stage = 'registered'`. Fires WhatsApp template to agent within 60s.
- **"How Sarah works" section** = 3 promises, no dates. Static content with agent's first name substituted:
  - "A personal hello on WhatsApp" / "{first_name} replies within the hour. A short message — not a sales call, not a bot."
  - "The brochure the day it drops" / "When {developer_name} releases pricing & floor plans, you'll have them before the public launch."
  - "No noise, no other agents" / "One agent, one channel. Opt out any time with a single message."
- **No timeline. No specific dates anywhere.** No "Last updated" line anywhere. No registered-count number visible to buyers.

### Full Info page — content rules

Match `agent-pages-offplan-fullinfo.html` exactly. Key behavioural rules:

- **Status strip = 2 columns only:** Handover, From. No Completion percentage column anywhere on the page.
- **Thesis is anchored high** — placed immediately after the status strip, before unit mix. This is the agent's competitive differentiation.
- **Unit mix table** — 4 columns (Type pill, Beds, Size, Price). Row click → child unit-type page.
- **Payment plan visualisation** — pulled from `payment_plan_json`, rendered as stacked bar + 3-up (or 4-up if PHPP) detail cards.
- **Developer card** — pulled from shared `developers` table. Shows logo tile (`short_code`), name, tagline, Verified badge if applicable, 4 stat tiles (years/units/on-time/RERA), bio paragraph.
- **Lead capture card** — captures full lead with `interested_unit_type` from the dropdown. Submits to `development_leads` with `source_mode = 'full_info'`, `stage = 'brochure_requested'`. WhatsApp template includes brochure PDF link + agent's note + 3 best-value unit type picks.

## Mode upgrade flow (Teaser → Full Info)

Critical UX. When an agent gets the brochure for their Teaser-mode development:

1. Agent goes to `/agent/developments/[id]/edit`
2. Settings page shows a banner: *"This development is in Teaser mode. Got the brochure? Upgrade to Full Info."*
3. "Upgrade to Full Info" button takes them to Step 3 (Payment + thesis) — Step 1 + 2 are already done
4. Once payment plan is selected and thesis is generated, "Upgrade & notify priority list" button:
   - Sets `mode = 'full_info'`, `mode_changed_at = now()`
   - Triggers a batch WhatsApp template to all `development_leads` where `development_id = X AND source_mode = 'teaser' AND notified_of_full_info = false`
   - Template: "Hi {name}, {dev.name} just launched! Full brochure, prices & payment plan attached. {dev_url}"
   - Sets `notified_of_full_info = true`, `notified_at = now()` on each lead
5. Agent gets a confirmation: "{N} priority list members notified. {N} are now warm leads in your inbox."

## What to reuse (don't rebuild)

- **Agent banner component** — same `<AgentBanner>` used on listing pages (sticky, avatar, name, brokerage, Call + WhatsApp buttons)
- **Google Places Autocomplete + location tree mapping** — same component as property wizard Step 5
- **Visibility Engine toggles** — same `<VisibilityEngineSection>` from wizard
- **Pattern A topbar** with breadcrumbs + auto-save indicator + Exit button
- **Step rail component** from the property wizard — extend, don't fork
- **Lead inbox view** — extend with a "Type" column showing "Property" or "Development", filter chip for development leads
- **Custom domain** — works automatically; development URLs use the workspace's primary domain just like properties
- **WhatsApp template firing infrastructure** — reuse the existing respond.io integration; just add new template definitions

## Visibility & SEO

- Each development page has its own `schema_json` (RealEstateListing-compatible structured data)
- Child unit-type pages have their own schema (one per page)
- All live developments included in `/sitemap-developments.xml`
- Crawler allowlist same as listing pages (configured at workspace level)
- Answer page generator extended with development-type templates (see prior off-plan spec for the 5 new templates — defer to v1.1, just leave a `feature_flag` for now)

## Pricing & tier gating

Add to existing tier enforcement:

| Tier | Properties | Developments |
|---|---|---|
| Starter (free) | 1 | 0 (paywall: "Upgrade to Growth to add a development") |
| Growth ($10/property) | 2–9 | 1 included |
| **Pro ($100 flat)** | 10–19 | **3 included** |
| Studio ($150 flat) | 20–30 | **Unlimited** |

Enforce at creation time. If agent on Pro already has 3 developments and tries to add a 4th: "You've reached 3 developments on Pro. Upgrade to Studio for unlimited."

## Acceptance checklist

- [ ] `developments`, `unit_types`, `developers`, `payment_plan_templates`, `thesis_chips`, `development_leads` tables created with the schema above
- [ ] Seed data inserted for `payment_plan_templates`, `thesis_chips`, and `developers` (Emaar, Damac, Sobha, Nakheel, Meraas, Aldar)
- [ ] `/agent/developments` list view exists alongside `/agent/properties`
- [ ] `/agent/developments/new` wizard works end-to-end across 5 steps
- [ ] Step 2 unit mix builder has NO "available" column
- [ ] Step 3 payment plan picker shows 5 cards with mini-bar visualisations
- [ ] Step 3 thesis chip grid limits selection to 3–5 chips, with live counter
- [ ] Step 3 AI thesis preview supports 3 tones with regenerate
- [ ] Mode selector visible in Step 1 with the two cards matching the admin HTML
- [ ] Teaser → Full Info upgrade banner appears on `/agent/developments/[id]/edit` for Teaser-mode devs
- [ ] Mode upgrade fires WhatsApp batch to all priority-list leads
- [ ] Public `/[agent-slug]/[dev-slug]` routes to Teaser OR Full Info template based on `mode`
- [ ] Teaser page has 3-cell hero attribute strip (Location, Type, Handover only — NO Frontage cell)
- [ ] Teaser page has 4-fact "What we know" section, with Confirmed/Coming pills derived from data
- [ ] Teaser page scarcity meter shows visual bars only, NO registered count number
- [ ] Teaser page has "How Sarah works" 3-promise block, NO timeline, NO speculative dates
- [ ] No "Last updated" timestamp anywhere on either page
- [ ] Full Info status strip is 2 columns (Handover, From) — NO Completion percentage anywhere
- [ ] Full Info thesis card sits immediately after status strip
- [ ] Full Info developer card pulls from shared `developers` table with stats + bio + Verified badge
- [ ] Visibility Engine toggles work and write `visibility_config` JSON
- [ ] Pricing tier gating enforced at creation time
- [ ] Lead capture writes to `development_leads` with correct `source_mode` and `stage`
- [ ] Auto-save fires every 3s on any wizard step
- [ ] Mobile breakpoints match the HTML at <820px

## Out of scope for v1 (defer to v1.1)

- Child unit-type pages (`/[agent-slug]/[dev-slug]/[unit-type-slug]`) — capture data in schema, leave pages as 404 for now
- Custom payment plan builder (Step 3 "Custom" template)
- Developer profile pages (`/[agent-slug]/developer/[developer-slug]`)
- New answer-page templates for off-plan (yield comparison, post-handover filter, etc.)
- Live Link adaptation for developments (mixing properties + developments in one shortlist)
- Per-property domain on Studio tier
- Verified developer flow (manual approval queue)
- Developer-side dashboard for cross-agent inventory

## Timeline

**3-week build:**

- Week 1: Schema + seed data + admin wizard scaffold + Step 1, 2, 4, 5
- Week 2: Step 3 (payment plan picker + thesis chip builder + LLM integration) + mode upgrade flow
- Week 3: Public page templates (Teaser + Full Info) + pricing tier gating + acceptance testing

Ship behind a `feature_flags.developments_enabled` boolean per workspace so we can roll out gradually.

## Final notes

- Match the HTMLs visually. If something doesn't make sense in the HTMLs, ask before guessing.
- Inter throughout the admin UI. Fraunces only on hero titles and editorial H2s in the published pages.
- Emerald accent system across both modes. No purple, no gold-as-brand, no other accent colours.
- Off-plan content scope: agent has limited info, especially at Teaser. **Never invent dates, percentages, or numbers the agent didn't enter.**
- Honest scarcity > fake scarcity. Vague meter > fake counter.
- Generated thesis quality is the moat. Spend time getting the LLM prompt right.
