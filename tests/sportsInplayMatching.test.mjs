import test, { describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import {
  getFixtureSportKey,
  getFixtureSportLabel,
  matchesSportsSelection,
  prioritizeFootballFixtures,
} from '../utils/sportsSelection.ts'
import { getSportsTabRedirectPath, resolveSportsTabRedirectUrl, getEnvRedirectUrl } from '../utils/sportsRedirect.ts'
import { useSportsRouteBase } from '../composables/useSportsRouteBase.ts'
import { SAMPLE_SPORTS, getTournamentLogo } from '../data/sports.ts'

describe('Sports In-Play Matching & Football Route Suite', () => {
  const kadarioBasketballEvent = {
    id: '214032414',
    leagueId: '10858',
    sport: 'basketball',
    sport_key: '10858',
    sport_title: 'Philippine National League',
    commence_time: '2026-11-09T07:30:00Z',
    home_team: 'Avalanche',
    away_team: 'Juggernauts',
    completed: false,
    scores: [
      { name: 'Avalanche', score: '33' },
      { name: 'Juggernauts', score: '39' },
    ],
  }

  const kadarioFootballEvent = {
    id: '275487930',
    leagueId: '717572',
    sport: 'football',
    sport_key: '717572',
    sport_title: 'CWL 1',
    commence_time: '2026-11-09T07:00:00Z',
    home_team: 'Qingdao West Coast(w)',
    away_team: 'Wuhan Sports University(w)',
    completed: false,
    scores: [
      { name: 'Qingdao West Coast(w)', score: '0' },
      { name: 'Wuhan Sports University(w)', score: '2' },
    ],
  }

  test('Case 1: Live Kadario basketball event matches Basketball selection without tournaments', () => {
    const matches = matchesSportsSelection(kadarioBasketballEvent, ['Basketball'])
    assert.equal(matches, true)
  })

  test('Case 2: Live Kadario basketball event matches Basketball selection even when selectedTournaments has Odds API keys', () => {
    const selectedTournaments = {
      Basketball: ['basketball_nba', 'basketball_preseason', 'basketball_euroleague'],
    }
    const matches = matchesSportsSelection(kadarioBasketballEvent, ['Basketball'], selectedTournaments)
    assert.equal(matches, true)
  })

  test('Case 3: Live Kadario football event matches Soccer and Football selection without tournaments', () => {
    assert.equal(matchesSportsSelection(kadarioFootballEvent, ['Soccer']), true)
    assert.equal(matchesSportsSelection(kadarioFootballEvent, ['Football']), true)
  })

  test('Case 4: Live Kadario football event matches Soccer selection even when selectedTournaments has Odds API keys', () => {
    const selectedTournaments = {
      Soccer: ['soccer_epl', 'soccer_uefa_champs_league', 'soccer_uefa_champions_league'],
    }
    assert.equal(matchesSportsSelection(kadarioFootballEvent, ['Soccer'], selectedTournaments), true)
  })

  test('Case 5: Live Kadario basketball event does not match Soccer, Tennis, or Baseball', () => {
    assert.equal(matchesSportsSelection(kadarioBasketballEvent, ['Soccer']), false)
    assert.equal(matchesSportsSelection(kadarioBasketballEvent, ['Tennis']), false)
    assert.equal(matchesSportsSelection(kadarioBasketballEvent, ['Baseball']), false)
  })

  test('Case 6: Live Kadario football event does not match Basketball, Tennis, or Baseball', () => {
    assert.equal(matchesSportsSelection(kadarioFootballEvent, ['Basketball']), false)
    assert.equal(matchesSportsSelection(kadarioFootballEvent, ['Tennis']), false)
    assert.equal(matchesSportsSelection(kadarioFootballEvent, ['Baseball']), false)
  })

  test('Case 7: Numeric tournament key filtering is respected when explicit numeric keys are specified', () => {
    assert.equal(
      matchesSportsSelection(kadarioBasketballEvent, ['Basketball'], { Basketball: ['10858'] }),
      true,
    )
    assert.equal(
      matchesSportsSelection(kadarioBasketballEvent, ['Basketball'], { Basketball: ['99999'] }),
      false,
    )
  })

  test('Case 8: Standard Odds API pre-match tournament keys still filter strictly', () => {
    const preMatchNba = {
      sport: 'basketball',
      sport_key: 'basketball_nba',
      commence_time: '2026-11-10T12:00:00Z',
    }
    assert.equal(
      matchesSportsSelection(preMatchNba, ['Basketball'], { Basketball: ['basketball_nba'] }),
      true,
    )
    assert.equal(
      matchesSportsSelection(preMatchNba, ['Basketball'], { Basketball: ['basketball_euroleague'] }),
      false,
    )
  })

  test('Case 9: Football redirects in utils/sportsRedirect.ts mirror Soccer redirects', () => {
    assert.equal(
      getSportsTabRedirectPath('football', 'smart-pick'),
      'sportEvents/parlay/football/interval/parlayPromotion',
    )
    assert.equal(
      getSportsTabRedirectPath('football', 'parlay'),
      'sportEvents/parlay/football/interval/parlayPromotion',
    )
    assert.equal(
      getSportsTabRedirectPath('football', 'outright'),
      'sportEvents/outright/football',
    )
    assert.equal(
      getSportsTabRedirectPath('football', 'replay'),
      'sportEvents/gameResult/football/regular/today',
    )
    assert.equal(
      resolveSportsTabRedirectUrl('football', 'replay'),
      `${getEnvRedirectUrl()}/sportEvents/gameResult/football/regular/today?p=xjSD`,
    )
  })

  test('Case 10: composables/useSportsRouteBase.ts recognizes football route base', () => {
    const routeBaseSource = fs.readFileSync(
      path.resolve(process.cwd(), 'composables/useSportsRouteBase.ts'),
      'utf-8',
    )
    assert.match(routeBaseSource, /football/)
  })

  test('Case 11: pages/explore/sports/[sport].vue includes football in validation, names, and popularLeagues', () => {
    const pageSource = fs.readFileSync(
      path.resolve(process.cwd(), 'pages/explore/sports/[sport].vue'),
      'utf-8',
    )
    assert.match(pageSource, /football:\s*['"]Soccer['"]/)
    assert.match(pageSource, /football:\s*\[/)
    assert.match(pageSource, /['"]football['"]/)
  })

  test('Case 12: components/SportsPopular.vue filters inplay events by effectiveSelectedSports without tournament mismatch', () => {
    const popularSource = fs.readFileSync(
      path.resolve(process.cwd(), 'components/SportsPopular.vue'),
      'utf-8',
    )
    assert.match(
      popularSource,
      /matchesSportsSelection\(event,\s*effectiveSelectedSports\.value\)/,
    )
    assert.match(popularSource, /football:\s*['"]Soccer['"]/)
  })

  test('Case 13: homepage sports section prioritizes football/soccer fixtures ahead of other sports while preserving relative order', () => {
    const mixedFixtures = [
      { id: 'b1', sport: 'basketball', sport_key: 'basketball_nba' },
      { id: 'f1', sport: 'football', sport_key: 'football_kadario_20' },
      { id: 't1', sport: 'tennis', sport_key: 'tennis_atp' },
      { id: 's1', sport: '', sport_key: 'soccer_epl' },
      { id: 'b2', sport: 'basketball', sport_key: 'basketball_euroleague' },
    ]
    const ordered = prioritizeFootballFixtures(mixedFixtures)
    assert.deepEqual(ordered.map(item => item.id), ['f1', 's1', 'b1', 't1', 'b2'])
    assert.equal(getFixtureSportKey(mixedFixtures[1]), 'soccer')
    assert.equal(getFixtureSportLabel(mixedFixtures[1]), 'Football')
    assert.equal(getFixtureSportLabel(mixedFixtures[3]), 'Football')
    assert.equal(getFixtureSportLabel(mixedFixtures[0]), 'Basketball')

    const homepageSportsSource = fs.readFileSync(
      path.resolve(process.cwd(), 'components/HomepageSportsSection.vue'),
      'utf-8',
    )
    assert.match(homepageSportsSource, /prioritizeFootballFixtures\(/)
  })

  test('Case 14: soccer leagues map to specific /images/sports logos that exist on disk without wrong-league fallback', () => {
    const soccerEntries = SAMPLE_SPORTS.filter(sport => sport.group === 'Soccer')
    assert.ok(soccerEntries.length > 0, 'SAMPLE_SPORTS must define Soccer entries')

    for (const league of soccerEntries) {
      const resolvedLogo = getTournamentLogo(league)
      assert.ok(resolvedLogo.startsWith('/'), `Logo for ${league.key} must be a root-relative path`)
      const filePath = path.resolve(process.cwd(), 'public', resolvedLogo.replace(/^\//, ''))
      assert.equal(fs.existsSync(filePath), true, `Missing logo file for ${league.key}: ${resolvedLogo}`)
    }

    assert.equal(getTournamentLogo('soccer_conmebol_copa_sudamericana'), '/images/sports/suda americana.webp')
    assert.equal(getTournamentLogo('soccer_belgium_first_div'), '/images/sports/belgium first div.webp')
    assert.equal(getTournamentLogo('soccer_brazil_campeonato'), '/images/sports/brazil serie a.webp')
    assert.equal(getTournamentLogo('soccer_brazil_serie_b'), '/images/sports/brazil serie b.webp')
    assert.equal(getTournamentLogo('soccer_italy_serie_b'), '/images/sports/serie b.webp')
    assert.equal(getTournamentLogo('soccer_france_ligue_two'), '/images/sports/france ligue 2.webp')
    assert.equal(getTournamentLogo('soccer_russia_premier_league'), '/images/sports/russia premier league.webp')
    assert.equal(getTournamentLogo('soccer_efl_champ'), '/images/sports/efl champions .webp')
    assert.equal(getTournamentLogo('soccer_korea_kleague1'), '/images/sports/k league.webp')
    assert.equal(getTournamentLogo('soccer_germany_dfb_pokal'), '/images/sports/pokal.webp')
    assert.equal(getTournamentLogo('soccer_portugal_primeira_liga'), '/images/sports/portugal primeira.webp')
  })
})
