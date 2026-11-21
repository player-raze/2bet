import { promises as fs } from 'node:fs'
import path from 'node:path'
import { getHeader, readBody, sendRedirect, setHeader, setResponseStatus, type H3Event } from 'h3'
import { asRecord, isPublishedBlog, normalizeBlogPost, sanitizeBlogHtml } from '../../utils/blog-content'
import { normalizeGoogleAnalyticsId, normalizeGoogleTagId } from '../../utils/googleTracking'
import type { BlogArticle, BlogCategory, BlogListResponse } from '../../types/blog'

export { normalizeGoogleAnalyticsId, normalizeGoogleTagId }

export interface PlaynowClickResult {
  ok: boolean
  totalClicks: number
  locationClicks: number
  forwardedTo?: string
}

export interface BloggeristSeoSettings {
  googleAnalyticsId: string
  googleTagId: string
  raw: Record<string, unknown>
}

const SEO_SETTINGS_CACHE_TTL_MS = 5000
const seoSettingsCache = new Map<string, { value: BloggeristSeoSettings; expiresAt: number }>()
const seoSettingsInFlight = new Map<string, Promise<BloggeristSeoSettings>>()

export function clearBloggeristSeoSettingsCache(): void {
  seoSettingsCache.clear()
  seoSettingsInFlight.clear()
}

export async function readBloggeristSeoSettings(event: H3Event): Promise<BloggeristSeoSettings> {
  let origin = ''
  try {
    origin = bloggeristOrigin(event)
  } catch {
    return { googleAnalyticsId: '', googleTagId: '', raw: {} }
  }

  const now = Date.now()
  const cached = seoSettingsCache.get(origin)
  if (cached && cached.expiresAt > now) {
    return cached.value
  }

  const pending = seoSettingsInFlight.get(origin)
  if (pending) {
    return pending
  }

  const task = (async (): Promise<BloggeristSeoSettings> => {
    try {
      const response = await fetch(`${origin}/api/settings/seo.php`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(2500),
      })
      if (!response.ok) {
        const empty: BloggeristSeoSettings = { googleAnalyticsId: '', googleTagId: '', raw: {} }
        seoSettingsCache.set(origin, { value: empty, expiresAt: Date.now() + SEO_SETTINGS_CACHE_TTL_MS })
        return empty
      }

      const json = await response.json().catch(() => null)
      const data = asRecord(json)
      const settings = asRecord(data.settings)
      const googleAnalyticsId = data.ok === true
        ? normalizeGoogleAnalyticsId(settings.google_analytics_id)
        : ''
      const googleTagId = data.ok === true
        ? (
            [
              settings.google_tag_id,
              settings.google_tag,
              settings.google_tag_manager_id,
              settings.gtm_id,
            ]
              .map(normalizeGoogleTagId)
              .find(Boolean) || ''
          )
        : ''
      const result: BloggeristSeoSettings = {
        googleAnalyticsId,
        googleTagId,
        raw: data.ok === true ? settings : {},
      }
      seoSettingsCache.set(origin, { value: result, expiresAt: Date.now() + SEO_SETTINGS_CACHE_TTL_MS })
      return result
    } catch {
      const empty: BloggeristSeoSettings = { googleAnalyticsId: '', googleTagId: '', raw: {} }
      seoSettingsCache.set(origin, { value: empty, expiresAt: Date.now() + SEO_SETTINGS_CACHE_TTL_MS })
      return empty
    } finally {
      seoSettingsInFlight.delete(origin)
    }
  })()

  seoSettingsInFlight.set(origin, task)
  return task
}

function cleanClickText(value: unknown, maxLength: number): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, maxLength)
}

function extractClientIp(event: H3Event): string {
  const candidates = [
    getHeader(event, 'cf-connecting-ip'),
    getHeader(event, 'x-real-ip'),
    getHeader(event, 'x-forwarded-for'),
    event.node?.req?.socket?.remoteAddress,
  ]
  for (const raw of candidates) {
    if (!raw) continue
    const first = raw.split(',')[0]?.trim().replace(/^::ffff:/, '') || ''
    if (first && first !== 'unknown') {
      return first
    }
  }
  return '127.0.0.1'
}

export function normalizePlaynowClickPayload(
  rawPayload: Record<string, unknown>,
  fallbackReferer = '',
): Record<string, unknown> {
  const pageUrl = cleanClickText(rawPayload.pageUrl, 300)
  let parsedPath = ''
  if (pageUrl) {
    try {
      parsedPath = new URL(pageUrl).pathname
    } catch {
      parsedPath = pageUrl.split(/[?#]/)[0] || ''
    }
  }
  const pagePath = cleanClickText(rawPayload.pagePath, 180)
    || cleanClickText(parsedPath || fallbackReferer || '/', 180)
  const pageTitle = cleanClickText(rawPayload.pageTitle, 180)
  const referrer = cleanClickText(rawPayload.referrer, 300)
  const targetUrl = cleanClickText(rawPayload.targetUrl, 300)
  const buttonText = cleanClickText(rawPayload.buttonText, 120)
  const buttonClass = cleanClickText(rawPayload.buttonClass, 220)
  const buttonId = cleanClickText(rawPayload.buttonId, 120)
  const buttonName = cleanClickText(rawPayload.buttonName, 120)
  const buttonTag = cleanClickText(rawPayload.buttonTag, 40)
  const section = cleanClickText(rawPayload.section, 140)
  const selector = cleanClickText(rawPayload.selector, 220)
  const location = cleanClickText(rawPayload.location, 220)
    || cleanClickText(`${pagePath} | ${section || 'page'} | ${buttonText || 'playnow-link'}`, 220)

  const xRaw = rawPayload.x
  const yRaw = rawPayload.y
  const x = typeof xRaw === 'number' && Number.isFinite(xRaw) ? Math.round(xRaw) : null
  const y = typeof yRaw === 'number' && Number.isFinite(yRaw) ? Math.round(yRaw) : null

  return {
    pageUrl,
    pagePath,
    pageTitle,
    referrer,
    targetUrl,
    buttonText,
    buttonClass,
    buttonId,
    buttonName,
    buttonTag,
    section,
    selector,
    location,
    x,
    y,
  }
}

let localPersistQueue: Promise<unknown> = Promise.resolve()

async function persistPlaynowClickLocally(
  payload: Record<string, unknown>,
  clientIp: string,
  userAgent: string,
): Promise<PlaynowClickResult> {
  const run = async (): Promise<PlaynowClickResult> => {
    const storageDir = path.resolve(process.cwd(), 'data/bloggerist')
    const filePath = path.resolve(storageDir, 'playnow-clicks.json')
    await fs.mkdir(storageDir, { recursive: true })

    let data: Record<string, any> = {}
    try {
      const raw = await fs.readFile(filePath, 'utf8')
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        data = parsed
      }
    } catch {
      data = {}
    }

    const nowIso = new Date().toISOString()
    const buttonText = String(payload.buttonText || '')
    const buttonId = String(payload.buttonId || '')
    const buttonKey = buttonText || (buttonId ? `#${buttonId}` : 'playnow-link')
    const pagePath = String(payload.pagePath || '/')
    const targetUrl = String(payload.targetUrl || '')
    const location = String(payload.location || `${pagePath} | page | ${buttonKey}`)

    data.totalClicks = Number(data.totalClicks || 0) + 1
    data.updatedAt = nowIso
    data.byLocation = data.byLocation && typeof data.byLocation === 'object' ? data.byLocation : {}
    data.byIp = data.byIp && typeof data.byIp === 'object' ? data.byIp : {}
    data.byPage = data.byPage && typeof data.byPage === 'object' ? data.byPage : {}
    data.byButton = data.byButton && typeof data.byButton === 'object' ? data.byButton : {}
    data.byTarget = data.byTarget && typeof data.byTarget === 'object' ? data.byTarget : {}
    data.recent = Array.isArray(data.recent) ? data.recent : []

    data.byLocation[location] = Number(data.byLocation[location] || 0) + 1
    data.byIp[clientIp] = Number(data.byIp[clientIp] || 0) + 1
    data.byPage[pagePath] = Number(data.byPage[pagePath] || 0) + 1
    data.byButton[buttonKey] = Number(data.byButton[buttonKey] || 0) + 1
    data.byTarget[targetUrl] = Number(data.byTarget[targetUrl] || 0) + 1

    data.recent.push({
      time: nowIso,
      timestamp: Math.floor(Date.now() / 1000),
      ip: clientIp,
      ...payload,
      buttonKey,
      userAgent: cleanClickText(userAgent, 300),
    })
    if (data.recent.length > 2000) {
      data.recent = data.recent.slice(-2000)
    }

    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8')
    return {
      ok: true,
      totalClicks: data.totalClicks,
      locationClicks: data.byLocation[location],
      forwardedTo: 'local-fallback',
    }
  }

  const next = localPersistQueue.then(run, run)
  localPersistQueue = next.catch(() => {})
  return next
}

export function bloggeristOrigin(event: H3Event): string {
  const configured = String(useRuntimeConfig(event).bloggeristUrl || '').replace(/\/+$/, '')
  try {
    const url = new URL(configured)
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error()
    return configured
  } catch { throw createError({ statusCode: 503, statusMessage: 'Blog service unavailable' }) }
}

async function readBloggerist(event: H3Event, path: string, query: Record<string, string | number> = {}): Promise<Record<string, any>> {
  try {
    const result = await $fetch<unknown>(`${bloggeristOrigin(event)}/api/${path}`, { query, timeout: 8000, retry: 0 })
    const data = asRecord(result)
    if (data.ok !== true) throw new Error('Invalid blog response')
    return data
  } catch (error) {
    if (Number(asRecord(error).statusCode ?? asRecord(error).status) === 404 && path === 'blog.php') {
      throw createError({ statusCode: 404, statusMessage: 'Article not found' })
    }
    throw createError({ statusCode: 503, statusMessage: 'Blog service unavailable' })
  }
}

export async function readBlogList(event: H3Event, page: number, count: number, category: string, preview = false): Promise<BlogListResponse> {
  const origin = bloggeristOrigin(event)
  const [data, taxonomy] = await Promise.all([
    readBloggerist(event, 'blog-post-list.php', { page, count, ...(category ? { category } : {}), ...(preview ? { preview: '1' } : {}) }),
    readBloggerist(event, 'blog-category-list.php'),
  ])
  if (!Array.isArray(data.blogs) || !Array.isArray(taxonomy.categories)) {
    throw createError({ statusCode: 503, statusMessage: 'Blog service unavailable' })
  }
  const pagination = asRecord(data.pagination)
  const total = Math.max(0, Number(pagination.total) || 0)
  const categories: BlogCategory[] = taxonomy.categories.map((value: unknown) => {
    const item = asRecord(value)
    return { id: String(item.id ?? ''), name: String(item.name || ''), slug: String(item.slug || ''), postCount: Math.max(0, Number(item.postCount) || 0), parent_name: item.parent_name || null }
  })
  const blogs = data.blogs
    .filter((post: unknown) => preview || isPublishedBlog(post))
    .map((post: unknown) => normalizeBlogPost(post, origin))
    .filter((post: { slug: string; status?: string }) => post.slug && (preview || post.status !== 'draft'))

  return {
    ok: true,
    blogs,
    categories,
    pagination: { page: Number(pagination.page) || page, count, total, totalPages: Math.max(1, Number(pagination.totalPages) || Math.ceil(total / count)), category: category || null },
  }
}

export async function readBlogArticle(event: H3Event, slug: string, preview = false): Promise<BlogArticle> {
  const data = await readBloggerist(event, 'blog.php', { slug, ...(preview ? { preview: '1' } : {}) })
  if (!data.blog || (!preview && !isPublishedBlog(data.blog))) throw createError({ statusCode: 404, statusMessage: 'Article not found' })
  const origin = bloggeristOrigin(event)
  const post = normalizeBlogPost(data.blog, origin)
  if (!preview && post.status === 'draft') throw createError({ statusCode: 404, statusMessage: 'Article not found' })
  return {
    ...post,
    contentHtml: sanitizeBlogHtml(String(data.blog.content_html || ''), origin),
    seoTitle: typeof data.blog.seoTitle === 'string' && data.blog.seoTitle ? data.blog.seoTitle : post.title,
    seoDescription: typeof data.blog.seoDescription === 'string' && data.blog.seoDescription ? data.blog.seoDescription : post.excerpt,
  }
}

export async function recordPlaynowClick(
  event: H3Event,
  rawPayload: Record<string, unknown>,
): Promise<PlaynowClickResult> {
  const refererHeader = getHeader(event, 'referer') || ''
  const userAgentHeader = getHeader(event, 'user-agent') || ''
  const clientIp = extractClientIp(event)
  const payload = normalizePlaynowClickPayload(rawPayload, refererHeader)

  let origin = ''
  try {
    origin = bloggeristOrigin(event)
  } catch {
    origin = ''
  }

  if (origin) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Forwarded-For': clientIp,
      'X-Real-IP': clientIp,
    }
    if (userAgentHeader) {
      headers['User-Agent'] = userAgentHeader
    }
    if (refererHeader) {
      headers.Referer = refererHeader
    }

    const targets = [`${origin}/api/playnow-tracker`, `${origin}/api/playnow-click.php`]
    const serializedBody = JSON.stringify(payload)

    for (const target of targets) {
      try {
        const response = await fetch(target, {
          method: 'POST',
          headers,
          body: serializedBody,
          signal: AbortSignal.timeout(4000),
        })
        if (!response.ok) continue
        const data = await response.json().catch(() => null)
        if (data && typeof data === 'object' && data.ok === true) {
          return {
            ok: true,
            totalClicks: Number(data.totalClicks || 0),
            locationClicks: Number(data.locationClicks || 0),
            forwardedTo: target,
          }
        }
      } catch {
        // Try the next Bloggerist endpoint or fall back to local storage.
      }
    }
  }

  return persistPlaynowClickLocally(payload, clientIp, userAgentHeader)
}

function parsePlaynowRequestBody(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    if (!trimmed) return {}
    try {
      const parsed = JSON.parse(trimmed)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>
      }
    } catch {
      return Object.fromEntries(new URLSearchParams(trimmed))
    }
  }
  return {}
}

export async function handlePlaynowTrackerRequest(event: H3Event) {
  setHeader(event, 'Cache-Control', 'no-store, max-age=0')
  setHeader(event, 'Access-Control-Allow-Origin', '*')
  setHeader(event, 'Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  setHeader(event, 'Access-Control-Allow-Headers', 'Content-Type, Accept, X-Requested-With')

  const method = (event.method || event.node?.req?.method || 'GET').toUpperCase()
  if (method === 'OPTIONS') {
    setResponseStatus(event, 204)
    return null
  }

  if (method === 'GET') {
    let origin = ''
    try {
      origin = bloggeristOrigin(event)
    } catch {
      origin = ''
    }
    const accept = getHeader(event, 'accept') || ''
    if (origin && accept.includes('text/html')) {
      return sendRedirect(event, `${origin}/admin/playnow-tracker.php`, 302)
    }
    return {
      ok: true,
      endpoint: origin ? `${origin}/api/playnow-tracker` : '/api/playnow-tracker',
    }
  }

  if (method !== 'POST') {
    setResponseStatus(event, 405)
    return { ok: false, error: 'Method not allowed.' }
  }

  const rawBody = await readBody<unknown>(event).catch(() => null)
  const payload = parsePlaynowRequestBody(rawBody)
  return recordPlaynowClick(event, payload)
}
