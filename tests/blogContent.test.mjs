import assert from 'node:assert/strict'
import { test } from 'node:test'
import { blogDate, blogUrl, isPublishedBlog, normalizeBlogPost, sanitizeBlogHtml } from '../utils/blog-content.ts'

const origin = 'http://127.0.0.1:8082'

test('CMS blog HTML retains editorial content without scripts, global styles or event handlers', () => {
  const html = sanitizeBlogHtml('<style>body{display:none}</style><script>bad()</script><h1>Guide</h1><p onclick="bad()">A <strong>safe</strong> guide.</p><details class="blog-faq-item"><summary>Question</summary><p>Answer</p></details><iframe src="https://example.com"></iframe>', origin)
  assert.match(html, /<h2>Guide<\/h2>/)
  assert.match(html, /<strong>safe<\/strong>/)
  assert.match(html, /<details class="blog-faq-item">/)
  assert.doesNotMatch(html, /style|script|onclick|iframe|display:none|bad\(\)/)
})

test('CMS links and images reject encoded executable schemes and preserve valid image links', () => {
  const html = sanitizeBlogHtml('<a href="&#106;avascript:alert(1)">unsafe</a><img src="data:text/html,bad"><a href="/blog/read-this" rel="nofollow"><img src="/uploads/blogs/banner.webp" onerror="bad()" alt="Banner"></a>', origin)
  assert.doesNotMatch(html, /javascript|data:|onerror/)
  assert.match(html, /href="\/blog\/read-this"/)
  assert.match(html, /src="http:\/\/127.0.0.1:8082\/uploads\/blogs\/banner.webp"/)
  assert.match(html, /nofollow noopener noreferrer/)
  assert.match(html, /loading="lazy"/)
})

test('CMS URL normalization supports configured media origins and rejects unsafe URLs', () => {
  assert.equal(blogUrl('[insert_domain_here]/uploads/blogs/a.webp', origin), `${origin}/uploads/blogs/a.webp`)
  assert.equal(blogUrl('/uploads/blogs/a.webp', origin), `${origin}/uploads/blogs/a.webp`)
  assert.equal(blogUrl('java&colon;script:bad', origin), '')
  assert.equal(blogUrl('javascript&colon;bad', origin, true), '')
  assert.equal(blogUrl(`${origin}/blog/guide/`, origin, true), '/blog/guide')
  assert.equal(blogUrl(`${origin}/blogs/guides?page=2`, origin, true), '/blogs/guides?page=2')
})

test('blog data normalizes timestamps, preserves authored titles and excludes private fields', () => {
  const post = normalizeBlogPost({ id: 3, slug: 'guide', title: 'Guide | 2bet', featuredImage: '/uploads/a.webp', publishedAt: 1700000000, readTime: 3, writer: { name: 'Writer', role_name: 'Editor', password_hash: 'private' }, secret: 'private' }, origin)
  assert.equal(post.title, 'Guide | 2bet')
  assert.equal(post.readTime, '3')
  assert.equal(post.publishedAt, '2023-11-14T22:13:20.000Z')
  assert.equal(post.writer.name, 'Writer')
  assert.doesNotMatch(JSON.stringify(post), /private|password_hash|secret/)
  assert.equal(blogDate('not a date'), null)
})

test('drafts, private and future scheduled posts cannot appear publicly', () => {
  const now = Date.parse('2026-11-13T00:00:00Z')
  assert.equal(isPublishedBlog({ status: 'published', isPublic: true }, now), true)
  assert.equal(isPublishedBlog({ status: 'draft' }, now), false)
  assert.equal(isPublishedBlog({ status: 'Draft' }, now), false)
  assert.equal(isPublishedBlog({ isDraft: true }, now), false)
  assert.equal(isPublishedBlog({ is_draft: 1 }, now), false)
  assert.equal(isPublishedBlog({ status: 'archived' }, now), false)
  assert.equal(isPublishedBlog({ status: 'published', isPublic: false }, now), false)
  assert.equal(isPublishedBlog({ status: 'scheduled', scheduledAt: '2026-11-14T00:00:00Z' }, now), false)
  assert.equal(isPublishedBlog({ status: 'scheduled', scheduledAt: '2026-11-12T00:00:00Z' }, now), true)
})

test('blog category list filters out categories with 0 published blogs (including categories with only drafts)', () => {
  const categories = [
    { id: 'community', name: 'Community', slug: 'community', postCount: 1 },
    { id: 'general', name: 'General', slug: 'general', postCount: 1 }, // had draft only
    { id: 'promotions', name: 'Promotions', slug: 'promotions', postCount: 0 },
    { id: 'sports-news', name: 'Sports News', slug: 'sports-news', postCount: 3 },
  ]
  // Only published posts are in the list; General has no published posts
  const posts = [
    { slug: 'test-1', status: 'published', category: { slug: 'community' } },
    { slug: 'test-2', status: 'published', category: { slug: 'sports-news' } },
  ]
  const filterCategories = (cats, currentCategory = '') => cats.filter((item) => {
    const hasPublishedPosts = posts.some(p => (p.category?.slug === item.slug || p.category?.id === item.id) && p.status !== 'draft')
    const isCurrent = Boolean(currentCategory && (currentCategory === item.slug || currentCategory === item.id))
    return hasPublishedPosts || isCurrent
  })

  const visible = filterCategories(categories)
  assert.deepEqual(visible.map(c => c.slug), ['community', 'sports-news'])
  assert.equal(visible.some(c => c.slug === 'general'), false, 'Category with only drafts must be excluded')
  assert.equal(visible.some(c => c.slug === 'promotions'), false, 'Category with 0 posts must be excluded')
})

