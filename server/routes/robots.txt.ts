import { defineEventHandler, setResponseHeader, type H3Event } from 'h3'

export default defineEventHandler((event: H3Event) => {
  const config = useRuntimeConfig(event)
  const isIndexFollow = Boolean(config.public.indexFollow)
  const siteUrl = String(config.public.siteUrl || 'https://2bet.com').replace(/\/+$/, '')

  setResponseHeader(event, 'content-type', 'text/plain; charset=utf-8')

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
