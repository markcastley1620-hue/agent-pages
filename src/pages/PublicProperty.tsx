import { useEffect, useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface Property {
  id: string; title: string; slug: string; asking_price_aed: number | null
  price_psqft_aed: number | null; show_price: boolean; community: string | null
  sub_community: string | null; tower: string | null; address_line: string | null
  bedrooms: number | null; bathrooms: number | null; built_up_sqft: number | null
  floor: number | null; view_desc: string | null; furnishing: string | null
  parking_spaces: number | null; service_charge_psqft: number | null
  completion_status: string | null; property_type: string | null
  description_full: string | null; feature_highlights: {title:string;sub:string}[] | null
  amenities: string[] | null; hero_photo_url: string | null; gallery_urls: string[] | null
  dld_permit_number: string | null; rera_disclosure: boolean
  lat: number | null; lng: number | null; location_display: string | null; location_exact: boolean | null
}
interface Profile {
  id: string; display_name: string; slug: string; headline: string | null
  phone: string | null; whatsapp: string | null; email: string | null
  photo_url: string | null; years_experience: number | null; deals_closed: number | null
  rera_number: string | null; specialisms: string[] | null
}

function fmtPrice(n: number | null) {
  if (!n) return null
  if (n >= 1_000_000) return `AED ${(n / 1_000_000).toFixed(2)}M`
  return `AED ${n.toLocaleString()}`
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase()
}

export default function PublicProperty() {
  const { agentSlug, propertySlug } = useParams()
  const [property, setProperty] = useState<Property | null>(null)
  const [agent, setAgent] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ full_name:'', phone:'', email:'', buyer_type:'cash', preferred_time:'this_week' })
  const [status, setStatus] = useState<'idle'|'sending'|'sent'|'error'>('idle')
  const [allPhotos, setAllPhotos] = useState<string[]>([])

  useEffect(() => {
    if (!agentSlug || !propertySlug) return
    ;(async () => {
      const { data: ag } = await supabase.schema('agent_pages').from('profiles').select('*').eq('slug', agentSlug).single()
      if (!ag) { setLoading(false); return }
      setAgent(ag)
      const { data: prop } = await supabase.schema('agent_pages').from('properties').select('*').eq('agent_id', ag.id).eq('slug', propertySlug).eq('status', 'live').single()
      if (prop) {
        setProperty(prop)
        const photos = [prop.hero_photo_url, ...(prop.gallery_urls || [])].filter(Boolean) as string[]
        setAllPhotos(photos)
        // fire-and-forget view track
        supabase.schema('agent_pages').from('page_views').insert({ agent_id: ag.id, property_id: prop.id, page_type: 'property', referrer: document.referrer || null, device: window.innerWidth < 768 ? 'mobile' : 'desktop' }).then(() => {})
      }
      setLoading(false)
    })()
  }, [agentSlug, propertySlug])

  async function handleLead(e: FormEvent) {
    e.preventDefault()
    if (!agent || !property) return
    setStatus('sending')
    const { error } = await supabase.schema('agent_pages').from('leads').insert({ agent_id: agent.id, property_id: property.id, source: 'property_page', ...form, page_url: window.location.href, referrer: document.referrer || null, device: window.innerWidth < 768 ? 'mobile' : 'desktop' })
    setStatus(error ? 'error' : 'sent')
  }

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontFamily:'Inter,sans-serif',color:'#999',fontSize:'14px'}}>Loading…</div>
  if (!property || !agent) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontFamily:'Inter,sans-serif',color:'#999',fontSize:'14px'}}>Property not found.</div>

  const price = fmtPrice(property.asking_price_aed)
  const psqft = property.price_psqft_aed ? `AED ${property.price_psqft_aed.toLocaleString()} per sqft` : null
  const location = [property.tower || property.sub_community, property.community].filter(Boolean).join(', ')

  return (
    <>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body{font-family:'Inter',sans-serif;background:#fff;color:#1a1a1a;-webkit-font-smoothing:antialiased;letter-spacing:-0.01em;line-height:1.5}
        .nav{height:72px;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;justify-content:space-between;padding:0 56px;background:#fff;position:sticky;top:0;z-index:10}
        .nav-brand{display:flex;align-items:center;gap:10px}
        .nav-avatar{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#c9a84c,#b08f3a);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#1a1a1a;overflow:hidden;flex-shrink:0}
        .nav-avatar img{width:100%;height:100%;object-fit:cover}
        .nav-name{font-size:15px;font-weight:600;color:#1a1a1a;letter-spacing:-0.02em}
        .nav-meta{font-size:12px;color:#999}
        .nav-right{display:flex;align-items:center;gap:8px}
        .nav-btn{padding:9px 14px;border-radius:100px;font-size:13px;font-weight:500;background:transparent;border:none;color:#4a4a4a;cursor:pointer;font-family:inherit;transition:background .12s}
        .nav-btn:hover{background:#f7f7f5}
        .nav-btn.primary{background:#1a1a1a;color:#fff;padding:9px 18px}
        .nav-btn.primary:hover{background:#000}
        .container{max-width:1240px;margin:0 auto;padding:32px 56px 80px}
        .hero-title{font-size:28px;font-weight:600;color:#1a1a1a;letter-spacing:-0.025em;line-height:1.2;margin-bottom:6px}
        .hero-meta{font-size:14px;color:#6e6e6e;display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:16px}
        .meta-dot{width:3px;height:3px;border-radius:50%;background:#c0c0c0}
        .gallery{display:grid;grid-template-columns:1.5fr 1fr 1fr;grid-template-rows:220px 220px;gap:8px;border-radius:16px;overflow:hidden;position:relative;margin-bottom:48px}
        .gal-main{grid-row:1/3;background:linear-gradient(135deg,#2a2a2a,#1a1a1a);display:flex;align-items:center;justify-content:center;cursor:pointer;overflow:hidden}
        .gal-main img{width:100%;height:100%;object-fit:cover}
        .gal-cell{background:#f4f3ef;display:flex;align-items:center;justify-content:center;cursor:pointer;overflow:hidden}
        .gal-cell img{width:100%;height:100%;object-fit:cover}
        .gal-empty-icon{opacity:0.3}
        .gal-show-all{position:absolute;bottom:16px;right:16px;background:#fff;border:1px solid #1a1a1a;border-radius:8px;padding:8px 14px;font-size:13px;font-weight:500;color:#1a1a1a;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:6px}
        .main-grid{display:grid;grid-template-columns:1fr 380px;gap:80px}
        .section{padding-bottom:32px;border-bottom:1px solid #ececec;margin-bottom:32px}
        .section-title{font-size:20px;font-weight:600;color:#1a1a1a;letter-spacing:-0.015em;margin-bottom:18px}
        .summary-title{font-size:22px;font-weight:600;color:#1a1a1a;letter-spacing:-0.015em;margin-bottom:4px}
        .summary-sub{font-size:14px;color:#6e6e6e}
        .feature{display:flex;gap:16px;align-items:flex-start;margin-bottom:18px}
        .feature:last-child{margin-bottom:0}
        .feature-icon{width:28px;height:28px;flex-shrink:0;display:flex;align-items:center;justify-content:center}
        .feature-title{font-size:14.5px;font-weight:600;color:#1a1a1a;margin-bottom:2px}
        .feature-sub{font-size:13.5px;color:#6e6e6e;line-height:1.5}
        .about-body{font-size:15px;line-height:1.7;color:#1a1a1a}
        .about-body p{margin-bottom:14px}
        .about-body p:last-child{margin-bottom:0}
        .included-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px 32px}
        .inc-item{display:flex;align-items:center;gap:12px;font-size:14.5px;color:#1a1a1a}
        .specs-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px 24px}
        .spec-label{font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#999;font-weight:500;margin-bottom:4px}
        .spec-value{font-size:15px;font-weight:500;color:#1a1a1a}
        .map-placeholder{height:280px;border-radius:12px;background:linear-gradient(135deg,#fafaf8,#f0efea);position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;margin-bottom:16px}
        .map-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(0,0,0,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,0.04) 1px,transparent 1px);background-size:40px 40px}
        .map-pin{width:36px;height:36px;border-radius:50%;background:#1a1a1a;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(0,0,0,0.2)}
        .agent-row{display:flex;align-items:center;gap:16px;padding:18px;background:#fafaf8;border-radius:12px}
        .agent-avatar{width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#c9a84c,#b08f3a);display:flex;align-items:center;justify-content:center;color:#fff;font-size:18px;font-weight:600;flex-shrink:0;overflow:hidden}
        .agent-avatar img{width:100%;height:100%;object-fit:cover}
        .agent-name{font-size:15px;font-weight:600;color:#1a1a1a;margin-bottom:2px}
        .agent-meta{font-size:13px;color:#6e6e6e}
        .agent-btn{padding:9px 16px;background:#fff;border:1px solid #1a1a1a;border-radius:8px;font-size:13px;font-weight:500;color:#1a1a1a;cursor:pointer;font-family:inherit;transition:all .12s;text-decoration:none;display:inline-block}
        .agent-btn:hover{background:#1a1a1a;color:#fff}
        .lead-card{position:sticky;top:96px;background:#fff;border:1px solid #e8e8e8;border-radius:16px;box-shadow:0 6px 24px rgba(0,0,0,0.05),0 2px 6px rgba(0,0,0,0.04);padding:24px}
        .lead-price{font-size:26px;font-weight:600;color:#1a1a1a;letter-spacing:-0.025em}
        .lead-psqft{font-size:13px;color:#6e6e6e;margin-bottom:16px;margin-top:4px}
        .lead-divider{height:1px;background:#f0f0f0;margin:0 -24px 18px}
        .lead-form-title{font-size:14.5px;font-weight:600;color:#1a1a1a;margin-bottom:4px}
        .lead-form-sub{font-size:13px;color:#6e6e6e;margin-bottom:18px;line-height:1.5}
        .lead-field{display:flex;flex-direction:column;gap:4px;margin-bottom:10px}
        .lead-field input,.lead-field select{width:100%;padding:11px 14px;border:1px solid #d8d8d8;border-radius:10px;font-size:14px;font-family:inherit;color:#1a1a1a;background:#fff;transition:border-color .12s}
        .lead-field input:focus,.lead-field select:focus{outline:none;border-color:#1a1a1a}
        .lead-row{display:grid;grid-template-columns:1fr 1fr;gap:8px}
        .lead-cta{width:100%;padding:14px;background:linear-gradient(135deg,#c9a84c,#b08f3a);color:#1a1a1a;border:none;border-radius:10px;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit;transition:transform .1s,box-shadow .12s;letter-spacing:-0.01em}
        .lead-cta:hover{box-shadow:0 4px 16px rgba(201,168,76,0.35)}
        .lead-disclaimer{font-size:11.5px;color:#999;margin-top:12px;text-align:center;line-height:1.5}
        .lead-or{display:flex;align-items:center;gap:10px;margin:14px 0}
        .lead-or::before,.lead-or::after{content:'';flex:1;height:1px;background:#ececec}
        .lead-or span{font-size:11px;color:#b0b0b0;letter-spacing:0.06em;text-transform:uppercase;font-weight:500}
        .lead-secondary{display:grid;grid-template-columns:1fr 1fr;gap:8px}
        .lead-sec-btn{padding:11px;border:1px solid #d8d8d8;border-radius:10px;background:#fff;font-size:13px;font-weight:500;color:#1a1a1a;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;justify-content:center;gap:6px;transition:all .12s;text-decoration:none}
        .lead-sec-btn:hover{border-color:#1a1a1a}
        .lead-trust{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:18px;padding-top:16px;border-top:1px solid #f0f0f0;font-size:12px;color:#6e6e6e}
        .trust-item{display:inline-flex;align-items:center;gap:5px}
        .footer{background:#fafaf8;border-top:1px solid #ececec;padding:40px 56px;margin-top:0}
        .footer-inner{max-width:1240px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px}
        .footer-links{display:flex;gap:24px;font-size:13px}
        .footer-links a{color:#6e6e6e;text-decoration:none}
        .footer-links a:hover{color:#1a1a1a}
        .success-box{background:#e8f8f3;border:1px solid #b6e8d5;border-radius:10px;padding:16px;text-align:center;color:#1a7a64;font-size:14px;font-weight:500}
        @media(max-width:980px){
          .nav{padding:0 24px}
          .container{padding:24px 24px 64px}
          .gallery{grid-template-columns:1fr;grid-template-rows:280px}
          .gallery .gal-cell{display:none}
          .main-grid{grid-template-columns:1fr;gap:40px}
          .lead-card{position:static}
          .specs-grid,.included-grid{grid-template-columns:1fr 1fr}
        }
        @media(max-width:480px){
          .nav{height:60px;padding:0 16px}
          .nav-name{font-size:13px}
          .container{padding:16px 16px 64px}
          .hero-title{font-size:20px}
          .hero-meta{font-size:12px;gap:6px}
          .gallery{grid-template-rows:220px}
          .specs-grid{grid-template-columns:1fr 1fr}
          .included-grid{grid-template-columns:1fr}
          .lead-price{font-size:22px}
          .lead-row{grid-template-columns:1fr}
          .lead-secondary{grid-template-columns:1fr}
          .summary-title{font-size:18px}
          .section-title{font-size:17px}
          .agent-row{flex-wrap:wrap;gap:12px}
          .footer{padding:24px 16px}
        }
      `}</style>

      {/* NAV — agent branding only, no AOS */}
      <nav className="nav">
        <div className="nav-brand">
          <div className="nav-avatar">
            {agent.photo_url ? <img src={agent.photo_url} alt={agent.display_name} /> : initials(agent.display_name)}
          </div>
          <div>
            <div className="nav-name">{agent.display_name}</div>
            {agent.headline && <div className="nav-meta">{agent.headline}</div>}
          </div>
        </div>
        <div className="nav-right">
          {agent.phone && <a href={`tel:${agent.phone}`} className="nav-btn">Call</a>}
          {agent.whatsapp && <a href={`https://wa.me/${agent.whatsapp.replace(/\D/g,'')}`} className="nav-btn primary">WhatsApp</a>}
        </div>
      </nav>

      <div className="container">
        {/* Title */}
        <div>
          <h1 className="hero-title">{property.title}</h1>
          <div className="hero-meta">
            {location && <span>{location}</span>}
            {location && property.community && <span className="meta-dot" />}
            {property.bedrooms != null && <span>{property.bedrooms === 0 ? 'Studio' : `${property.bedrooms} bed`}</span>}
            {property.bathrooms != null && <><span className="meta-dot" /><span>{property.bathrooms} bath</span></>}
            {property.built_up_sqft && <><span className="meta-dot" /><span>{property.built_up_sqft.toLocaleString()} sqft</span></>}
          </div>
        </div>

        {/* Gallery */}
        <div className="gallery">
          <div className="gal-main">
            {allPhotos[0] ? <img src={allPhotos[0]} alt="hero" /> : (
              <div style={{textAlign:'center',color:'rgba(255,255,255,0.5)',padding:'24px'}}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.5" style={{marginBottom:'12px'}}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/></svg>
                <div style={{fontSize:'14px',fontWeight:500,color:'#fff',marginBottom:'4px'}}>{property.tower || property.sub_community || property.community}</div>
                <div style={{fontSize:'12px'}}>No photos yet</div>
              </div>
            )}
          </div>
          {[1,2,3,4].map(i => (
            <div key={i} className="gal-cell">
              {allPhotos[i] ? <img src={allPhotos[i]} alt={`photo ${i+1}`} /> : (
                <svg className="gal-empty-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/></svg>
              )}
            </div>
          ))}
          {allPhotos.length > 1 && (
            <button className="gal-show-all">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
              Show all photos
            </button>
          )}
        </div>

        <div className="main-grid">
          <div>
            {/* Summary */}
            <div className="section" style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'24px'}}>
              <div>
                <div className="summary-title">{property.bedrooms === 0 ? 'Studio' : property.bedrooms ? `${property.bedrooms}-bed` : ''}{property.property_type ? ` ${property.property_type.toLowerCase()}` : ''}{property.tower ? ` in ${property.tower}` : ''}</div>
                <div className="summary-sub">
                  {[property.bedrooms != null && (property.bedrooms === 0 ? 'Studio' : `${property.bedrooms} beds`), property.bathrooms && `${property.bathrooms} baths`, property.built_up_sqft && `${property.built_up_sqft.toLocaleString()} sqft`, property.floor && `Floor ${property.floor}`, property.completion_status].filter(Boolean).join(' · ')}
                </div>
              </div>
              <div className="agent-avatar" style={{width:'52px',height:'52px',flexShrink:0}}>
                {agent.photo_url ? <img src={agent.photo_url} alt={agent.display_name} /> : initials(agent.display_name)}
              </div>
            </div>

            {/* Feature highlights */}
            {property.feature_highlights && property.feature_highlights.length > 0 && (
              <div className="section">
                {property.feature_highlights.map((f, i) => (
                  <div key={i} className="feature">
                    <div className="feature-icon">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="1.6"><path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6"/></svg>
                    </div>
                    <div>
                      <div className="feature-title">{f.title}</div>
                      <div className="feature-sub">{f.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Description */}
            {property.description_full && (
              <div className="section">
                <h2 className="section-title">About this property</h2>
                <div className="about-body" dangerouslySetInnerHTML={{__html: property.description_full.replace(/\n/g,'<br/>')}} />
              </div>
            )}

            {/* Amenities */}
            {property.amenities && property.amenities.length > 0 && (
              <div className="section">
                <h2 className="section-title">What's in the building</h2>
                <div className="included-grid">
                  {property.amenities.map((a, i) => (
                    <div key={i} className="inc-item">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="1.6"><path d="M20 6L9 17l-5-5"/></svg>
                      {a}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Specs */}
            <div className="section">
              <h2 className="section-title">The details</h2>
              <div className="specs-grid">
                {[
                  ['Type', property.property_type],
                  ['Bedrooms', property.bedrooms === 0 ? 'Studio' : property.bedrooms],
                  ['Bathrooms', property.bathrooms],
                  ['Built-up area', property.built_up_sqft && `${property.built_up_sqft.toLocaleString()} sqft`],
                  ['Floor', property.floor],
                  ['View', property.view_desc],
                  ['Furnishing', property.furnishing],
                  ['Parking', property.parking_spaces && `${property.parking_spaces} space${property.parking_spaces > 1 ? 's' : ''}`],
                  ['Service charge', property.service_charge_psqft && `AED ${property.service_charge_psqft}/sqft`],
                  ['Completion', property.completion_status],
                  ['Listed by', agent.display_name],
                  ['DLD permit', property.dld_permit_number],
                ].filter(([,v]) => v != null && v !== '').map(([label, val], i) => (
                  <div key={i}>
                    <div className="spec-label">{label}</div>
                    <div className="spec-value">{String(val)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Location */}
            {property.lat && property.lng ? (
              <div className="section">
                <div style={{fontSize:'11px',letterSpacing:'0.1em',textTransform:'uppercase',color:'#999',fontWeight:600,marginBottom:'12px'}}>LOCATION</div>
                <div style={{position:'relative',height:'300px',borderRadius:'12px',overflow:'hidden',marginBottom:'12px'}}>
                  <img
                    src={`https://maps.googleapis.com/maps/api/staticmap?center=${property.lat},${property.lng}&zoom=15&size=800x300&scale=2&key=AIzaSyBdZrnGpA6uof-um3fxLH1gu2Y6uoqCwqw&style=feature:all|saturation:-80${property.location_exact ? `&markers=color:0x2d5a4f%7C${property.lat},${property.lng}` : ''}`}
                    alt="Property location map"
                    style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}
                  />
                  {!property.location_exact && (
                    <div style={{
                      position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',
                      width:'120px',height:'120px',borderRadius:'50%',
                      background:'rgba(45,90,79,0.15)',
                      border:'2px solid rgba(45,90,79,0.4)',
                      pointerEvents:'none',
                    }} />
                  )}
                </div>
                {property.location_display && (
                  <div style={{fontSize:'13px',color:'#6e6e6e'}}>{property.location_display}</div>
                )}
              </div>
            ) : (property.address_line || property.community) ? (
              <div className="section">
                <div style={{fontSize:'11px',letterSpacing:'0.1em',textTransform:'uppercase',color:'#999',fontWeight:600,marginBottom:'12px'}}>LOCATION</div>
                <div className="map-placeholder">
                  <div className="map-grid" />
                  <div className="map-pin">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2"><path d="M3 9.5L12 3l9 6.5V21H3V9.5z"/></svg>
                  </div>
                </div>
                <div style={{fontSize:'14px',color:'#1a1a1a',fontWeight:500}}>{property.address_line || [property.tower, property.community].filter(Boolean).join(', ')}</div>
              </div>
            ) : null}

            {/* Agent */}
            <div>
              <h2 className="section-title">Your agent</h2>
              <div className="agent-row">
                <div className="agent-avatar">
                  {agent.photo_url ? <img src={agent.photo_url} alt={agent.display_name} /> : initials(agent.display_name)}
                </div>
                <div style={{flex:1}}>
                  <div className="agent-name">{agent.display_name}</div>
                  <div className="agent-meta">{[agent.headline, agent.specialisms?.slice(0,2).join(' · ')].filter(Boolean).join(' · ')}</div>
                  {agent.deals_closed && <div className="agent-meta" style={{marginTop:'4px'}}>★ {agent.deals_closed} closed deals</div>}
                </div>
                {agent.whatsapp && <a href={`https://wa.me/${agent.whatsapp.replace(/\D/g,'')}`} className="agent-btn">Message</a>}
              </div>
            </div>
          </div>

          {/* Lead capture */}
          <aside>
            <div className="lead-card">
              {property.show_price && price ? (
                <>
                  <div className="lead-price">{price}</div>
                  {psqft && <div className="lead-psqft">{psqft}</div>}
                </>
              ) : (
                <div className="lead-price" style={{fontSize:'18px'}}>Price on request</div>
              )}
              <div className="lead-divider" />
              {status === 'sent' ? (
                <div className="success-box">✓ Request sent — we'll confirm within 30 minutes.</div>
              ) : (
                <form onSubmit={handleLead}>
                  <div className="lead-form-title">Book a viewing</div>
                  <div className="lead-form-sub">Tell us when works and we'll confirm within 30 minutes.</div>
                  <div className="lead-field"><input required placeholder="Full name" value={form.full_name} onChange={e => setForm(f => ({...f, full_name: e.target.value}))} /></div>
                  <div className="lead-row">
                    <div className="lead-field"><input type="tel" required placeholder="Phone" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} /></div>
                    <div className="lead-field"><input type="email" placeholder="Email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} /></div>
                  </div>
                  <div className="lead-field">
                    <select value={form.buyer_type} onChange={e => setForm(f => ({...f, buyer_type: e.target.value}))}>
                      <option value="cash">I'm a — cash buyer</option>
                      <option value="mortgage">I'm a — mortgage buyer</option>
                      <option value="investor">I'm a — investor</option>
                      <option value="browsing">I'm a — just browsing</option>
                    </select>
                  </div>
                  <div className="lead-field">
                    <select value={form.preferred_time} onChange={e => setForm(f => ({...f, preferred_time: e.target.value}))}>
                      <option value="this_week">Preferred time — this week</option>
                      <option value="this_weekend">Preferred time — this weekend</option>
                      <option value="next_week">Preferred time — next week</option>
                      <option value="flexible">Preferred time — flexible</option>
                    </select>
                  </div>
                  <button className="lead-cta" type="submit" disabled={status === 'sending'}>{status === 'sending' ? 'Sending…' : 'Request viewing'}</button>
                  {status === 'error' && <div style={{fontSize:'12px',color:'#a14b2c',marginTop:'8px',textAlign:'center'}}>Something went wrong. Please try again.</div>}
                  <div className="lead-disclaimer">Free, no obligation. We respond within 30 minutes during business hours.</div>
                </form>
              )}
              <div className="lead-or"><span>or</span></div>
              <div className="lead-secondary">
                {agent.whatsapp && <a href={`https://wa.me/${agent.whatsapp.replace(/\D/g,'')}`} className="lead-sec-btn">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.5 8.5 0 11-3-6.5L21 8M21 3v5h-5"/></svg>
                  WhatsApp
                </a>}
                {agent.phone && <a href={`tel:${agent.phone}`} className="lead-sec-btn">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.37 1.9.72 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0122 16.92z"/></svg>
                  Call now
                </a>}
              </div>
              <div className="lead-trust">
                {property.rera_disclosure && <div className="trust-item"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2ab695" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>RERA-certified</div>}
                <div className="trust-item"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2ab695" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>Verified listing</div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <footer className="footer">
        <div className="footer-inner">
          <div style={{fontSize:'13px',color:'#6e6e6e'}}>{agent.display_name}{agent.rera_number && ` · RERA ${agent.rera_number}`}</div>
          <div className="footer-links">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            {property.rera_disclosure && <a href="#">RERA disclosure</a>}
          </div>
        </div>
      </footer>
    </>
  )
}
