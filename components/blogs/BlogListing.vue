<script setup lang="ts">
import { ArrowRight, BookOpen, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-vue-next'
import BlogHeader from './BlogHeader.vue'
import BlogImage from './BlogImage.vue'
import { formatBlogReadTime } from './formatReadTime'
import type { BlogCategory, BlogPost } from '~/types/blog'

interface BlogListResponse {
  ok: boolean
  blogs: BlogPost[]
  categories: BlogCategory[]
  pagination: { total: number; count: number; page: number; totalPages: number; category: string | null }
}

const route = useRoute()
const config = useRuntimeConfig()
const { locale } = useSiteLocale()
const copy = computed(() => locale.value === 'pt' ? {
  title: 'Blog', intro: 'Novidades, guias e histórias da 2bet.', all: 'Todos', featured: 'Em destaque',
  latest: 'Últimos artigos', read: 'Ler artigo', empty: 'Nenhum artigo publicado ainda.',
  emptyCategory: 'Nenhum artigo nesta categoria ainda.', emptyHint: 'Volte em breve para conferir novidades.',
  error: 'Não foi possível carregar os artigos.', retry: 'Tentar novamente', previous: 'Página anterior', next: 'Próxima página',
  page: 'Página', of: 'de', loading: 'Carregando artigos', categories: 'Categorias do blog',
} : {
  title: 'Blog', intro: 'News, guides and stories from 2bet.', all: 'All', featured: 'Featured',
  latest: 'Latest articles', read: 'Read article', empty: 'No articles published yet.',
  emptyCategory: 'No articles in this category yet.', emptyHint: 'Check back soon for something new.',
  error: 'We could not load the articles.', retry: 'Try again', previous: 'Previous page', next: 'Next page',
  page: 'Page', of: 'of', loading: 'Loading articles', categories: 'Blog categories',
})
const category = computed(() => typeof route.params.category === 'string' ? route.params.category : '')
const page = computed(() => Math.max(1, Math.min(10000, Number.parseInt(String(route.query.page || '1'), 10) || 1)))
const query = computed(() => ({ count: 12, page: page.value, ...(category.value ? { category: category.value } : {}) }))
const { data, error, status, refresh } = await useFetch<BlogListResponse>('/api/blogs', { query })
const posts = computed(() => data.value?.blogs || [])
const categories = computed(() => data.value?.categories || [])
const pagination = computed(() => data.value?.pagination)
const featured = computed(() => posts.value.slice(0, 4))
const groups = computed(() => {
  const groups = new Map<string, { name: string; slug: string; posts: BlogPost[] }>()
  for (const post of posts.value) {
    const slug = post.category?.slug || ''
    if (!groups.has(slug)) groups.set(slug, { name: post.category?.name || copy.value.latest, slug, posts: [] })
    groups.get(slug)!.posts.push(post)
  }
  return [...groups.values()]
})
const featuredTrack = ref<HTMLElement | null>(null)
const scrollFeatured = (direction: number) => {
  const track = featuredTrack.value
  if (!track) return
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  track.scrollBy({ left: direction * track.clientWidth * .8, behavior: reduceMotion ? 'auto' : 'smooth' })
}
const categoryLink = (slug: string) => ({ path: slug ? `/blogs/${encodeURIComponent(slug)}` : '/blogs' })
const pageLink = (number: number) => ({ ...categoryLink(category.value), query: number > 1 ? { page: number } : {} })
const postDate = (post: BlogPost) => {
  if (!post.publishedAt) return post.date
  const date = new Date(post.publishedAt)
  return Number.isNaN(date.getTime()) ? post.date : new Intl.DateTimeFormat(locale.value === 'pt' ? 'pt-BR' : 'en', { dateStyle: 'medium', timeZone: 'UTC' }).format(date)
}
const siteUrl = computed(() => String(config.public.siteUrl || 'https://2bet.com').replace(/\/+$/, ''))
const title = computed(() => locale.value === 'pt' ? 'Blog — Novidades e Guias | 2bet' : 'Blog — News and Guides | 2bet')
useSeoMeta({ title, ogTitle: title, twitterTitle: title, description: () => copy.value.intro, ogDescription: () => copy.value.intro, twitterDescription: () => copy.value.intro, ogType: 'website', twitterCard: 'summary_large_image' })
useHead(() => ({ link: [{ rel: 'canonical', href: `${siteUrl.value}${categoryLink(category.value).path}${page.value > 1 ? `?page=${page.value}` : ''}` }] }))
watch([page, category], () => featuredTrack.value?.scrollTo({ left: 0 }))
</script>

<template>
  <div class="blog-list-page">
    <BlogHeader :title="copy.title" heading />
    <div class="blog-list-content">
      <nav class="blog-categories" :aria-label="copy.categories">
        <NuxtLink :to="categoryLink('')" :aria-current="!category ? 'page' : undefined">{{ copy.all }}</NuxtLink>
        <NuxtLink v-for="item in categories" :key="item.id || item.slug" :to="categoryLink(item.slug)" :aria-current="category === item.slug || category === item.id ? 'page' : undefined">{{ item.name }}</NuxtLink>
      </nav>

      <div v-if="status === 'pending'" class="blog-loading" role="status" :aria-label="copy.loading">
        <div v-for="index in 4" :key="index" class="blog-loading__card"><span /><i /><i /></div>
        <span class="sr-only">{{ copy.loading }}</span>
      </div>
      <div v-else-if="error" class="blog-state" role="alert">
        <BookOpen :size="38" aria-hidden="true" /><h2>{{ copy.error }}</h2>
        <button type="button" @click="refresh()"><RefreshCw :size="16" aria-hidden="true" />{{ copy.retry }}</button>
      </div>
      <div v-else-if="!posts.length" class="blog-state">
        <BookOpen :size="42" aria-hidden="true" /><h2>{{ category ? copy.emptyCategory : copy.empty }}</h2><p>{{ copy.emptyHint }}</p>
        <NuxtLink v-if="category" to="/blogs">{{ copy.all }} <ArrowRight :size="16" aria-hidden="true" /></NuxtLink>
      </div>
      <template v-else>
        <section class="blog-featured" :aria-label="copy.featured">
          <div ref="featuredTrack" class="blog-featured__track">
            <NuxtLink v-for="(post, index) in featured" :key="post.id || post.slug" :to="`/blog/${encodeURIComponent(post.slug)}`" class="blog-featured-card">
              <div class="blog-featured-card__image"><BlogImage :src="post.featuredImage" :alt="post.title" :eager="index < 2" /></div>
              <div class="blog-featured-card__copy"><strong>{{ post.title }}</strong><span>{{ postDate(post) }}<template v-if="post.readTime"> · {{ formatBlogReadTime(post.readTime, locale) }}</template></span></div>
            </NuxtLink>
          </div>
          <template v-if="featured.length > 1">
            <button type="button" class="blog-featured__arrow blog-featured__arrow--previous" :aria-label="copy.previous" @click="scrollFeatured(-1)"><ChevronLeft :size="18" aria-hidden="true" /></button>
            <button type="button" class="blog-featured__arrow blog-featured__arrow--next" :aria-label="copy.next" @click="scrollFeatured(1)"><ChevronRight :size="18" aria-hidden="true" /></button>
          </template>
        </section>

        <div class="blog-groups">
          <section v-for="group in groups" :key="group.slug" class="blog-group">
            <NuxtLink :to="categoryLink(group.slug)" class="blog-group__heading"><h2>{{ group.name }}</h2><ChevronRight :size="18" aria-hidden="true" /></NuxtLink>
            <NuxtLink v-for="post in group.posts" :key="post.id || post.slug" :to="`/blog/${encodeURIComponent(post.slug)}`" class="blog-post-row">
              <div class="blog-post-row__image"><BlogImage :src="post.featuredImage" :alt="post.title" /></div>
              <div class="blog-post-row__copy"><h3>{{ post.title }}</h3><p>{{ post.excerpt }}</p><small>{{ postDate(post) }}<template v-if="post.author"> · {{ post.author }}</template></small></div>
              <span class="blog-post-row__details">{{ copy.read }}<ChevronRight :size="14" aria-hidden="true" /></span>
            </NuxtLink>
          </section>
        </div>

        <nav v-if="pagination && pagination.totalPages > 1" class="blog-pagination" :aria-label="locale === 'pt' ? 'Paginação do blog' : 'Blog pagination'">
          <NuxtLink v-if="page > 1" :to="pageLink(page - 1)" :aria-label="copy.previous"><ChevronLeft :size="18" aria-hidden="true" /></NuxtLink><span v-else class="blog-pagination__disabled" aria-hidden="true"><ChevronLeft :size="18" /></span>
          <span>{{ copy.page }} {{ page }} {{ copy.of }} {{ pagination.totalPages }}</span>
          <NuxtLink v-if="page < pagination.totalPages" :to="pageLink(page + 1)" :aria-label="copy.next"><ChevronRight :size="18" aria-hidden="true" /></NuxtLink><span v-else class="blog-pagination__disabled" aria-hidden="true"><ChevronRight :size="18" /></span>
        </nav>
      </template>
    </div>
  </div>
</template>

<style scoped>
.blog-list-page { width: 100%; min-width: 0; color: var(--text); }
.blog-list-content { min-width: 0; }
.blog-categories { display: flex; align-items: center; gap: 6px; overflow-x: auto; margin-bottom: 9px; padding: 6px 8px; border: 1px solid var(--border); border-radius: 10px; background: var(--surface); scrollbar-width: none; overscroll-behavior-inline: contain; }
.blog-categories::-webkit-scrollbar,.blog-featured__track::-webkit-scrollbar { display: none; }
.blog-categories a { flex: 0 0 auto; padding: 5px 14px; border-radius: 999px; color: var(--secondary); font-size: 13px; font-weight: 700; line-height: 1.5; white-space: nowrap; }
.blog-categories a:hover { color: var(--heading); background: var(--panel-soft); }
.blog-categories a[aria-current='page'] { background: #009440; color: #fff; }
.blog-featured { position: relative; margin-bottom: 12px; }
.blog-featured__track { display: grid; grid-auto-flow: column; grid-auto-columns: calc((100% - 24px) / 4); gap: 8px; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; overscroll-behavior-inline: contain; }
.blog-featured-card { min-width: 0; overflow: hidden; border: 1px solid #177e4b4d; border-radius: 10px; background: #015d25; color: #fff; scroll-snap-align: start; }
.blog-featured-card__image { aspect-ratio: 2.08 / 1; overflow: hidden; }
.blog-featured-card__copy { display: flex; flex-direction: column; gap: 4px; padding: 10px 12px; }
.blog-featured-card__copy strong { display: -webkit-box; overflow: hidden; -webkit-line-clamp: 2; -webkit-box-orient: vertical; min-height: 38px; font-size: 14px; font-weight: 800; line-height: 19px; overflow-wrap: anywhere; }
.blog-featured-card__copy span { color: #ffffffb8; font-size: 11px; line-height: 1.5; }
.blog-featured__arrow { position: absolute; z-index: 2; top: 30%; display: grid; place-items: center; width: 30px; height: 30px; border: 1px solid #ffffff1a; border-radius: 50%; background: #111c15e6; color: #fff; box-shadow: 0 2px 8px #0004; }
.blog-featured__arrow--previous { left: 7px; }.blog-featured__arrow--next { right: 7px; }
.blog-groups { display: grid; gap: 10px; }
.blog-group { min-width: 0; overflow: hidden; border: 1px solid var(--border); border-radius: 10px; background: var(--surface); }
.blog-group__heading { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 12px 15px; color: var(--heading); border-bottom: 1px solid var(--border); }
.blog-group__heading h2 { margin: 0; font-size: 17px; font-weight: 800; overflow-wrap: anywhere; }
.blog-post-row { display: flex; align-items: center; gap: 13px; min-width: 0; padding: 12px 15px; border-bottom: 1px solid var(--border); }
.blog-post-row:last-child { border-bottom: 0; }.blog-post-row:hover { background: var(--panel-soft); }
.blog-post-row__image { flex: 0 0 88px; width: 88px; height: 68px; overflow: hidden; border-radius: 8px; }
.blog-post-row__copy { flex: 1; min-width: 0; }
.blog-post-row__copy h3 { margin: 0; font-size: 15px; font-weight: 800; line-height: 1.4; color: var(--heading); overflow-wrap: anywhere; }
.blog-post-row__copy p { overflow: hidden; margin: 4px 0; color: var(--secondary); font-size: 12px; line-height: 1.5; text-overflow: ellipsis; white-space: nowrap; }
.blog-post-row__copy small { display: block; color: var(--secondary); font-size: 11px; line-height: 1.5; }
.blog-post-row__details { display: flex; align-items: center; gap: 4px; flex-shrink: 0; border-radius: 7px; padding: 7px 9px; background: #252c27; color: #b4c9bd; font-size: 12px; font-weight: 700; }
.blog-pagination { display: flex; justify-content: center; align-items: center; gap: 18px; padding: 22px 0; font-size: 13px; color: var(--secondary); }
.blog-pagination a,.blog-pagination__disabled { display: grid; place-items: center; width: 36px; height: 36px; border: 1px solid var(--border); border-radius: 8px; background: var(--surface); color: var(--heading); }.blog-pagination__disabled { opacity: .35; }
.blog-state { display: flex; align-items: center; flex-direction: column; justify-content: center; min-height: 300px; gap: 14px; padding: 40px 20px; border: 1px solid var(--border); border-radius: 12px; background: var(--surface); color: var(--secondary); text-align: center; }
.blog-state h2 { margin: 0; font-size: 18px; font-weight: 700; color: var(--heading); }.blog-state p { margin: 0; font-size: 14px; }
.blog-state button,.blog-state>a { display: flex; align-items: center; gap: 8px; padding: 10px 16px; border-radius: 8px; background: #009440; color: #fff; font-size: 14px; font-weight: 700; }
.blog-loading { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 10px; }
.blog-loading__card { overflow: hidden; padding-bottom: 15px; border-radius: 10px; background: var(--surface); border: 1px solid var(--border); }
.blog-loading__card span { display: block; aspect-ratio: 2/1; background: #20332a; }.blog-loading__card i { display: block; height: 10px; width: 75%; margin: 14px 12px 0; border-radius: 4px; background: #2e4437; }.blog-loading__card i:last-child { width: 45%; }
.blog-list-page :is(a,button):focus-visible { outline: 2px solid #009440; outline-offset: 3px; }
html[data-theme='light'] .blog-featured-card { border-color: #00944033; box-shadow: 0 2px 6px #10261c0a; }
html[data-theme='light'] .blog-post-row__details { background: #eaf5ee; color: #008039; }
html[data-theme='light'] .blog-featured__arrow { background: #fffffff2; color: #10261c; border-color: #d8e2dc; }
html[data-theme='light'] .blog-loading__card span { background: #e3f0e8; }html[data-theme='light'] .blog-loading__card i { background: #b8d1c1; }
@media (max-width: 63.99rem) {
  .blog-list-content { padding: 0 10px 16px; }.blog-categories { padding: 7px; min-height: 46px; border-radius: 12px; }.blog-categories a { font-size: 14px; }
  .blog-featured__track { grid-auto-columns: 76%; gap: 8px; }.blog-featured-card { border-radius: 14px; }.blog-featured-card__copy strong { font-size: 16px; line-height: 22px; min-height: 44px; }.blog-featured-card__copy span { font-size: 12px; }
  .blog-featured__arrow--previous { display: none; }.blog-featured__arrow { width: 32px; height: 32px; }
  .blog-group__heading { padding: 12px; }.blog-group__heading h2 { font-size: 18px; }.blog-post-row { padding: 12px; gap: 10px; }.blog-post-row__image { flex-basis: 64px; width: 64px; height: 64px; }.blog-post-row__copy h3 { font-size: 14px; }.blog-post-row__copy p { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; white-space: normal; font-size: 12px; }.blog-post-row__copy small { font-size: 10px; }.blog-post-row__details { width: 24px; padding: 5px; overflow: hidden; font-size: 0; gap: 0; }.blog-post-row__details svg { flex-shrink: 0; }
  .blog-loading { grid-template-columns: repeat(2,minmax(0,1fr)); }
}
@media (prefers-reduced-motion: no-preference) { .blog-loading__card { animation: blog-pulse 1.5s ease-in-out infinite alternate; } @keyframes blog-pulse { to { opacity: .55; } } }
</style>
