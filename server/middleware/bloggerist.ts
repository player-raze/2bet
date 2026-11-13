export default defineEventHandler((event) => {
  let path = getRequestURL(event).pathname
  try { path = decodeURIComponent(path) } catch { /* Invalid paths cannot expose source. */ }
  if (/^\/bloggerist(?:\/|$)/i.test(path)) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }
})
