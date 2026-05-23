import { useEffect, useState } from 'react'
import { X, Mail, Phone, Calendar, Building2 } from 'lucide-react'
import Layout, { PageHeader } from '../components/Layout'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

interface Lead {
  id: string
  name: string
  email: string
  phone: string | null
  message: string | null
  property_id: string | null
  status: string
  created_at: string
  properties?: { title: string } | null
}

const statusColors: Record<string, string> = {
  new: '#c9a84c',
  contacted: '#2ab695',
  qualified: '#1a1a1a',
  closed: '#999',
}

export default function Leads() {
  const { user } = useAuth()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [selected, setSelected] = useState<Lead | null>(null)

  useEffect(() => {
    if (!user) return
    supabase
      .from('leads')
      .select('*, properties(title)')
      .eq('agent_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setLeads(data ?? [])
        setLoading(false)
      })
  }, [user])

  async function updateStatus(leadId: string, status: string) {
    await supabase.from('leads').update({ status }).eq('id', leadId)
    setLeads(l => l.map(lead => lead.id === leadId ? { ...lead, status } : lead))
    if (selected?.id === leadId) setSelected(s => s ? { ...s, status } : s)
  }

  const filtered = filter === 'all' ? leads : leads.filter(l => l.status === filter)

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <Layout>
      <div className="p-8">
        <PageHeader title="Leads" subtitle={`${leads.length} total leads`} />

        {/* Filters */}
        <div className="flex items-center gap-2 mb-6">
          {['all', 'new', 'contacted', 'qualified', 'closed'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                filter === f ? 'bg-[#1a1a1a] text-white' : 'bg-white border border-gray-200 text-gray-500 hover:text-[#1a1a1a]'
              }`}
            >
              {f === 'all' ? `All (${leads.length})` : `${f.charAt(0).toUpperCase() + f.slice(1)} (${leads.filter(l => l.status === f).length})`}
            </button>
          ))}
        </div>

        <div className="flex gap-5">
          {/* Lead list */}
          <div className="flex-1 bg-white rounded-xl border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center text-sm text-gray-400">No leads found</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {filtered.map(lead => (
                  <button
                    key={lead.id}
                    onClick={() => setSelected(lead)}
                    className={`w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors ${selected?.id === lead.id ? 'bg-[#fdf8e9]' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm font-medium text-[#1a1a1a]">{lead.name}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{lead.email}</div>
                        {lead.properties?.title && (
                          <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                            <Building2 size={11} />
                            {lead.properties.title}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div
                          className="text-xs font-medium capitalize"
                          style={{ color: statusColors[lead.status] ?? '#999' }}
                        >
                          {lead.status}
                        </div>
                        <div className="text-xs text-gray-300 mt-0.5">{formatDate(lead.created_at)}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Side drawer */}
          {selected && (
            <div className="w-80 bg-white rounded-xl border border-gray-100 p-5 self-start sticky top-6">
              <div className="flex items-center justify-between mb-5">
                <div className="text-sm font-semibold text-[#1a1a1a]">{selected.name}</div>
                <button onClick={() => setSelected(null)} className="text-gray-300 hover:text-gray-500 transition-colors">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3 mb-5">
                <a href={`mailto:${selected.email}`} className="flex items-center gap-2.5 text-sm text-gray-500 hover:text-[#1a1a1a] transition-colors">
                  <Mail size={14} className="text-gray-300" />
                  {selected.email}
                </a>
                {selected.phone && (
                  <a href={`tel:${selected.phone}`} className="flex items-center gap-2.5 text-sm text-gray-500 hover:text-[#1a1a1a] transition-colors">
                    <Phone size={14} className="text-gray-300" />
                    {selected.phone}
                  </a>
                )}
                <div className="flex items-center gap-2.5 text-xs text-gray-400">
                  <Calendar size={14} className="text-gray-300" />
                  {formatDate(selected.created_at)}
                </div>
                {selected.properties?.title && (
                  <div className="flex items-center gap-2.5 text-xs text-gray-400">
                    <Building2 size={14} className="text-gray-300" />
                    {selected.properties.title}
                  </div>
                )}
              </div>

              {selected.message && (
                <div className="mb-5">
                  <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Message</div>
                  <p className="text-sm text-gray-500 leading-relaxed bg-gray-50 rounded-lg p-3">{selected.message}</p>
                </div>
              )}

              <div>
                <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Status</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {['new', 'contacted', 'qualified', 'closed'].map(s => (
                    <button
                      key={s}
                      onClick={() => updateStatus(selected.id, s)}
                      className={`py-2 rounded-lg text-xs font-medium capitalize transition-colors ${
                        selected.status === s
                          ? 'bg-[#1a1a1a] text-white'
                          : 'border border-gray-200 text-gray-400 hover:text-[#1a1a1a] hover:border-gray-300'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
