-- Seed: Payment plan templates
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
  {"phase":"post","pct":90,"when":"5 years post-handover","desc":"Long tail across 60 months."}]', 4)
ON CONFLICT (template_key) DO NOTHING;

-- Seed: Thesis chips
INSERT INTO agent_pages.thesis_chips (chip_key, label, category, display_order) VALUES
('strong_yields', 'Strong rental yields', 'financial', 1),
('established_community', 'Established community', 'community', 2),
('below_resale_comps', 'Below resale comparables', 'financial', 3),
('top_tier_developer', 'Top-tier developer', 'developer', 4),
('limited_inventory', 'Limited inventory', 'financial', 5),
('beachfront', 'Beachfront / waterfront', 'lifestyle', 6),
('best_in_community', 'Best in community', 'community', 7),
('high_capital_appreciation', 'High capital appreciation', 'financial', 8),
('str_friendly', 'Short-term rental friendly', 'financial', 9),
('family_oriented', 'Family-oriented', 'lifestyle', 10),
('below_market_entry', 'Below market entry', 'financial', 11),
('schools_nearby', 'Strong schools nearby', 'community', 12),
('metro_hub', 'Metro / transit hub', 'community', 13),
('investor_only_access', 'Investor-only access', 'financial', 14)
ON CONFLICT (chip_key) DO NOTHING;

-- Seed: Developers
INSERT INTO agent_pages.developers (name, slug, short_code, tagline, bio, founded_year, years_operating, units_delivered_label, on_time_pct, rera_rating) VALUES
('Emaar Properties', 'emaar', 'EM', 'Founded 1997 · Listed DFM · Dubai-headquartered',
 'Emaar built Downtown Dubai, the Marina, the Hills community, and Dubai Creek Harbour — the master communities most other developers benchmark against. Their off-plan inventory is among the most liquid on resale: Emaar units typically trade at par or above purchase price in secondary, with rental yields holding above community averages.',
 1997, 28, '85k+', 96, 'A+'),
('DAMAC Properties', 'damac', 'DM', 'Founded 2002 · Listed DFM · Luxury focus',
 'DAMAC has delivered over 43,000 units across the UAE, with a luxury-forward positioning that includes branded residences with Cavalli, Versace, and Trump. Known for aggressive payment plans and high-yield investor products.',
 2002, 23, '43k+', 88, 'A'),
('Sobha Realty', 'sobha', 'SB', 'Founded 2003 · Indian-origin · Vertically integrated',
 'Sobha is one of the few vertically integrated developers in Dubai — they own the entire build chain from design to finishing. Known for premium build quality, their flagship Sobha Hartland development in MBR City has become a benchmark for quality.',
 2003, 22, '25k+', 94, 'A+'),
('Nakheel', 'nakheel', 'NK', 'Government-backed · Master developer',
 'Nakheel created Palm Jumeirah, The World Islands, and some of Dubai''s most iconic waterfront communities. Now part of Dubai Holding, they focus on master-planned communities with strong infrastructure.',
 2000, 25, '80k+', 90, 'A'),
('Meraas', 'meraas', 'MR', 'Lifestyle-first · Dubai Holding subsidiary',
 'Meraas focuses on lifestyle destinations and boutique residential — City Walk, Bluewaters, La Mer. Their projects tend to command premium PSF driven by design quality and location.',
 2007, 18, '15k+', 92, 'A'),
('Aldar Properties', 'aldar', 'AL', 'Abu Dhabi-headquartered · Listed ADX',
 'Aldar is Abu Dhabi''s largest developer, now expanding into Dubai. Known for Yas Island, Saadiyat, and Al Raha developments. Strong government backing and increasingly active in Dubai''s off-plan market.',
 2005, 20, '35k+', 93, 'A+')
ON CONFLICT (name) DO NOTHING;
