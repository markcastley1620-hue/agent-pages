import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Eye, Users, ChevronRight, Circle } from 'lucide-react'
import Layout, { PageHeader } from '../components/Layout'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

interface Property {
  id: string
  title: string
  status: string
  slug: string
  price: number | null
  location: string | null
  created_at: string
  views?: number
  leads?: number
}

const statusColors: Record<string, string> = {
  live: '#2ab695',
  draft: '#c9a84c',
  archived: '#999',
}

const statusLabels: Record<string, string> = {
  live: 'Live',
  draft: 'Draft',
  archived: 'Archived',
}

function formatPrice(p: number | null) {
  if (!p) return '—'
  if (p >= 1_000_000) return `AED ${(p / 1_000_000).toFixed(1)}M`
  if (p >= 1_000) return `AED ${(p / 1_000).toFixed(0)}K`
  return `AED ${p.toLocaleString()}`
}

export default function Properties() {
  const { user } = useAuth()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase
      .from('properties')
      .select('*')
      .eq('agent_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setProperties(data ?? [])
        setLoading(false)
      })
  }, [user])

  return (
    <Layout>
      <div className="p-8">
        <PageHeader
          title="Properties"
          subtitle={`${properties.length} total · ${properties.filter(p => p.status === 'live').length} live`}
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

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : properties.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <div className="w-12 h-12 bg-gray-50 rounded-xl mx-auto mb-4 flex items-center justify-center">
              <Plus size={24} className="text-gray-300" />
            </div>
            <div className="text-sm font-medium text-[#1a1a1a] mb-1">No properties yet</div>
            <div className="text-xs text-gray-400 mb-6">Add your first property to get started</div>
            <Link
              to="/properties/new"
              className="inline-flex items-center gap-2 bg-[#1a1a1a] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-black transition-colors"
            >
              <Plus size={16} />
              Add property
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Property</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Price</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Views</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Leads</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {properties.map(prop => (
                  <tr key={prop.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-medium text-[#1a1a1a] text-sm">{prop.title}</div>
                      {prop.location && <div className="text-xs text-gray-400 mt-0.5">{prop.location}</div>}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <Circle size={6} fill={statusColors[prop.status] ?? '#999'} color="transparent" />
                        <span className="text-xs font-medium" style={{ color: statusColors[prop.status] ?? '#999' }}>
                          {statusLabels[prop.status] ?? prop.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">{formatPrice(prop.price)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Eye size={13} />
                        {prop.views ?? 0}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Users size={13} />
                        {prop.leads ?? 0}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        to={`/properties/${prop.id}`}
                        className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-[#1a1a1a] transition-colors"
                      >
                        Open <ChevronRight size={13} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  )
}
