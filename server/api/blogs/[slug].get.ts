import { readBlogArticle, readBlogList } from '../../utils/bloggerist'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug') || ''
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(slug) || slug.length > 200) throw createError({ statusCode: 404, statusMessage: 'Article not found' })
  setHeader(event, 'Cache-Control', 'no-store')
  const blog = await readBlogArticle(event, slug)
  const list = await readBlogList(event, 1, 6, blog.category?.slug || '').catch(() => null)
  return { ok: true, blog, related: (list?.blogs || []).filter(post => post.slug !== blog.slug).slice(0, 4) }
})
