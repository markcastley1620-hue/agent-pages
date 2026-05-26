-- Off-plan developments schema migration
-- Tables: developers, developments, unit_types, payment_plan_templates, thesis_chips, development_leads

-- 1. Developers (shared across workspaces)
CREATE TABLE IF NOT EXISTS agent_pages.developers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  short_code text,
  logo_url text,
  tagline text,
  bio text,
  founded_year int,
  years_operating int,
  units_delivered_label text,
  on_time_pct int,
  rera_rating text,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 2. Developments
CREATE TABLE IF NOT EXISTS agent_pages.developments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES agent_pages.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  developer_id uuid REFERENCES agent_pages.developers(id),
  slug text NOT NULL,
  community text,
  sub_community text,
  google_place_id text,
  lat decimal(10,8),
  lng decimal(11,8),
  formatted_address text,
  mode text NOT NULL DEFAULT 'teaser',
  mode_changed_at timestamptz,
  handover_quarter text,
  handover_year int,
  property_type_label text NOT NULL,
  hero_pitch text,
  description text,
  thesis_chips text[],
  thesis_tone text DEFAULT 'analytical',
  thesis_manually_edited boolean DEFAULT false,
  payment_plan_template text,
  payment_plan_json jsonb,
  hero_image_url text,
  gallery_image_urls text[],
  brochure_pdf_url text,
  floor_plans_pdf_url text,
  show_prices_publicly boolean DEFAULT true,
  status text DEFAULT 'draft',
  published_at timestamptz,
  visibility_config jsonb DEFAULT '{"google": true, "chatgpt": true, "claude": true, "gemini": true, "perplexity": true, "bing": true, "grok": true}',
  schema_json jsonb,
  visibility_status text DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS developments_workspace_slug ON agent_pages.developments(workspace_id, slug);
CREATE INDEX IF NOT EXISTS developments_workspace_status ON agent_pages.developments(workspace_id, status);
CREATE INDEX IF NOT EXISTS developments_mode ON agent_pages.developments(mode) WHERE status = 'live';

-- 3. Unit types
CREATE TABLE IF NOT EXISTS agent_pages.unit_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  development_id uuid NOT NULL REFERENCES agent_pages.developments(id) ON DELETE CASCADE,
  label text NOT NULL,
  category text NOT NULL,
  beds int,
  baths int,
  beds_label text,
  sqft_from int,
  sqft_to int,
  price_from numeric(14,2),
  price_to numeric(14,2),
  price_currency text DEFAULT 'AED',
  display_order int NOT NULL DEFAULT 0,
  floor_plan_image_url text,
  child_page_slug text,
  aux_text text,
  beds_aux_text text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS unit_types_dev_order ON agent_pages.unit_types(development_id, display_order);

-- 4. Payment plan templates
CREATE TABLE IF NOT EXISTS agent_pages.payment_plan_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key text NOT NULL UNIQUE,
  name text NOT NULL,
  tag text NOT NULL,
  description text,
  milestones jsonb NOT NULL,
  display_order int NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 5. Thesis chips
CREATE TABLE IF NOT EXISTS agent_pages.thesis_chips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chip_key text NOT NULL UNIQUE,
  label text NOT NULL,
  category text,
  display_order int NOT NULL DEFAULT 0,
  active boolean DEFAULT true
);

-- 6. Development leads
CREATE TABLE IF NOT EXISTS agent_pages.development_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  development_id uuid NOT NULL REFERENCES agent_pages.developments(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES agent_pages.profiles(id),
  name text NOT NULL,
  email text,
  whatsapp text,
  source_mode text NOT NULL,
  budget_range text,
  purpose text,
  interested_unit_type text,
  stage text DEFAULT 'registered',
  whatsapp_msg_sent boolean DEFAULT false,
  whatsapp_msg_sent_at timestamptz,
  notified_of_full_info boolean DEFAULT false,
  notified_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS dev_leads_workspace ON agent_pages.development_leads(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS dev_leads_dev ON agent_pages.development_leads(development_id, created_at DESC);

-- RLS policies
ALTER TABLE agent_pages.developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_pages.developments ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_pages.unit_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_pages.payment_plan_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_pages.thesis_chips ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_pages.development_leads ENABLE ROW LEVEL SECURITY;

-- Developers: read all, insert auth
CREATE POLICY developers_read ON agent_pages.developers FOR SELECT USING (true);
CREATE POLICY developers_insert ON agent_pages.developers FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Developments: owner CRUD
CREATE POLICY developments_select ON agent_pages.developments FOR SELECT USING (
  workspace_id = auth.uid() OR status = 'live'
);
CREATE POLICY developments_insert ON agent_pages.developments FOR INSERT WITH CHECK (workspace_id = auth.uid());
CREATE POLICY developments_update ON agent_pages.developments FOR UPDATE USING (workspace_id = auth.uid());
CREATE POLICY developments_delete ON agent_pages.developments FOR DELETE USING (workspace_id = auth.uid());

-- Unit types: via development ownership
CREATE POLICY unit_types_select ON agent_pages.unit_types FOR SELECT USING (
  EXISTS (SELECT 1 FROM agent_pages.developments d WHERE d.id = development_id AND (d.workspace_id = auth.uid() OR d.status = 'live'))
);
CREATE POLICY unit_types_insert ON agent_pages.unit_types FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM agent_pages.developments d WHERE d.id = development_id AND d.workspace_id = auth.uid())
);
CREATE POLICY unit_types_update ON agent_pages.unit_types FOR UPDATE USING (
  EXISTS (SELECT 1 FROM agent_pages.developments d WHERE d.id = development_id AND d.workspace_id = auth.uid())
);
CREATE POLICY unit_types_delete ON agent_pages.unit_types FOR DELETE USING (
  EXISTS (SELECT 1 FROM agent_pages.developments d WHERE d.id = development_id AND d.workspace_id = auth.uid())
);

-- Templates + chips: read all
CREATE POLICY templates_read ON agent_pages.payment_plan_templates FOR SELECT USING (true);
CREATE POLICY chips_read ON agent_pages.thesis_chips FOR SELECT USING (true);

-- Development leads: owner read, public insert
CREATE POLICY dev_leads_select ON agent_pages.development_leads FOR SELECT USING (workspace_id = auth.uid());
CREATE POLICY dev_leads_insert ON agent_pages.development_leads FOR INSERT WITH CHECK (true);
CREATE POLICY dev_leads_update ON agent_pages.development_leads FOR UPDATE USING (workspace_id = auth.uid());
