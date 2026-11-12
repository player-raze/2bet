import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const read = (relPath) => readFileSync(resolve(root, relPath), 'utf8')

describe('Jackpot 3-second interval and homepage mobile full-width 3s auto-slide carousels', () => {
  it('updates jackpot counters and winner schedules every 3 seconds (3000ms)', () => {
    const jackpotCounter = read('composables/useJackpotCounter.ts')
    assert.match(jackpotCounter, /const DEFAULT_DELAY_MS = \[3_000, 3_000\] as const/)
    assert.match(jackpotCounter, /const DEFAULT_INITIAL_DELAY_MS = \[3_000, 3_000\] as const/)
    assert.doesNotMatch(jackpotCounter, /delayMs:\s*\[5[05]_000/)
    assert.doesNotMatch(jackpotCounter, /initialDelayMs:\s*\[1[568]_000|initialDelayMs:\s*\[2[02]_000/)

    const homepageJackpot = read('components/HomepageJackpotSection.vue')
    assert.match(homepageJackpot, /const delay = 3000/)

    const jackpotWinners = read('composables/useJackpotWinners.ts')
    assert.match(jackpotWinners, /const delay = 3_000/)

    const providerJackpotPage = read('pages/explore/egames/jackpot/[provider].vue')
    assert.match(providerJackpotPage, /const JACKPOT_REFRESH_INTERVAL_MS = 3_000/)
  })

  it('sets mobile carousel slides to full width (100%) in sports and promotions sections', () => {
    const sportsSection = read('components/HomepageSportsSection.vue')
    assert.doesNotMatch(sportsSection, /grid-auto-columns:\s*88%/)
    assert.match(
      sportsSection,
      /@media \(max-width: 767px\)[\s\S]*?\.homepage-sports-section :deep\(\.allgames-game-track\)\s*\{\s*grid-auto-columns:\s*100%;\s*\}/,
    )
    assert.match(
      sportsSection,
      /@media \(max-width: 600px\)[\s\S]*?\.homepage-sports-section :deep\(\.allgames-game-track\)\s*\{\s*grid-auto-columns:\s*100%;\s*\}/,
    )

    const allgamesCss = read('assets/css/allgames-home.css')
    assert.doesNotMatch(
      allgamesCss,
      /\.homepage-promotions-section \.allgames-game-track\s*\{[^}]*calc\(\(100% - \.15 \* var\(--allgames-row-gap\)\) \/ 1\.15\)/,
    )
    assert.match(
      allgamesCss,
      /@media \(max-width: 700px\)[\s\S]*?\.homepage-promotions-section \.allgames-game-track\s*\{[^}]*grid-auto-columns:\s*100%/,
    )
    assert.match(
      allgamesCss,
      /@media \(max-width: 767px\)[\s\S]*?\.homepage-promotions-section \.allgames-game-track\s*\{[^}]*grid-auto-columns:\s*100%/,
    )
  })

  it('enables 3-second mobile auto-slide on sports and promotions homepage sliders', () => {
    const slider = read('components/HomepageContentSlider.vue')
    assert.match(slider, /mobileAutoplayMs\?:\s*number/)
    assert.match(slider, /window\.matchMedia\('\(max-width: 767px\)'\)/)
    assert.match(slider, /setInterval\(advanceMobileSlide,\s*props\.mobileAutoplayMs\)/)

    const sportsSection = read('components/HomepageSportsSection.vue')
    assert.match(sportsSection, /:mobile-autoplay-ms="3000"/)

    const homepage = read('components/AllGamesHomepage.vue')
    assert.match(homepage, /id="promotions"[^>]*:mobile-autoplay-ms="3000"/)
  })

  it('displays MobileBottomNav on /egames/customer-service in mobile mode', () => {
    const defaultLayout = read('layouts/default.vue')
    assert.doesNotMatch(
      defaultLayout,
      /\.site-shell--customer-service\s+:deep\(\.mobile-bottom-nav\)/,
    )

    const mobileBottomNav = read('components/MobileBottomNav.vue')
    assert.match(mobileBottomNav, /to:\s*'\/egames\/customer-service'/)
    assert.match(mobileBottomNav, /isPathActive\(item\.to\)\s*\|\|\s*isPathActive\(`\/explore\$\{item\.to\}`\)/)
  })
})
