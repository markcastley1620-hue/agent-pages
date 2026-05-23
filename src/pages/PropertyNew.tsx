import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Upload, X, Link as LinkIcon, Loader } from 'lucide-react'
import Layout, { Breadcrumb } from '../components/Layout'
import { supabase, supabasePublic } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const STORAGE_BUCKET = 'agent-pages'

function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-')
}

type Section = 'url' | 'details' | 'media'

interface MatchResult {
  found: boolean
  data?: Record<string, unknown>
  checked: boolean
}

export default function PropertyNew() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState<Section>('url')
  const [listingUrl, setListingUrl] = useState('')
  const [matchResult, setMatchResult] = useState<MatchResult>({ found: false, checked: false })
  const [checkingUrl, setCheckingUrl] = useState(false)
  const [saving, setSaving] = useState(false)

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
    community_pricing: false,
    show_price: true,
  })

  const [_photos, setPhotos] = useState<(File | null)[]>([null, null, null, null, null])
  const [photoUrls, setPhotoUrls] = useState<(string | null)[]>([null, null, null, null, null])
  const [uploading, setUploading] = useState<boolean[]>([false, false, false, false, false])
  const fileRefs = useRef<(HTMLInputElement | null)[]>([])

  // Pre-filled flag for display
  const prefilled = matchResult.found && matchResult.data ? Object.keys(matchResult.data) : []

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value = e.target.type === 'checkbox'
        ? (e.target as HTMLInputElement).checked
        : e.target.value
      setForm(f => ({
        ...f,
        [field]: value,
        ...(field === 'title' && !f.slug ? { slug: slugify(e.target.value) } : {}),
      }))
    }
  }

  async function checkListingUrl() {
    if (!listingUrl.trim()) return
    setCheckingUrl(true)
    try {
      const { data, error } = await supabasePublic.functions.invoke('match-listing-url', {
        body: { url: listingUrl },
      })
      if (error || !data?.found) {
        setMatchResult({ found: false, checked: true })
      } else {
        setMatchResult({ found: true, checked: true, data: data.listing })
        // Pre-fill form
        const l = data.listing
        setForm(f => ({
          ...f,
          title: l.title ?? f.title,
          price: l.price?.toString() ?? f.price,
          location: l.location ?? f.location,
          community: l.community ?? f.community,
          bedrooms: l.bedrooms?.toString() ?? f.bedrooms,
          bathrooms: l.bathrooms?.toString() ?? f.bathrooms,
          area_sqft: l.area_sqft?.toString() ?? f.area_sqft,
          property_type: l.property_type ?? f.property_type,
          description: l.description ?? f.description,
          rera_number: l.rera_number ?? f.rera_number,
          permit_number: l.permit_number ?? f.permit_number,
        }))
      }
    } catch {
      setMatchResult({ found: false, checked: true })
    }
    setCheckingUrl(false)
    setActiveSection('details')
  }

  async function handlePhotoUpload(index: number, file: File) {
    if (!user) return
    setUploading(u => { const n = [...u]; n[index] = true; return n })
    const path = `${user.id}/${Date.now()}-${file.name.replace(/\s+/g, '-')}`
    const { data, error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    })
    if (!error && data) {
      const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(data.path)
      setPhotoUrls(u => { const n = [...u]; n[index] = urlData.publicUrl; return n })
      setPhotos(p => { const n = [...p]; n[index] = file; return n })
    }
    setUploading(u => { const n = [...u]; n[index] = false; return n })
  }

  function removePhoto(index: number) {
    setPhotos(p => { const n = [...p]; n[index] = null; return n })
    setPhotoUrls(u => { const n = [...u]; n[index] = null; return n })
  }

  async function handleSave(publish: boolean) {
    if (!user || !form.title) return
    setSaving(true)
    const validPhotos = photoUrls.filter(Boolean) as string[]
    const { data, error } = await supabase.from('properties').insert({
      agent_id: user.id,
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
      community_pricing: form.community_pricing,
      show_price: form.show_price,
      photos: validPhotos,
      status: publish ? 'live' : 'draft',
      source_url: listingUrl || null,
    }).select().single()

    setSaving(false)
    if (!error && data) {
      navigate(`/properties/${data.id}`)
    }
  }

  const inputClass = (field?: string) =>
    `w-full border rounded-lg px-4 py-3 text-sm outline-none focus:border-[#c9a84c] transition-colors placeholder:text-gray-300 ${
      field && prefilled.includes(field)
        ? 'border-[#c9a84c]/40 bg-[#fdf8e9]'
        : 'border-gray-200 bg-white'
    }`

  const selectClass = (field?: string) =>
    `w-full border rounded-lg px-4 py-3 text-sm outline-none focus:border-[#c9a84c] transition-colors ${
      field && prefilled.includes(field)
        ? 'border-[#c9a84c]/40 bg-[#fdf8e9]'
        : 'border-gray-200 bg-white'
    }`

  return (
    <Layout>
      <div className="p-8 max-w-3xl">
        <Breadcrumb items={[{ label: 'Properties', to: '/properties' }, { label: 'Add property' }]} />
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-[#1a1a1a] tracking-tight">Add property</h1>
          <p className="text-sm text-gray-400 mt-0.5">Create a new property listing page</p>
        </div>

        {/* Section tabs */}
        <div className="flex items-center gap-0 mb-8 border border-gray-200 rounded-xl overflow-hidden w-fit">
          {([
            { key: 'url', label: '1. Source URL' },
            { key: 'details', label: '2. Details' },
            { key: 'media', label: '3. Media & Publish' },
          ] as { key: Section; label: string }[]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              className={`px-5 py-2.5 text-sm font-medium transition-colors ${
                activeSection === key
                  ? 'bg-[#1a1a1a] text-white'
                  : 'text-gray-400 hover:text-[#1a1a1a] bg-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Section 1: URL */}
        {activeSection === 'url' && (
          <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
            <div>
              <div className="text-sm font-medium text-[#1a1a1a] mb-1">Listing URL</div>
              <p className="text-xs text-gray-400 mb-4">
                Paste a listing URL to automatically pull property details. We'll check if it matches
                our database and pre-fill the form.
              </p>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <LinkIcon size={14} className="absolute left-3.5 top-3.5 text-gray-300" />
                  <input
                    value={listingUrl}
                    onChange={e => setListingUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full border border-gray-200 rounded-lg pl-9 pr-4 py-3 text-sm outline-none focus:border-[#c9a84c] transition-colors placeholder:text-gray-300"
                  />
                </div>
                <button
                  onClick={checkListingUrl}
                  disabled={checkingUrl || !listingUrl.trim()}
                  className="bg-[#1a1a1a] text-white px-5 py-3 rounded-lg text-sm font-medium hover:bg-black transition-colors disabled:opacity-40 flex items-center gap-2"
                >
                  {checkingUrl && <Loader size={14} className="animate-spin" />}
                  {checkingUrl ? 'Checking…' : 'Check URL'}
                </button>
              </div>
              {matchResult.checked && (
                <div className={`flex items-center gap-2 mt-3 text-sm ${matchResult.found ? 'text-[#2ab695]' : 'text-gray-400'}`}>
                  {matchResult.found
                    ? <><Check size={15} /> Found in database — form pre-filled</>
                    : <><X size={15} /> Not in database — enter details manually</>
                  }
                </div>
              )}
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActiveSection('details')}
                className="bg-[#1a1a1a] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-black transition-colors"
              >
                Continue to details →
              </button>
            </div>
          </div>
        )}

        {/* Section 2: Details */}
        {activeSection === 'details' && (
          <div className="space-y-5">
            {matchResult.found && (
              <div className="bg-[#fdf8e9] border border-[#c9a84c]/20 rounded-xl px-4 py-3 text-xs text-[#c9a84c]">
                Fields with a gold background were pre-filled from the matched listing.
              </div>
            )}

            {/* Basics */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">Basics</div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Title *</label>
                <input value={form.title} onChange={set('title')} placeholder="e.g. Modern 2BR in Downtown Dubai" className={inputClass('title')} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">URL slug</label>
                  <input value={form.slug} onChange={set('slug')} placeholder="modern-2br-downtown" className={inputClass()} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Type</label>
                  <select value={form.property_type} onChange={set('property_type')} className={selectClass('property_type')}>
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

            {/* Location */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">Location</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Area / Location</label>
                  <input value={form.location} onChange={set('location')} placeholder="Dubai Marina" className={inputClass('location')} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Community</label>
                  <input value={form.community} onChange={set('community')} placeholder="Marina Promenade" className={inputClass('community')} />
                </div>
              </div>
            </div>

            {/* Commercial */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">Commercial</div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Price (AED)</label>
                <input type="number" value={form.price} onChange={set('price')} placeholder="2500000" className={inputClass('price')} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Agent commission</label>
                <input value={form.agent_commission} onChange={set('agent_commission')} placeholder="2%" className={inputClass()} />
              </div>
            </div>

            {/* Features */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">Features</div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Bedrooms</label>
                  <input type="number" value={form.bedrooms} onChange={set('bedrooms')} placeholder="2" className={inputClass('bedrooms')} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Bathrooms</label>
                  <input type="number" value={form.bathrooms} onChange={set('bathrooms')} placeholder="2" className={inputClass('bathrooms')} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Area (sq ft)</label>
                  <input type="number" value={form.area_sqft} onChange={set('area_sqft')} placeholder="1200" className={inputClass('area_sqft')} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Floor</label>
                  <input value={form.floor} onChange={set('floor')} placeholder="18" className={inputClass()} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Parking</label>
                  <input value={form.parking} onChange={set('parking')} placeholder="1" className={inputClass()} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Furnished</label>
                  <select value={form.furnished} onChange={set('furnished')} className={selectClass()}>
                    <option value="no">Unfurnished</option>
                    <option value="yes">Furnished</option>
                    <option value="semi">Semi-furnished</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">View</label>
                <input value={form.view} onChange={set('view')} placeholder="Sea view, Marina view…" className={inputClass()} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Description</label>
                <textarea value={form.description} onChange={set('description')} rows={4} placeholder="Describe the property…" className={`${inputClass('description')} resize-none`} />
              </div>
            </div>

            {/* Compliance */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">Compliance</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">RERA number</label>
                  <input value={form.rera_number} onChange={set('rera_number')} placeholder="RERA-2024-XXXXX" className={inputClass('rera_number')} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Permit number</label>
                  <input value={form.permit_number} onChange={set('permit_number')} placeholder="DLD-XXXXX" className={inputClass('permit_number')} />
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <button onClick={() => setActiveSection('url')} className="text-sm text-gray-400 hover:text-[#1a1a1a] transition-colors">
                ← Back
              </button>
              <button
                onClick={() => setActiveSection('media')}
                className="bg-[#1a1a1a] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-black transition-colors"
              >
                Continue to media →
              </button>
            </div>
          </div>
        )}

        {/* Section 3: Media + Publish */}
        {activeSection === 'media' && (
          <div className="space-y-5">
            <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">Photos</div>
              <p className="text-xs text-gray-400">Up to 5 photos. First photo is the hero image.</p>
              <div className="grid grid-cols-5 gap-3">
                {[0, 1, 2, 3, 4].map(i => (
                  <div key={i} className="relative aspect-square">
                    {photoUrls[i] ? (
                      <>
                        <img src={photoUrls[i]!} alt="" className="w-full h-full object-cover rounded-lg" />
                        <button
                          onClick={() => removePhoto(i)}
                          className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black transition-colors"
                        >
                          <X size={10} />
                        </button>
                        {i === 0 && (
                          <div className="absolute bottom-1 left-1 bg-[#c9a84c] text-white text-[9px] font-medium px-1.5 py-0.5 rounded">
                            Hero
                          </div>
                        )}
                      </>
                    ) : uploading[i] ? (
                      <div className="w-full h-full border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center">
                        <Loader size={16} className="animate-spin text-gray-300" />
                      </div>
                    ) : (
                      <label className="w-full h-full border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#c9a84c]/40 transition-colors">
                        <Upload size={14} className="text-gray-300 mb-1" />
                        <span className="text-[10px] text-gray-300">{i === 0 ? 'Hero' : `Photo ${i + 1}`}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          ref={el => { fileRefs.current[i] = el }}
                          onChange={e => e.target.files?.[0] && handlePhotoUpload(i, e.target.files[0])}
                        />
                      </label>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">Visibility options</div>
              {[
                { field: 'community_pricing', label: 'Show community pricing context', desc: 'Display area average prices on the listing page' },
                { field: 'show_price', label: 'Show asking price', desc: 'Display the price publicly on the listing page' },
              ].map(({ field, label, desc }) => (
                <label key={field} className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form[field as keyof typeof form] as boolean}
                    onChange={e => setForm(f => ({ ...f, [field]: e.target.checked }))}
                    className="mt-0.5 accent-[#c9a84c]"
                  />
                  <div>
                    <div className="text-sm font-medium text-[#1a1a1a]">{label}</div>
                    <div className="text-xs text-gray-400">{desc}</div>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button onClick={() => setActiveSection('details')} className="text-sm text-gray-400 hover:text-[#1a1a1a] transition-colors">
                ← Back
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleSave(false)}
                  disabled={saving || !form.title}
                  className="border border-gray-200 text-[#1a1a1a] px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-40"
                >
                  {saving ? 'Saving…' : 'Save as draft'}
                </button>
                <button
                  onClick={() => handleSave(true)}
                  disabled={saving || !form.title}
                  className="bg-[#2ab695] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#22a082] transition-colors disabled:opacity-40"
                >
                  {saving ? 'Publishing…' : 'Publish listing'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
