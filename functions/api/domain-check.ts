// Cloudflare Pages Function — domain availability via WHOIS over TCP
// Route: GET /api/domain-check?names=example.com,test.io

interface Env {}

// WHOIS servers per TLD
const WHOIS_SERVERS: Record<string, string> = {
  com: 'whois.verisign-grs.com',
  net: 'whois.verisign-grs.com',
  org: 'whois.pir.org',
  io:  'whois.nic.io',
  co:  'whois.nic.co',
  ae:  'whois.aeda.net.ae',
  properties: 'whois.nic.properties',
  homes: 'whois.nic.homes',
  estate: 'whois.nic.estate',
  realestate: 'whois.nic.realestate',
  realty: 'whois.nic.realty',
  casa: 'whois.nic.casa',
}

// Patterns that mean "not found" / available
const AVAIL_PATTERNS = [
  'no match for',
  'not found',
  'no data found',
  'no entries found',
  'domain not found',
  'status: available',
  'status: free',
  'no object found',
  'nothing found',
  'is available for',
]

async function whoisCheck(domain: string): Promise<{ domain: string; available: boolean; raw?: string }> {
  const parts = domain.toLowerCase().trim().split('.')
  const tld = parts.slice(1).join('.')  // handles .co.uk etc
  const singleTld = parts[parts.length - 1]
  const server = WHOIS_SERVERS[tld] || WHOIS_SERVERS[singleTld]

  if (!server) {
    // Fallback: DNS check for unsupported TLDs
    return dnsFallback(domain)
  }

  try {
    // @ts-ignore — Cloudflare Workers support connect()
    const socket = connect({ hostname: server, port: 43 })
    const writer = socket.writable.getWriter()
    const encoder = new TextEncoder()
    await writer.write(encoder.encode(domain + '\r\n'))
    await writer.close()

    const reader = socket.readable.getReader()
    const chunks: Uint8Array[] = []
    let totalBytes = 0
    while (totalBytes < 8192) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
      totalBytes += value.length
    }

    const decoder = new TextDecoder()
    const raw = chunks.map(c => decoder.decode(c, { stream: true })).join('')
    const lower = raw.toLowerCase()

    const available = AVAIL_PATTERNS.some(p => lower.includes(p))
    return { domain, available }
  } catch (e) {
    // If WHOIS fails, fall back to DNS
    return dnsFallback(domain)
  }
}

async function dnsFallback(domain: string): Promise<{ domain: string; available: boolean }> {
  try {
    const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=NS`)
    const data: any = await res.json()
    return { domain, available: data.Status === 3 }
  } catch {
    return { domain, available: false } // assume taken on error
  }
}

export const onRequestGet: PagesFunction<Env> = async ({ request }) => {
  const url = new URL(request.url)
  const names = url.searchParams.get('names')

  if (!names) {
    return Response.json({ error: 'Missing ?names= parameter' }, { status: 400 })
  }

  const domains = names.split(',').map(d => d.trim().toLowerCase()).filter(Boolean).slice(0, 10)
  const results = await Promise.all(domains.map(whoisCheck))

  return Response.json({
    success: true,
    results: results.map(r => ({ domain: r.domain, available: r.available })),
  }, {
    headers: { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=300' },
  })
}
