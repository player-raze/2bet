<script setup lang="ts">
import { ArrowLeft, ArrowRight, BookOpen, Clock3, RefreshCw } from 'lucide-vue-next'
import BlogHeader from './BlogHeader.vue'
import BlogImage from './BlogImage.vue'
import { formatBlogReadTime } from './formatReadTime'
import type { BlogPost } from '~/types/blog'

interface BlogDetailResponse {
  ok: boolean
  blog: BlogPost & { contentHtml: string; seoTitle: string; seoDescription: string }
  related: BlogPost[]
}
const route = useRoute()
const config = useRuntimeConfig()
const { locale } = useSiteLocale()
const slug = computed(() => String(route.params.slug || ''))
const isPreview = computed(() => route.query.preview === '1' || route.query.preview === 'true')
const { data, error, status, refresh } = await useFetch<BlogDetailResponse>(() => `/api/blogs/${encodeURIComponent(slug.value)}`, {
  query: computed(() => (isPreview.value ? { preview: '1' } : {})),
})
const missing = error.value && (error.value.statusCode === 404 || error.value.status === 404)
if (missing) throw createError({ statusCode: 404, statusMessage: locale.value === 'pt' ? 'Artigo não encontrado' : 'Article not found' })
const post = computed(() => data.value?.blog)
const isNoIndex = computed(() => isPreview.value || post.value?.status === 'draft')
const related = computed(() => data.value?.related || [])
const copy = computed(() => locale.value === 'pt' ? {
  blog: 'Blog', back: 'Todos os artigos', related: 'Leia também', by: 'Por', updated: 'Atualizado em',
  error: 'Não foi possível carregar este artigo.', retry: 'Tentar novamente', loading: 'Carregando artigo', author: 'Sobre o autor',
} : {
  blog: 'Blog', back: 'All articles', related: 'Read next', by: 'By', updated: 'Updated',
  error: 'We could not load this article.', retry: 'Try again', loading: 'Loading article', author: 'About the author',
})
const displayDate = (value: string | null | undefined, fallback = '') => {
  if (!value) return fallback
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? fallback : new Intl.DateTimeFormat(locale.value === 'pt' ? 'pt-BR' : 'en', { dateStyle: 'long', timeZone: 'UTC' }).format(date)
}
const siteUrl = computed(() => String(config.public.siteUrl || 'https://2bet.com').replace(/\/+$/, ''))
const canonical = computed(() => `${siteUrl.value}/blog/${encodeURIComponent(slug.value)}`)
const metaTitle = computed(() => post.value?.seoTitle || post.value?.title || copy.value.blog)
const description = computed(() => post.value?.seoDescription || post.value?.excerpt || '')
useSeoMeta({
  title: metaTitle, ogTitle: metaTitle, twitterTitle: metaTitle,
  description, ogDescription: description, twitterDescription: description,
  ogImage: () => post.value?.featuredImage || '/brand/2bet-logo.webp',
  twitterImage: () => post.value?.featuredImage || '/brand/2bet-logo.webp',
  ogType: 'article', twitterCard: 'summary_large_image',
  articlePublishedTime: () => post.value?.publishedAt || undefined,
  articleModifiedTime: () => post.value?.updatedAt || undefined,
  robots: () => (isNoIndex.value ? 'noindex, nofollow, noarchive' : undefined),
})
useHead(() => ({
  meta: isNoIndex.value ? [
    { name: 'robots', content: 'noindex, nofollow, noarchive' },
    { name: 'googlebot', content: 'noindex, nofollow, noarchive' },
  ] : [],
  link: isNoIndex.value ? [] : [{ rel: 'canonical', href: canonical.value }],
  script: post.value ? [{ key: 'blog-article-schema', type: 'application/ld+json', children: JSON.stringify({
    '@context': 'https://schema.org', '@type': 'BlogPosting', headline: post.value.title,
    description: description.value, url: canonical.value, mainEntityOfPage: canonical.value,
    image: post.value.featuredImage || undefined,
    datePublished: post.value.publishedAt || undefined, dateModified: post.value.updatedAt || undefined,
    author: post.value.author ? { '@type': 'Person', name: post.value.author } : undefined,
    publisher: { '@type': 'Organization', name: String(config.public.siteName || '2bet') },
  }).replace(/</g, '\\u003c') }] : [],
}))
</script>

<template>
  <div class="blog-detail-page">
    <BlogHeader :title="copy.blog" back-to="/blogs" />
    <div v-if="status === 'pending'" class="blog-detail-loading" role="status" :aria-label="copy.loading"><span /><i /><i /><i /><span class="sr-only">{{ copy.loading }}</span></div>
    <div v-else-if="error" class="blog-detail-state" role="alert"><BookOpen :size="40" aria-hidden="true" /><h1>{{ copy.error }}</h1><button type="button" @click="refresh()"><RefreshCw :size="16" aria-hidden="true" />{{ copy.retry }}</button><NuxtLink to="/blogs"><ArrowLeft :size="16" aria-hidden="true" />{{ copy.back }}</NuxtLink></div>
    <template v-else-if="post">
      <div class="blog-detail-content">
        <div class="blog-banner"><BlogImage :src="post.featuredImage" :alt="post.title" eager /></div>
        <div class="blog-detail-columns" :class="{ 'blog-detail-columns--related': related.length }">
          <article class="blog-article">
            <header class="blog-article__header">
              <NuxtLink v-if="post.category" :to="`/blogs/${encodeURIComponent(post.category.slug)}`" class="blog-article__category">{{ post.category.name }}</NuxtLink>
              <h1>{{ post.title }}</h1>
              <div class="blog-article__metadata"><span v-if="post.author">{{ copy.by }} {{ post.author }}</span><time v-if="post.publishedAt || post.date" :datetime="post.publishedAt || undefined">{{ displayDate(post.publishedAt, post.date) }}</time><span v-if="post.readTime"><Clock3 :size="14" aria-hidden="true" />{{ formatBlogReadTime(post.readTime, locale) }}</span></div>
              <p v-if="post.excerpt" class="blog-article__excerpt">{{ post.excerpt }}</p>
            </header>
            <div class="blog-article-content" v-html="post.contentHtml" />
            <footer class="blog-article__footer">
              <div v-if="post.tags.length" class="blog-tags"><span v-for="tag in post.tags" :key="tag.slug">{{ tag.name }}</span></div>
              <p v-if="post.updatedAt && post.updatedAt !== post.publishedAt" class="blog-article__updated">{{ copy.updated }} <time :datetime="post.updatedAt">{{ displayDate(post.updatedAt) }}</time></p>
              <section v-if="post.writer?.bio" class="blog-author" :aria-label="copy.author"><strong>{{ post.writer.name || post.author }}</strong><span v-if="post.writer.role_name">{{ post.writer.role_name }}</span><p>{{ post.writer.bio }}</p></section>
              <NuxtLink to="/blogs" class="blog-back-link"><ArrowLeft :size="16" aria-hidden="true" />{{ copy.back }}</NuxtLink>
            </footer>
          </article>
          <aside v-if="related.length" class="blog-related" :aria-label="copy.related">
            <h2>{{ copy.related }}</h2>
            <NuxtLink v-for="item in related" :key="item.id || item.slug" :to="`/blog/${encodeURIComponent(item.slug)}`" class="blog-related__item">
              <div class="blog-related__image"><BlogImage :src="item.featuredImage" :alt="item.title" /></div><div><strong>{{ item.title }}</strong><span>{{ item.category?.name || formatBlogReadTime(item.readTime, locale) }}</span></div><ArrowRight :size="15" aria-hidden="true" />
            </NuxtLink>
          </aside>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.blog-detail-page { width: 100%; min-width: 0; color: var(--text); }
.blog-detail-content { min-width: 0; }
.blog-banner { width: 100%; height: clamp(180px,22vw,310px); overflow: hidden; border: 1px solid var(--border); border-radius: 12px; background: var(--surface); }
.blog-banner :deep(img) { object-position: center 10%; }
.blog-banner :deep(.blog-image--fallback img) { object-position: center; }
.blog-detail-columns { display: grid; grid-template-columns: minmax(0,1fr); gap: 14px; align-items: start; margin-top: 12px; }
.blog-detail-columns--related { grid-template-columns: minmax(0,1fr) minmax(220px,28%); }
.blog-article { min-width: 0; padding: clamp(20px,2.6vw,36px); border: 1px solid var(--border); border-radius: 12px; background: var(--surface); }
.blog-article__header { margin-bottom: 24px; padding-bottom: 22px; border-bottom: 1px solid var(--border); }
.blog-article__category { display: inline-flex; max-width: 100%; margin-bottom: 12px; padding: 5px 10px; border-radius: 6px; background: #00944026; color: #45d892; font-size: 12px; font-weight: 700; overflow-wrap: anywhere; }
.blog-article h1 { margin: 0; color: var(--heading); font-size: clamp(24px,2.5vw,34px); font-weight: 800; line-height: 1.25; overflow-wrap: anywhere; }
.blog-article__metadata { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 16px; margin-top: 16px; color: var(--secondary); font-size: 12px; line-height: 1.6; }
.blog-article__metadata span { display: inline-flex; align-items: center; gap: 5px; }
.blog-article__excerpt { margin: 16px 0 0; color: var(--secondary); font-size: 15px; line-height: 1.65; }
.blog-article-content { min-width: 0; font-size: 15px; line-height: 1.8; color: var(--text); overflow-wrap: anywhere; }
.blog-article-content :deep(> :first-child) { margin-top: 0; }
.blog-article-content :deep(:is(h1,h2,h3,h4,h5,h6)) { margin: 1.5em 0 .65em; color: var(--heading); font-weight: 800; line-height: 1.35; scroll-margin-top: calc(var(--header-height) + 65px); }
.blog-article-content :deep(h1) { font-size: 28px; }.blog-article-content :deep(h2) { font-size: 23px; }.blog-article-content :deep(h3) { font-size: 19px; }.blog-article-content :deep(:is(h4,h5,h6)) { font-size: 16px; }
.blog-article-content :deep(p) { margin: 0 0 1.15em; }.blog-article-content :deep(:is(ul,ol)) { margin: 1em 0; padding-left: 1.5em; }.blog-article-content :deep(ul) { list-style: disc; }.blog-article-content :deep(ol) { list-style: decimal; }.blog-article-content :deep(li) { margin: .4em 0; }
.blog-article-content :deep(a) { color: #49d896; text-decoration: underline; text-underline-offset: 3px; }.blog-article-content :deep(a:hover) { color: #8becbc; }
.blog-article-content :deep(img) { display: block; max-width: 100%; height: auto; margin: 1em auto; border-radius: 9px; }.blog-article-content :deep(figure) { max-width: 100%; margin: 1.4em 0; }.blog-article-content :deep(figcaption) { color: var(--secondary); font-size: 12px; text-align: center; }
.blog-article-content :deep(blockquote) { margin: 1.5em 0; padding: 16px 20px; border-left: 3px solid #009440; border-radius: 0 8px 8px 0; background: var(--panel-soft); color: var(--secondary); }.blog-article-content :deep(blockquote p:last-child) { margin-bottom: 0; }
.blog-article-content :deep(:is(.blog-table-block,.table-wrapper)) { max-width: 100%; overflow-x: auto; margin: 1.4em 0; overscroll-behavior-inline: contain; }
.blog-article-content :deep(table) { display: block; max-width: 100%; overflow-x: auto; width: 100%; margin: 1em 0; border-collapse: collapse; font-size: 13px; overscroll-behavior-inline: contain; }.blog-article-content :deep(:is(th,td)) { min-width: 80px; padding: 10px 12px; border: 1px solid var(--border); text-align: left; overflow-wrap: anywhere; }.blog-article-content :deep(th) { background: #08633b; color: #fff; font-weight: 800; }.blog-article-content :deep(tbody tr:nth-child(even)) { background: var(--panel-soft); }
.blog-article-content :deep(pre) { max-width: 100%; overflow-x: auto; margin: 1em 0; padding: 16px; border: 1px solid var(--border); border-radius: 8px; background: var(--panel-soft); font-size: 12px; }.blog-article-content :deep(code) { overflow-wrap: normal; }.blog-article-content :deep(hr) { margin: 2em 0; border: 0; border-top: 1px solid var(--border); }
.blog-article-content :deep(:is(iframe,video)) { display: block; width: 100%; max-width: 100%; aspect-ratio: 16/9; height: auto; border-radius: 8px; }.blog-article-content :deep(summary) { cursor: pointer; font-weight: 700; color: var(--heading); }.blog-article-content :deep(details) { margin: 12px 0; padding: 14px; border: 1px solid var(--border); border-radius: 8px; background: var(--panel-soft); }.blog-article-content :deep(details[open] summary) { margin-bottom: 12px; }.blog-article-content :deep(details p:last-child) { margin-bottom: 0; }
.blog-article-content :deep(:is(.blog-button-link,.blog-slot-demo-link)) { display: inline-flex; align-items: center; justify-content: center; min-height: 42px; margin: 8px 4px 8px 0; padding: 8px 18px; border-radius: 7px; background: #009440; color: #fff; text-decoration: none; font-size: 14px; font-weight: 700; }.blog-article-content :deep(.blog-slot-demo-actions) { display: flex; flex-wrap: wrap; gap: 8px; }
.blog-article__footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid var(--border); }.blog-tags { display: flex; flex-wrap: wrap; gap: 7px; margin-bottom: 16px; }.blog-tags span { max-width: 100%; padding: 5px 9px; border-radius: 5px; background: var(--panel-soft); color: var(--secondary); font-size: 11px; overflow-wrap: anywhere; }.blog-article__updated { margin: 12px 0; color: var(--secondary); font-size: 11px; }
.blog-author { display: flex; flex-direction: column; gap: 4px; margin: 20px 0; padding: 16px; border: 1px solid var(--border); border-radius: 9px; background: var(--panel-soft); }.blog-author strong { color: var(--heading); font-size: 14px; }.blog-author span { color: var(--secondary); font-size: 12px; }.blog-author p { margin: 6px 0 0; color: var(--secondary); font-size: 13px; line-height: 1.7; white-space: pre-line; }
.blog-back-link { display: inline-flex; align-items: center; gap: 8px; margin-top: 10px; color: #45d892; font-size: 13px; font-weight: 700; }
.blog-related { min-width: 0; overflow: hidden; border: 1px solid var(--border); border-radius: 12px; background: var(--surface); }.blog-related h2 { margin: 0; padding: 15px; border-bottom: 1px solid var(--border); color: var(--heading); font-size: 17px; font-weight: 800; }.blog-related__item { display: flex; align-items: center; min-width: 0; gap: 10px; padding: 14px; border-bottom: 1px solid var(--border); }.blog-related__item:last-child { border-bottom: 0; }.blog-related__item:hover { background: var(--panel-soft); }.blog-related__image { flex: 0 0 54px; width: 54px; height: 54px; overflow: hidden; border-radius: 7px; }.blog-related__item>div:nth-child(2) { flex: 1; min-width: 0; }.blog-related__item strong { display: block; color: var(--heading); font-size: 12px; line-height: 1.5; overflow-wrap: anywhere; }.blog-related__item span { display: block; margin-top: 5px; color: var(--secondary); font-size: 11px; }.blog-related__item>svg { flex-shrink: 0; color: var(--secondary); }
.blog-detail-state { display: flex; flex-direction: column; align-items: center; gap: 18px; min-height: 300px; padding: 40px 20px; border: 1px solid var(--border); border-radius: 12px; background: var(--surface); color: var(--secondary); text-align: center; }.blog-detail-state h1 { margin: 0; color: var(--heading); font-size: 20px; font-weight: 700; }.blog-detail-state :is(button,a) { display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; border-radius: 8px; background: #009440; color: #fff; font-size: 14px; font-weight: 700; }
.blog-detail-loading { min-height: 420px; padding: 0 0 20px; border: 1px solid var(--border); border-radius: 12px; background: var(--surface); }.blog-detail-loading>span:first-child { display: block; width: 100%; height: 220px; border-radius: 12px 12px 0 0; background: #20332a; }.blog-detail-loading>i { display: block; width: 70%; height: 14px; margin: 22px; border-radius: 5px; background: #2e4437; }.blog-detail-loading>i:last-of-type { width: 50%; }
.blog-detail-page :is(a,button):focus-visible,.blog-article-content :deep(:is(a,button,summary):focus-visible) { outline: 2px solid #009440; outline-offset: 3px; }
html[data-theme='light'] .blog-article__category { color: #007e36; background: #e5f5eb; }html[data-theme='light'] .blog-back-link { color: #008039; }html[data-theme='light'] .blog-article-content :deep(a) { color: #007d36; }html[data-theme='light'] .blog-article-content :deep(a:hover) { color: #005f29; }html[data-theme='light'] .blog-article-content :deep(:is(.blog-button-link,.blog-slot-demo-link)) { color: #fff; }
html[data-theme='light'] .blog-detail-loading>span:first-child { background: #e3f0e8; }html[data-theme='light'] .blog-detail-loading>i { background: #b8d1c1; }
@media (max-width: 63.99rem) {
  .blog-detail-content { padding: 0 10px 16px; }.blog-banner { height: auto; aspect-ratio: 2/1; border-radius: 12px; }.blog-detail-columns,.blog-detail-columns--related { grid-template-columns: minmax(0,1fr); gap: 12px; margin-top: 10px; }.blog-article { padding: 20px 16px; }.blog-article h1 { font-size: 25px; line-height: 1.3; }.blog-article__header { margin-bottom: 20px; padding-bottom: 18px; }.blog-article__metadata { font-size: 11px; gap: 7px 12px; margin-top: 12px; }.blog-article__excerpt { font-size: 14px; }.blog-article-content { font-size: 15px; line-height: 1.8; }.blog-article-content :deep(h2) { font-size: 21px; }.blog-article-content :deep(h3) { font-size: 18px; }.blog-article-content :deep(:is(th,td)) { padding: 8px; }.blog-article-content :deep(blockquote) { padding: 12px 14px; }.blog-related h2 { font-size: 18px; }.blog-related__item strong { font-size: 14px; }.blog-related__image { flex-basis: 64px; width: 64px; height: 64px; }.blog-detail-state { margin: 0 10px; }.blog-detail-loading { margin: 0 10px; }
}
@media (max-width: 359px) { .blog-article { padding: 18px 12px; }.blog-article h1 { font-size: 22px; }.blog-article-content { font-size: 14px; } }
@media (prefers-reduced-motion: no-preference) { .blog-detail-loading { animation: blog-detail-pulse 1.5s ease-in-out infinite alternate; }@keyframes blog-detail-pulse { to { opacity: .55; } } }
</style>
