import { defineEventHandler, getRequestURL, setResponseHeader } from 'h3'

export default defineEventHandler((event) => {
  const url = getRequestURL(event)
  if (url.searchParams.get('preview') === '1' || url.searchParams.get('preview') === 'true') {
    setResponseHeader(event, 'X-Robots-Tag', 'noindex, nofollow, noarchive')
  }
})
