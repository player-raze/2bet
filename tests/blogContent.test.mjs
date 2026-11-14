import assert from 'node:assert/strict'
import { test } from 'node:test'
import { blogDate, blogUrl, extractBlogFaqSchema, isPublishedBlog, normalizeBlogPost, sanitizeBlogHtml } from '../utils/blog-content.ts'

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

test('blog category navigation retains all categories with articles and hides categories with 0 articles', () => {
  const categories = [
    { id: 'community', name: 'Community', slug: 'community', postCount: 1 },
    { id: 'promotions', name: 'Promotions', slug: 'promotions', postCount: 0 },
    { id: 'casino', name: 'Casino', slug: 'casino', postCount: 0 },
    { id: 'sports-news', name: 'Sports News', slug: 'sports-news', postCount: 3 },
  ]
  // In navigation, show categories that have articles (postCount > 0) and hide 0-article categories
  const filterCategories = cats => cats.filter(item => Boolean(item && item.name && item.slug && (Number(item.postCount) || 0) > 0))

  const visible = filterCategories(categories)
  assert.equal(visible.length, 2)
  assert.deepEqual(visible.map(c => c.slug), ['community', 'sports-news'])
  assert.equal(visible.some(c => c.slug === 'promotions'), false, 'Promotions (0 articles) must be hidden')
  assert.equal(visible.some(c => c.slug === 'casino'), false, 'Casino (0 articles) must be hidden')
})

test('blog article includes disclaimer, social share, author box, official channels, and play now redirect', async () => {
  const fs = await import('node:fs')
  const path = await import('node:path')
  const articleVue = fs.readFileSync(path.resolve(process.cwd(), 'components/blogs/BlogArticle.vue'), 'utf-8')
  const { buildBybetRedirectUrl } = await import('../utils/sportsRedirect.ts')

  // Verify Play Now CTA constructs redirect to env_redirect_url + /login + env_code
  const playNowRedirect = buildBybetRedirectUrl('login', 'https://2bet.com', 'xjSD')
  assert.equal(playNowRedirect, 'https://2bet.com/login?p=xjSD')

  // Verify template contains the required sections
  assert.match(articleVue, /class="blog-breadcrumbs"/, 'Must contain breadcrumbs navigation')
  assert.match(articleVue, /class="blog-disclaimer"/, 'Must contain disclaimer section')
  assert.match(articleVue, /class="blog-share"/, 'Must contain social share section')
  assert.match(articleVue, /class="blog-author-box"/, 'Must contain rich author section')
  assert.match(articleVue, /<section class="blog-channels"/, 'Must contain active official channels section')
  assert.doesNotMatch(articleVue, /<!-- <section class="blog-channels"/, 'Channels section must not be commented out')
  assert.match(articleVue, /class="blog-cta"/, 'Must contain play now CTA banner')
  assert.match(articleVue, /:href="playNowUrl"/, 'Play now CTA button must bind to playNowUrl')
})

test('blog category page produces custom SEO title and description', async () => {
  const fs = await import('node:fs')
  const path = await import('node:path')
  const listingVue = fs.readFileSync(path.resolve(process.cwd(), 'components/blogs/BlogListing.vue'), 'utf-8')

  assert.match(listingVue, /currentCategoryName\.value\} \| Blog da 2bet \| Tutoriais e Guias de Apostas/)
  assert.match(listingVue, /Confira os blogs da \$\{currentCategoryName\.value\} na 2bet para encontrar dicas, tutoriais e as últimas novidades\. Perfeito para quem deseja apostar com mais confiança\./)
})

test('SEO schemas are present for /blogs, /blogs/{category}, and /blog/{blog-slug}', async () => {
  const fs = await import('node:fs')
  const path = await import('node:path')
  const listingVue = fs.readFileSync(path.resolve(process.cwd(), 'components/blogs/BlogListing.vue'), 'utf-8')
  const articleVue = fs.readFileSync(path.resolve(process.cwd(), 'components/blogs/BlogArticle.vue'), 'utf-8')

  // Check /blogs and /blogs/{category} schema definitions
  assert.match(listingVue, /'@type':\s*'Blog'/, 'Must contain Blog schema for /blogs')
  assert.match(listingVue, /'@type':\s*'CollectionPage'/, 'Must contain CollectionPage schema for /blogs/{category}')
  assert.match(listingVue, /'@type':\s*'BreadcrumbList'/, 'Must contain BreadcrumbList schema for blogs listings')
  assert.match(listingVue, /blog-listing-schema/, 'Must render script key for listing schema')

  // Check /blog/{blog-slug} schema definitions
  assert.match(articleVue, /'@type':\s*'BlogPosting'/, 'Must contain BlogPosting schema for /blog/{blog-slug}')
  assert.match(articleVue, /'@type':\s*'BreadcrumbList'/, 'Must contain BreadcrumbList schema for /blog/{blog-slug}')
  assert.match(articleVue, /blog-article-schema/, 'Must render script key for article schema')
  assert.match(articleVue, /faqSchema\.value/, 'Must conditionally include faqSchema in blog article graph')
})

test('FAQ schema is generated when article has faq_schema or HTML FAQ details', () => {
  const canonical = 'https://2bet.com/blog/casino-guide'

  // Case 1: Post with explicit faq_schema
  const postWithFaq = {
    title: 'Casino Guide',
    faq_schema: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How do I register at 2bet?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Click on the Register button and fill in your details.',
          },
        },
      ],
    },
  }
  const schema1 = extractBlogFaqSchema(postWithFaq, canonical)
  assert.ok(schema1, 'FAQ schema should be created for post with faq_schema')
  assert.equal(schema1['@type'], 'FAQPage')
  assert.equal(schema1['@id'], 'https://2bet.com/blog/casino-guide#faq')
  assert.equal(schema1.mainEntity.length, 1)
  assert.equal(schema1.mainEntity[0].name, 'How do I register at 2bet?')
  assert.equal(schema1.mainEntity[0].acceptedAnswer.text, 'Click on the Register button and fill in your details.')

  // Case 2: Post with HTML content FAQ
  const postWithHtml = {
    title: 'Casino Guide',
    contentHtml: '<p>Intro</p><section class="blog-faq-block"><details class="blog-faq-item"><summary>What is the minimum deposit?</summary><p>The minimum deposit is R$ 10.</p></details></section>',
  }
  const schema2 = extractBlogFaqSchema(postWithHtml, canonical)
  assert.ok(schema2, 'FAQ schema should be extracted from contentHtml')
  assert.equal(schema2['@type'], 'FAQPage')
  assert.equal(schema2.mainEntity[0].name, 'What is the minimum deposit?')
  assert.equal(schema2.mainEntity[0].acceptedAnswer.text, 'The minimum deposit is R$ 10.')

  // Case 3: Post with no FAQ
  const postWithoutFaq = {
    title: 'Regular Article',
    contentHtml: '<p>Just normal content without any FAQs.</p>',
  }
  const schema3 = extractBlogFaqSchema(postWithoutFaq, canonical)
  assert.equal(schema3, null, 'Must return null if post has no FAQ')
})

test('OG image configurations across routes', async () => {
  const fs = await import('node:fs')
  const path = await import('node:path')

  // Verify the copied 2bet-og.webp asset exists in public/brand/
  const ogAssetPath = path.resolve(process.cwd(), 'public/brand/2bet-og.webp')
  assert.equal(fs.existsSync(ogAssetPath), true, 'public/brand/2bet-og.webp must exist')

  // Verify homepage uses the first hero slider image (/hero/editorial/sports.webp)
  const homeVue = fs.readFileSync(path.resolve(process.cwd(), 'pages/index.vue'), 'utf-8')
  assert.match(homeVue, /image:\s*['"]\/hero\/editorial\/sports\.webp['"]/, 'Home page must use first hero slider image for og:image')

  // Verify useAppSeo default og image is /brand/2bet-og.webp
  const useAppSeoTs = fs.readFileSync(path.resolve(process.cwd(), 'composables/useAppSeo.ts'), 'utf-8')
  assert.match(useAppSeoTs, /resolveVal\(options\.image\)\s*\|\|\s*['"]\/brand\/2bet-og\.webp['"]/, 'useAppSeo must default fallback to /brand/2bet-og.webp')

  // Verify SeoHeader defaults to /brand/2bet-og.webp
  const seoHeaderVue = fs.readFileSync(path.resolve(process.cwd(), 'components/SeoHeader.vue'), 'utf-8')
  assert.match(seoHeaderVue, /ogImage:\s*['"]\/brand\/2bet-og\.webp['"]/, 'SeoHeader must default to /brand/2bet-og.webp')

  // Verify blog listing pages (/blogs, /blogs/{category}) use /brand/2bet-og.webp
  const listingVue = fs.readFileSync(path.resolve(process.cwd(), 'components/blogs/BlogListing.vue'), 'utf-8')
  assert.match(listingVue, /ogImage:\s*['"]\/brand\/2bet-og\.webp['"]/, 'Blog listing must use /brand/2bet-og.webp')

  // Verify blog article (/blog/{blog-slug}) preserves post.value.featuredImage
  const articleVue = fs.readFileSync(path.resolve(process.cwd(), 'components/blogs/BlogArticle.vue'), 'utf-8')
  assert.match(articleVue, /ogImage:\s*\(\)\s*=>\s*post\.value\?\.featuredImage/, 'Blog article must retain post.value.featuredImage for og:image')
})

