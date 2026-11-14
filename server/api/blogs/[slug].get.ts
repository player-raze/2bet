import { readBlogArticle, readBlogList } from '../../utils/bloggerist'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug') || ''
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(slug) || slug.length > 200) throw createError({ statusCode: 404, statusMessage: 'Article not found' })
  const query = getQuery(event)
  const isPreview = query.preview === '1' || query.preview === 'true'
  setHeader(event, 'Cache-Control', 'no-store')
  if (isPreview) {
    setHeader(event, 'X-Robots-Tag', 'noindex, nofollow, noarchive')
  }
  const blog = await readBlogArticle(event, slug, isPreview)
  const list = await readBlogList(event, 1, 6, blog.category?.slug || '', isPreview).catch(() => null)
  return { ok: true, blog, related: (list?.blogs || []).filter(post => post.slug !== blog.slug).slice(0, 4) }
})
