import { defineEventHandler, setResponseHeader, type H3Event } from 'h3'
import { bloggeristOrigin } from '~/server/utils/bloggerist'

export default defineEventHandler(async (event: H3Event) => {
  setResponseHeader(event, 'content-type', 'application/xml; charset=utf-8')
  setResponseHeader(event, 'cache-control', 'public, max-age=3600, s-maxage=14400')

  try {
    const origin = bloggeristOrigin(event)
    const xml = await $fetch<string>(`${origin}/sitemap-blog.php`, {
      responseType: 'text',
      timeout: 8000,
      retry: 0,
    })
    return xml
  } catch {
    // Graceful fallback if Bloggerist PHP backend is not yet started or offline
    return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n</urlset>\n'
  }
})
