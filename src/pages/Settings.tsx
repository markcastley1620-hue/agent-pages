import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import Layout, { PageHeader } from '../components/Layout'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

export default function Settings() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    company: '',
    slug: '',
  })

  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
      if (data) {
        setForm({
          first_name: data.first_name ?? '',
          last_name: data.last_name ?? '',
          phone: data.phone ?? '',
          company: data.company ?? '',
          slug: data.slug ?? '',
        })
      }
      setLoading(false)
    })
  }, [user])

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSave() {
    if (!user) return
    setSaving(true)
    await supabase.from('profiles').update({
      first_name: form.first_name,
      last_name: form.last_name,
      phone: form.phone || null,
      company: form.company || null,
      slug: form.slug,
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
      <div className="p-8 max-w-xl">
        <PageHeader title="Settings" subtitle="Manage your profile and account" />

        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">Profile</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">First name</label>
                <input value={form.first_name} onChange={set('first_name')} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#c9a84c] transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Last name</label>
                <input value={form.last_name} onChange={set('last_name')} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#c9a84c] transition-colors" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Email</label>
              <div className="w-full border border-gray-100 rounded-lg px-4 py-3 text-sm text-gray-400 bg-gray-50">
                {user?.email}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Phone</label>
              <input value={form.phone} onChange={set('phone')} placeholder="+971 50 000 0000" className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#c9a84c] transition-colors placeholder:text-gray-300" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Company / Brokerage</label>
              <input value={form.company} onChange={set('company')} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#c9a84c] transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Portfolio slug</label>
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:border-[#c9a84c] transition-colors">
                <span className="bg-gray-50 border-r border-gray-200 px-3 py-3 text-xs text-gray-400 shrink-0">agentpages.io/</span>
                <input value={form.slug} onChange={set('slug')} className="flex-1 px-3 py-3 text-sm outline-none" />
              </div>
            </div>
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
