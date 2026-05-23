import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) { setError(error.message); return }
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left panel */}
      <div className="flex-1 flex flex-col justify-center px-12 max-w-md mx-auto">
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-6 h-6 bg-[#c9a84c] rounded" />
            <span className="font-semibold text-[#1a1a1a] text-sm tracking-tight">Agent Pages</span>
          </div>
          <h1 className="text-2xl font-semibold text-[#1a1a1a] tracking-tight mb-1">Welcome back</h1>
          <p className="text-sm text-gray-400">Sign in to your agent workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-[#1a1a1a] outline-none focus:border-[#c9a84c] transition-colors placeholder:text-gray-300"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-[#1a1a1a] outline-none focus:border-[#c9a84c] transition-colors placeholder:text-gray-300"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1a1a1a] text-white rounded-lg py-3 text-sm font-medium hover:bg-black transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-sm text-gray-400 mt-6 text-center">
          No account?{' '}
          <Link to="/signup" className="text-[#c9a84c] hover:underline font-medium">Create one</Link>
        </p>
      </div>

      {/* Right panel */}
      <div className="hidden lg:flex flex-1 bg-[#1a1a1a] items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#c9a84c] rounded-xl mx-auto mb-6 flex items-center justify-center">
            <span className="text-white text-2xl font-bold">AP</span>
          </div>
          <p className="text-white/60 text-sm max-w-xs">
            Your professional property portfolio. Built to win listings and capture leads.
          </p>
        </div>
      </div>
    </div>
  )
}
