import { useEffect, useState, type FormEvent } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Phone, Mail, MapPin, Bed, Bath, Maximize2, ChevronLeft, ChevronRight, Check, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface Property {
  id: string
  title: string
  slug: string
  price: number | null
  location: string | null
  community: string | null
  bedrooms: number | null
  bathrooms: number | null
  area_sqft: number | null
  floor: string | null
  parking: string | null
  furnished: string | null
  view: string | null
  property_type: string | null
  description: string | null
  photos: string[]
  show_price: boolean
  rera_number: string | null
  permit_number: string | null
  agent_id: string
}

interface Agent {
  id: string
  first_name: string
  last_name: string
  slug: string
  phone: string | null
  email: string | null
  company: string | null
}

function formatPrice(p: number | null) {
  if (!p) return null
  if (p >= 1_000_000) return `AED ${(p / 1_000_000).toFixed(2)}M`
  return `AED ${p.toLocaleString()}`
}

export default function PublicProperty() {
  const { agentSlug, propertySlug } = useParams()
  const [property, setProperty] = useState<Property | null>(null)
  const [agent, setAgent] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(true)
  const [photoIndex, setPhotoIndex] = useState(0)
  const [leadForm, setLeadForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [leadStatus, setLeadStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  useEffect(() => {
    if (!agentSlug || !propertySlug) return

    supabase
      .from('profiles')
      .select('*')
      .eq('slug', agentSlug)
      .single()
      .then(async ({ data: agentData, error }) => {
        if (error || !agentData) { setLoading(false); return }
        setAgent(agentData)

        const { data: propData } = await supabase
          .from('properties')
          .select('*')
          .eq('agent_id', agentData.id)
          .eq('slug', propertySlug)
          .eq('status', 'live')
          .single()

        if (propData) {
          setProperty(propData)
          // Record page view (fire & forget)
          supabase.from('page_views').insert({
            agent_id: agentData.id,
            property_id: propData.id,
            referrer: document.referrer || null,
          }).then(() => {})
        }
        setLoading(false)
      })
  }, [agentSlug, propertySlug])

  async function handleLeadSubmit(e: FormEvent) {
    e.preventDefault()
    if (!property || !agent) return
    setLeadStatus('sending')

    const { error } = await supabase.from('leads').insert({
      agent_id: agent.id,
      property_id: property.id,
      name: leadForm.name,
      email: leadForm.email,
      phone: leadForm.phone || null,
      message: leadForm.message || null,
      status: 'new',
    })

    if (error) {
      setLeadStatus('error')
    } else {
      setLeadStatus('sent')
      setLeadForm({ name: '', email: '', phone: '', message: '' })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-6 h-6 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!property || !agent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="text-4xl font-semibold text-gray-100 mb-4">404</div>
          <p className="text-sm text-gray-400 mb-4">This property isn't available.</p>
          {agentSlug && (
            <Link to={`/${agentSlug}`} className="text-xs text-[#c9a84c] hover:underline">
              ← View agent portfolio
            </Link>
          )}
        </div>
      </div>
    )
  }

  const photos = property.photos ?? []
  const agentName = `${agent.first_name} ${agent.last_name}`

  const specs = [
    property.bedrooms != null && { icon: Bed, label: `${property.bedrooms} Bed${property.bedrooms !== 1 ? 's' : ''}` },
    property.bathrooms != null && { icon: Bath, label: `${property.bathrooms} Bath${property.bathrooms !== 1 ? 's' : ''}` },
    property.area_sqft && { icon: Maximize2, label: `${property.area_sqft.toLocaleString()} sqft` },
  ].filter(Boolean) as { icon: React.FC<{ size: number; className?: string }>; label: string }[]

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 h-16 flex items-center px-8">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
          <Link to={`/${agentSlug}`} className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#1a1a1a] transition-colors">
            <ChevronLeft size={16} />
            {agentName}
          </Link>
          <a href="#enquire" className="bg-[#1a1a1a] text-white text-xs px-4 py-2 rounded-lg hover:bg-black transition-colors font-medium">
            Enquire now
          </a>
        </div>
      </nav>

      <div className="pt-16">
        {/* Photo gallery */}
        <div className="relative bg-[#1a1a1a] h-[60vh] overflow-hidden">
          {photos.length > 0 ? (
            <>
              <img
                src={photos[photoIndex]}
                alt={property.title}
                className="w-full h-full object-cover opacity-90"
              />
              {photos.length > 1 && (
                <>
                  <button
                    onClick={() => setPhotoIndex(i => (i - 1 + photos.length) % photos.length)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => setPhotoIndex(i => (i + 1) % photos.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                  >
                    <ChevronRight size={20} />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {photos.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setPhotoIndex(i)}
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${i === photoIndex ? 'bg-white' : 'bg-white/40'}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <MapPin size={48} className="text-white/20" />
            </div>
          )}

          {/* Overlay title */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-8">
            <div className="max-w-6xl mx-auto">
              {property.property_type && (
                <div className="text-xs font-medium text-[#c9a84c] uppercase tracking-widest mb-2 capitalize">
                  {property.property_type}
                </div>
              )}
              <h1 className="text-3xl font-semibold text-white tracking-tight">{property.title}</h1>
              {property.location && (
                <div className="flex items-center gap-1.5 text-white/70 text-sm mt-2">
                  <MapPin size={13} />
                  {[property.community, property.location].filter(Boolean).join(', ')}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Thumbnail strip */}
        {photos.length > 1 && (
          <div className="flex gap-1 px-8 pt-3 max-w-6xl mx-auto overflow-x-auto">
            {photos.slice(0, 6).map((photo, i) => (
              <button
                key={i}
                onClick={() => setPhotoIndex(i)}
                className={`shrink-0 w-16 h-12 rounded-md overflow-hidden border-2 transition-colors ${i === photoIndex ? 'border-[#c9a84c]' : 'border-transparent'}`}
              >
                <img src={photo} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Main content */}
        <div className="max-w-6xl mx-auto px-8 py-10 grid grid-cols-3 gap-10">
          {/* Left col */}
          <div className="col-span-2 space-y-8">
            {/* Price + specs */}
            <div className="flex items-start justify-between">
              <div>
                {property.show_price && property.price && (
                  <div className="text-3xl font-semibold text-[#c9a84c] tracking-tight mb-1">
                    {formatPrice(property.price)}
                  </div>
                )}
                <div className="flex items-center gap-5 mt-3">
                  {specs.map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-1.5 text-sm text-gray-500">
                      <Icon size={15} className="text-gray-400" />
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Key details */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Type', value: property.property_type },
                { label: 'Location', value: property.location },
                { label: 'Community', value: property.community },
                { label: 'Floor', value: property.floor },
                { label: 'Parking', value: property.parking },
                { label: 'Furnished', value: property.furnished === 'yes' ? 'Furnished' : property.furnished === 'semi' ? 'Semi-furnished' : 'Unfurnished' },
                { label: 'View', value: property.view },
              ].filter(d => d.value).map(({ label, value }) => (
                <div key={label} className="bg-gray-50 rounded-lg p-3.5">
                  <div className="text-xs text-gray-400 mb-0.5">{label}</div>
                  <div className="text-sm font-medium text-[#1a1a1a] capitalize">{value}</div>
                </div>
              ))}
            </div>

            {/* Description */}
            {property.description && (
              <div>
                <h3 className="text-base font-semibold text-[#1a1a1a] mb-3">About this property</h3>
                <p className="text-sm text-gray-500 leading-relaxed whitespace-pre-wrap">{property.description}</p>
              </div>
            )}

            {/* Compliance */}
            {(property.rera_number || property.permit_number) && (
              <div className="border-t border-gray-100 pt-6">
                <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Compliance</div>
                <div className="flex gap-6 text-xs text-gray-500">
                  {property.rera_number && <span>RERA: {property.rera_number}</span>}
                  {property.permit_number && <span>Permit: {property.permit_number}</span>}
                </div>
              </div>
            )}
          </div>

          {/* Right col — agent card + lead form */}
          <div className="space-y-5">
            {/* Agent card */}
            <div className="bg-white border border-gray-100 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#c9a84c]/10 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-[#c9a84c]">
                    {agent.first_name[0]}{agent.last_name[0]}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-[#1a1a1a] text-sm">{agentName}</div>
                  {agent.company && <div className="text-xs text-gray-400">{agent.company}</div>}
                </div>
              </div>
              <div className="space-y-2">
                {agent.phone && (
                  <a href={`tel:${agent.phone}`} className="flex items-center gap-2 text-xs text-gray-500 hover:text-[#1a1a1a] transition-colors">
                    <Phone size={13} className="text-[#c9a84c]" />
                    {agent.phone}
                  </a>
                )}
                {agent.email && (
                  <a href={`mailto:${agent.email}`} className="flex items-center gap-2 text-xs text-gray-500 hover:text-[#1a1a1a] transition-colors">
                    <Mail size={13} className="text-[#c9a84c]" />
                    {agent.email}
                  </a>
                )}
              </div>
            </div>

            {/* Lead form */}
            <div id="enquire" className="bg-white border border-gray-100 rounded-xl p-5">
              <div className="text-sm font-semibold text-[#1a1a1a] mb-4">Enquire about this property</div>
              {leadStatus === 'sent' ? (
                <div className="flex items-center gap-3 py-4 text-[#2ab695]">
                  <div className="w-8 h-8 bg-[#2ab695]/10 rounded-full flex items-center justify-center">
                    <Check size={15} />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Message sent!</div>
                    <div className="text-xs text-gray-400">The agent will be in touch shortly.</div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleLeadSubmit} className="space-y-3">
                  {leadStatus === 'error' && (
                    <div className="flex items-center gap-2 text-red-500 text-xs bg-red-50 px-3 py-2 rounded-lg">
                      <AlertCircle size={13} />
                      Something went wrong. Please try again.
                    </div>
                  )}
                  <input
                    required
                    value={leadForm.name}
                    onChange={e => setLeadForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Your name"
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#c9a84c] transition-colors placeholder:text-gray-300"
                  />
                  <input
                    required
                    type="email"
                    value={leadForm.email}
                    onChange={e => setLeadForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="Email address"
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#c9a84c] transition-colors placeholder:text-gray-300"
                  />
                  <input
                    type="tel"
                    value={leadForm.phone}
                    onChange={e => setLeadForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="Phone (optional)"
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#c9a84c] transition-colors placeholder:text-gray-300"
                  />
                  <textarea
                    value={leadForm.message}
                    onChange={e => setLeadForm(f => ({ ...f, message: e.target.value }))}
                    placeholder="Your message (optional)"
                    rows={3}
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#c9a84c] transition-colors resize-none placeholder:text-gray-300"
                  />
                  <button
                    type="submit"
                    disabled={leadStatus === 'sending'}
                    className="w-full bg-[#c9a84c] text-white py-3 rounded-lg text-sm font-medium hover:bg-[#b8953e] transition-colors disabled:opacity-50"
                  >
                    {leadStatus === 'sending' ? 'Sending…' : 'Send enquiry'}
                  </button>
                  <p className="text-[10px] text-gray-300 text-center">Your details are shared only with the agent.</p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#1a1a1a] py-8 px-8 mt-16">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="text-xs text-white/20">{agentName}</div>
          <div className="text-xs text-white/20">Powered by Agent Pages</div>
        </div>
      </footer>
    </div>
  )
}
