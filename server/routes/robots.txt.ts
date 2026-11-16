import { promises as fs } from 'node:fs'
import path from 'node:path'
import { defineEventHandler, setResponseHeader, type H3Event } from 'h3'

async function readCustomRobotsTxt(): Promise<string | null> {
  const candidates = [
    path.resolve(process.cwd(), 'robots.txt'),
    path.resolve(process.cwd(), 'public/robots.txt'),
    path.resolve(process.cwd(), '.output/public/robots.txt'),
  ]
  for (const candidate of candidates) {
    try {
      return await fs.readFile(candidate, 'utf8')
    } catch {
      // Ignore missing files and fall back to dynamic defaults
    }
  }
  return null
}

export default defineEventHandler(async (event: H3Event) => {
  const config = useRuntimeConfig(event)
  const isIndexFollow = Boolean(config.public.indexFollow)
  const siteUrl = String(config.public.siteUrl || 'https://2bet.com').replace(/\/+$/, '')

  setResponseHeader(event, 'content-type', 'text/plain; charset=utf-8')

  const customRobotsTxt = await readCustomRobotsTxt()
  if (customRobotsTxt !== null) {
    return customRobotsTxt
  }

  if (isIndexFollow) {
    return [
      'User-agent: *',
      'Disallow: /*?*preview=',
      'Disallow: /*?preview=',
      'Disallow: /*&preview=',
      'Allow: /',
      '',
      'User-agent: Googlebot',
      'Disallow: /*?*preview=',
      'Disallow: /*?preview=',
      'Disallow: /*&preview=',
      'Allow: /',
      '',
      `Sitemap: ${siteUrl}/sitemap-index.xml`,
      '',
    ].join('\n')
  }

  return [
    'User-agent: *',
    'Disallow: /',
    '',
    `Sitemap: ${siteUrl}/sitemap-index.xml`,
    '',
  ].join('\n')
})
