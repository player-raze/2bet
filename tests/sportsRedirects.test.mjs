import test, { describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import {
  buildBybetRedirectUrl,
  getEnvRedirectCode,
  getEnvRedirectUrl,
  getSportsTabRedirectPath,
  getSportsMatchRedirectPath,
  resolveSportsMatchRedirectUrl,
  resolveSportsTabRedirectUrl,
  resolveTennisRedirectUrl,
} from '../utils/sportsRedirect.ts'

describe('Sports Navigation External Redirects Suite', () => {
  const rawEnvBase = getEnvRedirectUrl()
  const envBase = rawEnvBase.replace(/\/+$/, '')
  const envCode = getEnvRedirectCode()
  const pQuery = envCode ? `?p=${encodeURIComponent(envCode)}` : ''

  test('Case 1: popular > smart pick redirects to sportEvents/hotGame/smartPick with p parameter', () => {
    const pathResult = getSportsTabRedirectPath('popular', 'smart-pick')
    assert.equal(pathResult, 'sportEvents/hotGame/smartPick')

    const urlDefault = resolveSportsTabRedirectUrl('popular', 'smart-pick')
    assert.equal(urlDefault, `${envBase}/sportEvents/hotGame/smartPick${pQuery}`)

    const urlCustom = resolveSportsTabRedirectUrl('popular', 'smart-pick', 'https://bybet.ph/', 'PROMO99')
    assert.equal(urlCustom, 'https://bybet.ph/sportEvents/hotGame/smartPick?p=PROMO99')
  })

  test('Case 2: popular > outright redirects to sportEvents/hotGame/outright with p parameter', () => {
    const pathResult = getSportsTabRedirectPath('popular', 'outright')
    assert.equal(pathResult, 'sportEvents/hotGame/outright')

    const urlDefault = resolveSportsTabRedirectUrl('popular', 'outright')
    assert.equal(urlDefault, `${envBase}/sportEvents/hotGame/outright${pQuery}`)
  })

  test('Case 3: basketball > parlay redirects to sportEvents/parlay/basketball/interval/inplay with p parameter', () => {
    const pathParlay = getSportsTabRedirectPath('basketball', 'parlay')
    const pathSmartPick = getSportsTabRedirectPath('basketball', 'smart-pick')
    assert.equal(pathParlay, 'sportEvents/parlay/basketball/interval/inplay')
    assert.equal(pathSmartPick, 'sportEvents/parlay/basketball/interval/inplay')

    const urlDefault = resolveSportsTabRedirectUrl('basketball', 'smart-pick')
    assert.equal(urlDefault, `${envBase}/sportEvents/parlay/basketball/interval/inplay${pQuery}`)
  })

  test('Case 4: basketball > outright redirects to sportEvents/outright/basketball with p parameter', () => {
    const pathResult = getSportsTabRedirectPath('basketball', 'outright')
    assert.equal(pathResult, 'sportEvents/outright/basketball')

    const urlDefault = resolveSportsTabRedirectUrl('basketball', 'outright')
    assert.equal(urlDefault, `${envBase}/sportEvents/outright/basketball${pQuery}`)
  })

  test('Case 5: soccer > parlay redirects to sportEvents/parlay/football/interval/parlayPromotion with p parameter', () => {
    const pathParlay = getSportsTabRedirectPath('soccer', 'parlay')
    const pathSmartPick = getSportsTabRedirectPath('soccer', 'smart-pick')
    assert.equal(pathParlay, 'sportEvents/parlay/football/interval/parlayPromotion')
    assert.equal(pathSmartPick, 'sportEvents/parlay/football/interval/parlayPromotion')

    const urlDefault = resolveSportsTabRedirectUrl('soccer', 'smart-pick')
    assert.equal(urlDefault, `${envBase}/sportEvents/parlay/football/interval/parlayPromotion${pQuery}`)
  })

  test('Case 6: soccer > outright redirects to sportEvents/outright/football with p parameter', () => {
    const pathResult = getSportsTabRedirectPath('soccer', 'outright')
    assert.equal(pathResult, 'sportEvents/outright/football')

    const urlDefault = resolveSportsTabRedirectUrl('soccer', 'outright')
    assert.equal(urlDefault, `${envBase}/sportEvents/outright/football${pQuery}`)
  })

  test('Case 7: soccer > replay redirects to sportEvents/gameResult/football/regular/today with p parameter', () => {
    const pathResult = getSportsTabRedirectPath('soccer', 'replay')
    assert.equal(pathResult, 'sportEvents/gameResult/football/regular/today')

    const urlDefault = resolveSportsTabRedirectUrl('soccer', 'replay')
    assert.equal(urlDefault, `${envBase}/sportEvents/gameResult/football/regular/today${pQuery}`)
  })

  test('Case 8: live > all esports redirects to sportEvents/liveGame/eSportBallGroup with p parameter', () => {
    const pathEsports = getSportsTabRedirectPath('live', 'esports')
    const pathAllEsports = getSportsTabRedirectPath('live', 'all esports')
    assert.equal(pathEsports, 'sportEvents/liveGame/eSportBallGroup')
    assert.equal(pathAllEsports, 'sportEvents/liveGame/eSportBallGroup')

    const urlDefault = resolveSportsTabRedirectUrl('live', 'esports')
    assert.equal(urlDefault, `${envBase}/sportEvents/liveGame/eSportBallGroup${pQuery}`)
  })

  test('Case 9: buildBybetRedirectUrl handles formatting, slashes, and custom query params cleanly', () => {
    assert.equal(
      buildBybetRedirectUrl('sportEvents/hotGame/smartPick', 'https://bybet.com/', 'xjSD'),
      'https://bybet.com/sportEvents/hotGame/smartPick?p=xjSD',
    )
    assert.equal(
      buildBybetRedirectUrl('/sportEvents/hotGame/smartPick', 'https://bybet.com///', 'customCode'),
      'https://bybet.com/sportEvents/hotGame/smartPick?p=customCode',
    )
  })

  test('Case 10: components/SportsPopular.vue wires tab destination and external redirect', () => {
    const source = fs.readFileSync(path.resolve('components/SportsPopular.vue'), 'utf-8')
    assert.match(source, /getTabDestination\(tab\.key\)/, 'SportsPopular must bind getTabDestination to tab :to')
    assert.match(source, /:external="redirectsToByBet\(tab\.key\)"/, 'SportsPopular must mark redirects as external')
    assert.match(source, /getSportsTabRedirectPath/, 'SportsPopular must use getSportsTabRedirectPath')
  })

  test('Case 11: pages/explore/sports/live.vue includes All eSports tab pointing to sportEvents/liveGame/eSportBallGroup', () => {
    const source = fs.readFileSync(path.resolve('pages/explore/sports/live.vue'), 'utf-8')
    assert.match(source, /sportEvents\/liveGame\/eSportBallGroup/, 'live.vue must contain live esports redirect path')
    assert.match(source, /key:\s*['"]esports['"]/, 'live.vue must define esports tab')
    assert.match(source, /:external="Boolean\(tab\.external\)"/, 'live.vue must bind external attribute on tabs')
  })

  test('Case 12: components/sports/MobileSportsNav.vue routes esports in live mode to sportEvents/liveGame/eSportBallGroup', () => {
    const source = fs.readFileSync(path.resolve('components/sports/MobileSportsNav.vue'), 'utf-8')
    assert.match(
      source,
      /isLive\.value\s*&&\s*\(sport\.key === 'esports'[\s\S]*?sportEvents\/liveGame\/eSportBallGroup/,
      'MobileSportsNav must route esports to sportEvents/liveGame/eSportBallGroup when isLive is true',
    )
  })

  test('Case 13: utils/sportsRedirect.ts uses .env values when arguments are omitted', () => {
    // Both resolve to the configured .env values
    assert.equal(getEnvRedirectUrl(), rawEnvBase)
    assert.equal(getEnvRedirectCode(), envCode)

    // Calling without explicit bybetRedirectUrl or redirectCode parameters
    assert.equal(
      buildBybetRedirectUrl('sportEvents/hotGame/smartPick'),
      `${envBase}/sportEvents/hotGame/smartPick${pQuery}`,
    )
    assert.equal(
      resolveTennisRedirectUrl(),
      `${envBase}/sportEvents/inplay/tennis${pQuery}`,
    )
    assert.equal(
      resolveSportsTabRedirectUrl('basketball', 'parlay'),
      `${envBase}/sportEvents/parlay/basketball/interval/inplay${pQuery}`,
    )
  })

  test('Case 14: Dynamic changes to process.env BYBET_REDIRECT_URL and BYBET_REDIRECT_CODE immediately update URLs', () => {
    const origUrl = process.env.BYBET_REDIRECT_URL
    const origCode = process.env.BYBET_REDIRECT_CODE

    try {
      process.env.BYBET_REDIRECT_URL = 'https://custom-env-test.bybet.com/'
      process.env.BYBET_REDIRECT_CODE = 'PROMO_FROM_ENV'

      assert.equal(getEnvRedirectUrl(), 'https://custom-env-test.bybet.com/')
      assert.equal(getEnvRedirectCode(), 'PROMO_FROM_ENV')

      assert.equal(
        buildBybetRedirectUrl('sportEvents/hotGame/smartPick'),
        'https://custom-env-test.bybet.com/sportEvents/hotGame/smartPick?p=PROMO_FROM_ENV',
      )
      assert.equal(
        resolveSportsTabRedirectUrl('soccer', 'replay'),
        'https://custom-env-test.bybet.com/sportEvents/gameResult/football/regular/today?p=PROMO_FROM_ENV',
      )
    } finally {
      if (origUrl === undefined) delete process.env.BYBET_REDIRECT_URL
      else process.env.BYBET_REDIRECT_URL = origUrl
      if (origCode === undefined) delete process.env.BYBET_REDIRECT_CODE
      else process.env.BYBET_REDIRECT_CODE = origCode
    }
  })

  test('Case 15: Empty BYBET_REDIRECT_CODE omits ?p= query parameter across all helpers and config', () => {
    assert.equal(buildBybetRedirectUrl('login', 'https://2bet.com', ''), 'https://2bet.com/login')
    assert.equal(buildBybetRedirectUrl('login', 'https://2bet.com', '   '), 'https://2bet.com/login')
    assert.equal(
      buildBybetRedirectUrl('sportEvents/hotGame/smartPick?tab=1', 'https://2bet.com', ''),
      'https://2bet.com/sportEvents/hotGame/smartPick?tab=1',
    )

    const origCode = process.env.BYBET_REDIRECT_CODE
    try {
      process.env.BYBET_REDIRECT_CODE = ''
      assert.equal(getEnvRedirectCode(), '')
      assert.equal(buildBybetRedirectUrl('login', 'https://2bet.com'), 'https://2bet.com/login')
      assert.equal(resolveTennisRedirectUrl('https://2bet.com'), 'https://2bet.com/sportEvents/inplay/tennis')
      assert.equal(
        resolveSportsTabRedirectUrl('soccer', 'outright', 'https://2bet.com'),
        'https://2bet.com/sportEvents/outright/football',
      )
    } finally {
      if (origCode === undefined) delete process.env.BYBET_REDIRECT_CODE
      else process.env.BYBET_REDIRECT_CODE = origCode
    }

    const nuxtConfig = fs.readFileSync(path.resolve('nuxt.config.ts'), 'utf-8')
    assert.match(nuxtConfig, /bybetRedirectCode:\s*\(environment\?\.BYBET_REDIRECT_CODE\s*\?\?/)
  })

  test('Case 16: HomepagePartnerBanner and FloatingPartnerBanner link to env redirect /login', () => {
    for (const file of [
      'components/HomepagePartnerBanner.vue',
      'components/FloatingPartnerBanner.vue',
    ]) {
      const source = fs.readFileSync(path.resolve(file), 'utf-8')
      assert.match(source, /buildBybetRedirectUrl\('login',\s*rawRedirectUrl,\s*bybetRedirectCode\)/, `${file} must build external login redirect URL`)
      assert.doesNotMatch(source, /to="\/affiliate"/, `${file} must no longer link to /affiliate`)
    }
  })
})

describe('Match card destinations', () => {
  const destinations = [
    ['/sports/popular/upcoming', 'sportEvents/hotGame/incoming'],
    ['/sports/popular/league', 'sportEvents/hotGame/tournament'],
    ['/sports/popular/pre-match', 'sportEvents/hotGame/early'],
    ['/sports/basketball/inplay', 'sportEvents/inplay/basketball'],
    ['/sports/basketball/league', 'sportEvents/tournament/basketball'],
    ['/sports/basketball/upcoming', 'sportEvents/incoming/basketball'],
    ['/sports/basketball/pre-match', 'sportEvents/early/basketball/'],
    ['/sports/soccer/inplay', 'sportEvents/inplay/football'],
    ['/sports/soccer/league', 'sportEvents/tournament/football'],
    ['/sports/soccer/upcoming', 'sportEvents/incoming/football'],
    ['/sports/soccer/pre-match', 'sportEvents/early/football/'],
    ['/sports/live', 'sportEvents/liveGame/all'],
    ['/sports/live/basketball', 'sportEvents/liveGame/basketball'],
    ['/sports/live/soccer', 'sportEvents/liveGame/football'],
  ]

  for (const [route, destination] of destinations) {
    test(`${route} match cards open ${destination}`, () => {
      assert.equal(getSportsMatchRedirectPath(route), destination)
      assert.equal(getSportsMatchRedirectPath(`/explore${route}`), destination)
      assert.equal(
        resolveSportsMatchRedirectUrl(route, 'https://sports.example/', 'PROMO 99'),
        `https://sports.example/${destination}?p=PROMO%2099`,
      )
    })
  }

  test('filtered routes and football aliases retain the matching sports destination', () => {
    assert.equal(getSportsMatchRedirectPath('/sports/popular/upcoming/24?sort=time#matches'), 'sportEvents/hotGame/incoming')
    assert.equal(getSportsMatchRedirectPath('/sports/basketball/pre-match/11-18-2026'), 'sportEvents/early/basketball/')
    assert.equal(getSportsMatchRedirectPath('/sports/soccer/league/premier-league'), 'sportEvents/tournament/football')
    assert.equal(getSportsMatchRedirectPath('/sports/football/inplay'), 'sportEvents/inplay/football')
    assert.equal(getSportsMatchRedirectPath('/sports/live/football/'), 'sportEvents/liveGame/football')
    assert.equal(resolveSportsMatchRedirectUrl('/sports/live', 'https://sports.example', ''), 'https://sports.example/sportEvents/liveGame/all')
  })

  test('match destinations do not turn local sports tabs into external links', () => {
    assert.equal(getSportsTabRedirectPath('popular', 'league'), null)
    assert.equal(getSportsTabRedirectPath('basketball', 'inplay'), null)
    assert.equal(getSportsTabRedirectPath('soccer', 'upcoming'), null)
    assert.equal(getSportsMatchRedirectPath('/entertainment/poker'), null)
    assert.equal(getSportsMatchRedirectPath('/sports/soccer/replay'), null)
  })
})
