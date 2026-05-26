# Vega — Off-plan developments (full build, revised)

Build the off-plan developments feature for Agent Pages. This includes:

1. The `developments` entity (separate from `listings`) with two render modes (Teaser, Full Info)
2. The admin flow (5-step wizard) with pre-built payment plan picker + AI thesis chip builder
3. Two public page templates (Teaser, Full Info) with the mode-upgrade lifecycle
4. Lead capture + funnel stages distinct from listing leads
5. Credit-pool pricing (listings + developments share one counter; teasers free)

This brief supersedes the earlier `vega-off-plan-build-prompt.md`.

## Source of truth (design contracts)

Five HTML files attached. Build React components to match these visually:

- `agent-pages-offplan-admin.html` — admin Step 3 showing payment picker + thesis chip builder
- `agent-pages-offplan-teaser.html` — published Teaser page
- `agent-pages-offplan-fullinfo.html` — published Full Info page
- `agent-pages-leads-inbox.html` — leads inbox with development lead flow + detail panel
- `agent-pages-pricing.html` — pricing page

Do not improvise on visual treatment. If something is ambiguous in the HTMLs, ask before guessing.

---

## Section 1 — The off-plan entity

### What this is

Off-plan launches sold by authorised agents. The agent is usually one of 100-200 authorised sub-agents distributing the same developer's launch — differentiation comes from the agent's brand, thesis, and page quality.

A development is structurally different from a secondary listing: it's a launch of unit *types* (1BR, 2BR, 3BR, PH), not a single unit. It has a payment plan structure, a developer profile, and evolves through stages: announcement → sales gallery → brochure release.

Two render modes:

- **Teaser** — early-stage announcement page when info is limited (developer + project name + location + property type + handover window). Designed to feel premium and capture leads on a "priority list".
- **Full Info** — launch-ready page when brochure, payment plan, unit prices, and renders are all available. Built for AI search ranking and buyer self-qualification.

Both modes share the same `developments` row. Mode is just a column. Agents can upgrade Teaser → Full Info at any time; all Teaser leads are auto-notified.

### Data model

All tables in `agent_pages.*` schema.

```sql
CREATE TABLE agent_pages.developments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES agent_pages.workspaces(id) ON DELETE CASCADE,

  name text NOT NULL,
  developer_id uuid REFERENCES agent_pages.developers(id),
  slug text NOT NULL,

  -- Location (same Google Places model as listings)
  community_id uuid REFERENCES agent_pages.locations(id),
  sub_community_id uuid REFERENCES agent_pages.locations(id),
  google_place_id text,
  lat decimal(10,8),
  lng decimal(11,8),
  formatted_address text,

  -- Mode
  mode text NOT NULL DEFAULT 'teaser',           -- 'teaser' | 'full_info'
  mode_changed_at timestamptz,

  -- Off-plan specifics
  handover_quarter text,                          -- "Q3 2027" — required for Full Info, optional Teaser
  handover_year int,                              -- "2028" — Teaser fallback when quarter unknown
  property_type_label text NOT NULL,              -- "Apartments & penthouses"

  -- Description
  hero_pitch text,
  description text,                               -- AI-generated thesis
  thesis_chips text[],
  thesis_tone text DEFAULT 'analytical',          -- 'analytical' | 'warm' | 'punchy'

  -- Payment plan (Full Info only — null on Teaser)
  payment_plan_template text,                     -- '20_60_20' | '40_60' | '50_50_phpp' | '10_90_phpp' | 'custom'
  payment_plan_json jsonb,

  -- Media
  hero_image_url text,
  gallery_image_urls text[],
  brochure_pdf_url text,                          -- Full Info only
  floor_plans_pdf_url text,                       -- Full Info only

  -- Display options
  show_prices_publicly boolean DEFAULT true,

  -- Status
  status text DEFAULT 'draft',                    -- 'draft' | 'live' | 'archived'
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

-- Unit types (one row per 1BR, 2BR, etc.)
CREATE TABLE agent_pages.unit_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  development_id uuid NOT NULL REFERENCES agent_pages.developments(id) ON DELETE CASCADE,

  label text NOT NULL,                            -- "1BR", "2BR", "PH"
  category text NOT NULL,                         -- 'studio' | 'apartment' | 'penthouse' | 'townhouse' | 'duplex'
  beds int,
  baths int,
  beds_label text,                                -- "3–4 bedrooms"

  sqft_from int,
  sqft_to int,

  price_from numeric(14,2),
  price_to numeric(14,2),
  price_currency text DEFAULT 'AED',

  display_order int NOT NULL DEFAULT 0,
  floor_plan_image_url text,
  child_page_slug text,                           -- "1-bed-apartments"

  aux_text text,                                  -- "Park-facing options"
  beds_aux_text text,                             -- "1 bath · Balcony"

  created_at timestamptz DEFAULT now()
);

-- Developers (shared across workspaces — Emaar is ONE row referenced by N agents)
CREATE TABLE agent_pages.developers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  short_code text,                                -- "EM"
  logo_url text,

  tagline text,                                   -- "Founded 1997 · Listed DFM · Dubai-headquartered"
  bio text,
  founded_year int,

  -- Stats for the Full Info developer card
  years_operating int,
  units_delivered_label text,                     -- "85k+"
  on_time_pct int,
  rera_rating text,

  verified boolean DEFAULT false,

  created_at timestamptz DEFAULT now()
);

-- Pre-built payment plan templates
CREATE TABLE agent_pages.payment_plan_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key text NOT NULL UNIQUE,              -- '20_60_20'
  name text NOT NULL,                             -- "20 / 60 / 20"
  tag text NOT NULL,                              -- "Standard Emaar"
  description text,
  milestones jsonb NOT NULL,
  display_order int NOT NULL,
  active boolean DEFAULT true
);

-- Thesis chip vocabulary
CREATE TABLE agent_pages.thesis_chips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chip_key text NOT NULL UNIQUE,
  label text NOT NULL,
  category text,
  display_order int NOT NULL DEFAULT 0,
  active boolean DEFAULT true
);
```

### Seed data

**Payment plan templates** (4 + Custom placeholder):

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

**Thesis chips** (14 starters):
`strong_yields`, `established_community`, `below_resale_comps`, `top_tier_developer`, `limited_inventory`, `beachfront`, `best_in_community`, `high_capital_appreciation`, `str_friendly`, `family_oriented`, `below_market_entry`, `schools_nearby`, `metro_hub`, `investor_only_access`.

**Developers**: pre-seed Emaar, Damac, Sobha, Nakheel, Meraas, Aldar with `verified = false`.

### Routes

**Authenticated:**
- `/agent/developments` — list view (parallel to `/agent/properties`)
- `/agent/developments/new` — wizard entry
- `/agent/developments/[id]/edit` — wizard for existing dev
- `/agent/developments/[id]/edit/step/[1-5]` — deep-linkable steps

**Public:**
- `/[agent-slug]/[dev-slug]` — development page (mode router: Teaser OR Full Info)
- `/[agent-slug]/[dev-slug]/[unit-type-slug]` — child page per unit type (Full Info only, v1.1)
- `/sitemap-developments.xml`

### 5-step wizard

URL: `/agent/developments/new`. Pattern A topbar with breadcrumb `Developments › Add new`.

- **Step 1 — Basics** (~60s): Developer (autocomplete from `developers`), name, location (Google Places), property type label, handover quarter/year, **mode selector (Teaser or Full Info)**
- **Step 2 — Unit mix** (~60s): table builder, columns `Type / Size (sqft) / Price from`. **No "available" column.** Beds/baths captured per-row.
- **Step 3 — Payment + thesis** (~75s): pre-built payment plan cards (Full Info only) + chip-based thesis builder with AI generation in 3 tones. **Match `agent-pages-offplan-admin.html` exactly.**
- **Step 4 — Gallery** (~60s): hero image, gallery, brochure PDF (Full Info), floor plans PDF (Full Info)
- **Step 5 — URL & publish** (~30s): URL slug, visibility engine toggles (reuse existing component), publish CTA

### AI thesis generation

When the agent selects 3-5 chips, call an LLM with:

```
You are writing an investment thesis for an off-plan Dubai property launch, in the voice of {agent_name}, an authorised broker with {years_in_market} years experience.

Development context:
- Name: {dev.name}
- Developer: {dev.developer.name}
- Location: {dev.community.name}, {dev.sub_community.name}
- Property type: {dev.property_type_label}
- Handover: {dev.handover_quarter or handover_year}
- Unit mix: {summary}
- Payment plan: {template name and structure}

Selected reasons this launch is compelling:
{thesis_chips list with labels}

Write a 2-paragraph thesis (180–250 words total) that:
- Opens with the strongest reason from the chips
- References specific data points from the unit mix and location where possible
- Reads like an experienced agent's confident analysis, NOT marketing copy
- Avoids superlatives like "best", "amazing", "incredible"
- Uses one or two bold-worthy phrases (don't add bold tags — those are added in the UI)
- Tone: {analytical|warm|punchy}
  - Analytical: data-led, focused on numbers and comparables
  - Warm: conversational, focused on lifestyle and the buyer's experience
  - Punchy: short sentences, direct, conviction-led
- Ends with a forward-looking statement about value at handover or yield

Do not include greetings, sign-offs, or meta-commentary. Output two paragraphs only.
```

Store in `description`. Re-generate on chip change or tone change. "Edit manually" locks the field from regeneration unless explicitly clicked "Regenerate" again.

### Live page rendering rules

**Mode router:** Public URL `/[agent-slug]/[dev-slug]` → server fetches development → branches on `mode` → renders `<TeaserDevelopmentPage>` or `<FullInfoDevelopmentPage>`.

**Teaser page (match `agent-pages-offplan-teaser.html` exactly):**
- Hero attribute strip = **3 cells only**: Location · Type · Handover. NO Frontage cell.
- Hero scarcity meter = **5-bar visual, no number**. Logic: 0-10 registered → 2 bars filled, 11-30 → 3 bars, 31-60 → 4 bars + "Filling up", 61+ → 4 bars + "Almost full". Never display raw count.
- "What we know" section = **4 facts maximum**, with `Confirmed` (emerald pill) or `Coming soon` (highlight pill) status derived from data.
- "How Sarah works" section = **3 promises, NO timeline, NO speculative dates**. Static content with agent's first name substituted:
  - "A personal hello on WhatsApp" — `{first_name} replies within the hour. A short message — not a sales call, not a bot.`
  - "The brochure the day it drops" — `When {developer_name} releases pricing & floor plans, you'll have them before the public launch.`
  - "No noise, no other agents" — `One agent, one channel. Opt out any time with a single message.`
- **No "Last updated" line anywhere.** No registered-count number visible.

**Full Info page (match `agent-pages-offplan-fullinfo.html` exactly):**
- Status strip = **2 columns only**: Handover, From. **NO Completion percentage anywhere on the page.**
- Thesis is **anchored high** — immediately after status strip, before unit mix.
- Unit mix table: 4 columns (Type pill, Beds, Size, Price). Row click → child unit-type page.
- Payment plan visualisation pulled from `payment_plan_json`, rendered as stacked bar + 3-up detail.
- Developer card pulled from shared `developers` table: logo tile (`short_code`), name, tagline, Verified badge, 4 stat tiles (years/units/on-time/RERA), bio paragraph.
- Lead capture writes to `development_leads` with `source_mode = 'full_info'`, `stage = 'brochure_requested'`.

### Mode upgrade flow (Teaser → Full Info)

1. Agent opens `/agent/developments/[id]/edit` on a Teaser-mode development
2. Settings page shows banner: *"This development is in Teaser mode. Got the brochure? Upgrade to Full Info."*
3. "Upgrade to Full Info" → jumps to Step 3 (Payment + thesis); Steps 1 + 2 already done
4. After payment plan selected and thesis generated, "Upgrade & notify priority list" button:
   - Sets `mode = 'full_info'`, `mode_changed_at = now()`
   - Triggers batch WhatsApp to all `development_leads` where `development_id = X AND source_mode = 'teaser' AND notified_of_full_info = false`
   - Template: *"Hi {name}, {dev.name} just launched! Full brochure, prices & payment plan attached. {dev_url}"*
   - Sets `notified_of_full_info = true`, `notified_at = now()` on each lead
5. Confirmation: *"{N} priority list members notified. {N} are now warm leads in your inbox."*

---

## Section 2 — Lead capture & inbox

Match `agent-pages-leads-inbox.html` exactly.

### Data model

```sql
CREATE TABLE agent_pages.development_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  development_id uuid NOT NULL REFERENCES agent_pages.developments(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES agent_pages.workspaces(id),

  name text NOT NULL,
  email text,
  whatsapp text,

  -- Captured at form time
  source_mode text NOT NULL,                      -- 'teaser' | 'full_info'
  budget_range text,
  purpose text,                                   -- 'investment' | 'move_in' | 'holiday' | 'exploring'
  interested_unit_type text,                      -- Full Info only

  -- Funnel stage
  stage text DEFAULT 'registered',
    -- Teaser: 'registered' → 'notified_at_launch' → 'converted_to_full_info_lead'
    -- Full Info: 'brochure_requested' → 'pricing_shared' → 'unit_selected' → 'eoi_submitted' → 'booked'

  -- WhatsApp delivery
  whatsapp_msg_sent boolean DEFAULT false,
  whatsapp_msg_sent_at timestamptz,

  -- Mode upgrade notification
  notified_of_full_info boolean DEFAULT false,
  notified_at timestamptz,

  created_at timestamptz DEFAULT now()
);

CREATE INDEX dev_leads_workspace ON agent_pages.development_leads(workspace_id, created_at DESC);
CREATE INDEX dev_leads_dev ON agent_pages.development_leads(development_id, created_at DESC);
```

### Lead flow — Teaser

1. Buyer hits Teaser page → submits priority-list form (name, email, WhatsApp, budget, purpose)
2. Insert `development_leads` row: `source_mode='teaser'`, `stage='registered'`
3. WhatsApp template fires to **agent** within 60s with lead snapshot: *"New priority list lead for {dev.name}: {name}, budget {budget_range}, {purpose}. WhatsApp: {whatsapp}"*
4. Lead appears in inbox under Developments tab with "On priority list" stage pill (highlight gold)

### Lead flow — Full Info

1. Buyer hits Full Info page → submits "Send me the brochure + Sarah's picks" form (name, email, WhatsApp, interested unit type, purpose)
2. Insert `development_leads` row: `source_mode='full_info'`, `stage='brochure_requested'`
3. **Two WhatsApp messages fire:**
   - To buyer: template with brochure PDF link + payment plan link + agent's auto-note based on chip selections + agent's contact card
   - To agent: lead snapshot
4. Lead appears in inbox with "Brochure requested" stage pill (emerald)

### Lead inbox UI

Reuse existing `<LeadsInbox>` component, extend with:

- **Type tabs**: All / Listings / Developments / Live Links (with counts)
- **Lead row** shows source-mode tag pill (`Teaser` in gold, `Full Info` in emerald)
- **Lead row** shows source dev name + buyer's interested unit type/budget
- **Stage pill** with the 6 development-funnel stages (registered / brochure-requested / pricing-shared / unit-selected / eoi-submitted / booked)
- **Right detail panel** shows:
  - Captured details (email, WhatsApp, interested unit, purpose)
  - "Came from" card linking back to the source dev page with a small thumbnail
  - Funnel timeline with done/current/upcoming dots — agent can click a stage to mark it done
- **Sidebar nav** has Listings + Developments + Leads + Live Links as separate items with counts

### WhatsApp template definitions

Add to existing respond.io setup:

| Template ID | Trigger | Recipient | Variables |
|---|---|---|---|
| `dev_lead_teaser_to_agent` | New Teaser lead | Agent | dev_name, lead_name, budget, purpose, whatsapp |
| `dev_lead_fullinfo_to_buyer` | New Full Info lead | Buyer | agent_name, dev_name, brochure_url, payment_plan_url, agent_note |
| `dev_lead_fullinfo_to_agent` | New Full Info lead | Agent | dev_name, lead_name, interested_unit, purpose, whatsapp |
| `dev_mode_upgraded_to_lead` | Mode upgrade fired | Each priority-list lead | name, dev_name, dev_url |

---

## Section 3 — Pricing (credit pool)

### The model

Each workspace has one credit pool shared between listings and developments.

- A **listing** with `status='live'` = 1 credit
- A **development** with `status='live' AND mode='full_info'` = 1 credit
- A **development** with `status='live' AND mode='teaser'` = **0 credits** (free)
- Archived or draft items = 0 credits

Tier limits:

| Tier | Monthly | Annual | Credits |
|---|---|---|---|
| Starter | Free | Free | 1 |
| Solo | $29 | $279 | 10 |
| Active | $79 | $759 | 25 |
| Studio | $149 | $1,429 | 50 |

**No overflow.** When the agent reaches the limit, creation is blocked with an upgrade prompt.

### Data model

```sql
ALTER TABLE agent_pages.workspaces
  ADD COLUMN tier text NOT NULL DEFAULT 'starter',
  ADD COLUMN tier_credits_included int NOT NULL DEFAULT 1,
  ADD COLUMN billing_cycle text NOT NULL DEFAULT 'monthly',
  ADD COLUMN stripe_subscription_id text,
  ADD COLUMN stripe_customer_id text;

CREATE TABLE agent_pages.pricing_tiers (
  tier text PRIMARY KEY,
  display_name text NOT NULL,
  credits_included int NOT NULL,
  monthly_price_usd numeric(10,2) NOT NULL,
  annual_price_usd numeric(10,2) NOT NULL,
  stripe_price_id_monthly text,
  stripe_price_id_annual text,
  features jsonb NOT NULL DEFAULT '[]',
  display_order int NOT NULL,
  active boolean DEFAULT true
);

INSERT INTO agent_pages.pricing_tiers VALUES
  ('starter', 'Starter', 1, 0, 0, NULL, NULL,
   '["portfolio_page","ai_search_visibility","lead_inbox","agent_subdomain"]', 1, true),
  ('solo', 'Solo', 10, 29, 279, 'price_solo_monthly', 'price_solo_annual',
   '["live_links","answer_pages","analytics","lead_funnel"]', 2, true),
  ('active', 'Active', 25, 79, 759, 'price_active_monthly', 'price_active_annual',
   '["custom_domain","developer_cards","priority_whatsapp","advanced_analytics"]', 3, true),
  ('studio', 'Studio', 50, 149, 1429, 'price_studio_monthly', 'price_studio_annual',
   '["per_page_domains","priority_support","advanced_ai_search","bulk_import"]', 4, true);
```

### Credit count query

```sql
SELECT
  (SELECT COUNT(*) FROM agent_pages.listings
   WHERE workspace_id = $1 AND status = 'live')
  +
  (SELECT COUNT(*) FROM agent_pages.developments
   WHERE workspace_id = $1 AND status = 'live' AND mode = 'full_info')
  AS credits_used;
```

Teasers tracked separately for the dashboard ("12 free Teasers") but **never count against credits**.

### Stripe integration

Each workspace has one Stripe subscription with a **single price item** matching their tier. No usage-based items, no overflow, no metered billing.

- **Upgrade**: `stripe.subscriptions.update` with `proration_behavior: 'create_prorations'` — applied immediately
- **Downgrade**: `stripe.subscriptionSchedules.create` — takes effect at end of billing period
- **Annual / monthly switch**: same as upgrade/downgrade flow

### Tier gating

Before allowing a new listing or development creation:

```javascript
if (credits_used >= tier_credits_included) {
  // Block creation. Show upgrade modal.
  showUpgradeModal({
    current_tier: workspace.tier,
    suggested_tier: nextTier(workspace.tier),
    message: "You've reached your credit limit on {tier_name}. Upgrade to {suggested_tier} to add more."
  });
  return;
}
```

Teaser creation **always allowed** — never blocked by credit gate.

### Upgrade modal

Shown when user tries to create a credit-consuming item at limit:

```
You've reached 25/25 credits on Active

To add this development, upgrade to Studio:
  • 50 credits (double your current limit)
  • Per-page custom domains
  • Priority support

Active: $79/mo  →  Studio: $149/mo
(Prorated for the rest of this month: $X)

[Upgrade now]   [Archive something first]   [Cancel]
```

If on Studio and at 50/50, modal explains: *"You're on our highest tier. Archive an item first, or talk to us about a custom Brokerage plan."*

### Downgrade with overflow

If a Studio user (50 credits, using 45) tries to downgrade to Active (25 credits):

```
You're using 45 credits but Active only includes 25.

Downgrading will require archiving 20 items first — pick which ones to archive, or stay on Studio.

[Pick items to archive]   [Stay on Studio]   [Cancel downgrade]
```

The "Pick items to archive" flow opens a multi-select list with the agent's lowest-engagement items pre-selected. They confirm, those items get archived, then the downgrade goes through.

### Dashboard credit indicator

Top of dashboard, in topbar (per `agent-pages-leads-inbox.html`):

```
[14 / 25 credits used]
```

States:
- **Comfortable** (≤80%): default styling, muted text
- **Approaching** (81-99%): subtle highlight gold background
- **At limit** (100%): emerald background with "Upgrade →" link

### Billing page

Settings → Billing shows:
- Current tier with included credits
- Live usage breakdown: `X listings + Y developments + Z teasers (free) = X+Y credits used of [tier limit]`
- Upgrade/downgrade CTAs
- Stripe-hosted invoice history link

### Pricing page

Public route at `/pricing`. Implement to match `agent-pages-pricing.html` exactly:
- Hero with model explainer (3-card explainer of Listing / Development / Teaser)
- 4 tier cards (Starter / Solo / Active / Studio)
- Teaser policy section (dark gradient)
- 3 worked examples
- FAQ

---

## What to reuse (don't rebuild)

- Agent banner component
- Google Places Autocomplete + location tree (from property wizard)
- Visibility Engine toggles
- Pattern A topbar with breadcrumbs + auto-save
- Step rail from property wizard
- Lead inbox (extend with Type tabs + new stage pills)
- Custom domain — works automatically for both listings and developments
- WhatsApp template firing via respond.io

---

## Acceptance checklist

### Off-plan entity
- [ ] `developments`, `unit_types`, `developers`, `payment_plan_templates`, `thesis_chips`, `development_leads` tables created
- [ ] Seed data: 4 payment plan templates, 14 thesis chips, 6 developers
- [ ] `/agent/developments` list view alongside `/agent/properties`
- [ ] `/agent/developments/new` 5-step wizard works end-to-end
- [ ] Step 2 unit mix has NO "available" column
- [ ] Step 3 payment picker shows 5 cards with mini-bar visualisations
- [ ] Step 3 thesis chip grid limits 3-5 chips with live counter
- [ ] Step 3 AI thesis preview supports 3 tones with regenerate
- [ ] Mode selector in Step 1 (Teaser / Full Info cards)
- [ ] Teaser → Full Info upgrade banner appears on Teaser-mode dev settings
- [ ] Mode upgrade fires WhatsApp batch to priority-list leads

### Live pages
- [ ] Public `/[agent-slug]/[dev-slug]` routes to Teaser OR Full Info based on `mode`
- [ ] Teaser hero has 3-cell attribute strip (Location, Type, Handover only) — NO Frontage
- [ ] Teaser has 4-fact "What we know" with Confirmed/Coming pills
- [ ] Teaser scarcity meter is bars only — NO registered count number
- [ ] Teaser has "How Sarah works" 3-promise block — NO timeline, NO dates
- [ ] No "Last updated" timestamp anywhere
- [ ] Full Info status strip is 2 columns (Handover, From) — NO Completion %
- [ ] Full Info thesis card sits immediately after status strip
- [ ] Full Info developer card pulls from shared `developers` table
- [ ] Visibility Engine toggles write `visibility_config` JSON

### Lead capture
- [ ] Teaser lead form writes `development_leads` with `source_mode='teaser'`, `stage='registered'`
- [ ] Full Info lead form writes `development_leads` with `source_mode='full_info'`, `stage='brochure_requested'`
- [ ] WhatsApp templates fire for: new teaser lead (to agent), new fullinfo lead (to buyer + agent), mode upgrade (to all teaser leads)
- [ ] Lead inbox shows Type tabs (All / Listings / Developments / Live Links) with counts
- [ ] Lead row shows source-mode tag pill (Teaser gold / Full Info emerald)
- [ ] Lead row shows stage pill with correct funnel stage
- [ ] Right detail panel shows captured details, source page card, funnel timeline
- [ ] Funnel timeline stages clickable to mark done

### Pricing
- [ ] `pricing_tiers` table with seed data for 4 tiers
- [ ] Credit count query returns listings + Full Info devs (NOT teasers)
- [ ] Tier gating blocks credit-consuming creation at limit
- [ ] Teaser creation always allowed regardless of credit usage
- [ ] Stripe subscription updates: instant upgrade with proration, scheduled downgrade
- [ ] Downgrade flow shows "archive items first" picker when over-allocated
- [ ] Dashboard credit indicator: comfortable / approaching / at-limit states
- [ ] Billing page shows current tier, usage breakdown, upgrade/downgrade CTAs
- [ ] Pricing page implemented at `/pricing` matching `agent-pages-pricing.html`

---

## Out of scope (v1)

- Child unit-type pages (`/[agent-slug]/[dev-slug]/[unit-type-slug]`) — capture data, leave routes 404 for now
- Custom payment plan builder (Step 3 "Custom" template — placeholder only)
- Developer profile pages (`/[agent-slug]/developer/[developer-slug]`)
- New answer-page templates for off-plan
- Live Link adaptation for developments
- Per-page domain on Studio
- Verified developer flow (manual approval queue)
- Brokerage tier billing automation
- Annual prorations
- Credit gifting / referral credits

---

## Timeline

**4-week build, behind `feature_flags.developments_enabled` per workspace:**

- **Week 1**: Schema + seed data + admin wizard scaffold (Steps 1, 2, 4, 5)
- **Week 2**: Step 3 (payment + thesis with LLM integration) + mode upgrade flow
- **Week 3**: Public page templates (Teaser + Full Info) + leads inbox extensions + WhatsApp templates
- **Week 4**: Pricing tier gating + Stripe subscription updates + billing page + pricing page + acceptance testing

---

## Migration plan

For existing beta workspaces:

```sql
-- Default all to Starter
UPDATE agent_pages.workspaces SET tier = 'starter', tier_credits_included = 1;

-- Comp beta users to Active for 90 days (no charge)
UPDATE agent_pages.workspaces
SET tier = 'active', tier_credits_included = 25, trial_ends_at = now() + interval '90 days'
WHERE id IN (SELECT workspace_id FROM beta_users);
```

90-day grace period before billing kicks in.

---

## Final notes

- Match the HTMLs visually. If something is ambiguous, ask before guessing.
- Inter throughout the admin UI. Fraunces only on hero titles and editorial H2s in published pages.
- Emerald accent system across both modes. No purple, no gold-as-brand colour.
- **Never invent dates, percentages, or numbers the agent didn't enter.**
- Honest scarcity > fake scarcity. Vague meter > fake counter.
- Generated thesis quality is the moat. Spend time getting the LLM prompt right.
- Teasers are the lead-gen magnet — must always be free, always work, always promote conversion to Full Info.
