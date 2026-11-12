<script setup lang="ts">
import SubpageHeader from '~/components/SubpageHeader.vue'
import { Check } from 'lucide-vue-next'

const { locale, setLocale } = useSiteLocale()

useAppSeo({
  title: 'Preferências de Idioma e Configurações Regionais | 2bet',
  description: 'Personalize o idioma de navegação na plataforma 2bet. Escolha as configurações ideais para sua experiência em jogos e apostas online.',
  breadcrumbs: [
    { name: 'Início', path: '/' },
    { name: 'Minha Conta', path: '/account/me' },
    { name: 'Idioma', path: '/account/language' },
  ],
})
</script>

<template>
  <section class="preference-page language-page w-full min-w-0 pb-16 text-white bg-black light:bg-[#f4f8f5] light:text-[#10261c]">
    <SubpageHeader
      title="Language"
      back-to="/account/me"
      class="mb-2 sm:mb-3"
    />

    <div class="px-2.5 sm:px-0">
      <div class="preference-list overflow-hidden rounded-xl bg-[#141414] border border-white/5 light:bg-white light:border-[#d8e2dc] light:shadow-sm">
        <button
          v-for="language in languageOptions"
          :key="language.code"
          type="button"
          class="preference-row flex w-full items-center justify-between px-3 text-left border-b border-[#414141] last:border-b-0 light:border-b-[#eef2f0] hover:bg-white/[0.045] focus-visible:bg-white/[0.045] light:hover:bg-[#f4f8f5] light:focus-visible:bg-[#f4f8f5]"
          :class="{ 'preference-row--selected': locale === language.code }"
          :aria-current="locale === language.code ? 'true' : undefined"
          @click="setLocale(language.code)"
        >
          <span class="flex min-w-0 items-center gap-3">
            <span class="flag" aria-hidden="true">{{ language.flag }}</span>
            <span
              class="truncate text-[14px]"
              :class="locale === language.code ? 'font-bold text-[#20c997]' : 'text-[#eceeed] light:text-[#10261c]'"
            >
              {{ language.label }}
            </span>
          </span>
          <span
            v-if="locale === language.code"
            class="selected-check grid h-[15px] w-[15px] shrink-0 place-items-center rounded-full text-white bg-[#087b5b]"
            aria-label="Selected"
          >
            <Check class="h-3 w-3" :stroke-width="3.5" aria-hidden="true" />
          </span>
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.preference-page {
  min-height: calc(100vh - var(--header-height));
}

.preference-row {
  min-height: 50px;
  transition: background-color 140ms ease;
}

.preference-row:last-child {
  border-bottom: 0;
}

.preference-row:hover,
.preference-row:focus-visible {
  outline: none;
}

.flag {
  width: 24px;
  flex: 0 0 24px;
  font-size: 22px;
  line-height: 1;
  text-align: center;
}
</style>

