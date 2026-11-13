import { readBlogList } from '../../utils/bloggerist'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const positiveInt = (value: unknown, fallback: number, max: number) => /^\d+$/.test(String(value ?? '')) ? Math.max(1, Math.min(max, Number(value))) : fallback
  const page = positiveInt(query.page, 1, 100000)
  const count = positiveInt(query.count, 12, 100)
  const category = typeof query.category === 'string' ? query.category.trim().slice(0, 120) : ''
  setHeader(event, 'Cache-Control', 'no-store')
  return readBlogList(event, page, count, category)
})
