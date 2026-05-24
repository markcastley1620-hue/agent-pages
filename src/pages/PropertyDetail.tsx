import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Eye, Users, Edit, ExternalLink, Circle, ToggleLeft, ToggleRight } from 'lucide-react'

import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import AISearchVisibility from '../components/AISearchVisibility'

interface Property {
  id: string
  title: string
  slug: string
  status: string
  price: number | null
  location: string | null
  bedrooms: number | null
  bathrooms: number | null
  area_sqft: number | null
  description: string | null
  property_type: string | null
  photos: string[]
  show_price: boolean
  agent_id: string
  created_at: string
  visibility_config?: Record<string, boolean>
}

const statusColors: Record<string, string> = {
  live: '#2ab695',
  draft: '#c9a84c',
  archived: '#999',
}

function formatPrice(p: number | null) {
  if (!p) return '—'
  if (p >= 1_000_000) return `AED ${(p / 1_000_000).toFixed(2)}M`
  return `AED ${p.toLocaleString()}`
}

export default function PropertyDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)
  const [profile, setProfile] = useState<{ slug: string } | null>(null)

  useEffect(() => {
    if (!id || !user) return
    Promise.all([
      supabase.from('properties').select('*').eq('id', id).single(),
      supabase.from('profiles').select('slug').eq('id', user.id).single(),
    ]).then(([p, pr]) => {
      setProperty(p.data)
      setProfile(pr.data)
      setLoading(false)
    })
  }, [id, user])

  async function toggleStatus() {
    if (!property) return
    setToggling(true)
    const newStatus = property.status === 'live' ? 'draft' : 'live'
    await supabase.from('properties').update({ status: newStatus }).eq('id', property.id)
    setProperty(p => p ? { ...p, status: newStatus } : p)
    setToggling(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!property) {
    return (
      <div className="p-8">
        <div className="text-sm text-gray-400">Property not found.</div>
      </div>
    )
  }

  const isLive = property.status === 'live'

  return (
    <div className="p-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-semibold text-[#1a1a1a] tracking-tight">{property.title}</h1>
              <div className="flex items-center gap-1.5">
                <Circle size={7} fill={statusColors[property.status]} color="transparent" />
                <span className="text-xs font-medium" style={{ color: statusColors[property.status] }}>
                  {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
                </span>
              </div>
            </div>
            {property.location && <p className="text-sm text-gray-400">{property.location}</p>}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleStatus}
              disabled={toggling}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isLive
                  ? 'bg-[#2ab695]/10 text-[#2ab695] hover:bg-[#2ab695]/20'
                  : 'bg-[#c9a84c]/10 text-[#c9a84c] hover:bg-[#c9a84c]/20'
              }`}
            >
              {isLive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
              {toggling ? '…' : isLive ? 'Set to draft' : 'Publish'}
            </button>
            <Link
              to={`/properties/${id}/edit`}
              className="flex items-center gap-2 border border-gray-200 px-4 py-2.5 rounded-lg text-sm font-medium text-[#1a1a1a] hover:bg-gray-50 transition-colors"
            >
              <Edit size={15} />
              Edit
            </Link>
            {isLive && profile && (
              <a
                href={`/${profile.slug}/${property.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-[#1a1a1a] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-black transition-colors"
              >
                <ExternalLink size={15} />
                View page
              </a>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Main info */}
          <div className="col-span-2 space-y-5">
            {/* Photos */}
            {property.photos && property.photos.length > 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <img
                  src={property.photos[0]}
                  alt={property.title}
                  className="w-full h-64 object-cover"
                />
                {property.photos.length > 1 && (
                  <div className="grid grid-cols-4 gap-1 p-1">
                    {property.photos.slice(1, 5).map((photo, i) => (
                      <img key={i} src={photo} alt="" className="w-full h-16 object-cover rounded" />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-100 h-48 flex items-center justify-center">
                <div className="text-center text-gray-300">
                  <div className="text-sm">No photos yet</div>
                  <Link to={`/properties/${id}/edit`} className="text-xs text-[#c9a84c] mt-1 block">Add photos →</Link>
                </div>
              </div>
            )}

            {/* Details */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">Property details</div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Type', value: property.property_type ?? '—' },
                  { label: 'Price', value: formatPrice(property.price) },
                  { label: 'Bedrooms', value: property.bedrooms ?? '—' },
                  { label: 'Bathrooms', value: property.bathrooms ?? '—' },
                  { label: 'Area', value: property.area_sqft ? `${property.area_sqft.toLocaleString()} sq ft` : '—' },
                  { label: 'Location', value: property.location ?? '—' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div className="text-xs text-gray-400 mb-0.5">{label}</div>
                    <div className="text-sm font-medium text-[#1a1a1a]">{value}</div>
                  </div>
                ))}
              </div>
              {property.description && (
                <div className="mt-5 pt-5 border-t border-gray-100">
                  <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Description</div>
                  <p className="text-sm text-gray-600 leading-relaxed">{property.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Stats */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">Performance</div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Eye size={14} />
                  Page views
                </div>
                <span className="text-sm font-medium text-[#1a1a1a]">—</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Users size={14} />
                  Leads captured
                </div>
                <span className="text-sm font-medium text-[#1a1a1a]">—</span>
              </div>
            </div>

            {/* Public URL */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Public URL</div>
              {isLive && profile ? (
                <a
                  href={`/${profile.slug}/${property.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#c9a84c] hover:underline break-all"
                >
                  /{profile.slug}/{property.slug}
                </a>
              ) : (
                <div className="text-xs text-gray-300">Publish to get a public URL</div>
              )}
            </div>

            {/* Settings */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">Visibility</div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Show price</span>
                <span className={`text-xs font-medium ${property.show_price ? 'text-[#2ab695]' : 'text-gray-300'}`}>
                  {property.show_price ? 'Yes' : 'No'}
                </span>
              </div>
            </div>

            <Link
              to={`/properties/${id}/edit`}
              className="flex items-center justify-center gap-2 w-full border border-gray-200 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:text-[#1a1a1a] hover:bg-gray-50 transition-colors"
            >
              <Edit size={15} />
              Edit property
            </Link>
          </div>
        </div>

        {/* AI Search Visibility — shown for published properties */}
        {isLive && (
          <div className="mt-6">
            <AISearchVisibility
              mode="post-publish"
              visibilityConfig={property.visibility_config ?? { google: true, chatgpt: true, claude: true, gemini: true, perplexity: true, bing: true, grok: true }}
              onConfigChange={() => {}}
              publishedAt={new Date(property.created_at)}
            />
          </div>
        )}
      </div>
  )
}
