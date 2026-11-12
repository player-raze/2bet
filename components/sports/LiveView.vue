<script setup lang="ts">
import { matchesSportsSelection } from '~/utils/sportsSelection'
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { Search } from 'lucide-vue-next'
import InplayMatches from '~/components/sports/InplayMatches.vue'
import SportsSkeleton from '~/components/sports/SportsSkeleton.vue'
import Sort from '~/components/buttons/Sort.vue'
import Collapse from '~/components/buttons/Collapse.vue'
import type { SportsEvent } from '~/types/sports'
import '~/assets/css/sports.css'

const props = defineProps<{
  sport?: string
}>()

const SPORT_NAMES: Record<string, string> = {
  basketball: 'Basketball',
  soccer: 'Soccer',
  tennis: 'Tennis',
  baseball: 'Baseball',
}

const selectedSports = computed(() => {
  if (props.sport && SPORT_NAMES[props.sport]) {
    return [SPORT_NAMES[props.sport]]
  }
  return ['Basketball', 'Soccer', 'Tennis', 'Baseball']
})

const { translate } = useSiteLocale()

const search = ref('')
const sortBy = ref<'league' | 'time'>('time')
const matchList = ref<InstanceType<typeof InplayMatches> | null>(null)

const { data, status, error, refresh } = await useFetch('/api/sports', {
  query: { mode: 'inplay' },
})
const liveEvents = computed(() => data.value?.events ?? [])
let refreshTimer: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  refreshTimer = setInterval(() => { if (status.value !== 'pending') void refresh() }, 30000)
})
onBeforeUnmount(() => clearInterval(refreshTimer))

const filteredEvents = computed(() => {
  const q = search.value.toLowerCase().trim()
  let list = liveEvents.value.filter((event: SportsEvent) => matchesSportsSelection(event, selectedSports.value))

  if (q) {
    list = list.filter((event: SportsEvent) => {
      const details = `${event.home_team ?? ''} ${event.away_team ?? ''} ${event.sport_title ?? ''}`.toLowerCase()
      return details.includes(q)
    })
  }

  return [...list].sort((a, b) => {
    if (sortBy.value === 'league') {
      const leagueCompare = (a.sport_title ?? '').localeCompare(b.sport_title ?? '')
      if (leagueCompare !== 0) {
        return leagueCompare
      }
    }
    return new Date(b.commence_time).getTime() - new Date(a.commence_time).getTime()
  })
})
</script>

<template>
  <div class="results" :aria-busy="status === 'pending'">
    <div class="inplay-tab">
      <!-- Compact live toolbar -->
      <div class="toolbar">
        <SportsMobileSportsRoulette />
        <label class="search bg-[#1f1f1f] light:bg-white text-[#959799] light:text-[#5d7066] border border-transparent light:border-[#d8e2dc] light:shadow-sm">
          <span class="search-icons">
            <Search :size="16" aria-hidden="true" />
          </span>
          <input
            v-model="search"
            type="search"
            class="text-white light:text-[#10261c] placeholder:text-[#959799] light:placeholder:text-[#8c918f] bg-transparent outline-none"
            :placeholder="translate('Search league or team')"
            :aria-label="translate('Search league or team')"
          >
        </label>

        <Sort
          v-model="sortBy"
          class="light:bg-white light:text-[#5d7066] light:border light:border-[#d8e2dc]"
        />

        <Collapse
          :model-value="matchList?.allCollapsed ?? false"
          :title="translate('Collapse all matches')"
          class="light:bg-white light:text-[#5d7066] light:border light:border-[#d8e2dc]"
          @toggle="matchList?.toggleAll()"
        />
      </div>

      <!-- Loading State -->
      <SportsSkeleton v-if="status === 'pending' && !data" />

      <!-- Error State -->
      <div v-else-if="error" class="empty" role="alert">
        <h2>{{ translate('Unable to load inplay matches') }}</h2>
        <p>{{ translate('Live sports data is temporarily unavailable. Please try again.') }}</p>
        <button type="button" @click="refresh()">
          {{ translate('Try again') }}
        </button>
      </div>

      <!-- Live Matches List using InplayMatches -->
      <InplayMatches
        v-else-if="filteredEvents.length"
        ref="matchList"
        :events="filteredEvents"
        :group-by-sport="!props.sport"
      />

      <!-- Empty State -->
      <div v-else class="empty" role="status">
        <img
          src="/images/empty/no-events.webp"
          :alt="translate('No Live Streaming')"
          class="h-auto w-full max-w-[200px] object-contain"
        />
        <h2>{{ translate('No Live Streaming') }}</h2>
        <p>{{ translate('No live streaming matches available right now. Check back later.') }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
@media (min-width: 64rem) {
  .live-page .toolbar {
    align-items: center;
    gap: 8px;
    margin: 20px 0 12px;
  }

  .live-page .search {
    height: 36px;
    gap: 6px;
    padding: 0 10px;
    border-radius: 22px;
  }

  .live-page .search input { min-height: 36px; font-size: 14px; }
  .live-page .search input::placeholder { opacity: 1; }
  .live-page .search-icons :deep(svg) { width: 20px; height: 20px; stroke-width: 1.5; }
  .live-page .toolbar :deep(.toolbar-circle-btn) {
    width: 36px;
    height: 36px;
  }
}

@media (max-width: 63.99rem) {
  .live-page .inplay-tab .toolbar {
    gap: 8px;
    margin: 12px 0 16px;
  }

  .live-page .inplay-tab .search {
    gap: 6px;
    padding: 0 8px;
    border-radius: 22px;
  }

  .search-icons :deep(svg) { width: 20px; height: 20px; stroke-width: 1.5; }
}
</style>

