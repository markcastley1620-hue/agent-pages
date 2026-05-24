import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-')
}

export default function PropertyEdit() {
  const { id } = useParams()
  useAuth()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const [form, setForm] = useState({
    title: '',
    slug: '',
    property_type: 'apartment',
    price: '',
    location: '',
    community: '',
    bedrooms: '',
    bathrooms: '',
    area_sqft: '',
    floor: '',
    parking: '',
    furnished: 'no',
    view: '',
    description: '',
    agent_commission: '',
    rera_number: '',
    permit_number: '',
    show_price: true,
  })

  useEffect(() => {
    if (!id) return
    supabase.from('properties').select('*').eq('id', id).single().then(({ data }) => {
      if (data) {
        setForm({
          title: data.title ?? '',
          slug: data.slug ?? '',
          property_type: data.property_type ?? 'apartment',
          price: data.price?.toString() ?? '',
          location: data.location ?? '',
          community: data.community ?? '',
          bedrooms: data.bedrooms?.toString() ?? '',
          bathrooms: data.bathrooms?.toString() ?? '',
          area_sqft: data.area_sqft?.toString() ?? '',
          floor: data.floor ?? '',
          parking: data.parking ?? '',
          furnished: data.furnished ?? 'no',
          view: data.view ?? '',
          description: data.description ?? '',
          agent_commission: data.agent_commission ?? '',
          rera_number: data.rera_number ?? '',
          permit_number: data.permit_number ?? '',
          show_price: data.show_price ?? true,
        })
      }
      setLoading(false)
    })
  }, [id])

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value
      setForm(f => ({ ...f, [field]: value }))
    }
  }

  async function handleSave() {
    if (!id || !form.title) return
    setSaving(true)
    await supabase.from('properties').update({
      title: form.title,
      slug: form.slug || slugify(form.title),
      property_type: form.property_type,
      price: form.price ? Number(form.price) : null,
      location: form.location || null,
      community: form.community || null,
      bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
      bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
      area_sqft: form.area_sqft ? Number(form.area_sqft) : null,
      floor: form.floor || null,
      parking: form.parking || null,
      furnished: form.furnished,
      view: form.view || null,
      description: form.description || null,
      agent_commission: form.agent_commission || null,
      rera_number: form.rera_number || null,
      permit_number: form.permit_number || null,
      show_price: form.show_price,
    }).eq('id', id)
    setSaving(false)
    navigate(`/properties/${id}`)
  }

  const input = (field: string, props?: Record<string, unknown>) => (
    <input
      value={form[field as keyof typeof form] as string}
      onChange={set(field)}
      className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#c9a84c] transition-colors placeholder:text-gray-300 bg-white"
      {...props}
    />
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-[#1a1a1a] tracking-tight">Edit property</h1>
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">Basics</div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Title *</label>
              {input('title', { placeholder: 'e.g. Modern 2BR in Downtown Dubai' })}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">URL slug</label>
                {input('slug', { placeholder: 'modern-2br-downtown' })}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Type</label>
                <select value={form.property_type} onChange={set('property_type')} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#c9a84c] transition-colors bg-white">
                  <option value="apartment">Apartment</option>
                  <option value="villa">Villa</option>
                  <option value="townhouse">Townhouse</option>
                  <option value="penthouse">Penthouse</option>
                  <option value="studio">Studio</option>
                  <option value="plot">Plot</option>
                  <option value="commercial">Commercial</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">Location</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Area</label>
                {input('location', { placeholder: 'Dubai Marina' })}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Community</label>
                {input('community', { placeholder: 'Marina Promenade' })}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">Commercial</div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Price (AED)</label>
              {input('price', { type: 'number', placeholder: '2500000' })}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">Features</div>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Beds</label>{input('bedrooms', { type: 'number' })}</div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Baths</label>{input('bathrooms', { type: 'number' })}</div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Area (sqft)</label>{input('area_sqft', { type: 'number' })}</div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Description</label>
              <textarea value={form.description} onChange={set('description')} rows={4} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#c9a84c] transition-colors bg-white resize-none" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-3">
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">Compliance</div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-medium text-gray-500 mb-1.5">RERA</label>{input('rera_number')}</div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Permit</label>{input('permit_number')}</div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.show_price} onChange={e => setForm(f => ({ ...f, show_price: e.target.checked }))} className="accent-[#c9a84c]" />
              <div>
                <div className="text-sm font-medium text-[#1a1a1a]">Show asking price publicly</div>
                <div className="text-xs text-gray-400">Display the price on the listing page</div>
              </div>
            </label>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button onClick={() => navigate(`/properties/${id}`)} className="text-sm text-gray-400 hover:text-[#1a1a1a] transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.title}
              className="bg-[#1a1a1a] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-black transition-colors disabled:opacity-40"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>
  )
}
