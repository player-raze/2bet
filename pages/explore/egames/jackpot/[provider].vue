<script setup lang="ts">
import { ChevronRight } from 'lucide-vue-next'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  JACKPOT_NAV_TABS,
  JACKPOT_SECTIONS,
  type JackpotSection,
} from '~/data/jackpot'
import {
  JDB_JACKPOT_COUNTER,
  JILI_JACKPOT_COUNTER,
  CQ9_JACKPOT_COUNTER,
  formatJackpotAmount,
  useJackpotCounter,
} from '~/composables/useJackpotCounter'
import { resolveJackpotRedirectUrl } from '~/utils/sportsRedirect'
import GameCard from '~/components/game-cards/GameCard.vue'
import GameRail from '~/components/game-cards/GameRail.vue'
import JackpotWinnersCard from '~/components/jackpot/JackpotWinnersCard.vue'
import JackpotCounter from '~/components/jackpot/JackpotCounter.vue'
import { SLOTS, getStandaloneJackpotGames, normalizeSlotProvider } from '~/data/slots'
import { getProviderLogoForTheme } from '~/utils/providerLogo'

const JACKPOT_REFRESH_INTERVAL_MS = 3_000

const JACKPOT_CHARACTER_IMAGES: Record<JackpotSection['jackpotCharacter'], string> = {
  dragon: '/images/jackpot/jili-jackpot.webp',
  genie: '/images/jackpot/cq9-jackpot.webp',
  panda: '/images/jackpot/jdb-jackpot.webp',
}

const JACKPOT_INCREMENT_RANGES: Record<string, readonly [number, number]> = {
  jili: [680, 2_800],
  cq9: [0, 0],
  jdb: [12, 120],
}

const JACKPOT_SECTION_ORDER = ['jdb']

const route = useRoute()
const router = useRouter()
const { effectiveTheme } = useSiteTheme()
const { translate } = useSiteLocale()
const siteUrl = useSiteUrl()

const themedProviderLogo = (providerLogo: string): string => {
  return getProviderLogoForTheme(providerLogo, effectiveTheme.value)
}

const activeProvider = computed(() => {
  const p = (route.params.provider as string || 'jdb').toLowerCase()
  return p
})

const providerName = computed(() => {
  const p = activeProvider.value
  if (p === 'all') return 'Todos os Provedores'
  return p.toUpperCase()
})

useAppSeo({
  title: computed(() =>
    formatSeoTitle(
      activeProvider.value === 'all'
        ? '2Bet Slot Gacor Jackpots | Acumulados e Melhores Provedores'
        : `Jackpots ${providerName.value} | Ganhe Prêmios na 2Bet Slots Casino Online`,
    ),
  ),
  description: computed(() =>
    formatSeoDescription(
      activeProvider.value === 'all'
        ? 'Dispute jackpots acumulados nos caça-níqueis da 2Bet Slot Gacor. Acompanhe contadores em R$ em tempo real e concorra a prêmios milionários.'
        : `Jogue caça-níqueis com jackpot da ${providerName.value} na 2bet slots casino online. Prêmios acumulados em R$ em tempo real e grandes chances de vitória.`,
    ),
  ),
  breadcrumbs: computed(() => [
    { name: 'Início', path: '/' },
    { name: 'Jackpots', path: '/egames/jackpot/all' },
    { name: providerName.value, path: `/egames/jackpot/${activeProvider.value}` },
  ]),
  schema: computed(() => ({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${providerName.value} Jackpots Progressivos - 2bet`,
    url: `${siteUrl.value}/egames/jackpot/${activeProvider.value}`,
  })),
})

const activeGameId = ref<string | null>(null)
const currentWinners = useJackpotWinners()
const standaloneJackpotGames = computed(() => getStandaloneJackpotGames())
const jackpotAmounts = ref<Record<string, number>>(
  Object.fromEntries(JACKPOT_SECTIONS.map(section => [section.id, section.jackpotAmount])),
)
let jackpotClockTimer: ReturnType<typeof setInterval> | null = null

const { displayAmount: jdbDisplay } = useJackpotCounter(JDB_JACKPOT_COUNTER)
const { displayAmount: jiliDisplay } = useJackpotCounter(JILI_JACKPOT_COUNTER)
const { displayAmount: cq9Display } = useJackpotCounter(CQ9_JACKPOT_COUNTER)

const storeAmounts: Record<string, Ref<number>> = {
  jdb: jdbDisplay,
  jili: jiliDisplay,
  cq9: cq9Display,
}

const getJackpotAmount = (section: JackpotSection): number => {
  if (storeAmounts[section.id]) {
    return storeAmounts[section.id].value
  }
  return jackpotAmounts.value[section.id] ?? section.jackpotAmount
}

const refreshJackpotAmounts = (): void => {
  const nextAmounts = { ...jackpotAmounts.value }

  JACKPOT_SECTIONS.filter(section => section.showCounter).forEach((section) => {
    const [minimum, maximum] = JACKPOT_INCREMENT_RANGES[section.id] ?? [20, 200]
    const increment = Math.random() * (maximum - minimum) + minimum
    nextAmounts[section.id] = Math.round((getJackpotAmount(section) + increment) * 100) / 100
  })

  jackpotAmounts.value = nextAmounts
}

const handleDocumentClick = (event: MouseEvent): void => {
  const target = event.target as HTMLElement | null
  if (!target?.closest('.game-card')) {
    activeGameId.value = null
  }
}

onMounted(() => {
  if (import.meta.client) {
    document.addEventListener('click', handleDocumentClick)
    jackpotClockTimer = setInterval(refreshJackpotAmounts, JACKPOT_REFRESH_INTERVAL_MS)
  }
})

onBeforeUnmount(() => {
  if (import.meta.client) {
    document.removeEventListener('click', handleDocumentClick)
    if (jackpotClockTimer) {
      clearInterval(jackpotClockTimer)
      jackpotClockTimer = null
    }
  }
})

const { bybetRedirectUrl: rawRedirectUrl, bybetRedirectCode } = useRuntimeConfig().public
const bybetRedirectUrl = computed(() => resolveJackpotRedirectUrl(activeProvider.value, rawRedirectUrl, bybetRedirectCode))
const { context: commentContext, openGameComments, closeComments } = useCommentPanel()

const toggleChat = (): void => {
  if (commentContext.value) {
    closeComments()
  } else {
    openGameComments()
  }
}

const selectTab = (key: string): void => {
  router.push(`/egames/jackpot/${key.toLowerCase()}`)
}

const showGameDetails = (_game: any): void => {}

const handleCardClick = (game: any): void => {
  if (activeGameId.value === game.id) {
    activeGameId.value = null
  } else {
    activeGameId.value = game.id
  }
}

const handleStartNow = (game: any): void => {
  if (import.meta.client) {
    window.open(game.href || bybetRedirectUrl.value, '_blank')
  }
}

const handleDemo = (game: any): void => {
  handleStartNow(game)
}

const filteredSections = computed<JackpotSection[]>(() => {
  const sections = activeProvider.value === 'all'
    ? [...JACKPOT_SECTIONS]
        .filter(s => s.id.toLowerCase() !== 'jili' && s.id.toLowerCase() !== 'cq9')
        .sort((left, right) => (
          JACKPOT_SECTION_ORDER.indexOf(left.id) - JACKPOT_SECTION_ORDER.indexOf(right.id)
        ))
    : JACKPOT_SECTIONS.filter((s) => s.id.toLowerCase() === activeProvider.value)

  return sections.map((section) => {
    const seenIds = new Set<string>()
    const amount = section.showCounter ? getJackpotAmount(section) : 0
    const poolText = amount > 0 ? `R$${formatJackpotAmount(amount)}` : undefined

    const jackpotGames = SLOTS.filter((game) => {
      if (game.jackpot !== true && game.Jackpot !== true) return false
      if (normalizeSlotProvider(game.provider) !== normalizeSlotProvider(section.id)) return false
      if (seenIds.has(game.id)) return false
      seenIds.add(game.id)
      return true
    })

    if (jackpotGames.length < 15) {
      const moreGames = SLOTS.filter((game) => {
        if (normalizeSlotProvider(game.provider) !== normalizeSlotProvider(section.id)) return false
        if (seenIds.has(game.id)) return false
        seenIds.add(game.id)
        return true
      }).slice(0, 15 - jackpotGames.length)
      jackpotGames.push(...moreGames)
    }

    const games = jackpotGames.map(game => (poolText ? { ...game, jackpotPool: poolText } : game))

    return { ...section, games, count: games.length }
  })
})

watch(
  activeProvider,
  (p) => {
    if (p === 'jili' || p === 'cq9') {
      router.replace('/egames/jackpot/all')
    }
    activeGameId.value = null
  },
  { immediate: true },
)
</script>

<template>
  <div class="jackpot-page w-full min-w-0 pb-16 text-white light:text-[#10261c]">
    <h1 class="sr-only">{{ providerName === 'Todos os Provedores' ? translate('Jackpots') : `Jackpot ${providerName}` }}</h1>
    <!-- Sticky Header (Top Nav Tabs Bar) -->
    <div class="sticky-header sticky-header-seal sticky top-[var(--content-sticky-top)] z-50 -mx-1 px-0 sm:px-1 pb-2">
      <!-- Top Nav Tabs Bar (777, JILI, JDB, CQ9 + Chat) -->
      <header class="top-nav-bar flex items-center justify-between gap-2 overflow-hidden rounded-lg bg-[#202020] light:bg-white light:border light:border-[#d8e2dc] py-0 sm:py-1 shadow-sm">
        <div class="provider-nav-track no-scrollbar flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto bg-[#141414] light:bg-white px-2.5 sm:px-1 py-4 sm:py-1.5 shadow-sm">
          <RouletteEntryButton style="--roulette-entry-size: 33px; border: 0" class="block sm:hidden" />
          <button
            v-for="tab in JACKPOT_NAV_TABS"
            :key="tab.key"
            type="button"
            class="nav-tab flex h-7 sm:h-6 min-w-[48px] shrink-0 cursor-pointer select-none items-center justify-center rounded-md px-2 transition-all py-5 sm:py-2"
            :class="activeProvider === tab.key.toLowerCase() ? 'bg-[var(--main-color)] shadow-md' : 'hover:bg-white/5'"
            :aria-label="tab.label"
            :aria-current="activeProvider === tab.key.toLowerCase() ? 'page' : undefined"
            @click="selectTab(tab.key)"
          >
            <img
              :src="themedProviderLogo(tab.logo)"
              :alt="tab.label"
              class="object-contain transition-opacity"
              :class="[
                tab.isAll ? 'h-10 sm:h-5 w-7 sm:w-5' : 'h-9 sm:h-4 max-w-[50px] sm:max-w-[42px]',
                activeProvider === tab.key.toLowerCase() ? '' : 'opacity-80',
                effectiveTheme === 'dark'
                  ? activeProvider === tab.key.toLowerCase() ? 'brightness-150 contrast-150' : 'brightness-125'
                  : '',
              ]"
            />
          </button>
        </div>
      </header>
    </div>

    <!-- Provider Jackpot Section (Layout matches Image 2) -->
    <section
      v-for="section in filteredSections"
      :id="`section-${section.id}`"
      :key="section.id"
      class="jackpot-provider-section scroll-mt-[85px]"
    >
      <!-- Provider identity, supplied jackpot artwork, and reference-style counter strip -->
      <div
        class="jackpot-provider-header"
        :class="{ 'jackpot-provider-header--with-counter': section.showCounter }"
      >
        <div class="jackpot-provider-identity">
          <h2 class="sr-only">{{ section.provider }}</h2>
          <img
            :src="themedProviderLogo(section.providerLogo)"
            :alt="section.provider"
            class="jackpot-provider-logo object-contain"
            :class="{ 'brightness-125': effectiveTheme === 'dark' }"
          />
        </div>

        <div class="jackpot-brand-stage" aria-hidden="true">
          <img
            src="/images/jackpot/jackpot.webp"
            alt="Jackpot"
            class="jackpot-wordmark"
          />
          <img
            :src="JACKPOT_CHARACTER_IMAGES[section.jackpotCharacter]"
            :alt="`${section.provider} character`"
            class="jackpot-character"
            :class="`jackpot-character--${section.jackpotCharacter}`"
          />
        </div>

        <JackpotCounter
          v-if="section.showCounter"
          :amount="getJackpotAmount(section)"
          :provider="section.provider"
        />

        <div class="jackpot-provider-count">
          <NuxtLink
            :to="`/egames/jackpot/${section.id}`"
            class="count-badge flex items-center gap-0.5 rounded-full bg-[#202220] hover:bg-[#282a29] light:bg-[#edf4f0] light:text-[#2a3c33] light:hover:text-[#019440] light:border light:border-[#d8e2dc] px-2.5 py-0.5 text-[11px] font-medium text-[#8e9491] hover:text-white transition-colors cursor-pointer"
          >
            <span>{{ section.count }}</span>
            <ChevronRight class="h-3 w-3" />
          </NuxtLink>
        </div>
      </div>

      <GameRail
        :label="`${section.provider} jackpot games`"
        :layout="activeProvider === 'all' ? 'slider' : 'grid'"
        :wide-columns="activeProvider === 'all' ? 8 : 6"
        :games="section.games"
        v-slot="{ games }"
      >
        <GameCard
          v-for="game in (games && games.length ? games : section.games)"
          :key="game.id"
          :game="game"
          :activeId="activeGameId"
          :displayCategory="section.id === 'jdb' || activeProvider === 'jdb' ? 'jackpot-jdb' : 'jackpot'"
          title-tag="h3"
          @select="handleCardClick"
          @info="showGameDetails"
          @start="handleStartNow"
          @demo="handleDemo"
        />
      </GameRail>
      <p v-if="section.games.length === 0" class="py-8 text-center text-sm text-[#8e9491]">
        {{ translate('No jackpot games are available for this provider.') }}
      </p>
    </section>

    <section
      v-if="activeProvider === 'all'"
      class="standalone-jackpot-section mb-5 min-w-0"
      aria-labelledby="standalone-jackpot-title"
    >
      <div class="mb-2 flex items-center justify-between gap-3">
        <h2 class="m-0 flex min-w-0 items-center">
          <NuxtLink
            id="standalone-jackpot-title"
            to="/egames/jackpot/standalone"
            class="flex min-w-0 items-center gap-1.5 text-[15px] font-bold text-white light:text-[#10261c] transition-colors hover:text-[var(--main-color)]"
          >
            <span aria-hidden="true">🎰</span>
            <span class="truncate">{{ translate('Standalone Jackpot Game') }}</span>
          </NuxtLink>
        </h2>
        <NuxtLink
          to="/egames/jackpot/standalone"
          class="flex shrink-0 items-center gap-0.5 rounded-full bg-[#202220] px-2.5 py-0.5 text-[11px] font-medium text-[#8e9491] light:bg-[#edf4f0] light:text-[#2a3c33] light:hover:text-[#019440] light:border light:border-[#d8e2dc] transition-colors hover:bg-[#282a29] hover:text-white"
          aria-label="View all standalone jackpot games"
        >
          <span>{{ standaloneJackpotGames.length }}</span>
          <ChevronRight class="h-3 w-3" />
        </NuxtLink>
      </div>

      <GameRail label="Standalone jackpot games" layout="slider" :wide-columns="11">
        <GameCard
          v-for="game in standaloneJackpotGames"
          :key="game.id"
          :game="game"
          :activeId="activeGameId"
          displayCategory="jackpot"
          title-tag="h3"
          @select="handleCardClick"
          @info="showGameDetails"
          @start="handleStartNow"
          @demo="handleDemo"
        />
      </GameRail>
    </section>

    <!-- Winners List Card (Shown only on JDB jackpot page) -->
    <JackpotWinnersCard
      v-if="activeProvider === 'jdb' || activeProvider === 'all'"
      :winners="currentWinners"
    />

  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.jackpot-provider-section {
  min-width: 0;
  margin-bottom: 20px;
}

.jackpot-provider-header {
  position: relative;
  min-width: 0;
  margin-bottom: 12px;
}

.jackpot-provider-identity,
.jackpot-provider-count {
  position: absolute;
  z-index: 5;
  top: 8px;
  display: flex;
  align-items: center;
}

.jackpot-provider-identity {
  left: 4px;
}

.jackpot-provider-count {
  right: 0;
}

.jackpot-provider-logo {
  width: auto;
  max-width: 82px;
  height: 71px;
}

.jackpot-brand-stage {
  position: relative;
  width: 100%;
  height: 105px;
}

.jackpot-provider-header--with-counter .jackpot-brand-stage {
  height: 84px;
}

.jackpot-wordmark {
  position: absolute;
  z-index: 20;
  bottom: 6px;
  left: 50%;
  width: clamp(178px, 18vw, 216px);
  height: auto;
  filter: drop-shadow(0 5px 7px rgba(0, 0, 0, 0.72));
  transform: translateX(-50%);
}

.jackpot-character {
  position: absolute;
  z-index: 3;
  bottom: 0;
  left: calc(50% + 70px);
  width: clamp(96px, 10vw, 118px);
  max-height: 92px;
  object-fit: contain;
  filter: drop-shadow(0 6px 7px rgba(0, 0, 0, 0.56));
}

.jackpot-character--dragon {
  left: calc(50% + 67px);
  width: clamp(112px, 12vw, 136px);
  max-height: 101px;
}

.jackpot-character--genie {
  left: calc(50% + 70px);
  width: clamp(92px, 9vw, 108px);
  max-height: 86px;
}

@media (max-width: 767px) {
  .jackpot-brand-stage {
    height: 98px;
  }

  .jackpot-provider-header--with-counter .jackpot-brand-stage {
    height: 82px;
  }

  .jackpot-wordmark {
    width: clamp(164px, 42vw, 194px);
  }

  .jackpot-character {
    left: calc(50% + 61px);
    width: clamp(88px, 25vw, 108px);
  }

  .jackpot-character--dragon {
    left: calc(50% + 58px);
    width: clamp(105px, 30vw, 126px);
  }

  .jackpot-character--genie {
    left: calc(50% + 60px);
  }

}

@media (max-width: 639px) {
  .jackpot-provider-identity,
  .jackpot-provider-count {
    top: 6px;
  }

}

</style>

