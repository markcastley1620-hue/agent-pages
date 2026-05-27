
CREATE TABLE IF NOT EXISTS public.developers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  short_code text, logo_url text, tagline text, bio text,
  founded_year int, years_operating int, units_delivered_label text,
  on_time_pct int, rera_rating text, verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.developments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  name text NOT NULL,
  developer_id uuid REFERENCES public.developers(id),
  slug text NOT NULL,
  community text, sub_community text, google_place_id text,
  lat decimal(10,8), lng decimal(11,8), formatted_address text,
  mode text NOT NULL DEFAULT 'teaser',
  handover_quarter text, handover_year int,
  property_type_label text NOT NULL,
  hero_pitch text, description text,
  thesis_chips text[], thesis_tone text DEFAULT 'analytical',
  payment_plan_template text, payment_plan_json jsonb,
  hero_image_url text, gallery_image_urls text[],
  brochure_pdf_url text, floor_plans_pdf_url text,
  show_prices_publicly boolean DEFAULT true,
  status text DEFAULT 'draft', published_at timestamptz,
  visibility_config jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.unit_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  development_id uuid NOT NULL REFERENCES public.developments(id) ON DELETE CASCADE,
  label text NOT NULL, category text NOT NULL,
  beds int, baths int, beds_label text,
  sqft_from int, sqft_to int,
  price_from numeric(14,2), price_to numeric(14,2),
  price_currency text DEFAULT 'AED',
  display_order int NOT NULL DEFAULT 0,
  floor_plan_image_url text, child_page_slug text,
  aux_text text, beds_aux_text text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payment_plan_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key text NOT NULL UNIQUE,
  name text NOT NULL, tag text NOT NULL, description text,
  milestones jsonb NOT NULL, display_order int NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.thesis_chips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chip_key text NOT NULL UNIQUE,
  label text NOT NULL, category text,
  display_order int NOT NULL DEFAULT 0,
  active boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.development_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  development_id uuid NOT NULL REFERENCES public.developments(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL,
  name text NOT NULL, email text, whatsapp text,
  source_mode text NOT NULL,
  budget_range text, purpose text, interested_unit_type text,
  stage text DEFAULT 'registered',
  whatsapp_msg_sent boolean DEFAULT false,
  whatsapp_msg_sent_at timestamptz,
  notified_of_full_info boolean DEFAULT false,
  notified_at timestamptz,
  created_at timestamptz DEFAULT now()
);

INSERT INTO public.payment_plan_templates (template_key, name, tag, description, milestones, display_order) VALUES
('20_60_20', '20/60/20', 'Standard', 'Standard plan', '[{"phase":"booking","pct":20},{"phase":"construction","pct":60},{"phase":"handover","pct":20}]', 1),
('40_60', '40/60', 'Build/Handover', 'Lighter booking', '[{"phase":"construction","pct":40},{"phase":"handover","pct":60}]', 2),
('50_50_phpp', '50/50 PHPP', 'Post-handover', 'Buyer-friendly', '[{"phase":"booking","pct":25},{"phase":"construction","pct":25},{"phase":"post","pct":50}]', 3),
('10_90_phpp', '10/90 PHPP', 'Aggressive', 'Low entry', '[{"phase":"booking","pct":10},{"phase":"post","pct":90}]', 4)
ON CONFLICT (template_key) DO NOTHING;

INSERT INTO public.thesis_chips (chip_key, label, category, display_order) VALUES
('strong_yields','Strong rental yields','financial',1),
('established_community','Established community','community',2),
('below_resale_comps','Below resale comparables','financial',3),
('top_tier_developer','Top-tier developer','developer',4),
('limited_inventory','Limited inventory','financial',5),
('beachfront','Beachfront/waterfront','lifestyle',6),
('best_in_community','Best in community','community',7),
('high_capital_appreciation','High capital appreciation','financial',8),
('str_friendly','Short-term rental friendly','financial',9),
('family_oriented','Family-oriented','lifestyle',10),
('below_market_entry','Below market entry','financial',11),
('schools_nearby','Strong schools nearby','community',12),
('metro_hub','Metro/transit hub','community',13),
('investor_only_access','Investor-only access','financial',14)
ON CONFLICT (chip_key) DO NOTHING;

INSERT INTO public.developers (name, slug, short_code, tagline, founded_year, years_operating, units_delivered_label, on_time_pct, rera_rating) VALUES
('Emaar Properties','emaar','EM','Founded 1997',1997,28,'85k+',96,'A+'),
('DAMAC Properties','damac','DM','Founded 2002',2002,23,'43k+',88,'A'),
('Sobha Realty','sobha','SB','Founded 2003',2003,22,'25k+',94,'A+'),
('Nakheel','nakheel','NK','Govt-backed',2000,25,'80k+',90,'A'),
('Meraas','meraas','MR','Lifestyle-first',2007,18,'15k+',92,'A'),
('Aldar Properties','aldar','AL','Abu Dhabi',2005,20,'35k+',93,'A+')
ON CONFLICT (name) DO NOTHING;
