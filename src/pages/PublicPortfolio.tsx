import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Phone, Mail, MapPin, Bed, Bath, Maximize2 } from 'lucide-react'

// Public Supabase client (no schema restriction for portfolio)
import { supabase } from '../lib/supabase'

interface Profile {
  id: string
  first_name: string
  last_name: string
  slug: string
  bio: string | null
  phone: string | null
  email: string | null
  company: string | null
  portfolio_published: boolean
}

interface Property {
  id: string
  title: string
  slug: string
  price: number | null
  location: string | null
  bedrooms: number | null
  bathrooms: number | null
  area_sqft: number | null
  property_type: string | null
  photos: string[]
  show_price: boolean
}

function formatPrice(p: number | null) {
  if (!p) return null
  if (p >= 1_000_000) return `AED ${(p / 1_000_000).toFixed(2)}M`
  if (p >= 1_000) return `AED ${(p / 1_000).toFixed(0)}K`
  return `AED ${p.toLocaleString()}`
}

export default function PublicPortfolio() {
  const { agentSlug } = useParams()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!agentSlug) return
    supabase
      .from('profiles')
      .select('*')
      .eq('slug', agentSlug)
      .single()
      .then(async ({ data, error }) => {
        if (error || !data) { setNotFound(true); setLoading(false); return }
        if (!data.portfolio_published) { setNotFound(true); setLoading(false); return }
        setProfile(data)

        const { data: props } = await supabase
          .from('properties')
          .select('id, title, slug, price, location, bedrooms, bathrooms, area_sqft, property_type, photos, show_price')
          .eq('agent_id', data.id)
          .eq('status', 'live')
          .order('created_at', { ascending: false })

        setProperties(props ?? [])
        setLoading(false)
      })
  }, [agentSlug])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-6 h-6 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="text-4xl font-semibold text-gray-100 mb-4">404</div>
          <p className="text-sm text-gray-400">This portfolio page doesn't exist or isn't published.</p>
        </div>
      </div>
    )
  }

  const fullName = `${profile.first_name} ${profile.last_name}`

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 h-16 flex items-center px-8">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
          <div className="font-semibold text-[#1a1a1a] text-sm">{fullName}</div>
          <div className="flex items-center gap-6">
            <a href="#listings" className="text-xs text-gray-400 hover:text-[#1a1a1a] transition-colors">Listings</a>
            <a href="#contact" className="text-xs text-gray-400 hover:text-[#1a1a1a] transition-colors">Contact</a>
            <a href="#contact" className="bg-[#1a1a1a] text-white text-xs px-4 py-2 rounded-lg hover:bg-black transition-colors font-medium">
              Get in touch
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-16 min-h-[60vh] flex items-center bg-[#1a1a1a]">
        <div className="max-w-6xl mx-auto px-8 py-24 w-full">
          <div className="max-w-2xl">
            <div className="text-xs font-medium text-[#c9a84c] uppercase tracking-widest mb-6">Real Estate Professional</div>
            <h1 className="text-5xl font-semibold text-white tracking-tight leading-tight mb-6">{fullName}</h1>
            {profile.bio && (
              <p className="text-base text-white/60 leading-relaxed mb-8 max-w-xl">{profile.bio}</p>
            )}
            {profile.company && (
              <div className="text-sm text-white/40">{profile.company}</div>
            )}
            <div className="flex items-center gap-4 mt-8">
              {profile.phone && (
                <a href={`tel:${profile.phone}`} className="flex items-center gap-2 bg-[#c9a84c] text-white text-sm px-5 py-3 rounded-lg font-medium hover:bg-[#b8953e] transition-colors">
                  <Phone size={15} />
                  {profile.phone}
                </a>
              )}
              <a href="#contact" className="flex items-center gap-2 border border-white/20 text-white text-sm px-5 py-3 rounded-lg font-medium hover:bg-white/10 transition-colors">
                <Mail size={15} />
                Send message
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <div className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-8 py-8 grid grid-cols-3 divide-x divide-gray-100">
          <div className="px-8 first:pl-0">
            <div className="text-2xl font-semibold text-[#1a1a1a] tracking-tight">{properties.length}</div>
            <div className="text-xs text-gray-400 mt-1">Active listings</div>
          </div>
          <div className="px-8">
            <div className="text-2xl font-semibold text-[#c9a84c] tracking-tight">Live</div>
            <div className="text-xs text-gray-400 mt-1">Portfolio status</div>
          </div>
          <div className="px-8">
            <div className="text-2xl font-semibold text-[#2ab695] tracking-tight">Pro</div>
            <div className="text-xs text-gray-400 mt-1">Agent tier</div>
          </div>
        </div>
      </div>

      {/* Listings */}
      <section id="listings" className="max-w-6xl mx-auto px-8 py-20">
        <div className="mb-10">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-2">Portfolio</div>
          <h2 className="text-3xl font-semibold text-[#1a1a1a] tracking-tight">Active listings</h2>
        </div>

        {properties.length === 0 ? (
          <div className="text-sm text-gray-400 py-12 text-center">No listings available.</div>
        ) : (
          <div className="grid grid-cols-3 gap-5">
            {properties.map(prop => (
              <Link
                key={prop.id}
                to={`/${agentSlug}/${prop.slug}`}
                className="group bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="relative h-52 bg-gray-100 overflow-hidden">
                  {prop.photos?.[0] ? (
                    <img
                      src={prop.photos[0]}
                      alt={prop.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <MapPin size={32} />
                    </div>
                  )}
                  {prop.property_type && (
                    <div className="absolute top-3 left-3 bg-white text-[#1a1a1a] text-[10px] font-medium px-2.5 py-1 rounded-md capitalize">
                      {prop.property_type}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="font-medium text-[#1a1a1a] text-sm mb-1 leading-snug">{prop.title}</div>
                  {prop.location && (
                    <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
                      <MapPin size={11} />
                      {prop.location}
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
                    {prop.bedrooms != null && (
                      <div className="flex items-center gap-1"><Bed size={11} />{prop.bedrooms} bed</div>
                    )}
                    {prop.bathrooms != null && (
                      <div className="flex items-center gap-1"><Bath size={11} />{prop.bathrooms} bath</div>
                    )}
                    {prop.area_sqft && (
                      <div className="flex items-center gap-1"><Maximize2 size={11} />{prop.area_sqft.toLocaleString()} sqft</div>
                    )}
                  </div>
                  {prop.show_price && prop.price && (
                    <div className="text-sm font-semibold text-[#c9a84c]">{formatPrice(prop.price)}</div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Contact */}
      <section id="contact" className="bg-[#1a1a1a] py-20">
        <div className="max-w-6xl mx-auto px-8">
          <div className="max-w-lg">
            <div className="text-xs font-medium text-[#c9a84c] uppercase tracking-widest mb-4">Contact</div>
            <h2 className="text-3xl font-semibold text-white tracking-tight mb-8">Get in touch</h2>
            <div className="space-y-3">
              {profile.phone && (
                <a href={`tel:${profile.phone}`} className="flex items-center gap-3 text-white/60 hover:text-white transition-colors">
                  <Phone size={15} className="text-[#c9a84c]" />
                  <span className="text-sm">{profile.phone}</span>
                </a>
              )}
              {profile.email && (
                <a href={`mailto:${profile.email}`} className="flex items-center gap-3 text-white/60 hover:text-white transition-colors">
                  <Mail size={15} className="text-[#c9a84c]" />
                  <span className="text-sm">{profile.email}</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#111] py-6 px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="text-xs text-white/20">© {new Date().getFullYear()} {fullName}</div>
          <div className="text-xs text-white/20">Powered by Agent Pages</div>
        </div>
      </footer>
    </div>
  )
}
