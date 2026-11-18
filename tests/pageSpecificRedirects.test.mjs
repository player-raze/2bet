import test, { describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import {
  getEnvRedirectCode,
  getEnvRedirectUrl,
  getJackpotRedirectPath,
  getLiveCasinoRedirectPath,
  getLivePlazaRedirectPath,
  getPokerRedirectPath,
  getSlotsRedirectPath,
  resolveJackpotRedirectUrl,
  resolveLiveCasinoRedirectUrl,
  resolveLivePlazaRedirectUrl,
  resolvePokerRedirectUrl,
  resolveSlotsRedirectUrl,
} from '../utils/sportsRedirect.ts'

describe('Page-Specific External Redirects Suite', () => {
  const envBase = getEnvRedirectUrl().replace(/\/+$/, '')
  const envCode = getEnvRedirectCode()
  const appendCode = (target) => {
    if (!envCode) return target
    const sep = target.includes('?') ? '&' : '?'
    return `${target}${sep}p=${encodeURIComponent(envCode)}`
  }

  test('Case 1: Live Casino routes and multi-table resolve to liveCasino/46?option=<n> with env_url', () => {
    const cases = [
      ['featured', 'liveCasino/46?option=0'],
      ['/entertainment/live-casino/featured', 'liveCasino/46?option=0'],
      ['good-road', 'liveCasino/46?option=1'],
      ['/explore/entertainment/live-casino/good-road', 'liveCasino/46?option=1'],
      ['live-show', 'liveCasino/46?option=19'],
      ['game-show', 'liveCasino/46?option=19'],
      ['baccarat', 'liveCasino/46?option=18'],
      ['multi-table', 'liveCasino/46?option=18'],
      ['multitable', 'liveCasino/46?option=18'],
      ['dragon-tiger', 'liveCasino/46?option=20'],
      ['roulette', 'liveCasino/46?option=21'],
      ['sicbo', 'liveCasino/46?option=23'],
    ]

    for (const [input, expectedPath] of cases) {
      assert.equal(getLiveCasinoRedirectPath(input), expectedPath)
      assert.equal(resolveLiveCasinoRedirectUrl(input), appendCode(`${envBase}/${expectedPath}`))
      assert.equal(
        resolveLiveCasinoRedirectUrl(input, 'https://bybet.example/', 'VIP7'),
        `https://bybet.example/${expectedPath}&p=VIP7`,
      )
      assert.equal(
        resolveLiveCasinoRedirectUrl(input, 'https://bybet.example/', ''),
        `https://bybet.example/${expectedPath}`,
      )
    }
  })

  test('Case 2: Poker routes resolve to board/<segment> with env_url', () => {
    const cases = [
      ['', 'board/hot'],
      ['popular', 'board/hot'],
      ['/entertainment/poker', 'board/hot'],
      ['all', 'board/all'],
      ['/entertainment/poker/all', 'board/all'],
      ['fishing', 'board/fishing'],
      ['mahjong', 'board/mahjong'],
      ['/explore/entertainment/poker/mahjong', 'board/mahjong'],
      ['bullbull', 'board/bullbull'],
      ['poker', 'board/poker'],
      ['baccarat', 'board/hundred'],
      ['/entertainment/poker/baccarat', 'board/hundred'],
      ['other', 'board/other'],
    ]

    for (const [input, expectedPath] of cases) {
      assert.equal(getPokerRedirectPath(input), expectedPath)
      assert.equal(resolvePokerRedirectUrl(input), appendCode(`${envBase}/${expectedPath}`))
      assert.equal(
        resolvePokerRedirectUrl(input, 'https://bybet.example/', 'VIP7'),
        `https://bybet.example/${expectedPath}?p=VIP7`,
      )
      assert.equal(
        resolvePokerRedirectUrl(input, 'https://bybet.example/', ''),
        `https://bybet.example/${expectedPath}`,
      )
    }
  })

  test('Case 3: Slots routes resolve to slotMachine/<segment> with env_url', () => {
    const cases = [
      ['', 'slotMachine/main'],
      ['home', 'slotMachine/main'],
      ['/egames/slots', 'slotMachine/main'],
      ['top-pick', 'slotMachine/recommend'],
      ['/egames/slots/top-pick', 'slotMachine/recommend'],
      ['new', 'slotMachine/new'],
      ['hot', 'slotMachine/hot'],
      ['cold', 'slotMachine/cold'],
      ['max-rpt', 'slotMachine/high'],
      ['max-rtp', 'slotMachine/high'],
    ]

    for (const [input, expectedPath] of cases) {
      assert.equal(getSlotsRedirectPath(input), expectedPath)
      assert.equal(resolveSlotsRedirectUrl(input), appendCode(`${envBase}/${expectedPath}`))
      assert.equal(
        resolveSlotsRedirectUrl(input, 'https://bybet.example/', ''),
        `https://bybet.example/${expectedPath}`,
      )
    }
  })

  test('Case 4: Jackpot routes resolve to jackpot/<list|18|singleJackpot> with env_url', () => {
    const cases = [
      ['', 'jackpot/list'],
      ['all', 'jackpot/list'],
      ['/egames/jackpot/all', 'jackpot/list'],
      ['jdb', 'jackpot/18'],
      ['/egames/jackpot/jdb', 'jackpot/18'],
      ['standalone', 'jackpot/singleJackpot'],
      ['/explore/egames/jackpot/standalone', 'jackpot/singleJackpot'],
    ]

    for (const [input, expectedPath] of cases) {
      assert.equal(getJackpotRedirectPath(input), expectedPath)
      assert.equal(resolveJackpotRedirectUrl(input), appendCode(`${envBase}/${expectedPath}`))
      assert.equal(
        resolveJackpotRedirectUrl(input, 'https://bybet.example/', ''),
        `https://bybet.example/${expectedPath}`,
      )
    }
  })

  test('Case 5: Live Plaza home and expert-predictions resolve to squareHome and expertHome with env_url', () => {
    const cases = [
      ['', 'squareHome'],
      ['home', 'squareHome'],
      ['/live-plaza/home', 'squareHome'],
      ['/explore/live-plaza/home', 'squareHome'],
      ['expert-predictions', 'expertHome'],
      ['/live-plaza/expert-predictions', 'expertHome'],
      ['/explore/live-plaza/expert-predictions', 'expertHome'],
    ]

    for (const [input, expectedPath] of cases) {
      assert.equal(getLivePlazaRedirectPath(input), expectedPath)
      assert.equal(resolveLivePlazaRedirectUrl(input), appendCode(`${envBase}/${expectedPath}`))
      assert.equal(
        resolveLivePlazaRedirectUrl(input, 'https://bybet.example/', 'PROMO1'),
        `https://bybet.example/${expectedPath}?p=PROMO1`,
      )
      assert.equal(
        resolveLivePlazaRedirectUrl(input, 'https://bybet.example/', ''),
        `https://bybet.example/${expectedPath}`,
      )
    }
  })

  test('Case 6: Target components and pages wire page-specific redirect resolvers instead of login', () => {
    const checks = [
      [
        'components/live-casino/LiveCasinoLobby.vue',
        [/resolveLiveCasinoRedirectUrl\(activeCategory\.value/, /buildBybetRedirectUrl\('liveCasino\/46\?option=18'/, /bybetRedirectUrl\.value/, /:href="multiTableRedirectUrl"/],
      ],
      [
        'pages/explore/entertainment/live-casino/[category].vue',
        [/resolveLiveCasinoRedirectUrl\(activeCategory\.value/, /bybetRedirectUrl\.value/],
      ],
      [
        'components/poker/PokerCatalogue.vue',
        [/resolvePokerRedirectUrl\(props\.category/, /bybetRedirectUrl\.value/],
      ],
      [
        'pages/explore/egames/slots/index.vue',
        [/resolveSlotsRedirectUrl\('home'/],
      ],
      [
        'pages/explore/egames/slots/[category].vue',
        [/resolveSlotsRedirectUrl\(activeCategory\.value/, /bybetRedirectUrl\.value/],
      ],
      [
        'pages/explore/egames/jackpot/[provider].vue',
        [/resolveJackpotRedirectUrl\(activeProvider\.value/, /bybetRedirectUrl\.value/],
      ],
      [
        'pages/explore/egames/jackpot/standalone.vue',
        [/resolveJackpotRedirectUrl\('standalone'/],
      ],
      [
        'pages/explore/live-plaza/home.vue',
        [/resolveLivePlazaRedirectUrl\('home'/],
      ],
      [
        'pages/explore/live-plaza/expert-predictions.vue',
        [/resolveLivePlazaRedirectUrl\('expert-predictions'/],
      ],
      [
        'components/live-plaza/LivePlazaPredictionCard.vue',
        [/resolveLivePlazaRedirectUrl\(route\.path/, /bybetRedirectUrl\.value/],
      ],
    ]

    for (const [file, patterns] of checks) {
      const source = fs.readFileSync(path.resolve(file), 'utf-8')
      assert.doesNotMatch(source, /buildBybetRedirectUrl\(['"]login['"]/, `${file} should no longer hardcode 'login'`)
      for (const pattern of patterns) {
        assert.match(source, pattern, `${file} must match ${pattern}`)
      }
    }
  })

  test('Case 7: GameCard, Slots, and Jackpot pages redirect directly on Start Now and Demo without popup messages', () => {
    const gameCard = fs.readFileSync(path.resolve('components/game-cards/GameCard.vue'), 'utf-8')
    assert.doesNotMatch(gameCard, /ReminderModal/, 'GameCard must not render ReminderModal popup')
    assert.doesNotMatch(gameCard, /showReminderModal/, 'GameCard must not retain reminder modal state')
    assert.match(gameCard, /handleStartNowClick[\s\S]*emit\('start',\s*props\.game\)/)
    assert.match(gameCard, /handleDemoClick[\s\S]*emit\('start',\s*props\.game\)/)
    assert.match(gameCard, /@click\.stop="handleDemoClick"/)

    for (const file of [
      'pages/explore/egames/slots/index.vue',
      'pages/explore/egames/slots/[category].vue',
      'pages/explore/egames/jackpot/[provider].vue',
      'pages/explore/egames/jackpot/standalone.vue',
    ]) {
      const source = fs.readFileSync(path.resolve(file), 'utf-8')
      assert.match(source, /handleDemo\s*=\s*\([^)]*\)\s*(?::\s*void\s*)?=>\s*\{\s*handleStartNow\(game\)/, `${file} must delegate handleDemo to handleStartNow`)
      assert.doesNotMatch(source, /Starting \$\{game\.title\}|Launching Demo mode for \$\{game\.title\}/, `${file} must not show popup toast messages on Start Now or Demo`)
    }
  })
})
