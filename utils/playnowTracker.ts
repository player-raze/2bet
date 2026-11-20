export interface PlaynowClickPayload {
  pageUrl: string
  pagePath: string
  pageTitle: string
  referrer: string
  targetUrl: string
  buttonText: string
  buttonClass: string
  buttonId: string
  buttonName: string
  buttonTag: string
  section: string
  selector: string
  location: string
  x: number | null
  y: number | null
}

export interface PlaynowClickContext {
  pageUrl?: string
  pagePath?: string
  pageTitle?: string
  referrer?: string
  origin?: string
}

export interface PlaynowTrackerOptions {
  bloggeristUrl?: string
  onTracked?: (payload: PlaynowClickPayload, endpoint: string) => void
}

export const CLICKABLE_BUTTON_SELECTOR = [
  'button',
  'a[href]',
  '[role="button"]',
  '[role="tab"]',
  '[role="menuitem"]',
  '[role="link"]',
  'summary',
  'input[type="button"]',
  'input[type="submit"]',
  'input[type="reset"]',
  '[data-playnow-url]',
  '[data-href]',
  '[data-url]',
  '[data-track-click]',
  '.btn',
  '[class*="btn-"]',
  '[class*="-btn"]',
].join(', ')

export const CLICKABLE_CARD_SELECTOR = [
  '.game-card',
  '.casino-table-card',
  '.poker-game-card',
  '.promo-card',
  '.bonus-card',
  '.original-game-card',
  '.blog-card',
  '[onclick]',
].join(', ')

const SECTION_SELECTOR = [
  '[data-track-section]',
  'section',
  'header',
  'footer',
  'nav',
  'article',
  'aside',
  'main',
  'form',
  '[role="dialog"]',
  '[role="navigation"]',
  '[role="region"]',
  '.announcement-bar',
  '.spotlight-card',
  '.playnow-blog-banner',
  '.mobile-drawer',
  '.page-hero',
  '.game-card',
  '.casino-table-card',
  '.poker-game-card',
  '.promo-card',
  '.bonus-card',
  '.blog-social-card',
].join(', ')

export function cleanTrackText(value: unknown, maxLength = 180): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, maxLength)
}

export function normalizeBloggeristBaseUrl(bloggeristUrl?: string): string {
  return String(bloggeristUrl ?? '')
    .trim()
    .replace(/^['"]+|['"]+$/g, '')
    .replace(/\/+$/, '')
}

export function buildPlaynowTrackerUrl(bloggeristUrl?: string): string {
  const cleanBase = normalizeBloggeristBaseUrl(bloggeristUrl)
  if (!cleanBase) return '/api/playnow-tracker'
  if (cleanBase.endsWith('/api/playnow-tracker')) return cleanBase
  return `${cleanBase}/api/playnow-tracker`
}

function getElementClassString(element: Element | null | undefined): string {
  if (!element) return ''
  const raw = (element as { className?: unknown }).className
  if (typeof raw === 'string') return raw
  return element.getAttribute?.('class') || ''
}

function isDisabledElement(element: Element): boolean {
  if ((element as HTMLButtonElement).disabled === true) return true
  if (element.hasAttribute?.('disabled')) return true
  return element.getAttribute?.('aria-disabled') === 'true'
}

export function closestTrackableElement(target: unknown): Element | null {
  let node = target as (Node & { parentElement?: Element | null; closest?: (sel: string) => Element | null }) | null
  while (node && typeof node.closest !== 'function') {
    node = node.parentElement ?? (node.parentNode as typeof node | null)
  }
  if (!node || typeof node.closest !== 'function') return null

  const primary = node.closest(CLICKABLE_BUTTON_SELECTOR)
  const candidate = primary || node.closest(CLICKABLE_CARD_SELECTOR)
  if (!candidate) return null
  if (candidate.closest?.('[data-no-track]')) return null
  if (isDisabledElement(candidate)) return null

  return candidate
}

export function cssPath(element: Element | null | undefined): string {
  if (!element || !element.tagName) return ''
  const parts: string[] = []
  let node: Element | null = element

  while (node && node.nodeType === 1 && parts.length < 5) {
    let part = node.tagName.toLowerCase()
    const id = cleanTrackText(node.id, 60)
    if (id) {
      part += `#${id}`
      parts.unshift(part)
      break
    }
    const cls = cleanTrackText(getElementClassString(node), 80)
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .join('.')
    if (cls) {
      part += `.${cls}`
    }
    parts.unshift(part)
    node = node.parentElement
  }

  return cleanTrackText(parts.join(' > '), 220)
}

function resolveHeadingText(container: Element): string {
  if (typeof container.querySelector !== 'function') return ''
  const heading = container.querySelector('h1, h2, h3')
  return heading ? cleanTrackText(heading.textContent, 100) : ''
}

export function findClickSection(element: Element): string {
  const section = element.closest?.(SECTION_SELECTOR)
  if (!section) return 'page'

  const explicit = section.getAttribute?.('data-track-section')
  if (explicit) return cleanTrackText(explicit, 140)

  const ariaLabel = section.getAttribute?.('aria-label')
  if (ariaLabel) return cleanTrackText(ariaLabel, 140)

  if (section.id) return cleanTrackText(section.id, 140)

  const heading = resolveHeadingText(section)
  if (heading) return cleanTrackText(heading, 140)

  return cleanTrackText(getElementClassString(section) || section.tagName?.toLowerCase() || 'page', 140)
}

function isCardContainer(element: Element): boolean {
  const cls = getElementClassString(element)
  return /\b(?:game-card|casino-table-card|poker-game-card|promo-card|bonus-card|original-game-card|blog-card)\b/.test(cls)
}

export function resolveButtonText(element: Element): string {
  const explicit = element.getAttribute?.('data-track-label')
    || element.getAttribute?.('data-button-text')
    || element.getAttribute?.('data-label')
  if (explicit) return cleanTrackText(explicit, 120)

  const ariaLabel = element.getAttribute?.('aria-label')
  if (ariaLabel) return cleanTrackText(ariaLabel, 120)

  if (isCardContainer(element) && typeof element.querySelector === 'function') {
    const titleEl = element.querySelector('h1, h2, h3, h4, .game-title, .card-title')
    const titleText = cleanTrackText(titleEl?.textContent, 120)
    if (titleText) return titleText
  }

  const inputValue = (element as HTMLInputElement).value
  if (element.tagName?.toLowerCase() === 'input' && inputValue) {
    return cleanTrackText(inputValue, 120)
  }

  const text = cleanTrackText(element.textContent, 120)
  if (text) return text

  const title = element.getAttribute?.('title')
  if (title) return cleanTrackText(title, 120)

  if (typeof element.querySelector === 'function') {
    const mediaLabel = element.querySelector('img[alt]')?.getAttribute('alt')
      || element.querySelector('[aria-label]')?.getAttribute('aria-label')
    if (mediaLabel) return cleanTrackText(mediaLabel, 120)
  }

  if (element.id) return cleanTrackText(`#${element.id}`, 120)
  const nameAttr = element.getAttribute?.('name')
  if (nameAttr) return cleanTrackText(nameAttr, 120)

  return cleanTrackText(element.tagName?.toLowerCase() || 'button', 120)
}

export function resolveTargetUrl(element: Element, baseUrl = 'https://2bet.com/', currentPath = '/'): string {
  const readCandidate = (node: Element | null | undefined): string => {
    if (!node) return ''
    return (
      node.getAttribute?.('data-playnow-url')
      || node.getAttribute?.('data-href')
      || node.getAttribute?.('data-url')
      || node.getAttribute?.('href')
      || node.getAttribute?.('formaction')
      || (node as HTMLAnchorElement).href
      || ''
    ).trim()
  }

  let raw = readCandidate(element)
  if (!raw && typeof element.closest === 'function') {
    const ancestor = element.closest('a[href], [data-playnow-url], [data-href], [data-url]')
    if (ancestor && ancestor !== element) {
      raw = readCandidate(ancestor)
    }
  }

  if (!raw || raw === '#' || /^javascript:/i.test(raw)) {
    return cleanTrackText(currentPath || '/', 300)
  }

  try {
    return cleanTrackText(new URL(raw, baseUrl).href, 300)
  } catch {
    return cleanTrackText(raw, 300)
  }
}

export function buildPlaynowClickPayload(
  element: Element,
  clickEvent?: { clientX?: number; clientY?: number },
  context?: PlaynowClickContext,
): PlaynowClickPayload {
  const win = typeof window !== 'undefined' ? window : undefined
  const doc = typeof document !== 'undefined' ? document : undefined

  const pageUrl = cleanTrackText(context?.pageUrl ?? win?.location?.href ?? '', 300)
  const pagePath = cleanTrackText(context?.pagePath ?? win?.location?.pathname ?? '/', 180) || '/'
  const pageTitle = cleanTrackText(context?.pageTitle ?? doc?.title ?? '', 180)
  const referrer = cleanTrackText(context?.referrer ?? doc?.referrer ?? '', 300)
  const baseUrl = context?.origin || pageUrl || win?.location?.origin || 'https://2bet.com/'

  const buttonText = resolveButtonText(element)
  const section = findClickSection(element)
  const targetUrl = resolveTargetUrl(element, baseUrl, pagePath)
  const location = cleanTrackText([pagePath, section, buttonText].filter(Boolean).join(' | '), 220)

  const x = clickEvent && typeof clickEvent.clientX === 'number' && Number.isFinite(clickEvent.clientX)
    ? Math.round(clickEvent.clientX)
    : null
  const y = clickEvent && typeof clickEvent.clientY === 'number' && Number.isFinite(clickEvent.clientY)
    ? Math.round(clickEvent.clientY)
    : null

  return {
    pageUrl,
    pagePath,
    pageTitle,
    referrer,
    targetUrl,
    buttonText,
    buttonClass: cleanTrackText(getElementClassString(element), 220),
    buttonId: cleanTrackText(element.id || '', 120),
    buttonName: cleanTrackText(element.getAttribute?.('name') || '', 120),
    buttonTag: cleanTrackText(element.tagName?.toLowerCase() || '', 40),
    section,
    selector: cssPath(element),
    location,
    x,
    y,
  }
}

function dispatchBeaconFallback(url: string, body: string): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.sendBeacon !== 'function' || typeof Blob === 'undefined') {
    return false
  }
  try {
    const blob = new Blob([body], { type: 'application/json' })
    return navigator.sendBeacon(url, blob)
  } catch {
    return false
  }
}

export async function sendPlaynowClick(
  payload: PlaynowClickPayload,
  bloggeristUrl?: string,
  options?: { onTracked?: (payload: PlaynowClickPayload, endpoint: string) => void },
): Promise<boolean> {
  if (typeof fetch !== 'function') return false

  const primaryUrl = buildPlaynowTrackerUrl(bloggeristUrl)
  const fallbackUrl = '/api/playnow-tracker'
  const body = JSON.stringify(payload)
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Requested-With': 'fetch',
  }

  try {
    const response = await fetch(primaryUrl, {
      method: 'POST',
      headers,
      body,
      keepalive: true,
    })
    if (response.ok) {
      options?.onTracked?.(payload, primaryUrl)
      return true
    }
  } catch {
    // Primary BLOGGERIST_URL/api/playnow-tracker failed (CORS/offline/404); fall back to Nuxt API.
  }

  let sameEndpoint = primaryUrl === fallbackUrl
  if (!sameEndpoint && typeof window !== 'undefined' && window.location?.origin) {
    try {
      sameEndpoint = new URL(primaryUrl, window.location.origin).href === new URL(fallbackUrl, window.location.origin).href
    } catch {
      sameEndpoint = false
    }
  }

  if (sameEndpoint) {
    return false
  }

  try {
    const fallbackResponse = await fetch(fallbackUrl, {
      method: 'POST',
      headers,
      body,
      keepalive: true,
    })
    if (fallbackResponse.ok) {
      options?.onTracked?.(payload, fallbackUrl)
      return true
    }
  } catch {
    // Fall back to sendBeacon during page unload if fetch was aborted.
  }

  const beaconOk = dispatchBeaconFallback(fallbackUrl, body)
  if (beaconOk) {
    options?.onTracked?.(payload, fallbackUrl)
  }
  return beaconOk
}

export function setupPlaynowTracker(options: PlaynowTrackerOptions = {}): () => void {
  if (typeof document === 'undefined') {
    return () => {}
  }

  const onClick = (event: MouseEvent) => {
    const element = closestTrackableElement(event.target)
    if (!element) return

    const payload = buildPlaynowClickPayload(element, event)
    void sendPlaynowClick(payload, options.bloggeristUrl, { onTracked: options.onTracked })
  }

  document.addEventListener('click', onClick, true)
  return () => {
    document.removeEventListener('click', onClick, true)
  }
}
