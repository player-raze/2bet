import type { SportsEvent } from '~/types/sports'

export function matchesSportsSelection(
  event: SportsEvent,
  selectedSports: string[],
  selectedTournaments: Record<string, string[]> = {},
) {
  const aliases: Record<string, string> = {
    football: 'Soccer', soccer: 'Soccer', basketball: 'Basketball', nba: 'Basketball', pba: 'Basketball',
    tennis: 'Tennis', atp: 'Tennis', wta: 'Tennis', baseball: 'Baseball', mlb: 'Baseball',
  }
  const group = aliases[(event.sport || event.sport_key.split('_')[0] || '').toLowerCase()]
  if (!group) return false
  const normalizedSelectedSports = selectedSports.map(s => aliases[s.toLowerCase()] || s)
  if (!normalizedSelectedSports.includes(group)) return false
  const keys = selectedTournaments[group] ?? []
  if (keys.length === 0) return true
  if (keys.some(key => key.endsWith('*') ? event.sport_key.startsWith(key.slice(0, -1)) : event.sport_key === key)) {
    return true
  }
  // If the event has a numeric league ID from a live stream feed and none of the configured tournament keys are numeric,
  // allow the live match for the sport.
  const isNumericLeague = /^\d+$/.test(event.sport_key) || Boolean(event.leagueId)
  const hasNumericFilter = keys.some(key => /^\d+$/.test(key))
  if (isNumericLeague && !hasNumericFilter) {
    return true
  }
  return false
}

type SportFixtureLike = { sport?: string; sport_key?: string }

const FIXTURE_SPORT_LABELS: Record<string, string> = {
  soccer: 'Football',
  basketball: 'Basketball',
  tennis: 'Tennis',
  baseball: 'Baseball',
}

/** Normalize a fixture sport identifier to canonical lowercase key ('football' -> 'soccer'). */
export function getFixtureSportKey(fixture: SportFixtureLike): string {
  const rawSport = (fixture.sport || fixture.sport_key?.split('_')[0] || '').trim().toLowerCase()
  return rawSport === 'football' ? 'soccer' : rawSport
}

/** Return the display label for a fixture sport key. */
export function getFixtureSportLabel(fixture: SportFixtureLike): string {
  return FIXTURE_SPORT_LABELS[getFixtureSportKey(fixture)] || 'Sports'
}

/** Prioritize football/soccer fixtures first while preserving relative order in each group. */
export function prioritizeFootballFixtures<T extends SportFixtureLike>(fixtures: readonly T[]): T[] {
  const football: T[] = []
  const others: T[] = []
  for (const fixture of fixtures) {
    if (getFixtureSportKey(fixture) === 'soccer') {
      football.push(fixture)
    } else {
      others.push(fixture)
    }
  }
  return [...football, ...others]
}

