<script setup lang="ts">
import { ChevronDown, ChevronRight } from 'lucide-vue-next'
import InplayMatch from './InplayMatch.vue'
import type { SportsEvent } from '~/types/sports'

const props = withDefaults(defineProps<{
  events: SportsEvent[]
  groupBySport?: boolean
}>(), {
  groupBySport: false,
})

interface SportCategory {
  key: string
  name: string
  icon: string
  events: SportsEvent[]
}

const SPORT_CATEGORIES: Record<string, Omit<SportCategory, 'events'>> = {
  basketball: { key: 'basketball', name: 'Basketball', icon: '/icons/sports/basketball.webp' },
  nba: { key: 'basketball', name: 'Basketball', icon: '/icons/sports/basketball.webp' },
  pba: { key: 'basketball', name: 'Basketball', icon: '/icons/sports/basketball.webp' },
  soccer: { key: 'soccer', name: 'Soccer', icon: '/icons/sports/soccer.webp' },
  football: { key: 'soccer', name: 'Soccer', icon: '/icons/sports/soccer.webp' },
  tennis: { key: 'tennis', name: 'Tennis', icon: '/icons/sports/tennis.webp' },
  atp: { key: 'tennis', name: 'Tennis', icon: '/icons/sports/tennis.webp' },
  wta: { key: 'tennis', name: 'Tennis', icon: '/icons/sports/tennis.webp' },
  baseball: { key: 'baseball', name: 'Baseball', icon: '/icons/sports/baseball.webp' },
  mlb: { key: 'baseball', name: 'Baseball', icon: '/icons/sports/baseball.webp' },
}

const SPORT_ORDER = ['basketball', 'soccer', 'tennis', 'baseball']

const collapsed = ref<string[]>([])
const selectedOutcomes = ref<Record<string, string>>({})
const sportType = (event: SportsEvent) => (event.sport || event.sport_key.split('_')[0] || '').toLowerCase()
const tournamentKey = (event: SportsEvent) => event.leagueId || `${event.sport_key}:${event.sport_title}`
const tournamentKeys = computed(() => [...new Set(props.events.map(tournamentKey))])
const allCollapsed = computed(() => tournamentKeys.value.length > 0 && tournamentKeys.value.every(key => collapsed.value.includes(key)))
const isExpanded = (key: string) => !collapsed.value.includes(key)
function toggleTournament(key: string) {
  collapsed.value = isExpanded(key) ? [...collapsed.value, key] : collapsed.value.filter(item => item !== key)
}
function toggleCategory(events: SportsEvent[]) {
  const keys = [...new Set(events.map(tournamentKey))]
  const allClosed = keys.every(key => collapsed.value.includes(key))
  collapsed.value = allClosed
    ? collapsed.value.filter(key => !keys.includes(key))
    : [...new Set([...collapsed.value, ...keys])]
}
function toggleAll() {
  collapsed.value = allCollapsed.value ? [] : [...tournamentKeys.value]
}
function tournaments(events: SportsEvent[]) {
  const groups = new Map<string, { key: string; title: string; events: SportsEvent[] }>()
  for (const event of events) {
    const key = tournamentKey(event)
    const group = groups.get(key) ?? { key, title: event.sport_title, events: [] }
    group.events.push(event)
    groups.set(key, group)
  }
  return [...groups.values()]
}
defineExpose({ toggleAll, allCollapsed })

const sportCategories = computed(() => {
  if (!props.groupBySport) {
    return [{
      key: 'all',
      name: props.events[0] ? SPORT_CATEGORIES[sportType(props.events[0])]?.name ?? '' : '',
      icon: '',
      events: props.events,
    }]
  }

  const categories = new Map<string, SportCategory>()

  for (const event of props.events) {
    const sport = sportType(event)
    const details = SPORT_CATEGORIES[sport] ?? {
      key: sport || 'other',
      name: sport
        ? sport.charAt(0).toUpperCase() + sport.slice(1).replaceAll('-', ' ')
        : 'Other sports',
      icon: '',
    }
    const category = categories.get(details.key) ?? { ...details, events: [] }
    category.events.push(event)
    categories.set(details.key, category)
  }

  return [...categories.values()].sort((a, b) => {
    const rank = (key: string) => {
      const index = SPORT_ORDER.indexOf(key)
      return index === -1 ? SPORT_ORDER.length : index
    }

    return rank(a.key) - rank(b.key)
  })
})
</script>

<template>
  <div class="sport-category-list min-w-0">
    <SportsCategorySection
      v-for="category in sportCategories"
      :key="category.key"
      :sport="category.key"
      :label="category.name"
      :show-banner="groupBySport"
      class="sport-category"
      :aria-label="groupBySport ? category.name : undefined"
    >
      <button
        v-if="category.name"
        class="live-category-heading text-white light:text-[#10261c]"
        type="button"
        :aria-expanded="category.events.some(event => isExpanded(tournamentKey(event)))"
        :aria-label="`${category.name}, ${category.events.length} live matches`"
        @click="toggleCategory(category.events)"
      >
        <span>{{ category.name }}</span>
        <span class="live-category-heading__count bg-[#292929] text-[#999] light:bg-[#eaf5ee] light:text-[#019440] light:border light:border-emerald-500/20">
          {{ category.events.length }}
          <ChevronRight :size="16" aria-hidden="true" />
        </span>
      </button>
      <div class="league-matches-list">
        <article
          v-for="tournament in tournaments(category.events)"
          :key="tournament.key"
          class="league-preview bg-[#141414] light:bg-white border border-white/5 light:border-[#d8e2dc] light:shadow-sm"
        >
          <button
            :id="`inplay-trigger-${tournament.key}`"
            class="league-card league-preview-heading"
            type="button"
            :aria-expanded="isExpanded(tournament.key)"
            :aria-controls="`inplay-panel-${tournament.key}`"
            @click="toggleTournament(tournament.key)"
          >
            <span class="league-name truncate text-[12px] text-[#999] light:text-[#5d7066]" :title="tournament.title">{{ tournament.title }}</span>
            <ChevronDown :size="16" class="shrink-0 text-[#999] light:text-[#5d7066]" :class="{ 'rotate-180': isExpanded(tournament.key) }" aria-hidden="true" />
          </button>
          <div
            v-show="isExpanded(tournament.key)"
            :id="`inplay-panel-${tournament.key}`"
            role="region"
            :aria-labelledby="`inplay-trigger-${tournament.key}`"
          >
            <InplayMatch
              v-for="event in tournament.events"
              :key="event.id"
              :match="event"
              :soccer="['soccer', 'football'].includes(sportType(event))"
              :full-markets="['basketball', 'nba', 'pba', 'baseball', 'mlb'].includes(sportType(event))"
              :selected-outcome="selectedOutcomes[event.id]"
              @select="selectedOutcomes[event.id] = selectedOutcomes[event.id] === $event ? '' : $event"
            />
          </div>
        </article>
      </div>
    </SportsCategorySection>
  </div>
</template>

<style scoped>
.live-category-heading {
  display: none;
}

.sport-category-list {
  display: grid;
  gap: 22px;
}

.sport-category {
  min-width: 0;
}

.sport-category__heading {
  display: flex;
  align-items: center;
  min-height: 30px;
  margin-bottom: 8px;
  padding: 0 4px;
  color: var(--text);
  gap: 8px;
}

.sport-category__heading h2 {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.2;
}

.sport-category__icon {
  width: 22px;
  height: 22px;
  flex: 0 0 auto;
  object-fit: contain;
}

.league-matches-list {
  display: grid;
  gap: 16px;
}

.league-preview {
  min-width: 0;
  overflow: hidden;
  border-radius: 10px;
  background: var(--surface);
}

.league-preview-heading {
  width: 100%;
  border: 0;
  border-radius: 0;
}


.league-preview-heading:focus-visible {
  outline-offset: -3px;
}

.league-chevron {
  flex-shrink: 0;
}

.league-chevron--expanded {
  transform: rotate(180deg);
}
@media (max-width: 63.99rem) {
  .live-page .sport-category-list {
    gap: 12px;
  }

  .live-page .live-category-heading {
    display: flex;
    width: 100%;
    min-height: 24px;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin: 0 0 12px;
    padding: 0;
    border: 0;
    background: transparent;
    font-size: 18px;
    font-weight: 700;
    line-height: 1.3;
    text-align: left;
  }

  .live-page .live-category-heading__count {
    display: flex;
    min-width: 46px;
    height: 24px;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    gap: 3px;
    padding: 0 6px 0 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
  }

  .live-page .league-matches-list {
    gap: 12px;
  }

  .live-page .league-preview {
    border-radius: 12px;
  }

  .live-page .league-preview-heading {
    min-height: 46px;
    padding: 10px 8px;
    background: transparent;
  }

  .live-page .league-preview-heading .league-name {
    font-size: 12px;
    font-weight: 400;
  }

  .live-page .league-preview-heading > svg {
    display: none;
  }

  .live-page .live-category-heading:focus-visible,
  .live-page .league-preview-heading:focus-visible {
    outline: 2px solid #48daa6;
    outline-offset: -2px;
  }
}
@media (min-width: 64rem) {
  .live-page .sport-category-list,
  .live-page .league-matches-list {
    gap: 16px;
  }

  .live-page .league-preview {
    border-radius: 12px;
  }

  .live-page .league-preview-heading {
    min-height: 46px;
    padding: 10px 12px;
    border-radius: 0;
    background: transparent;
  }

  .live-page .league-preview-heading .league-name {
    font-size: 12px;
    font-weight: 400;
  }

  .live-page .league-preview-heading > svg {
  }

  .live-page .league-preview-heading:focus-visible {
    outline: 2px solid #48daa6;
    outline-offset: -2px;
  }
}

</style>
