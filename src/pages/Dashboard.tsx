import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Users, Plus, ExternalLink, TrendingUp, Eye } from 'lucide-react'
import Layout, { PageHeader } from '../components/Layout'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

interface Stats {
  properties: number
  live: number
  leads: number
  views: number
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<Stats>({ properties: 0, live: 0, leads: 0, views: 0 })
  const [profile, setProfile] = useState<{ first_name: string; slug: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.from('profiles').select('first_name, slug').eq('id', user.id).single(),
      supabase.from('properties').select('id, status', { count: 'exact' }).eq('agent_id', user.id),
      supabase.from('leads').select('id', { count: 'exact' }).eq('agent_id', user.id),
      supabase.from('page_views').select('id', { count: 'exact' }).eq('agent_id', user.id),
    ]).then(([p, props, leads, views]) => {
      setProfile(p.data)
      const allProps = props.data ?? []
      setStats({
        properties: allProps.length,
        live: allProps.filter(p => p.status === 'live').length,
        leads: leads.count ?? 0,
        views: views.count ?? 0,
      })
      setLoading(false)
    })
  }, [user])

  const statCards = [
    { label: 'Total properties', value: stats.properties, icon: Building2, color: '#c9a84c' },
    { label: 'Live listings', value: stats.live, icon: TrendingUp, color: '#2ab695' },
    { label: 'Total leads', value: stats.leads, icon: Users, color: '#c9a84c' },
    { label: 'Page views', value: stats.views, icon: Eye, color: '#2ab695' },
  ]

  return (
    <Layout>
      <div className="p-8">
        <PageHeader
          title={loading ? 'Dashboard' : `Welcome back${profile ? `, ${profile.first_name}` : ''}`}
          subtitle="Here's what's happening with your portfolio"
          action={
            <Link
              to="/properties/new"
              className="flex items-center gap-2 bg-[#1a1a1a] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-black transition-colors"
            >
              <Plus size={16} />
              Add property
            </Link>
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {statCards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
                  <Icon size={18} style={{ color }} />
                </div>
              </div>
              <div className="text-2xl font-semibold text-[#1a1a1a] tracking-tight">{loading ? '—' : value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-3 gap-4">
          <Link
            to="/properties/new"
            className="bg-white rounded-xl border border-gray-100 p-6 hover:border-[#c9a84c] transition-colors group"
          >
            <div className="w-10 h-10 bg-[#c9a84c]/10 rounded-lg flex items-center justify-center mb-4">
              <Plus size={20} className="text-[#c9a84c]" />
            </div>
            <div className="font-medium text-[#1a1a1a] text-sm mb-1">Add a property</div>
            <div className="text-xs text-gray-400">Create a new listing page with lead capture</div>
          </Link>

          <Link
            to="/leads"
            className="bg-white rounded-xl border border-gray-100 p-6 hover:border-[#2ab695] transition-colors group"
          >
            <div className="w-10 h-10 bg-[#2ab695]/10 rounded-lg flex items-center justify-center mb-4">
              <Users size={20} className="text-[#2ab695]" />
            </div>
            <div className="font-medium text-[#1a1a1a] text-sm mb-1">View leads</div>
            <div className="text-xs text-gray-400">{loading ? '…' : `${stats.leads} leads in your inbox`}</div>
          </Link>

          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center mb-4">
              <ExternalLink size={20} className="text-gray-400" />
            </div>
            <div className="font-medium text-[#1a1a1a] text-sm mb-1">Portfolio site</div>
            {profile?.slug ? (
              <a
                href={`/${profile.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#c9a84c] hover:underline"
              >
                /{profile.slug}
              </a>
            ) : (
              <div className="text-xs text-gray-400">
                {stats.live < 3 ? `Needs ${3 - stats.live} more live listing${3 - stats.live !== 1 ? 's' : ''}` : 'Ready to publish'}
              </div>
            )}
          </div>
        </div>

        {/* Portfolio lock notice */}
        {stats.live < 3 && (
          <div className="mt-6 bg-[#fdf8e9] border border-[#c9a84c]/20 rounded-xl p-5 flex items-start gap-4">
            <div className="w-8 h-8 bg-[#c9a84c]/20 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
              <Building2 size={16} className="text-[#c9a84c]" />
            </div>
            <div>
              <div className="text-sm font-medium text-[#1a1a1a] mb-1">Portfolio page locked</div>
              <div className="text-xs text-gray-500">
                Your public portfolio page will unlock when you have 3 live properties.
                You have {stats.live} live {stats.live === 1 ? 'listing' : 'listings'} — {3 - stats.live} more to go.
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
