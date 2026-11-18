/**
 * Utility functions for building and resolving external sports redirect URLs.
 * Reads defaults directly from runtime config and .env configuration.
 */

export const DEFAULT_BYBET_REDIRECT_URL = 'https://bybet.com'
export const DEFAULT_BYBET_REDIRECT_CODE = 'xjSD'

/**
 * Attempts to read a key from a local .env file in Node runtime environments.
 */
function tryReadEnvFile(key: string): string | undefined {
  try {
    const proc = (globalThis as unknown as { process?: any }).process
    if (typeof proc?.getBuiltinModule === 'function' && typeof proc?.cwd === 'function') {
      const fs = proc.getBuiltinModule('node:fs')
      const path = proc.getBuiltinModule('node:path')
      const envPath = path.resolve(proc.cwd(), '.env')
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf-8')
        const match = content.match(new RegExp(`^[ \\t]*${key}[ \\t]*=[ \\t]*(.*)$`, 'm'))
        if (match) {
          const rawVal = match[1].trim()
          if (!rawVal) return ''
          const quoted = rawVal.match(/^(?:"([^"\r\n]*)"|'([^'\r\n]*)')/)
          if (quoted) return (quoted[1] ?? quoted[2] ?? '').trim()
          return rawVal.split('#')[0].trim()
        }
      }
    }
  } catch {
    // Ignore in non-Node or browser environments
  }
  return undefined
}

/**
 * Resolves the base redirect URL from Nuxt runtimeConfig, process.env, or .env file.
 */
export const getEnvRedirectUrl = (): string => {
  try {
    if (typeof useRuntimeConfig === 'function') {
      const config = useRuntimeConfig()
      if (config?.public?.bybetRedirectUrl) {
        return String(config.public.bybetRedirectUrl).trim()
      }
    }
  } catch {
    // Outside Nuxt context
  }

  const envUrl = (
    (typeof process !== 'undefined' && process.env?.BYBET_REDIRECT_URL) ||
    tryReadEnvFile('BYBET_REDIRECT_URL') ||
    ''
  ).trim()

  return envUrl || DEFAULT_BYBET_REDIRECT_URL
}

/**
 * Resolves the redirect referral / promo code from runtimeConfig, process.env, or .env file.
 * Preserves an explicitly empty string so callers omit the ?p= query parameter.
 */
export const getEnvRedirectCode = (): string => {
  try {
    if (typeof useRuntimeConfig === 'function') {
      const config = useRuntimeConfig()
      if (config?.public?.bybetRedirectCode !== undefined && config?.public?.bybetRedirectCode !== null) {
        return String(config.public.bybetRedirectCode).trim()
      }
    }
  } catch {
    // Outside Nuxt context
  }

  if (typeof process !== 'undefined' && process.env && process.env.BYBET_REDIRECT_CODE !== undefined) {
    return String(process.env.BYBET_REDIRECT_CODE).trim()
  }

  const fileCode = tryReadEnvFile('BYBET_REDIRECT_CODE')
  if (fileCode !== undefined) {
    return fileCode
  }

  return DEFAULT_BYBET_REDIRECT_CODE
}

/**
 * Constructs a fully qualified external ByBet redirect URL with query parameters.
 */
export const buildBybetRedirectUrl = (
  path: string,
  bybetRedirectUrl?: string,
  redirectCode?: string,
): string => {
  const envUrl = getEnvRedirectUrl()
  const raw = (bybetRedirectUrl || envUrl).trim().replace(/\/+$/, '')
  const rawCode = redirectCode !== undefined && redirectCode !== null ? redirectCode : getEnvRedirectCode()
  const code = String(rawCode ?? '').trim()
  const cleanPath = path.trim().replace(/^\/+/, '')

  const separator = cleanPath.includes('?') ? '&' : '?'
  const query = code && !cleanPath.includes('p=') ? `${separator}p=${encodeURIComponent(code)}` : ''

  return cleanPath ? `${raw}/${cleanPath}${query}` : `${raw}${query}`
}

export const resolveTennisRedirectUrl = (
  bybetRedirectUrl?: string,
  redirectCode?: string,
): string => {
  return buildBybetRedirectUrl('sportEvents/inplay/tennis', bybetRedirectUrl, redirectCode)
}

export const SPORTS_TAB_REDIRECT_PATHS: Record<string, Record<string, string>> = {
  popular: {
    'smart-pick': 'sportEvents/hotGame/smartPick',
    'smartpick': 'sportEvents/hotGame/smartPick',
    outright: 'sportEvents/hotGame/outright',
  },
  basketball: {
    'smart-pick': 'sportEvents/parlay/basketball/interval/inplay',
    parlay: 'sportEvents/parlay/basketball/interval/inplay',
    outright: 'sportEvents/outright/basketball',
  },
  soccer: {
    'smart-pick': 'sportEvents/parlay/football/interval/parlayPromotion',
    parlay: 'sportEvents/parlay/football/interval/parlayPromotion',
    outright: 'sportEvents/outright/football',
    replay: 'sportEvents/gameResult/football/regular/today',
  },
  football: {
    'smart-pick': 'sportEvents/parlay/football/interval/parlayPromotion',
    parlay: 'sportEvents/parlay/football/interval/parlayPromotion',
    outright: 'sportEvents/outright/football',
    replay: 'sportEvents/gameResult/football/regular/today',
  },
  live: {
    'all-esports': 'sportEvents/liveGame/eSportBallGroup',
    esports: 'sportEvents/liveGame/eSportBallGroup',
    'all esports': 'sportEvents/liveGame/eSportBallGroup',
  },
}

export const getSportsTabRedirectPath = (sport: string, tabKey: string): string | null => {
  const normalizedSport = (sport || '').trim().toLowerCase()
  const normalizedTab = (tabKey || '').trim().toLowerCase()
  return SPORTS_TAB_REDIRECT_PATHS[normalizedSport]?.[normalizedTab] ?? null
}

export const resolveSportsTabRedirectUrl = (
  sport: string,
  tabKey: string,
  bybetRedirectUrl?: string,
  redirectCode?: string,
): string | null => {
  const path = getSportsTabRedirectPath(sport, tabKey)
  if (!path) return null
  return buildBybetRedirectUrl(path, bybetRedirectUrl, redirectCode)
}

/** Match cards follow the current page without changing the local sports tabs. */
export const getSportsMatchRedirectPath = (routePath: string): string | null => {
  const pathname = routePath.split(/[?#]/)[0].replace(/^\/explore(?=\/)/, '')
  const match = pathname.match(/^\/sports\/(popular|basketball|soccer|football|tennis|baseball|live)(?:\/([^/]+))?(?:\/|$)/)
  if (!match) return null

  const [, section, tab] = match
  const sport = section === 'soccer' ? 'football' : section

  if (section === 'live') {
    const liveSport = tab === 'soccer' ? 'football' : (tab || 'all')
    return ['all', 'basketball', 'football', 'tennis', 'baseball'].includes(liveSport)
      ? `sportEvents/liveGame/${liveSport}`
      : null
  }

  const modes: Record<string, string> = {
    league: 'tournament',
    upcoming: 'incoming',
    'pre-match': 'early',
    prematch: 'early',
    ...(section === 'popular' ? {} : { inplay: 'inplay' }),
  }
  const mode = modes[tab || (section === 'popular' ? 'league' : 'inplay')]
  if (!mode) return null
  if (section === 'popular') return `sportEvents/hotGame/${mode}`
  return `sportEvents/${mode}/${sport}${mode === 'early' ? '/' : ''}`
}

export const resolveSportsMatchRedirectUrl = (
  routePath: string,
  bybetRedirectUrl?: string,
  redirectCode?: string,
): string | null => {
  const path = getSportsMatchRedirectPath(routePath)
  return path ? buildBybetRedirectUrl(path, bybetRedirectUrl, redirectCode) : null
}

const normalizeMappedKey = (value: string | undefined, routePrefixPattern: RegExp): string => {
  const pathname = (value || '').split(/[?#]/)[0].replace(/^\/explore(?=\/)/, '')
  const stripped = pathname.replace(routePrefixPattern, '').replace(/^\/+|\/+$/g, '').toLowerCase()
  return stripped.split('/')[0] || ''
}

export const LIVE_CASINO_REDIRECT_PATHS: Record<string, string> = {
  featured: 'liveCasino/46?option=0',
  'good-road': 'liveCasino/46?option=1',
  'live-show': 'liveCasino/46?option=19',
  'game-show': 'liveCasino/46?option=19',
  baccarat: 'liveCasino/46?option=18',
  'multi-table': 'liveCasino/46?option=18',
  multitable: 'liveCasino/46?option=18',
  'dragon-tiger': 'liveCasino/46?option=20',
  roulette: 'liveCasino/46?option=21',
  sicbo: 'liveCasino/46?option=23',
}

export const getLiveCasinoRedirectPath = (categoryOrPath?: string): string => {
  const key = normalizeMappedKey(categoryOrPath, /^\/?entertainment\/live-casino(?:\/|$)/i)
  return LIVE_CASINO_REDIRECT_PATHS[key] ?? 'liveCasino/46?option=0'
}

export const resolveLiveCasinoRedirectUrl = (
  categoryOrPath?: string,
  bybetRedirectUrl?: string,
  redirectCode?: string,
): string => {
  return buildBybetRedirectUrl(getLiveCasinoRedirectPath(categoryOrPath), bybetRedirectUrl, redirectCode)
}

export const POKER_REDIRECT_PATHS: Record<string, string> = {
  '': 'board/hot',
  popular: 'board/hot',
  all: 'board/all',
  fishing: 'board/fishing',
  mahjong: 'board/mahjong',
  bullbull: 'board/bullbull',
  poker: 'board/poker',
  baccarat: 'board/hundred',
  other: 'board/other',
}

export const getPokerRedirectPath = (categoryOrPath?: string): string => {
  const key = normalizeMappedKey(categoryOrPath, /^\/?entertainment\/poker(?:\/|$)/i)
  return POKER_REDIRECT_PATHS[key] ?? 'board/hot'
}

export const resolvePokerRedirectUrl = (
  categoryOrPath?: string,
  bybetRedirectUrl?: string,
  redirectCode?: string,
): string => {
  return buildBybetRedirectUrl(getPokerRedirectPath(categoryOrPath), bybetRedirectUrl, redirectCode)
}

export const SLOTS_REDIRECT_PATHS: Record<string, string> = {
  '': 'slotMachine/main',
  home: 'slotMachine/main',
  'top-pick': 'slotMachine/recommend',
  new: 'slotMachine/new',
  hot: 'slotMachine/hot',
  cold: 'slotMachine/cold',
  'max-rpt': 'slotMachine/high',
  'max-rtp': 'slotMachine/high',
}

export const getSlotsRedirectPath = (categoryOrPath?: string): string => {
  const key = normalizeMappedKey(categoryOrPath, /^\/?egames\/slots(?:\/|$)/i)
  return SLOTS_REDIRECT_PATHS[key] ?? 'slotMachine/main'
}

export const resolveSlotsRedirectUrl = (
  categoryOrPath?: string,
  bybetRedirectUrl?: string,
  redirectCode?: string,
): string => {
  return buildBybetRedirectUrl(getSlotsRedirectPath(categoryOrPath), bybetRedirectUrl, redirectCode)
}

export const JACKPOT_REDIRECT_PATHS: Record<string, string> = {
  '': 'jackpot/list',
  all: 'jackpot/list',
  jdb: 'jackpot/18',
  standalone: 'jackpot/singleJackpot',
}

export const getJackpotRedirectPath = (providerOrPath?: string): string => {
  const key = normalizeMappedKey(providerOrPath, /^\/?egames\/jackpot(?:\/|$)/i)
  return JACKPOT_REDIRECT_PATHS[key] ?? 'jackpot/list'
}

export const resolveJackpotRedirectUrl = (
  providerOrPath?: string,
  bybetRedirectUrl?: string,
  redirectCode?: string,
): string => {
  return buildBybetRedirectUrl(getJackpotRedirectPath(providerOrPath), bybetRedirectUrl, redirectCode)
}

export const LIVE_PLAZA_REDIRECT_PATHS: Record<string, string> = {
  '': 'squareHome',
  home: 'squareHome',
  'expert-predictions': 'expertHome',
}

export const getLivePlazaRedirectPath = (pageOrPath?: string): string => {
  const key = normalizeMappedKey(pageOrPath, /^\/?live-plaza(?:\/|$)/i)
  return LIVE_PLAZA_REDIRECT_PATHS[key] ?? 'squareHome'
}

export const resolveLivePlazaRedirectUrl = (
  pageOrPath?: string,
  bybetRedirectUrl?: string,
  redirectCode?: string,
): string => {
  return buildBybetRedirectUrl(getLivePlazaRedirectPath(pageOrPath), bybetRedirectUrl, redirectCode)
}
