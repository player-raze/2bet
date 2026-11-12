<script setup lang="ts">
import SubpageHeader from '~/components/SubpageHeader.vue'
import { MoreHorizontal } from 'lucide-vue-next'
import {
  EXPERT_PREDICTORS,
  type ExpertPredictor,
} from '~/data/predictions'
import type { LivePlazaSportFilter } from '~/components/live-plaza/LivePlazaSportFilters.vue'

type ExpertSort = 'hit' | 'win-streak'

const EXPERT_BATCH_SIZE = 22

const sortOptions: Array<{ value: ExpertSort; label: string }> = [
  { value: 'hit', label: 'Hit' },
  { value: 'win-streak', label: 'Win Streak' },
]

const { bybetRedirectUrl: bybetBaseUrl, bybetRedirectCode } = useRuntimeConfig().public
const bybetRedirectUrl = `${bybetBaseUrl}/login?p=${bybetRedirectCode}`
const { translate } = useSitePreferences()

useAppSeo({
  title: 'Top Tipsters e Especialistas em Apostas Esportivas | 2bet',
  description: 'Conheça os tipsters com maior taxa de acertos na 2bet Brasil. Siga análises esportivas especializadas e aprimore suas estratégias diárias.',
  breadcrumbs: [
    { name: 'Início', path: '/' },
    { name: 'Praça ao Vivo', path: '/live-plaza/home' },
    { name: 'Especialistas', path: '/live-plaza/experts' },
  ],
  schema: {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: '2Bet Sports Experts',
    url: 'https://2bet.com/live-plaza/experts',
  },
})

const selectedSport = ref<LivePlazaSportFilter>('all')
const expertSort = ref<ExpertSort>('hit')
const sortMenuOpen = ref(false)
const sortControl = ref<HTMLElement | null>(null)
const sortButton = ref<HTMLButtonElement | null>(null)
const displayedExpertCount = ref(EXPERT_BATCH_SIZE)
const loadMoreTrigger = ref<HTMLElement | null>(null)
let loadMoreObserver: IntersectionObserver | null = null

const selectedSortLabel = computed(() => (
  sortOptions.find(option => option.value === expertSort.value)?.label ?? 'Hit'
))

const visibleExperts = computed(() => {
  const experts = selectedSport.value === 'all'
    ? [...EXPERT_PREDICTORS]
    : EXPERT_PREDICTORS.filter(expert => expert.sport === selectedSport.value)

  if (expertSort.value === 'win-streak') {
    return experts.sort((a, b) => getWinStreakCount(b) - getWinStreakCount(a))
  }

  return experts.sort((a, b) => b.hitRate - a.hitRate)
})

const displayedExperts = computed(() => (
  visibleExperts.value.slice(0, displayedExpertCount.value)
))

const hasMoreExperts = computed(() => (
  displayedExpertCount.value < visibleExperts.value.length
))

const getWinStreakCount = (expert: ExpertPredictor): number => (
  Number(expert.winStreak?.match(/\d+/)?.[0] ?? 0)
)

const formatHitRate = (hitRate: number): string => (
  Number.isInteger(hitRate) ? hitRate.toFixed(0) : hitRate.toFixed(2)
)

const toggleSortMenu = (): void => {
  sortMenuOpen.value = !sortMenuOpen.value
}

const selectSort = (sort: ExpertSort): void => {
  expertSort.value = sort
  sortMenuOpen.value = false
}

const loadMoreExperts = (): void => {
  displayedExpertCount.value = Math.min(
    displayedExpertCount.value + EXPERT_BATCH_SIZE,
    visibleExperts.value.length,
  )
}

const syncLoadMoreObserver = (): void => {
  loadMoreObserver?.disconnect()

  if (loadMoreTrigger.value && hasMoreExperts.value) {
    loadMoreObserver?.observe(loadMoreTrigger.value)
  }
}

const handleDocumentClick = (event: MouseEvent): void => {
  if (sortMenuOpen.value && !sortControl.value?.contains(event.target as Node)) {
    sortMenuOpen.value = false
  }
}

const handleEscape = (event: KeyboardEvent): void => {
  if (event.key === 'Escape' && sortMenuOpen.value) {
    sortMenuOpen.value = false
    sortButton.value?.focus()
  }
}

const handleAvatarError = (event: Event): void => {
  const image = event.currentTarget as HTMLImageElement
  if (!image.src.endsWith('/images/predictions/jedaiah.webp')) {
    image.src = '/images/predictions/jedaiah.webp'
  }
}

watch([selectedSport, expertSort], () => {
  displayedExpertCount.value = EXPERT_BATCH_SIZE
})

watch([loadMoreTrigger, hasMoreExperts], () => {
  syncLoadMoreObserver()
})

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
  document.addEventListener('keydown', handleEscape)

  loadMoreObserver = new IntersectionObserver((entries) => {
    if (entries.some(entry => entry.isIntersecting)) {
      loadMoreExperts()
    }
  }, {
    rootMargin: '0px 0px 200px 0px',
  })

  syncLoadMoreObserver()
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
  document.removeEventListener('keydown', handleEscape)
  loadMoreObserver?.disconnect()
})
</script>

<template>
  <div class="experts-page text-white light:text-[#10261c]">
    <SubpageHeader
      title="All Experts"
      back-to="/live-plaza/expert-predictions"
      class="mb-2 sm:mb-3"
    >
      <template #right>
        <div ref="sortControl" class="experts-sort">
          <button
            ref="sortButton"
            type="button"
            class="experts-sort__button bg-[#0a402d] text-white light:bg-white light:text-[#019440] light:border light:border-[#d8e2dc]"
            :class="{ 'experts-sort__button--open': sortMenuOpen }"
            aria-haspopup="menu"
            :aria-expanded="sortMenuOpen"
            aria-controls="expert-sort-menu"
            @click.stop="toggleSortMenu"
          >
            <span>{{ translate(selectedSortLabel) }}</span>
            <MoreHorizontal :size="15" aria-hidden="true" />
          </button>

          <Transition name="sort-menu">
            <div
              v-if="sortMenuOpen"
              id="expert-sort-menu"
              class="experts-sort__menu bg-[#171717] text-[#eeeeee] border border-white/5 light:bg-white light:text-[#10261c] light:border-[#d8e2dc] light:shadow-xl"
              role="menu"
              :aria-label="translate('Sort experts')"
            >
              <span class="experts-sort__label text-[#eeeeee] light:text-[#10261c]">{{ translate('Sort') }}</span>
              <button
                v-for="option in sortOptions"
                :key="option.value"
                type="button"
                class="experts-sort__option bg-[#202322] text-[#eeeeee] border-[#565b58] light:bg-[#edf4f0] light:text-[#2a3c33] light:border-[#d8e2dc] [&.experts-sort__option--active]:!bg-[#007653] [&.experts-sort__option--active]:!text-white"
                :class="{ 'experts-sort__option--active': expertSort === option.value }"
                role="menuitemradio"
                :aria-checked="expertSort === option.value"
                @click="selectSort(option.value)"
              >
                {{ translate(option.label) }}
              </button>
            </div>
          </Transition>
        </div>
      </template>
    </SubpageHeader>

    <div class="experts-content-container px-2.5 sm:px-0">
      <section class="experts-filter-bar bg-[#141414] light:bg-white border border-white/5 light:border-[#d8e2dc] light:shadow-sm" :aria-label="translate('Filter experts')">
        <LivePlazaSportFilters v-model="selectedSport" />
      </section>

      <section v-if="displayedExperts.length" class="experts-grid" :aria-label="translate('All prediction experts')">
      <NuxtLink
        v-for="expert in displayedExperts"
        :key="expert.id"
        class="expert-card bg-[#141414] light:bg-white border border-white/5 light:border-[#d8e2dc] light:shadow-sm text-white light:text-[#10261c] hover:bg-[#181918] light:hover:bg-[#f4f8f5]"
        :to="bybetRedirectUrl"
        external
      >
        <span class="expert-card__identity">
          <img
            :src="expert.predictorAvatar"
            :alt="expert.predictorName"
            class="expert-card__avatar"
            width="44"
            height="44"
            loading="lazy"
            decoding="async"
            @error="handleAvatarError"
          >
          <span class="expert-card__details">
            <strong class="text-white light:text-[#10261c]">{{ expert.predictorName }}</strong>
            <span v-if="expert.winStreak" class="expert-card__streak text-[#f33549] bg-[#fff4f5]">
              {{ expert.winStreak }}
            </span>
          </span>
        </span>

        <span class="expert-card__stats">
          <span
            v-if="expert.currentPredictions"
            class="expert-card__current-predictions text-[#858985] light:text-[#5d7066]"
          >
            {{ translate('Current') }} {{ expert.currentPredictions }} {{ translate('predictions') }}
          </span>
          <span class="expert-card__hit-rate text-[#858985] light:text-[#5d7066]">
            <span>{{ translate('Hit Rate') }}</span>
            <strong class="text-[#13ae7d] light:text-[#009440]">{{ formatHitRate(expert.hitRate) }}<small class="text-[#f2f2f2] light:text-[#10261c]">%</small></strong>
          </span>
        </span>
      </NuxtLink>
    </section>

    <div
      v-if="hasMoreExperts"
      ref="loadMoreTrigger"
      class="experts-load-more-trigger"
      aria-hidden="true"
    />

    <div v-if="!visibleExperts.length" class="experts-empty bg-[#141414] text-[#858985] light:bg-white light:text-[#5d7066] light:border light:border-[#d8e2dc]">
      {{ translate('No experts are available for this sport.') }}
    </div>
    </div>
  </div>
</template>

<style scoped>
.experts-page {
  width: 100%;
  min-width: 0;
  padding-top: 0;
  padding-bottom: 3rem;
}

.experts-sort {
  position: relative;
  flex: 0 0 auto;
}

.experts-sort__button {
  display: inline-flex;
  min-width: 68px;
  min-height: 28px;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 500;
  cursor: pointer;
  gap: 4px;
  transition: border-color 150ms ease, background-color 150ms ease;
}

.experts-sort__button:hover,
.experts-sort__button--open {
  border-color: rgba(255, 255, 255, 0.25);
}

.experts-sort__menu {
  display: grid;
  position: absolute;
  z-index: 40;
  top: calc(100% + 6px);
  right: 0;
  width: 150px;
  padding: 9px 11px 10px;
  border-radius: 14px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.45);
  gap: 5px;
}

.experts-sort__label {
  margin-bottom: 2px;
  font-size: 11px;
}

.experts-sort__option {
  min-height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}

.experts-sort__option:hover {
  border-color: #008965;
}

.experts-sort__option--active {
  border-color: #007653;
}

.sort-menu-enter-active,
.sort-menu-leave-active {
  transition: opacity 120ms ease, transform 120ms ease;
  transform-origin: top right;
}

.sort-menu-enter-from,
.sort-menu-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
}

.experts-filter-bar {
  display: flex;
  min-height: 45px;
  align-items: center;
  margin-bottom: 8px;
  padding: 0 11px;
  border-radius: 12px;
}

.experts-grid {
  display: grid;
  min-width: 0;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.expert-card {
  display: flex;
  min-width: 0;
  min-height: 68px;
  align-items: center;
  justify-content: space-between;
  padding: 9px 12px;
  border-radius: 12px;
  text-decoration: none;
  gap: 12px;
  transition: border-color 150ms ease, background-color 150ms ease;
}

.expert-card:hover {
  border-color: rgba(31, 167, 121, 0.45);
}

.expert-card__identity {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 9px;
}

.expert-card__avatar {
  display: block;
  width: 44px;
  height: 44px;
  flex: 0 0 auto;
  border: 2px solid #777b79;
  border-radius: 50%;
  object-fit: cover;
  background: #242424;
}

.expert-card__details {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.expert-card__details strong {
  overflow: hidden;
  max-width: 12rem;
  font-size: 14px;
  line-height: 1.15;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.expert-card__streak {
  padding: 2px 7px;
  border-radius: 4px;
  font-size: 9px;
  font-weight: 800;
  line-height: 1.2;
}

.expert-card__stats {
  display: flex;
  min-width: 0;
  flex: 0 0 auto;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.expert-card__current-predictions {
  font-size: 9px;
  line-height: 1;
  white-space: nowrap;
}

.expert-card__hit-rate {
  display: flex;
  flex: 0 0 auto;
  align-items: baseline;
  gap: 5px;
}

.expert-card__hit-rate > span {
  font-size: 10px;
}

.expert-card__hit-rate strong {
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1;
}

.expert-card__hit-rate small {
  margin-left: 2px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0;
}

.experts-empty {
  display: grid;
  min-height: 220px;
  place-items: center;
  border-radius: 12px;
  font-size: 12px;
}

.experts-load-more-trigger {
  width: 100%;
  height: 1px;
}

@media (max-width: 55rem) {
  .experts-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 47.99rem) {
  .experts-page {
    padding-top: 0;
    padding-bottom: 5rem;
  }

  .expert-card {
    min-height: 62px;
    padding: 8px 10px;
  }

  .expert-card__avatar {
    width: 40px;
    height: 40px;
  }

  .expert-card__hit-rate strong {
    font-size: 22px;
  }

  .expert-card__hit-rate > span {
    display: none;
  }
}
</style>
