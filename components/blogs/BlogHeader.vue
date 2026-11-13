<script setup lang="ts">
import { ChevronLeft } from 'lucide-vue-next'

withDefaults(defineProps<{ title: string; backTo?: string; heading?: boolean }>(), {
  backTo: '/',
  heading: false,
})
const { locale } = useSiteLocale()
</script>

<template>
  <header class="blog-page-header sticky-header-seal">
    <NuxtLink :to="backTo" class="blog-page-header__back" :aria-label="locale === 'pt' ? 'Voltar' : 'Go back'">
      <ChevronLeft :size="20" aria-hidden="true" />
    </NuxtLink>
    <component :is="heading ? 'h1' : 'span'" class="blog-page-header__title">{{ title }}</component>
    <slot name="actions"><span class="blog-page-header__spacer" aria-hidden="true" /></slot>
  </header>
</template>

<style scoped>
.blog-page-header { position: sticky; z-index: 30; top: var(--content-sticky-top, 0px); display: flex; align-items: center; gap: 10px; min-height: 43px; margin-bottom: 8px; padding: 6px 10px; border: 1px solid var(--border); border-radius: 10px; background: var(--surface); color: var(--heading); }
.blog-page-header__back { display: grid; flex: 0 0 28px; width: 28px; height: 28px; place-items: center; border-radius: 50%; background: var(--panel-soft); color: #2bcf84; }
.blog-page-header__back:focus-visible { outline: 2px solid #009440; outline-offset: 3px; }
.blog-page-header__title { flex: 1; min-width: 0; margin: 0; font-size: 16px; font-weight: 800; line-height: 1.4; }
.blog-page-header__spacer { width: 28px; }
html[data-theme='light'] .blog-page-header__back { color: #009440; background: #eaf5ee; }
@media (max-width: 63.99rem) {
  .blog-page-header { top: 0; display: grid; grid-template-columns: 30px minmax(0,1fr) 30px; height: 52px; margin: 0 0 8px; padding: 0 14px; border: 0; border-radius: 0; background: #009440; color: #fff; }
  .blog-page-header__title { text-align: center; }
  .blog-page-header__back { width: 30px; height: 30px; background: #ffffff26; color: #fff; }
  html[data-theme='light'] .blog-page-header { background: #009440; color: #fff; }
  html[data-theme='light'] .blog-page-header__back { background: #ffffff26; color: #fff; }
}
</style>
