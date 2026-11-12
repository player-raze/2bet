<script setup lang="ts">
import { computed } from 'vue'
import '~/assets/css/sports.css'
import MobileSportsNav from '~/components/sports/MobileSportsNav.vue'
import { buildBybetRedirectUrl } from '~/utils/sportsRedirect'

const route = useRoute()
const { locale, translate } = useSiteLocale()

useAppSeo({
  title: 'Apostas ao Vivo — Cotações em Tempo Real e Jogos | 2bet',
  description: 'Acompanhe partidas esportivas em tempo real com a 2bet Brasil. Mercados dinâmicos, atualização instantânea de odds e cash out rápido.',
  breadcrumbs: [
    { name: 'Início', path: '/' },
    { name: 'Esportes', path: '/sports/popular' },
    { name: 'Ao Vivo', path: '/sports/live' },
  ],
  schema: {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Live Sports Betting - 2Bet',
    url: 'https://2bet.com/sports/live',
  },
})

const { bybetRedirectUrl: rawRedirectUrl, bybetRedirectCode } = useRuntimeConfig().public
const liveEsportsRedirectUrl = computed(() =>
  buildBybetRedirectUrl('sportEvents/liveGame/eSportBallGroup', rawRedirectUrl, bybetRedirectCode)
)

const liveTabs = [
  { key: 'all', label: 'All', icon: '', to: '/sports/live' },
  { key: 'basketball', label: '', icon: '/icons/sports/basketball.webp', to: '/sports/live/basketball' },
  { key: 'soccer', label: '', icon: '/icons/sports/soccer.webp', to: '/sports/live/soccer' },
  { key: 'tennis', label: '', icon: '/icons/sports/tennis.webp', to: buildBybetRedirectUrl('sportEvents/liveGame/tennis', rawRedirectUrl, bybetRedirectCode), external: true },
  { key: 'table-tennis', label: '', icon: '/icons/sports/table-tennis.webp', to: buildBybetRedirectUrl('sportEvents/liveGame/tableTennis', rawRedirectUrl, bybetRedirectCode), external: true },
  {
    key: 'esports',
    label: '',
    icon: '/icons/sports/esports.webp',
    to: liveEsportsRedirectUrl.value,
    external: true,
  },
  { key: 'badminton', label: '', icon: '/icons/sports/badminton.webp', to: buildBybetRedirectUrl('sportEvents/liveGame/badminton', rawRedirectUrl, bybetRedirectCode), external: true },
]

const currentSport = computed(() => {
  const sportParam = String(route.params.sport || '').toLowerCase()
  if (sportParam && ['basketball', 'soccer', 'tennis', 'baseball'].includes(sportParam)) {
    return sportParam
  }
  return 'all'
})

const liveHeading = computed(() => {
  if (currentSport.value !== 'all') {
    const sportParam = currentSport.value
    const sportName = translate(sportParam.charAt(0).toUpperCase() + sportParam.slice(1))
    return locale.value === 'pt'
      ? `Apostas ao Vivo em ${sportName}`
      : `Live ${sportName} Betting`
  }
  return locale.value === 'pt'
    ? 'Apostas Esportivas ao Vivo'
    : 'Live Sports Betting'
})

const mobileLiveTabs = [
  { key: 'all', label: 'All', to: '/sports/live', external: false },
  { key: 'basketball', label: 'Basketball', to: '/sports/live/basketball', external: false },
  { key: 'soccer', label: 'Soccer', to: '/sports/live/soccer', external: false },
  { key: 'tennis', label: 'Tennis', to: buildBybetRedirectUrl('sportEvents/liveGame/tennis', rawRedirectUrl, bybetRedirectCode), external: false },
  { key: 'tennis', label: 'Table Tennis', to: buildBybetRedirectUrl('sportEvents/liveGame/tableTennis', rawRedirectUrl, bybetRedirectCode), external: false },
  { key: 'tennis', label: 'eSports', to: buildBybetRedirectUrl('sportEvents/liveGame/eSportGameGroup', rawRedirectUrl, bybetRedirectCode), external: false },
  { key: 'virtual', label: 'Virtual Sports', to: buildBybetRedirectUrl('sportEvents/liveGame/eSportBallGroup', rawRedirectUrl, bybetRedirectCode), external: true },
  { key: 'badminton', label: 'Badminton', to: buildBybetRedirectUrl('sportEvents/liveGame/badminton', rawRedirectUrl, bybetRedirectCode), external: true },
]
</script>

<template>
  <section class="sports-page live-page">
    <h1 class="sr-only">{{ liveHeading }}</h1>
    <!-- Sports Tabs Navigation: Sport Ball Icons -->
    <div class="sticky-header-seal live-navigation sticky top-[var(--content-sticky-top)] z-30 -mx-1 px-1 pb-1">
      <MobileSportsNav class="live-mobile-icon-nav bg-[#1e241f] light:bg-white light:border light:border-[#d8e2dc] light:shadow-sm" />
      <nav class="sports-tabs live-mobile-categories" :aria-label="translate('Live sports categories')">
        <NuxtLink
          v-for="tab in mobileLiveTabs"
          :key="tab.key"
          :to="tab.to"
          :external="tab.external"
          :class="{ selected: currentSport === tab.key }"
          :aria-current="currentSport === tab.key ? 'page' : undefined"
        >
          {{ translate(tab.label) }}
        </NuxtLink>
      </nav>
      <nav
        class="sports-tabs live-sports-tabs bg-[#141414] light:bg-white light:border light:border-[#d8e2dc] light:shadow-sm"
        aria-label="Live sports categories"
      >
        <NuxtLink
          v-for="tab in liveTabs"
          :key="tab.key"
          :to="tab.to"
          :external="Boolean(tab.external)"
          :class="{ selected: currentSport === tab.key }"
          :aria-current="currentSport === tab.key ? 'page' : undefined"
        >
          <img
            v-if="tab.icon"
            :src="tab.icon"
            :alt="tab.label || tab.key"
            class="w-[24px] h-[24px] object-contain shrink-0"
          />
          <span v-if="tab.label">{{ tab.label }}</span>
        </NuxtLink>
      </nav>
    </div>

    <!-- Nested Route Content -->
    <NuxtPage />
  </section>
</template>

<style scoped>
.live-page {
  min-width: 0;
}

.live-page .live-mobile-categories { display: none; }

@media (min-width: 64rem) {
  .live-navigation {
    margin: 0;
    padding: 0;
  }

  .live-page .live-sports-tabs {
    height: 64px;
    align-items: center;
    gap: 16px;
    padding: 14px 12px;
    border-radius: 12px;
  }

  .live-page .live-sports-tabs a {
    width: 36px;
    min-height: 36px;
    flex: 0 0 36px;
    padding: 6px;
    border-radius: 50%;
    font-size: 14px;
  }
}

@media (max-width: 63.99rem) {
  .live-page { padding: 0; }
  .live-navigation {
    margin: 0;
    padding: 0;
    background: var(--page);
  }

  .live-page .live-sports-tabs { display: none; }
  .live-page .live-mobile-categories {
    display: flex;
    height: 44px;
    min-height: 44px;
    gap: 4px;
    padding: 8px;
    border-radius: 12px;
    background: var(--surface);
    overscroll-behavior-inline: contain;
  }

  .live-page .live-mobile-categories a {
    height: 28px;
    min-height: 28px;
    padding: 0 8px;
    font-size: 14px;
    line-height: 20px;
    letter-spacing: .2px;
  }

  .live-page .live-mobile-categories a.selected { min-width: 52px; }

  .live-mobile-icon-nav {
    height: 52px;
    gap: 8px;
    margin-bottom: 8px;
    padding: 8px;
    border-radius: 12px;
  }

  .live-mobile-icon-nav :deep(.mobile-sports-nav__item) {
    width: 44px;
    height: 36px;
    flex-basis: 44px;
  }

  .live-mobile-icon-nav :deep(.mobile-sports-nav__item--active) { background: transparent; }
  .live-mobile-icon-nav :deep(.mobile-sports-nav__img) { max-width: 28px; max-height: 28px; }
}
</style>
