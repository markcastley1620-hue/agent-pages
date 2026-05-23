import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Lock, Globe, Check } from 'lucide-react'
import Layout, { PageHeader } from '../components/Layout'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

export default function PortfolioEdit() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<{
    first_name: string
    last_name: string
    slug: string
    bio: string | null
    phone: string | null
    portfolio_published: boolean
  } | null>(null)
  const [liveCount, setLiveCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [form, setForm] = useState({ bio: '', phone: '', portfolio_published: false })

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('properties').select('id', { count: 'exact' }).eq('agent_id', user.id).eq('status', 'live'),
    ]).then(([p, props]) => {
      setProfile(p.data)
      setLiveCount(props.count ?? 0)
      if (p.data) {
        setForm({
          bio: p.data.bio ?? '',
          phone: p.data.phone ?? '',
          portfolio_published: p.data.portfolio_published ?? false,
        })
      }
      setLoading(false)
    })
  }, [user])

  const isLocked = liveCount < 3

  async function handleSave() {
    if (!user) return
    setSaving(true)
    await supabase.from('profiles').update({
      bio: form.bio || null,
      phone: form.phone || null,
      portfolio_published: isLocked ? false : form.portfolio_published,
    }).eq('id', user.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-24">
          <div className="w-6 h-6 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-8 max-w-2xl">
        <PageHeader title="Portfolio page" subtitle="Your public agent page" />

        {/* Lock notice */}
        {isLocked && (
          <div className="bg-[#fdf8e9] border border-[#c9a84c]/20 rounded-xl p-5 flex items-start gap-4 mb-6">
            <div className="w-8 h-8 bg-[#c9a84c]/20 rounded-lg flex items-center justify-center shrink-0">
              <Lock size={15} className="text-[#c9a84c]" />
            </div>
            <div>
              <div className="text-sm font-medium text-[#1a1a1a] mb-1">Portfolio locked</div>
              <div className="text-xs text-gray-500">
                You need at least 3 live properties to publish your portfolio.
                You currently have {liveCount} — {3 - liveCount} more needed.
              </div>
              <Link to="/properties/new" className="text-xs text-[#c9a84c] hover:underline mt-2 inline-block">
                Add a property →
              </Link>
            </div>
          </div>
        )}

        <div className="space-y-5">
          {/* Profile info */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">Profile</div>
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1">Name</div>
              <div className="text-sm text-[#1a1a1a]">{profile?.first_name} {profile?.last_name}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1">Portfolio URL</div>
              <div className="text-sm text-gray-500">/{profile?.slug}</div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Bio</label>
              <textarea
                value={form.bio}
                onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                rows={3}
                placeholder="Short bio shown on your portfolio page…"
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#c9a84c] transition-colors resize-none placeholder:text-gray-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Phone</label>
              <input
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+971 50 000 0000"
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#c9a84c] transition-colors placeholder:text-gray-300"
              />
            </div>
          </div>

          {/* Publish toggle */}
          <div className={`bg-white rounded-xl border border-gray-100 p-6 ${isLocked ? 'opacity-50 pointer-events-none' : ''}`}>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.portfolio_published}
                onChange={e => setForm(f => ({ ...f, portfolio_published: e.target.checked }))}
                disabled={isLocked}
                className="mt-0.5 accent-[#c9a84c]"
              />
              <div>
                <div className="flex items-center gap-2">
                  <Globe size={15} className="text-[#2ab695]" />
                  <div className="text-sm font-medium text-[#1a1a1a]">Publish portfolio page</div>
                </div>
                <div className="text-xs text-gray-400 mt-0.5">Make your public portfolio page visible to visitors</div>
              </div>
            </label>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-[#1a1a1a] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-black transition-colors disabled:opacity-40"
            >
              {saved ? <><Check size={15} /> Saved</> : saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
