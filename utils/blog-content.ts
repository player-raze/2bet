import { parse, ELEMENT_NODE, TEXT_NODE, type Node } from 'ultrahtml'
import type { BlogPost } from '../types/blog'

type RecordValue = Record<string, any>
export const asRecord = (value: unknown): RecordValue => value && typeof value === 'object' && !Array.isArray(value) ? value as RecordValue : {}
const string = (value: unknown) => typeof value === 'string' ? value : ''
const escapeAttribute = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const decodeUrl = (value: string) => value.replace(/&#(x[0-9a-f]+|\d+);?/gi, (_, code: string) => {
  const point = code[0].toLowerCase() === 'x' ? parseInt(code.slice(1), 16) : Number(code)
  return point > 0 && point <= 0x10ffff ? String.fromCodePoint(point) : ''
}).replace(/&amp;/gi, '&').replace(/&colon;/gi, ':').replace(/&(?:tab|newline);/gi, '').trim()

export function blogUrl(value: unknown, origin: string, link = false): string {
  let raw = decodeUrl(string(value))
  if (!raw) return ''
  if (raw.startsWith('[insert_domain_here]')) raw = raw.replace('[insert_domain_here]', origin)
  if (link && /^#[\w-]+$/.test(raw)) return `#blog-content-${raw.slice(1)}`
  try {
    const url = new URL(raw, `${origin.replace(/\/+$/, '')}/`)
    if (link && ['mailto:', 'tel:'].includes(url.protocol)) return url.href
    if (!['http:', 'https:'].includes(url.protocol)) return ''
    if (link && url.origin === new URL(origin).origin) {
      if (/^\/blog\//.test(url.pathname)) return `/blog/${url.pathname.split('/')[2]}${url.search}${url.hash}`
      if (/^\/(?:blogs?|bonuses?|sports|egames|entertainment|tutorial|game-rules|account|help|legal)(?:\/|$)/.test(url.pathname)) return `${url.pathname}${url.search}${url.hash}`
    }
    return url.href
  } catch { return '' }
}

export function blogDate(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null
  const number = Number(value)
  const date = Number.isFinite(number) && number > 0
    ? new Date(number < 1e12 ? number * 1000 : number)
    : new Date(String(value))
  return Number.isFinite(date.getTime()) ? date.toISOString() : null
}

export function normalizeBlogPost(value: unknown, origin: string): BlogPost {
  const post = asRecord(value)
  const category = asRecord(post.category)
  const writer = asRecord(post.writer || post.about_author)
  return {
    id: String(post.id ?? ''),
    slug: string(post.slug),
    title: string(post.title),
    excerpt: string(post.excerpt),
    featuredImage: blogUrl(post.featuredImage, origin),
    author: string(writer.name) || string(post.author) || 'Editorial Team',
    writer: {
      name: string(writer.name) || string(post.author) || 'Editorial Team',
      role_name: string(writer.role_name),
      profile_image: blogUrl(writer.profile_image, origin),
      bio: string(writer.bio),
    },
    category: category.slug ? { id: String(category.id ?? ''), name: string(category.name), slug: string(category.slug) } : null,
    tags: Array.isArray(post.tags) ? post.tags.map((tag: unknown) => ({ name: string(asRecord(tag).name), slug: string(asRecord(tag).slug) })).filter((tag: { name: string }) => tag.name) : [],
    publishedAt: blogDate(post.publishedAt ?? post.startsAt ?? post.scheduledAt),
    updatedAt: blogDate(post.updatedAt),
    date: string(post.date),
    readTime: String(post.readTime || ''),
  }
}

export function isPublishedBlog(value: unknown, now = Date.now()): boolean {
  const post = asRecord(value)
  if (post.isPublic === false || (post.status && !['published', 'scheduled'].includes(post.status))) return false
  const scheduled = blogDate(post.scheduledAt)
  return !scheduled || new Date(scheduled).getTime() <= now
}

const allowedTags = new Set('p br hr h1 h2 h3 h4 h5 h6 strong b em i u s del mark small sub sup blockquote ul ol li a img figure figcaption div section article span pre code table thead tbody tfoot tr th td caption colgroup col details summary time'.split(' '))
const dropTags = new Set(['script', 'style', 'iframe', 'object', 'embed', 'svg', 'math', 'form', 'input', 'button', 'textarea', 'select', 'template', 'noscript', 'link', 'meta', 'base'])
const voidTags = new Set(['br', 'hr', 'img', 'col'])

// Rebuild only editorial HTML from the parsed tree. CMS CSS/scripts and event
// handlers cannot change the site shell, theme, or client navigation.
export function sanitizeBlogHtml(html: string, origin: string): string {
  function render(node: Node): string {
    if (node.type === TEXT_NODE) return node.value.replace(/</g, '&lt;').replace(/>/g, '&gt;')
    if (node.type !== ELEMENT_NODE) return 'children' in node ? node.children.map(render).join('') : ''
    const tag = node.name.toLowerCase()
    if (dropTags.has(tag)) return ''
    const content = node.children.map(render).join('')
    if (!allowedTags.has(tag)) return content
    const attrs: Record<string, string> = {}
    for (const [key, value] of Object.entries(node.attributes)) {
      const name = key.toLowerCase()
      if (['title', 'alt'].includes(name)) attrs[name] = value
      else if (name === 'class') attrs.class = value.split(/\s+/).filter(part => /^blog-[a-z0-9_-]+$/i.test(part)).join(' ')
      else if (name === 'id' && /^[\w-]+$/.test(value)) attrs.id = `blog-content-${value}`
      else if (['colspan', 'rowspan', 'start', 'width', 'height'].includes(name) && /^\d{1,4}$/.test(value)) attrs[name] = value
      else if (tag === 'a' && name === 'href') attrs.href = blogUrl(value, origin, true)
      else if (tag === 'a' && name === 'rel') attrs.rel = value.includes('nofollow') ? 'nofollow noopener noreferrer' : 'noopener noreferrer'
      else if (tag === 'img' && name === 'src') attrs.src = blogUrl(value, origin)
      else if (tag === 'details' && name === 'open') attrs.open = ''
      else if (tag === 'time' && name === 'datetime') attrs.datetime = value
    }
    if (tag === 'img') {
      if (!attrs.src) return ''
      attrs.loading = 'lazy'
      attrs.decoding = 'async'
    }
    if (tag === 'a') attrs.rel ||= 'noopener noreferrer'
    const attributes = Object.entries(attrs).map(([key, value]) => ` ${key}="${escapeAttribute(value)}"`).join('')
    // The page supplies its own H1; authored content headings stay subordinate.
    const outputTag = tag === 'h1' ? 'h2' : tag
    return `<${outputTag}${attributes}>${voidTags.has(tag) ? '' : `${content}</${outputTag}>`}`
  }
  return render(parse(html))
}
