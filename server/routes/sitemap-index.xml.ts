import { defineEventHandler, setResponseHeader, type H3Event } from 'h3'
import { generateSitemapIndexXml } from '~/server/utils/sitemap'
import { readMatchingGeneratedFile, resolveRuntimeSiteUrl } from '~/server/utils/siteUrl'

export default defineEventHandler(async (event: H3Event) => {
  const siteUrl = await resolveRuntimeSiteUrl(event)

  setResponseHeader(event, 'content-type', 'application/xml; charset=utf-8')
  setResponseHeader(event, 'cache-control', 'public, max-age=3600, s-maxage=14400')

  const generated = await readMatchingGeneratedFile('sitemap-index.xml', siteUrl)
  if (generated !== null) {
    return generated
  }

  return generateSitemapIndexXml(siteUrl)
})
