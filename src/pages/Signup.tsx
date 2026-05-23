import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Signup() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    slug: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))
  }

  function slugify(name: string) {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    })
    if (authError) { setError(authError.message); setLoading(false); return }

    const userId = authData.user?.id
    if (!userId) { setError('Account created but user ID missing.'); setLoading(false); return }

    const slug = form.slug || slugify(`${form.firstName} ${form.lastName}`)

    // Create profile
    const { error: profileError } = await supabase.from('profiles').insert({
      id: userId,
      first_name: form.firstName,
      last_name: form.lastName,
      email: form.email,
      slug,
    })
    if (profileError) { setError(profileError.message); setLoading(false); return }

    // Create entitlement — pro trial 14 days
    const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    await supabase.from('entitlements').insert({
      agent_id: userId,
      plan: 'pro_trial',
      trial_ends_at: trialEnd,
      active: true,
    })

    setLoading(false)
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-white flex">
      <div className="flex-1 flex flex-col justify-center px-12 max-w-md mx-auto">
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-6 h-6 bg-[#c9a84c] rounded" />
            <span className="font-semibold text-[#1a1a1a] text-sm tracking-tight">Agent Pages</span>
          </div>
          <h1 className="text-2xl font-semibold text-[#1a1a1a] tracking-tight mb-1">Create your workspace</h1>
          <p className="text-sm text-gray-400">14-day Pro trial · No credit card required</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">First name</label>
              <input
                value={form.firstName}
                onChange={set('firstName')}
                required
                placeholder="James"
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#c9a84c] transition-colors placeholder:text-gray-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Last name</label>
              <input
                value={form.lastName}
                onChange={set('lastName')}
                required
                placeholder="Wilson"
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#c9a84c] transition-colors placeholder:text-gray-300"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={set('email')}
              required
              placeholder="you@example.com"
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#c9a84c] transition-colors placeholder:text-gray-300"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={set('password')}
              required
              minLength={8}
              placeholder="Min 8 characters"
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#c9a84c] transition-colors placeholder:text-gray-300"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
              Portfolio URL slug <span className="normal-case font-normal text-gray-300">(optional)</span>
            </label>
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:border-[#c9a84c] transition-colors">
              <span className="bg-gray-50 border-r border-gray-200 px-3 py-3 text-xs text-gray-400 shrink-0">agentpages.io/</span>
              <input
                value={form.slug}
                onChange={set('slug')}
                placeholder="james-wilson"
                className="flex-1 px-3 py-3 text-sm outline-none placeholder:text-gray-300"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1a1a1a] text-white rounded-lg py-3 text-sm font-medium hover:bg-black transition-colors disabled:opacity-50 mt-2"
          >
            {loading ? 'Creating workspace…' : 'Create workspace'}
          </button>
        </form>

        <p className="text-sm text-gray-400 mt-6 text-center">
          Have an account?{' '}
          <Link to="/login" className="text-[#c9a84c] hover:underline font-medium">Sign in</Link>
        </p>
      </div>

      <div className="hidden lg:flex flex-1 bg-[#1a1a1a] items-center justify-center">
        <div className="text-center max-w-xs">
          <div className="w-16 h-16 bg-[#c9a84c] rounded-xl mx-auto mb-6 flex items-center justify-center">
            <span className="text-white text-2xl font-bold">AP</span>
          </div>
          <p className="text-white/60 text-sm">
            Professional property pages for serious agents. Your portfolio, your brand.
          </p>
          <div className="mt-8 space-y-2 text-left">
            {['Unlimited property pages', 'Lead capture on every listing', 'Public portfolio site', 'Analytics dashboard'].map(f => (
              <div key={f} className="flex items-center gap-2 text-white/50 text-xs">
                <div className="w-1 h-1 bg-[#c9a84c] rounded-full" />
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
