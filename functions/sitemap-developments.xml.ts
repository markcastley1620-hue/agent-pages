// Cloudflare Pages Function — sitemap for all live developments
// Route: GET /sitemap-developments.xml

interface Env {
  SUPABASE_URL?: string
  SUPABASE_ANON_KEY?: string
}

interface Development {
  id: string
  slug: string
  workspace_id: string
  updated_at: string
}

interface Profile {
  workspace_id: string
  slug: string
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const supabaseUrl = context.env.SUPABASE_URL ?? 'https://bwzrbneskvvddukivphk.supabase.co'
  const anonKey = context.env.SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3enJibmVza3Z2ZGR1a2l2cGhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5NDExNDksImV4cCI6MjA5NDUxNzE0OX0.cIBiipAFFiGqqP89sHxHg2RDbHKrrB5SxkCfcI7Tq8Y'

  const headers = {
    'apikey': anonKey,
    'Authorization': `Bearer ${anonKey}`,
    'Accept': 'application/json',
  }

  // Fetch all live developments
  const devRes = await fetch(
    `${supabaseUrl}/rest/v1/developments?status=eq.live&select=id,slug,workspace_id,updated_at`,
    { headers }
  )

  if (!devRes.ok) {
    return new Response('Error fetching developments', { status: 500 })
  }

  const devData = await devRes.json() as Development[]

  // Gather unique workspace IDs
  const workspaceIds = [...new Set(devData.map((d) => d.workspace_id))]

  // Fetch agent slugs for those workspaces
  const profileMap: Record<string, string> = {}
  if (workspaceIds.length > 0) {
    const ids = workspaceIds.map((id) => `"${id}"`).join(',')
    const profileRes = await fetch(
      `${supabaseUrl}/rest/v1/profiles?workspace_id=in.(${ids})&select=workspace_id,slug`,
      { headers }
    )
    if (profileRes.ok) {
      const profiles = await profileRes.json() as Profile[]
      for (const p of profiles) {
        profileMap[p.workspace_id] = p.slug
      }
    }
  }

  // Build XML
  const urls = devData
    .map((dev) => {
      const agentSlug = profileMap[dev.workspace_id]
      if (!agentSlug) return null
      const loc = `https://agentpages.io/${agentSlug}/${dev.slug}`
      const lastmod = dev.updated_at ? dev.updated_at.split('T')[0] : ''
      return `  <url>\n    <loc>${escapeXml(loc)}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}\n    <changefreq>weekly</changefreq>\n  </url>`
    })
    .filter(Boolean)
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
