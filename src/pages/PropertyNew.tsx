import { useState, useRef, type ChangeEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Upload, X, ChevronRight, ChevronLeft, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').slice(0, 60)
}

const STEPS = ['Basics', 'Details', 'Photos & Publish']

export default function PropertyNew() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const [photos, setPhotos] = useState<File[]>([])
  const [photoUrls, setPhotoUrls] = useState<string[]>([])

  const [form, setForm] = useState({
    title: '',
    slug: '',
    property_type: 'Apartment',
    community: '',
    sub_community: '',
    tower: '',
    address_line: '',
    asking_price_aed: '',
    show_price: true,
    bedrooms: '',
    bathrooms: '',
    built_up_sqft: '',
    floor: '',
    view_desc: '',
    furnishing: 'Unfurnished',
    parking_spaces: '',
    service_charge_psqft: '',
    completion_status: '',
    dld_permit_number: '',
    rera_disclosure: true,
    description_full: '',
    amenities: [] as string[],
    show_community_pricing: false,
  })

  function set(field: string) {
    return (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const val = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value
      setForm(f => ({
        ...f,
        [field]: val,
        ...(field === 'title' && !f.slug ? { slug: slugify(e.target.value) } : {}),
      }))
    }
  }

  function toggleAmenity(a: string) {
    setForm(f => ({
      ...f,
      amenities: f.amenities.includes(a) ? f.amenities.filter(x => x !== a) : [...f.amenities, a],
    }))
  }

  async function handlePhotos(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []).slice(0, 5 - photos.length)
    if (!files.length) return
    const urls = files.map(f => URL.createObjectURL(f))
    setPhotos(p => [...p, ...files])
    setPhotoUrls(p => [...p, ...urls])
  }

  function removePhoto(i: number) {
    setPhotos(p => p.filter((_, idx) => idx !== i))
    setPhotoUrls(p => p.filter((_, idx) => idx !== i))
  }

  function validate() {
    if (step === 0) {
      if (!form.title.trim()) return 'Title is required'
      if (!form.property_type) return 'Property type is required'
      if (!form.community.trim()) return 'Community is required'
    }
    return ''
  }

  function next() {
    const err = validate()
    if (err) { setError(err); return }
    setError('')
    setStep(s => s + 1)
  }

  async function publish(status: 'draft' | 'live') {
    if (!user) return
    setSaving(true)
    setError('')
    try {
      // Upload photos
      let heroUrl: string | null = null
      const galleryUrls: string[] = []

      for (let i = 0; i < photos.length; i++) {
        const ext = photos[i].name.split('.').pop()
        const path = `${user.id}/${Date.now()}-${i}.${ext}`
        const { error: upErr } = await supabase.storage.from('agent-pages').upload(path, photos[i])
        if (upErr) throw upErr
        const { data: { publicUrl } } = supabase.storage.from('agent-pages').getPublicUrl(path)
        if (i === 0) heroUrl = publicUrl
        else galleryUrls.push(publicUrl)
      }

      // Get agent profile
      const { data: profile } = await supabase.from('profiles').select('id').eq('id', user.id).single()
      if (!profile) throw new Error('Profile not found')

      const price = form.asking_price_aed ? parseInt(form.asking_price_aed.replace(/,/g, '')) : null
      const sqft = form.built_up_sqft ? parseInt(form.built_up_sqft) : null
      const psqft = price && sqft ? Math.round(price / sqft) : null

      // Generate unique slug
      let slug = form.slug || slugify(form.title)
      if (!slug) slug = `property-${Date.now()}`

      const { error: insertErr } = await supabase.from('properties').insert({
        agent_id: user.id,
        slug,
        status,
        title: form.title,
        property_type: form.property_type,
        community: form.community || null,
        sub_community: form.sub_community || null,
        tower: form.tower || null,
        address_line: form.address_line || null,
        asking_price_aed: price,
        price_psqft_aed: psqft,
        show_price: form.show_price,
        bedrooms: form.bedrooms ? parseFloat(form.bedrooms) : null,
        bathrooms: form.bathrooms ? parseFloat(form.bathrooms) : null,
        built_up_sqft: sqft,
        floor: form.floor ? parseInt(form.floor) : null,
        view_desc: form.view_desc || null,
        furnishing: form.furnishing || null,
        parking_spaces: form.parking_spaces ? parseInt(form.parking_spaces) : null,
        service_charge_psqft: form.service_charge_psqft ? parseFloat(form.service_charge_psqft) : null,
        completion_status: form.completion_status || null,
        dld_permit_number: form.dld_permit_number || null,
        rera_disclosure: form.rera_disclosure,
        description_full: form.description_full || null,
        description_source: 'manual',
        amenities: form.amenities.length > 0 ? form.amenities : null,
        show_community_pricing: form.show_community_pricing,
        hero_photo_url: heroUrl,
        gallery_urls: galleryUrls.length > 0 ? galleryUrls : null,
        published_at: status === 'live' ? new Date().toISOString() : null,
      })

      if (insertErr) throw insertErr
      navigate('/properties')
    } catch (e: any) {
      setError(e.message || 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const inp = 'w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#c9a84c] transition-colors placeholder:text-gray-300'
  const lbl = 'block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide'

  const AMENITY_OPTIONS = [
    'Swimming pool', 'Gym', 'Concierge', 'Covered parking', 'Security', 'Kids play area',
    'BBQ area', 'Tennis court', 'Spa', 'Retail at podium', 'Direct mall access',
  ]

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Link to="/properties" className="hover:text-gray-700">Properties</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-gray-700 font-medium">New property</span>
        </div>
        {/* Step indicator */}
        <div className="flex items-center gap-1">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold transition-colors ${i < step ? 'bg-[#c9a84c] text-white' : i === step ? 'bg-[#1a1a1a] text-white' : 'bg-gray-100 text-gray-400'}`}>
                {i < step ? <Check className="h-3 w-3" /> : i + 1}
              </div>
              <span className={`text-xs ${i === step ? 'text-[#1a1a1a] font-medium' : 'text-gray-400'} hidden sm:inline`}>{s}</span>
              {i < STEPS.length - 1 && <div className="w-6 h-px bg-gray-200 mx-1" />}
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-8 py-10">
        {error && <div className="mb-5 bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>}

        {/* Step 0 — Basics */}
        {step === 0 && (
          <div className="space-y-5">
            <div>
              <h1 className="text-xl font-semibold text-[#1a1a1a] tracking-tight mb-1">Listing basics</h1>
              <p className="text-sm text-gray-400">Start with the key details buyers search for.</p>
            </div>

            <div>
              <label className={lbl}>Property title *</label>
              <input value={form.title} onChange={set('title')} required placeholder="e.g. 2-bed apartment with Burj Khalifa view · Burj Vista 1" className={inp} />
              <p className="text-xs text-gray-400 mt-1">This appears as the headline on your listing page.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Property type *</label>
                <select value={form.property_type} onChange={set('property_type')} className={inp}>
                  {['Apartment', 'Villa', 'Townhouse', 'Penthouse', 'Studio', 'Duplex', 'Office', 'Shop', 'Warehouse', 'Land'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Asking price (AED)</label>
                <input value={form.asking_price_aed} onChange={set('asking_price_aed')} placeholder="e.g. 3200000" className={inp} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Community *</label>
                <input value={form.community} onChange={set('community')} required placeholder="e.g. Downtown Dubai" className={inp} />
              </div>
              <div>
                <label className={lbl}>Sub-community / Tower</label>
                <input value={form.sub_community} onChange={set('sub_community')} placeholder="e.g. Burj Vista" className={inp} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={lbl}>Bedrooms</label>
                <select value={form.bedrooms} onChange={set('bedrooms')} className={inp}>
                  <option value="">—</option>
                  <option value="0">Studio</option>
                  {[1,2,3,4,5,6,7].map(n => <option key={n} value={n}>{n} BR</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Bathrooms</label>
                <select value={form.bathrooms} onChange={set('bathrooms')} className={inp}>
                  <option value="">—</option>
                  {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Size (sqft)</label>
                <input value={form.built_up_sqft} onChange={set('built_up_sqft')} placeholder="e.g. 1420" className={inp} />
              </div>
            </div>

            <div>
              <label className={lbl}>URL slug</label>
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:border-[#c9a84c] transition-colors">
                <span className="bg-gray-50 border-r border-gray-200 px-3 py-3 text-xs text-gray-400 shrink-0 whitespace-nowrap">yoursite/you/</span>
                <input value={form.slug} onChange={set('slug')} placeholder="burj-vista-2br-floor-38" className="flex-1 px-3 py-3 text-sm outline-none placeholder:text-gray-300" />
              </div>
            </div>
          </div>
        )}

        {/* Step 1 — Details */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h1 className="text-xl font-semibold text-[#1a1a1a] tracking-tight mb-1">Property details</h1>
              <p className="text-sm text-gray-400">More details help buyers make faster decisions.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Floor</label>
                <input value={form.floor} onChange={set('floor')} placeholder="e.g. 38" className={inp} />
              </div>
              <div>
                <label className={lbl}>View</label>
                <input value={form.view_desc} onChange={set('view_desc')} placeholder="e.g. Burj Khalifa + fountain" className={inp} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Furnishing</label>
                <select value={form.furnishing} onChange={set('furnishing')} className={inp}>
                  {['Unfurnished', 'Furnished', 'Semi-furnished'].map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Parking spaces</label>
                <input value={form.parking_spaces} onChange={set('parking_spaces')} placeholder="e.g. 2" className={inp} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Completion / Transfer status</label>
                <input value={form.completion_status} onChange={set('completion_status')} placeholder="e.g. Vacant on transfer" className={inp} />
              </div>
              <div>
                <label className={lbl}>Service charge (AED/sqft/yr)</label>
                <input value={form.service_charge_psqft} onChange={set('service_charge_psqft')} placeholder="e.g. 18" className={inp} />
              </div>
            </div>

            <div>
              <label className={lbl}>Description</label>
              <textarea value={form.description_full} onChange={set('description_full')} rows={5} placeholder="Describe the property — views, layout, key selling points, owner situation..." className={inp + ' resize-none'} />
            </div>

            <div>
              <label className={lbl}>Building amenities</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {AMENITY_OPTIONS.map(a => (
                  <label key={a} className="flex items-center gap-2 cursor-pointer group">
                    <div onClick={() => toggleAmenity(a)} className={`w-4 h-4 rounded flex-shrink-0 border flex items-center justify-center cursor-pointer transition-colors ${form.amenities.includes(a) ? 'bg-[#c9a84c] border-[#c9a84c]' : 'border-gray-300 group-hover:border-[#c9a84c]'}`}>
                      {form.amenities.includes(a) && <Check className="h-2.5 w-2.5 text-white" />}
                    </div>
                    <span className="text-sm text-gray-600" onClick={() => toggleAmenity(a)}>{a}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className={lbl}>DLD Permit number</label>
              <input value={form.dld_permit_number} onChange={set('dld_permit_number')} placeholder="e.g. 12345-2026" className={inp} />
            </div>

            <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-100">
              <input type="checkbox" id="show_price" checked={form.show_price} onChange={set('show_price')} className="w-4 h-4 accent-[#c9a84c]" />
              <label htmlFor="show_price" className="text-sm text-gray-700 cursor-pointer">Show price publicly — uncheck to show "Price on request"</label>
            </div>
          </div>
        )}

        {/* Step 2 — Photos & Publish */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h1 className="text-xl font-semibold text-[#1a1a1a] tracking-tight mb-1">Photos & publish</h1>
              <p className="text-sm text-gray-400">Add up to 5 photos. The first photo becomes the hero image.</p>
            </div>

            {/* Photo grid */}
            <div className="grid grid-cols-5 gap-2">
              {[0,1,2,3,4].map(i => (
                <div key={i} className={`aspect-square rounded-xl overflow-hidden relative ${i === 0 ? 'col-span-2 row-span-2' : ''}`}
                  style={i === 0 ? {gridColumn:'1/3', gridRow:'1/3', aspectRatio:'1'} : {}}>
                  {photoUrls[i] ? (
                    <div className="relative w-full h-full">
                      <img src={photoUrls[i]} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => removePhoto(i)} className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center hover:bg-black">
                        <X className="h-3 w-3 text-white" />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => fileRef.current?.click()} className="w-full h-full bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 hover:border-[#c9a84c] hover:bg-[#fdf8e9] transition-colors rounded-xl">
                      <Upload className="h-4 w-4 text-gray-300" />
                      {i === 0 && <span className="text-xs text-gray-300">Hero</span>}
                    </button>
                  )}
                </div>
              ))}
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotos} />
            <button onClick={() => fileRef.current?.click()} className="text-sm text-[#c9a84c] font-medium hover:underline">+ Add photos</button>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-100">
                <input type="checkbox" id="community_pricing" checked={form.show_community_pricing} onChange={set('show_community_pricing')} className="w-4 h-4 accent-[#c9a84c]" />
                <div>
                  <label htmlFor="community_pricing" className="text-sm font-medium text-gray-700 cursor-pointer">Show community market data</label>
                  <p className="text-xs text-gray-400 mt-0.5">Displays recent sold prices for this community on your listing page</p>
                </div>
              </div>
            </div>

            {/* Summary before publish */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-2">
              <div className="text-sm font-medium text-gray-700 mb-3">Listing summary</div>
              {[
                ['Title', form.title],
                ['Community', form.community],
                ['Type', form.property_type],
                ['Bedrooms', form.bedrooms === '0' ? 'Studio' : form.bedrooms ? `${form.bedrooms} BR` : '—'],
                ['Price', form.show_price && form.asking_price_aed ? `AED ${parseInt(form.asking_price_aed.replace(/,/g,'')).toLocaleString()}` : 'On request'],
                ['Photos', `${photos.length} uploaded`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-gray-400">{k}</span>
                  <span className="text-gray-700 font-medium">{v || '—'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className={`flex mt-8 ${step > 0 ? 'justify-between' : 'justify-end'}`}>
          {step > 0 && (
            <button onClick={() => { setError(''); setStep(s => s - 1) }} className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:border-gray-400 transition-colors">
              <ChevronLeft className="h-4 w-4" />Back
            </button>
          )}
          <div className="flex gap-3">
            {step < 2 ? (
              <button onClick={next} className="flex items-center gap-1.5 px-5 py-2.5 bg-[#1a1a1a] text-white rounded-lg text-sm font-medium hover:bg-black transition-colors">
                Next<ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <>
                <button onClick={() => publish('draft')} disabled={saving} className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-gray-400 transition-colors disabled:opacity-50">
                  {saving ? 'Saving…' : 'Save as draft'}
                </button>
                <button onClick={() => publish('live')} disabled={saving} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-[#1a1a1a] disabled:opacity-50 transition-colors" style={{background:'linear-gradient(135deg,#c9a84c,#b08f3a)'}}>
                  {saving ? 'Publishing…' : 'Publish listing'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
