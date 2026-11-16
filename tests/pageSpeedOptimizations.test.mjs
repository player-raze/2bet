import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const read = relPath => fs.readFileSync(path.join(root, relPath), 'utf8')

describe('PageSpeed & Core Web Vitals Optimizations', () => {
  it('avoids duplicate Tailwind compilation and defers light-mode.css on default dark theme', () => {
    const nuxtConfig = read('nuxt.config.ts')
    assert.match(nuxtConfig, /cssPath:\s*'~\/assets\/css\/main\.css'/)
    assert.doesNotMatch(nuxtConfig, /['"]~\/assets\/css\/main\.css['"]\s*,?\s*\]/)
    assert.match(nuxtConfig, /'build:manifest'\(manifest\)/)

    const mainCss = read('assets/css/main.css')
    assert.doesNotMatch(mainCss, /@import\s+['"]\.\/light-mode\.css['"]/)

    const appVue = read('app.vue')
    assert.match(appVue, /defineAsyncComponent\(\(\)\s*=>\s*import\(['"]~\/components\/LightModeTheme\.vue['"]\)\)/)
    assert.match(appVue, /effectiveTheme === 'light'/)
    const lightModeTheme = read('components/LightModeTheme.vue')
    assert.match(lightModeTheme, /assets\/css\/light-mode\.css/)
  })

  it('prioritizes responsive LCP hero preload and non-blocking hero initial paint', () => {
    const indexPage = read('pages/index.vue')
    assert.match(indexPage, /href:\s*'\/hero\/editorial\/sports-mobile\.webp'/)
    assert.match(indexPage, /href:\s*'\/hero\/editorial\/sports\.webp'/)
    assert.match(indexPage, /tagPriority:\s*-2/)

    const hero = read('components/HomepageHero.vue')
    assert.match(hero, /<source[\s\S]*?:srcset="item\.mobileImage"/)
    assert.match(hero, /:loading="index === 0 \? 'eager' : 'lazy'"/)
    assert.match(hero, /:decoding="index === 0 \? 'sync' : 'async'"/)
    assert.match(hero, /hasChangedSlide/)
  })

  it('adds explicit width and height attributes to provider, jackpot winner, sports watermark, and footer images', () => {
    const providers = read('components/HomepageProvidersSection.vue')
    assert.match(providers, /class="provider-logo-img"/)
    assert.match(providers, /:width="logoDimensions\(provider\.logo\)\.width"/)
    assert.match(providers, /:height="logoDimensions\(provider\.logo\)\.height"/)

    const jackpot = read('components/HomepageJackpotSection.vue')
    assert.match(jackpot, /:width="winnerLogoDimensions\(winner\.providerLogo\)\.width"/)
    assert.match(jackpot, /:height="winnerLogoDimensions\(winner\.providerLogo\)\.height"/)

    const sportsCard = read('components/HomepageSportsCard.vue')
    assert.match(sportsCard, /class="sports-center-watermark"[\s\S]*?width="64"[\s\S]*?height="64"/)

    const footer = read('components/AppFooter.vue')
    assert.match(footer, /:width="logo\.width"[\s\S]*?:height="logo\.height"/)
    assert.match(footer, /width="108"[\s\S]*?height="41"/)
  })

  it('eliminates rAF forced reflows, synchronous shine reflow, and heavy slots/casino data imports on homepage', () => {
    const providers = read('components/HomepageProvidersSection.vue')
    assert.doesNotMatch(providers, /requestAnimationFrame\(updateCarouselLoop\)/)
    assert.doesNotMatch(providers, /scrollLeft\s*\+=/)
    assert.match(providers, /@keyframes providers-marquee/)

    const homepage = read('components/AllGamesHomepage.vue')
    assert.doesNotMatch(homepage, /void\s+shine\.offsetWidth/)
    assert.doesNotMatch(homepage, /from\s+['"]~\/data\/live-casino['"]/)

    const slotsSection = read('components/HomepageSlotsSection.vue')
    assert.match(slotsSection, /from\s+['"]~\/data\/homepage-slots['"]/)
    assert.doesNotMatch(slotsSection, /^import\s+\{\s*SLOTS/m)

    const sidebar = read('components/AppSidebar.vue')
    assert.match(sidebar, /defineAsyncComponent\(\(\)\s*=>\s*import\(['"]~\/components\/modals\/UnderMaintenance\.vue['"]\)\)/)
    assert.match(sidebar, /defineAsyncComponent\(\(\)\s*=>\s*import\(['"]~\/components\/modals\/DepositReminderModal\.vue['"]\)\)/)
  })

  it('keeps compressed image assets under expected size budgets', () => {
    const floatingBytes = fs.statSync(path.join(root, 'public/images/affiliate/partner-floating.webp')).size
    assert.ok(floatingBytes < 1_000_000, `partner-floating.webp (${floatingBytes} B) should stay under 1 MB`)

    const mobileHeroBytes = fs.statSync(path.join(root, 'public/hero/editorial/sports-mobile.webp')).size
    assert.ok(mobileHeroBytes < 80_000, `sports-mobile.webp (${mobileHeroBytes} B) should stay lightweight`)
  })
})
