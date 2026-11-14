import type { H3Event } from 'h3'
import { asRecord, isPublishedBlog, normalizeBlogPost, sanitizeBlogHtml } from '../../utils/blog-content'
import type { BlogArticle, BlogCategory, BlogListResponse } from '../../types/blog'

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
