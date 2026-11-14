<script setup lang="ts">
import {
  ArrowLeft, ArrowRight, Bell, BookOpen, Bookmark, Check, ChevronRight, Clock3,
  Copy, ExternalLink, Gift, Globe, Home, Radio, RefreshCw, Send,
  Share2, Sparkles, Users,
} from 'lucide-vue-next'
import BlogHeader from './BlogHeader.vue'
import BlogImage from './BlogImage.vue'
import { formatBlogReadTime } from './formatReadTime'
import type { BlogPost } from '~/types/blog'
import { extractBlogFaqSchema } from '~/utils/blog-content'
import { buildBybetRedirectUrl } from '~/utils/sportsRedirect'

interface BlogDetailResponse {
  ok: boolean
  blog: BlogPost & {
    contentHtml: string
    seoTitle: string
    seoDescription: string
    faq_schema?: any
    faqSchema?: any
  }
  related: BlogPost[]
  faq_schema?: any
  faqSchema?: any
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
  blog: 'Blog', home: 'Início', breadcrumbs: 'Navegação estrutural', back: 'Todos os artigos', related: 'Leia também', by: 'Por', updated: 'Atualizado em',
  error: 'Não foi possível carregar este artigo.', retry: 'Tentar novamente', loading: 'Carregando artigo',
  author: 'Sobre o autor',
  writerBadge: 'BYGAME WRITER',
  writerRole: 'ByGame Writer',
  followAuthor: 'Seguir autor:',
  defaultBio: 'Escritor de blog digital que compartilha guias online simples, análises de plataformas, notas técnicas e dicas diárias para leitores que desejam informações claras e fáceis de acompanhar.',
  disclaimerTitle: 'Disclaimer',
  disclaimerText: 'Deve ter 19 anos ou mais para entrar no cassino. Indivíduos proibidos de frequentar locais de jogos não têm permissão para acessar as propriedades ou participar de concursos ou promoções.',
  shareTitle: 'Compartilhe este artigo nas redes sociais',
  copyLink: 'Copiar Link',
  copied: 'Link Copiado!',
  channelsTitle: 'Siga-nos nos canais oficiais',
  channelsSubtitle: 'Receba códigos Ang Pao diários, anúncios promocionais e dicas VIP!',
  activeMembers: '50K+ Membros Ativos',
  telegramTitle: 'Telegram Oficial',
  telegramDesc: 'Sorteios de Códigos Diários',
  facebookTitle: 'Comunidade Facebook',
  facebookDesc: 'Vencedores e Notícias',
  vipTitle: 'Grupo VIP High Roller',
  vipDesc: 'Cashback e Vantagens Exclusivas',
  ctaTitle: 'Pronto para testar esta estratégia vencedora?',
  ctaSubtitle: 'Reivindique seu bônus de boas-vindas grátis de ₱180 no seu primeiro jogo!',
  playNow: 'JOGAR AGORA',
} : {
  blog: 'Blog', home: 'Home', breadcrumbs: 'Breadcrumbs', back: 'All articles', related: 'Read next', by: 'By', updated: 'Updated',
  error: 'We could not load this article.', retry: 'Try again', loading: 'Loading article',
  author: 'About The Author',
  writerBadge: 'BYGAME WRITER',
  writerRole: 'ByGame Writer',
  followAuthor: 'Follow Author:',
  defaultBio: 'Casual digital blog writer sharing simple online guides, platform reviews, tech notes, and everyday internet tips for readers who want clear and easy-to-follow information.',
  disclaimerTitle: 'Disclaimer',
  disclaimerText: 'Must be 19 years of age or older to enter the casino. Individuals who are prohibited from attending Ontario gaming sites are not permitted to enter the properties or participate in contests or promotions.',
  shareTitle: 'Share This Article On Social Media',
  copyLink: 'Copy Link',
  copied: 'Link Copied!',
  channelsTitle: 'Follow Us On Official Channels',
  channelsSubtitle: 'Get daily Ang Pao codes, promo announcements, and VIP tips!',
  activeMembers: '50K+ Active Members',
  telegramTitle: 'Telegram Official',
  telegramDesc: 'Daily Code Giveaways',
  facebookTitle: 'Facebook Community',
  facebookDesc: 'Winners & Event News',
  vipTitle: 'VIP High Roller Group',
  vipDesc: 'Exclusive Cashback & Perks',
  ctaTitle: 'Ready to test this winning strategy?',
  ctaSubtitle: 'Claim your ₱180 free Welcome Bonus on your first game!',
  playNow: 'PLAY NOW',
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
const playNowUrl = computed(() => buildBybetRedirectUrl('login'))

const copied = ref(false)
let copyTimeout: ReturnType<typeof setTimeout> | null = null
const copyArticleLink = async () => {
  try {
    const url = typeof window !== 'undefined' ? window.location.href : canonical.value
    await navigator.clipboard.writeText(url)
    copied.value = true
    if (copyTimeout) clearTimeout(copyTimeout)
    copyTimeout = setTimeout(() => { copied.value = false }, 2000)
  } catch {
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }
}

const shareLinks = computed(() => {
  const url = encodeURIComponent(canonical.value)
  const title = encodeURIComponent(post.value?.title || '')
  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    telegram: `https://t.me/share/url?url=${url}&text=${title}`,
    twitter: `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
    whatsapp: `https://api.whatsapp.com/send?text=${title}%20${url}`,
  }
})

const faqSchema = computed(() => (post.value ? extractBlogFaqSchema(post.value, canonical.value, data.value) : null))

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
  script: post.value && !isNoIndex.value ? [{ key: 'blog-article-schema', type: 'application/ld+json', children: JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BlogPosting',
        '@id': `${canonical.value}#article`,
        headline: post.value.title,
        description: description.value,
        url: canonical.value,
        mainEntityOfPage: canonical.value,
        image: post.value.featuredImage || `${siteUrl.value}/brand/2bet-logo.webp`,
        datePublished: post.value.publishedAt || undefined,
        dateModified: post.value.updatedAt || post.value.publishedAt || undefined,
        articleSection: post.value.category?.name || undefined,
        keywords: post.value.tags?.length ? post.value.tags.map(t => t.name).join(', ') : undefined,
        author: {
          '@type': 'Person',
          name: post.value.writer?.name || post.value.author || String(config.public.siteName || '2bet'),
          jobTitle: post.value.writer?.role_name || undefined,
          image: post.value.writer?.profile_image || undefined,
        },
        publisher: {
          '@type': 'Organization',
          name: String(config.public.siteName || '2bet'),
          url: siteUrl.value,
          logo: {
            '@type': 'ImageObject',
            url: `${siteUrl.value}/brand/2bet-logo.webp`,
          },
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl.value },
          { '@type': 'ListItem', position: 2, name: copy.value.blog, item: `${siteUrl.value}/blogs` },
          ...(post.value.category ? [
            {
              '@type': 'ListItem',
              position: 3,
              name: post.value.category.name,
              item: `${siteUrl.value}/blogs/${encodeURIComponent(post.value.category.slug)}`,
            },
            {
              '@type': 'ListItem',
              position: 4,
              name: post.value.title,
              item: canonical.value,
            },
          ] : [
            {
              '@type': 'ListItem',
              position: 3,
              name: post.value.title,
              item: canonical.value,
            },
          ]),
        ],
      },
      ...(faqSchema.value ? [faqSchema.value] : []),
    ],
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
        <nav class="blog-breadcrumbs" :aria-label="copy.breadcrumbs">
          <NuxtLink to="/" class="blog-breadcrumbs__item">
            <Home :size="13" aria-hidden="true" />
            <span>{{ copy.home }}</span>
          </NuxtLink>
          <ChevronRight :size="12" class="blog-breadcrumbs__separator" aria-hidden="true" />
          <NuxtLink to="/blogs" class="blog-breadcrumbs__item">{{ copy.blog }}</NuxtLink>
          <template v-if="post.category">
            <ChevronRight :size="12" class="blog-breadcrumbs__separator" aria-hidden="true" />
            <NuxtLink :to="`/blogs/${encodeURIComponent(post.category.slug)}`" class="blog-breadcrumbs__item">
              {{ post.category.name }}
            </NuxtLink>
          </template>
          <ChevronRight :size="12" class="blog-breadcrumbs__separator" aria-hidden="true" />
          <span class="blog-breadcrumbs__current" aria-current="page">{{ post.title }}</span>
        </nav>
        <div class="blog-banner"><BlogImage :src="post.featuredImage" :alt="post.title" eager /></div>
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
            <NuxtLink to="/blogs" class="blog-back-link"><ArrowLeft :size="16" aria-hidden="true" />{{ copy.back }}</NuxtLink>
          </footer>
        </article>

            <!-- 1. Disclaimer Box -->
            <div class="blog-disclaimer">
              <div class="blog-disclaimer__header">
                <Sparkles :size="16" aria-hidden="true" />
                <h3>{{ copy.disclaimerTitle }}</h3>
              </div>
              <p>{{ copy.disclaimerText }}</p>
            </div>

            <!-- 2. Share This Article On Social Media -->
            <section class="blog-share" :aria-label="copy.shareTitle">
              <div class="blog-share__header">
                <Share2 :size="16" aria-hidden="true" />
                <h3>{{ copy.shareTitle }}</h3>
              </div>
              <div class="blog-share__buttons">
                <a :href="shareLinks.facebook" target="_blank" rel="noopener noreferrer" class="blog-share__btn blog-share__btn--facebook" aria-label="Share on Facebook">
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  <span>Facebook</span>
                </a>
                <a :href="shareLinks.telegram" target="_blank" rel="noopener noreferrer" class="blog-share__btn blog-share__btn--telegram" aria-label="Share on Telegram">
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z"/></svg>
                  <span>Telegram</span>
                </a>
                <a :href="shareLinks.twitter" target="_blank" rel="noopener noreferrer" class="blog-share__btn blog-share__btn--x" aria-label="Share on X">
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  <span>X (Twitter)</span>
                </a>
                <a :href="shareLinks.whatsapp" target="_blank" rel="noopener noreferrer" class="blog-share__btn blog-share__btn--whatsapp" aria-label="Share on WhatsApp">
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                  <span>WhatsApp</span>
                </a>
                <button type="button" class="blog-share__btn blog-share__btn--copy" @click="copyArticleLink">
                  <component :is="copied ? Check : Copy" :size="15" aria-hidden="true" />
                  <span>{{ copied ? copy.copied : copy.copyLink }}</span>
                </button>
              </div>
            </section>

            <!-- 3. About The Author -->
            <section class="blog-author-box" :aria-label="copy.author">
              <div class="blog-author-box__top">
                <div class="blog-author-box__title">
                  <Bookmark :size="16" aria-hidden="true" />
                  <h3>{{ copy.author }}</h3>
                </div>
                <span class="blog-author-box__badge"><Check :size="11" aria-hidden="true" /> {{ post.writer?.role_name || copy.writerBadge }}</span>
              </div>
              <div class="blog-author-box__body">
                <div class="blog-author-box__avatar-wrap">
                  <img :src="post.writer?.profile_image || '/brand/2bet-logo.webp'" :alt="post.writer?.name || post.author || copy.author" class="blog-author-box__avatar">
                  <span class="blog-author-box__verified" title="Verified Writer"><Check :size="11" aria-hidden="true" /></span>
                </div>
                <div class="blog-author-box__content">
                  <h4 class="blog-author-box__name">{{ post.writer?.name || post.author }}</h4>
                  <span class="blog-author-box__role">{{ post.writer?.role_name || copy.writerRole }}</span>
                  <p class="blog-author-box__bio">{{ post.writer?.bio || copy.defaultBio }}</p>
                  <div class="blog-author-box__social">
                    <span>{{ copy.followAuthor }}</span>
                    <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer">
                      <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                      <span>Facebook</span>
                      <ExternalLink :size="11" aria-hidden="true" />
                    </a>
                  </div>
                </div>
              </div>
            </section>

        <!-- 4. Follow Us On Official Channels -->
        <!-- <section class="blog-channels" :aria-label="copy.channelsTitle">
          <div class="blog-channels__header">
            <div class="blog-channels__title-wrap">
              <h3><Radio :size="16" aria-hidden="true" /> {{ copy.channelsTitle }}</h3>
              <p>{{ copy.channelsSubtitle }}</p>
            </div>
            <span class="blog-channels__badge"><Bell :size="14" aria-hidden="true" /> {{ copy.activeMembers }}</span>
          </div>
          <div class="blog-channels__grid">
            <a href="https://t.me/bybet_official" target="_blank" rel="noopener noreferrer" class="blog-channel-card">
              <div class="blog-channel-card__icon blog-channel-card__icon--telegram">
                <Send :size="18" aria-hidden="true" />
              </div>
              <div class="blog-channel-card__info">
                <strong>{{ copy.telegramTitle }}</strong>
                <span>{{ copy.telegramDesc }}</span>
              </div>
              <ArrowRight :size="15" aria-hidden="true" />
            </a>
            <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" class="blog-channel-card">
              <div class="blog-channel-card__icon blog-channel-card__icon--facebook">
                <Globe :size="18" aria-hidden="true" />
              </div>
              <div class="blog-channel-card__info">
                <strong>{{ copy.facebookTitle }}</strong>
                <span>{{ copy.facebookDesc }}</span>
              </div>
              <ArrowRight :size="15" aria-hidden="true" />
            </a>
            <a :href="playNowUrl" target="_blank" rel="noopener noreferrer" class="blog-channel-card">
              <div class="blog-channel-card__icon blog-channel-card__icon--vip">
                <Users :size="18" aria-hidden="true" />
              </div>
              <div class="blog-channel-card__info">
                <strong>{{ copy.vipTitle }}</strong>
                <span>{{ copy.vipDesc }}</span>
              </div>
              <ArrowRight :size="15" aria-hidden="true" />
            </a>
          </div>
        </section> -->

        <!-- 5. CTA Play Now Banner -->
        <section class="blog-cta" :aria-label="copy.ctaTitle">
          <div class="blog-cta__copy">
            <strong>{{ copy.ctaTitle }}</strong>
            <p>{{ copy.ctaSubtitle }}</p>
          </div>
          <a :href="playNowUrl" target="_blank" rel="noopener noreferrer" class="blog-cta__btn">
            <Gift :size="18" aria-hidden="true" />
            <span>{{ copy.playNow }}</span>
            <ArrowRight :size="16" aria-hidden="true" />
          </a>
        </section>

        <!-- Read Next -->
        <aside v-if="related.length" class="blog-related" :aria-label="copy.related">
          <h2>{{ copy.related }}</h2>
          <div class="blog-related__grid">
            <NuxtLink v-for="item in related" :key="item.id || item.slug" :to="`/blog/${encodeURIComponent(item.slug)}`" class="blog-related__item">
              <div class="blog-related__image"><BlogImage :src="item.featuredImage" :alt="item.title" /></div>
              <div class="blog-related__content">
                <strong>{{ item.title }}</strong>
                <div class="blog-related__meta">
                  <span>{{ item.category?.name || formatBlogReadTime(item.readTime, locale) }}</span>
                  <ArrowRight :size="14" aria-hidden="true" />
                </div>
              </div>
            </NuxtLink>
          </div>
        </aside>
      </div>
    </template>
  </div>
</template>

<style scoped>
.blog-detail-page { width: 100%; min-width: 0; color: var(--text); }
.blog-detail-content { min-width: 0; }
.blog-breadcrumbs { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; padding: 8px 12px; border: 1px solid var(--border); border-radius: 10px; background: var(--surface); font-size: 12px; color: var(--secondary); }
.blog-breadcrumbs__item { display: inline-flex; align-items: center; gap: 5px; color: var(--secondary); text-decoration: none; font-weight: 600; transition: color .15s ease; }
.blog-breadcrumbs__item:hover { color: #45d892; }
.blog-breadcrumbs__separator { flex-shrink: 0; opacity: 0.5; color: var(--secondary); }
.blog-breadcrumbs__current { color: var(--heading); font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: clamp(140px, 45vw, 420px); }
.blog-banner { width: 100%; height: clamp(180px,22vw,310px); overflow: hidden; border: 1px solid var(--border); border-radius: 12px; background: var(--surface); }
.blog-banner :deep(.blog-image:not(.blog-image--fallback) img) { object-position: center 10%; }
.blog-banner :deep(.blog-image--fallback) { display: grid; place-items: center; }
.blog-banner :deep(.blog-image--fallback img) { object-position: center center !important; object-fit: contain !important; margin: auto; }
.blog-article { min-width: 0; margin-top: 14px; padding: clamp(20px,2.6vw,36px); border: 1px solid var(--border); border-radius: 12px; background: var(--surface); }
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

/* 1. Disclaimer */
.blog-disclaimer { margin-top: 22px; padding: 16px 20px; border: 1px solid rgba(0, 148, 64, 0.35); border-radius: 12px; background: rgba(0, 148, 64, 0.06); }
.blog-disclaimer__header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; color: #45d892; font-size: 14px; font-weight: 800; }
.blog-disclaimer p { margin: 0; color: #9bb0a4; font-size: 13px; line-height: 1.6; }

/* 2. Share This Article */
.blog-share { margin-top: 14px; padding: 18px 20px; border: 1px solid var(--border); border-radius: 12px; background: var(--surface); }
.blog-share__header { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; color: #45d892; font-size: 13px; font-weight: 800; }
.blog-share__buttons { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; }
.blog-share__btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 42px; padding: 8px 12px; border-radius: 8px; font-size: 13px; font-weight: 700; text-decoration: none; cursor: pointer; transition: transform .15s ease, filter .15s ease; border: 1px solid transparent; font-family: inherit; }
.blog-share__btn:hover { transform: translateY(-1px); filter: brightness(1.15); }
.blog-share__btn--facebook { background: #13335c; color: #72aeff; border-color: #1f4a82; }
.blog-share__btn--telegram { background: #0e374d; color: #4dc3ff; border-color: #175273; }
.blog-share__btn--x { background: #222624; color: #f4f7f5; border-color: rgba(255, 255, 255, 0.12); }
.blog-share__btn--whatsapp { background: #0c3e21; color: #4be084; border-color: #165b32; }
.blog-share__btn--copy { background: #0e3b2b; color: #48e29e; border-color: #195841; }

/* 3. About The Author */
.blog-author-box { margin-top: 14px; padding: 20px 22px; border: 1px solid rgba(0, 148, 64, 0.35); border-radius: 12px; background: var(--surface); }
.blog-author-box__top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.blog-author-box__title { display: flex; align-items: center; gap: 8px; color: #45d892; font-size: 14px; font-weight: 800; }
.blog-author-box__badge { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 999px; background: rgba(0, 148, 64, 0.18); border: 1px solid #009440; color: #45d892; font-size: 10px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; }
.blog-author-box__body { display: flex; gap: 16px; align-items: flex-start; }
.blog-author-box__avatar-wrap { position: relative; flex-shrink: 0; width: 68px; height: 68px; border-radius: 12px; border: 2px solid #009440; overflow: visible; background: #10241b; }
.blog-author-box__avatar { width: 100%; height: 100%; border-radius: 10px; object-fit: cover; }
.blog-author-box__verified { position: absolute; bottom: -4px; right: -4px; width: 18px; height: 18px; border-radius: 999px; background: #009440; color: #fff; display: grid; place-items: center; border: 2px solid var(--surface); }
.blog-author-box__content { flex: 1; min-width: 0; }
.blog-author-box__name { margin: 0; color: var(--heading); font-size: 16px; font-weight: 800; }
.blog-author-box__role { display: block; margin-top: 2px; color: #45d892; font-size: 12px; font-weight: 700; }
.blog-author-box__bio { margin: 8px 0 12px; color: var(--secondary); font-size: 13px; line-height: 1.65; }
.blog-author-box__social { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--secondary); }
.blog-author-box__social a { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 6px; background: rgba(0, 148, 64, 0.15); border: 1px solid rgba(0, 148, 64, 0.35); color: #45d892; font-size: 12px; font-weight: 700; text-decoration: none; }
.blog-back-link { display: inline-flex; align-items: center; gap: 8px; margin-top: 16px; color: #45d892; font-size: 13px; font-weight: 700; }

/* 4. Follow Us On Official Channels */
.blog-channels { margin-top: 14px; padding: 20px 22px; border: 1px solid rgba(0, 148, 64, 0.35); border-radius: 14px; background: var(--surface); }
.blog-channels__header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
.blog-channels__title-wrap h3 { display: flex; align-items: center; gap: 8px; margin: 0; color: #45d892; font-size: 15px; font-weight: 800; }
.blog-channels__title-wrap p { margin: 5px 0 0; color: var(--secondary); font-size: 13px; }
.blog-channels__badge { display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 999px; background: rgba(0, 148, 64, 0.15); border: 1px solid rgba(0, 148, 64, 0.35); color: #45d892; font-size: 12px; font-weight: 700; white-space: nowrap; }
.blog-channels__grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
.blog-channel-card { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-radius: 10px; background: var(--panel-soft); border: 1px solid var(--border); text-decoration: none; transition: transform .15s ease, border-color .15s ease, background .15s ease; }
.blog-channel-card:hover { border-color: #009440; transform: translateY(-2px); }
.blog-channel-card__icon { flex-shrink: 0; width: 40px; height: 40px; border-radius: 8px; display: grid; place-items: center; }
.blog-channel-card__icon--telegram { background: #0e374d; color: #4dc3ff; }
.blog-channel-card__icon--facebook { background: #13335c; color: #72aeff; }
.blog-channel-card__icon--vip { background: #0c3e21; color: #45d892; }
.blog-channel-card__info { flex: 1; min-width: 0; }
.blog-channel-card__info strong { display: block; color: var(--heading); font-size: 13px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.blog-channel-card__info span { display: block; margin-top: 3px; color: var(--secondary); font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.blog-channel-card svg:last-child { flex-shrink: 0; color: var(--secondary); transition: transform .15s ease, color .15s ease; }
.blog-channel-card:hover svg:last-child { color: #45d892; transform: translateX(3px); }

/* 5. CTA Play Now Banner */
.blog-cta { margin-top: 14px; padding: 18px 24px; border-radius: 14px; background: linear-gradient(95deg, #009440 0%, #00ab4e 100%); display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.blog-cta__copy strong { display: block; color: #ffffff; font-size: 18px; font-weight: 900; line-height: 1.3; }
.blog-cta__copy p { margin: 4px 0 0; color: #e7faef; font-size: 13px; font-weight: 600; }
.blog-cta__btn { display: inline-flex; align-items: center; gap: 8px; flex-shrink: 0; padding: 12px 24px; border-radius: 999px; background: #064026; color: #ffffff; font-size: 14px; font-weight: 800; letter-spacing: 0.5px; text-decoration: none; box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25); transition: transform .15s ease, background-color .15s ease, box-shadow .15s ease; }
.blog-cta__btn:hover { background: #042e1b; transform: translateY(-2px); box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35); }
.blog-cta__btn svg:last-child { transition: transform .15s ease; }
.blog-cta__btn:hover svg:last-child { transform: translateX(3px); }

.blog-related { min-width: 0; margin-top: 16px; overflow: hidden; border: 1px solid var(--border); border-radius: 12px; background: var(--surface); }
.blog-related h2 { margin: 0; padding: 16px 20px; border-bottom: 1px solid var(--border); color: var(--heading); font-size: 18px; font-weight: 800; }
.blog-related__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 14px; padding: 16px; }
.blog-related__item { display: flex; flex-direction: column; min-width: 0; overflow: hidden; border: 1px solid var(--border); border-radius: 10px; background: var(--panel-soft); text-decoration: none; transition: transform .15s ease, border-color .15s ease; }
.blog-related__item:hover { border-color: #009440; transform: translateY(-2px); }
.blog-related__image { width: 100%; aspect-ratio: 16/9; overflow: hidden; }
.blog-related__image :deep(.blog-image:not(.blog-image--fallback) img) { object-position: center 10%; }
.blog-related__image :deep(.blog-image--fallback img) { object-position: center center !important; object-fit: contain !important; margin: auto; }
.blog-related__content { display: flex; flex-direction: column; justify-content: space-between; flex: 1; padding: 12px 14px; gap: 10px; }
.blog-related__content strong { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; color: var(--heading); font-size: 13px; font-weight: 700; line-height: 1.45; overflow-wrap: anywhere; }
.blog-related__item:hover strong { color: #45d892; }
.blog-related__meta { display: flex; align-items: center; justify-content: space-between; gap: 8px; color: var(--secondary); font-size: 11px; }
.blog-related__meta svg { flex-shrink: 0; color: var(--secondary); transition: transform .15s ease; }
.blog-related__item:hover .blog-related__meta svg { transform: translateX(3px); color: #45d892; }
.blog-detail-state { display: flex; flex-direction: column; align-items: center; gap: 18px; min-height: 300px; padding: 40px 20px; border: 1px solid var(--border); border-radius: 12px; background: var(--surface); color: var(--secondary); text-align: center; }.blog-detail-state h1 { margin: 0; color: var(--heading); font-size: 20px; font-weight: 700; }.blog-detail-state :is(button,a) { display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; border-radius: 8px; background: #009440; color: #fff; font-size: 14px; font-weight: 700; }
.blog-detail-loading { min-height: 420px; padding: 0 0 20px; border: 1px solid var(--border); border-radius: 12px; background: var(--surface); }.blog-detail-loading>span:first-child { display: block; width: 100%; height: 220px; border-radius: 12px 12px 0 0; background: #20332a; }.blog-detail-loading>i { display: block; width: 70%; height: 14px; margin: 22px; border-radius: 5px; background: #2e4437; }.blog-detail-loading>i:last-of-type { width: 50%; }
.blog-detail-page :is(a,button):focus-visible,.blog-article-content :deep(:is(a,button,summary):focus-visible) { outline: 2px solid #009440; outline-offset: 3px; }
html[data-theme='light'] .blog-breadcrumbs__item:hover { color: #008039; }
html[data-theme='light'] .blog-article__category { color: #007e36; background: #e5f5eb; }html[data-theme='light'] .blog-back-link { color: #008039; }html[data-theme='light'] .blog-article-content :deep(a) { color: #007d36; }html[data-theme='light'] .blog-article-content :deep(a:hover) { color: #005f29; }html[data-theme='light'] .blog-article-content :deep(:is(.blog-button-link,.blog-slot-demo-link)) { color: #fff; }
html[data-theme='light'] .blog-disclaimer { background: #eaf6ee; border-color: #a8dfbc; }
html[data-theme='light'] .blog-disclaimer__header { color: #007e36; }
html[data-theme='light'] .blog-disclaimer p { color: #41614e; }
html[data-theme='light'] .blog-share__header { color: #007e36; }
html[data-theme='light'] .blog-share__btn--facebook { background: #eaf2ff; color: #1765c9; border-color: #bdd6ff; }
html[data-theme='light'] .blog-share__btn--telegram { background: #e6f6ff; color: #0280bf; border-color: #b5e4ff; }
html[data-theme='light'] .blog-share__btn--x { background: #eef2ef; color: #1f2723; border-color: #cdd5d0; }
html[data-theme='light'] .blog-share__btn--whatsapp { background: #e8f9ee; color: #0d8740; border-color: #b5eec8; }
html[data-theme='light'] .blog-share__btn--copy { background: #e5f7ed; color: #007e36; border-color: #ace5c2; }
html[data-theme='light'] .blog-author-box { border-color: #a8dfbc; }
html[data-theme='light'] .blog-author-box__title { color: #007e36; }
html[data-theme='light'] .blog-author-box__role { color: #007e36; }
html[data-theme='light'] .blog-author-box__avatar-wrap { background: #eaf5ee; }
html[data-theme='light'] .blog-channels { border-color: #a8dfbc; }
html[data-theme='light'] .blog-channels__title-wrap h3 { color: #007e36; }
html[data-theme='light'] .blog-channels__badge { color: #007e36; background: #e5f7ed; border-color: #ace5c2; }
html[data-theme='light'] .blog-channel-card { background: #f6faf7; }
html[data-theme='light'] .blog-channel-card__icon--telegram { background: #e6f6ff; color: #0280bf; }
html[data-theme='light'] .blog-channel-card__icon--facebook { background: #eaf2ff; color: #1765c9; }
html[data-theme='light'] .blog-channel-card__icon--vip { background: #e5f7ed; color: #007e36; }
html[data-theme='light'] .blog-related__item { background: #f6faf7; }html[data-theme='light'] .blog-related__item:hover strong { color: #008039; }html[data-theme='light'] .blog-related__item:hover .blog-related__meta svg { color: #008039; }
html[data-theme='light'] .blog-detail-loading>span:first-child { background: #e3f0e8; }html[data-theme='light'] .blog-detail-loading>i { background: #b8d1c1; }
@media (max-width: 63.99rem) {
  .blog-detail-content { padding: 0 10px 16px; }.blog-breadcrumbs { margin-bottom: 10px; padding: 7px 10px; font-size: 11px; }.blog-breadcrumbs__current { max-width: 170px; }.blog-banner { height: auto; aspect-ratio: 2/1; border-radius: 12px; }.blog-article { margin-top: 10px; padding: 20px 16px; }.blog-article h1 { font-size: 25px; line-height: 1.3; }.blog-article__header { margin-bottom: 20px; padding-bottom: 18px; }.blog-article__metadata { font-size: 11px; gap: 7px 12px; margin-top: 12px; }.blog-article__excerpt { font-size: 14px; }.blog-article-content { font-size: 15px; line-height: 1.8; }.blog-article-content :deep(h2) { font-size: 21px; }.blog-article-content :deep(h3) { font-size: 18px; }.blog-article-content :deep(:is(th,td)) { padding: 8px; }.blog-article-content :deep(blockquote) { padding: 12px 14px; }
  .blog-share__buttons { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .blog-channels__header { flex-direction: column; align-items: flex-start; }
  .blog-channels__grid { grid-template-columns: minmax(0, 1fr); }
  .blog-cta { flex-direction: column; align-items: stretch; text-align: center; gap: 14px; padding: 16px 18px; }
  .blog-cta__btn { justify-content: center; width: 100%; }
  .blog-related { margin-top: 12px; }.blog-related h2 { font-size: 16px; padding: 14px 16px; }.blog-related__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; padding: 12px; }.blog-detail-state { margin: 0 10px; }.blog-detail-loading { margin: 0 10px; }
}
@media (max-width: 480px) {
  .blog-share__buttons { grid-template-columns: minmax(0, 1fr); }
  .blog-author-box__body { flex-direction: column; align-items: center; text-align: center; }
  .blog-author-box__social { justify-content: center; }
  .blog-related__grid { grid-template-columns: minmax(0, 1fr); }
}
@media (max-width: 359px) { .blog-article { padding: 18px 12px; }.blog-article h1 { font-size: 22px; }.blog-article-content { font-size: 14px; } }
@media (prefers-reduced-motion: no-preference) { .blog-detail-loading { animation: blog-detail-pulse 1.5s ease-in-out infinite alternate; }@keyframes blog-detail-pulse { to { opacity: .55; } } }
</style>
