import type { H3Event } from 'h3'
import { getKadarioCatalog } from '~/server/utils/kadarioApi'
import { prioritizeFootballFixtures } from '~/utils/sportsSelection'

export default defineEventHandler(async (event: H3Event) => {
  const config = useRuntimeConfig(event)
  const livestreamUrl = (config.livestreamApi as string) || 'https://live88.eu.cc/api/v1/hoopslive/football/games/live?site=YBa-BnymZ6iN8pkfAUFTWIKn'
  const catalog = await getKadarioCatalog(config.kadarioApi, config.kadarioSite, true, ['football', 'basketball'], livestreamUrl)
  return {
    ...catalog,
    results: prioritizeFootballFixtures(catalog.results ?? []),
  }
})
