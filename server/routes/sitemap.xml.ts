import { defineEventHandler, sendRedirect, type H3Event } from 'h3'

export default defineEventHandler((event: H3Event) => {
  return sendRedirect(event, '/sitemap-index.xml', 301)
})


