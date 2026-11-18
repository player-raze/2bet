import { promises as fs } from 'node:fs'
import path from 'node:path'
import { defineEventHandler, setResponseHeader, type H3Event } from 'h3'
import { resolveRuntimeSiteUrl } from '~/server/utils/siteUrl'

async function readCustomRobotsTxt(): Promise<string | null> {
  const cwd = path.resolve(process.cwd())
  const isOutputDir = cwd === path.resolve(cwd, '..', '.output')
  const isOutputServerDir = cwd === path.resolve(cwd, '../..', '.output', 'server')

  const candidates = isOutputServerDir
    ? [
        path.resolve(cwd, '../../robots.txt'),
        path.resolve(cwd, '../public/robots.txt'),
        path.resolve(cwd, '../../public/robots.txt'),
      ]
    : isOutputDir
      ? [
          path.resolve(cwd, '../robots.txt'),
          path.resolve(cwd, 'public/robots.txt'),
          path.resolve(cwd, '../public/robots.txt'),
        ]
      : [
          path.resolve(cwd, 'robots.txt'),
          path.resolve(cwd, '.output/public/robots.txt'),
          path.resolve(cwd, 'public/robots.txt'),
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
  const siteUrl = await resolveRuntimeSiteUrl(event)

  setResponseHeader(event, 'content-type', 'text/plain; charset=utf-8')
  setResponseHeader(event, 'cache-control', 'no-cache, max-age=0, must-revalidate')

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
