import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import postcss from 'postcss'
import tailwindcss from 'tailwindcss'
import tailwindConfig from '../tailwind.config.ts'

const projectRoot = process.cwd()

test('Light Mode Background & Text Classes Suite', async (t) => {
  const lightModeCss = fs.readFileSync(path.join(projectRoot, 'assets/css/light-mode.css'), 'utf-8')

  await t.test('Case 1: assets/css/light-mode.css defines overrides for all 8 requested targets', () => {
    // 1. jackpot-counter-plate
    assert.ok(lightModeCss.includes('.jackpot-counter-plate'), 'light-mode.css must style .jackpot-counter-plate')
    // 2. .winners-card
    assert.ok(lightModeCss.includes('.winners-card'), 'light-mode.css must style .winners-card')
    // 3. allgames-promo:before and allgames-promo:after (light green)
    assert.ok(lightModeCss.includes('.allgames-promo::before'), 'light-mode.css must style .allgames-promo::before')
    assert.ok(lightModeCss.includes('.allgames-promo::after'), 'light-mode.css must style .allgames-promo::after')
    assert.ok(
      lightModeCss.includes('rgba(1, 148, 64,') || lightModeCss.includes('rgba(72, 218, 166,'),
      'allgames-promo before/after must use light green gradients'
    )
    // 4. getting-started-faq-list
    assert.ok(lightModeCss.includes('.getting-started-faq-list'), 'light-mode.css must style .getting-started-faq-list')
    // 5. .sports-chat
    assert.ok(lightModeCss.includes('.sports-chat'), 'light-mode.css must style .sports-chat')
    // 6. sports-category-banner
    assert.ok(lightModeCss.includes('.sports-category-banner'), 'light-mode.css must style .sports-category-banner')
    // 7. loading
    assert.ok(lightModeCss.includes('.loading'), 'light-mode.css must style .loading')
    // 8. live-video-player
    assert.ok(lightModeCss.includes('.live-video-player'), 'light-mode.css must style .live-video-player')
  })

  await t.test('Case 2: Vue components integrate light:* Tailwind classes directly on templates', () => {
    const jackpotSection = fs.readFileSync(path.join(projectRoot, 'components/HomepageJackpotSection.vue'), 'utf-8')
    assert.ok(jackpotSection.includes('light:bg-[#f0f7f3]'), 'HomepageJackpotSection must have light:bg on counter plate')
    assert.ok(jackpotSection.includes('light:bg-white'), 'HomepageJackpotSection must have light:bg on winners card')

    const allGamesPromo = fs.readFileSync(path.join(projectRoot, 'components/AllGamesHomepage.vue'), 'utf-8')
    assert.ok(allGamesPromo.includes('light:bg-[#eaf5ee]'), 'AllGamesHomepage must have light:bg on allgames-promo')

    const faqList = fs.readFileSync(path.join(projectRoot, 'components/HomepageGettingStarted.vue'), 'utf-8')
    assert.ok(faqList.includes('light:bg-white'), 'HomepageGettingStarted must have light:bg on faq items')

    const sportsChat = fs.readFileSync(path.join(projectRoot, 'components/comments/SportsChat.vue'), 'utf-8')
    assert.ok(sportsChat.includes('light:bg-white'), 'SportsChat must have light:bg on root')

    const sportsBanner = fs.readFileSync(path.join(projectRoot, 'components/sports/SportsCategorySection.vue'), 'utf-8')
    assert.ok(sportsBanner.includes('light:bg-[#eaf5ee]'), 'SportsCategorySection must have light:bg on banner')

    const streamPlayer = fs.readFileSync(path.join(projectRoot, 'components/comments/StreamPlayer.vue'), 'utf-8')
    assert.ok(streamPlayer.includes('loading') && streamPlayer.includes('light:bg-[#eaf5ee]'), 'StreamPlayer must have loading and light:bg')

    const sportsPreview = fs.readFileSync(path.join(projectRoot, 'components/comments/SportsPreview.vue'), 'utf-8')
    assert.ok(sportsPreview.includes('live-video-player') && sportsPreview.includes('light:bg-[#eaf5ee]'), 'SportsPreview must have live-video-player and light:bg')

    const bingoPage = fs.readFileSync(path.join(projectRoot, 'pages/explore/egames/bingo/index.vue'), 'utf-8')
    assert.ok(bingoPage.includes('provider-filter-bar') && bingoPage.includes('light:bg-transparent'), 'bingo page must have light:bg-transparent on provider filter bar')

    const slotsPage = fs.readFileSync(path.join(projectRoot, 'pages/explore/egames/slots/index.vue'), 'utf-8')
    assert.ok(slotsPage.includes('provider-filter-bar') && slotsPage.includes('light:bg-transparent'), 'slots page must have light:bg-transparent on provider filter bar')
  })

  await t.test('Case 3: Tailwind processes newly applied light utility classes cleanly', async () => {
    const rawTemplate = `
      <div class="light:bg-[#f0f7f3] light:bg-[#eaf5ee] light:bg-white light:text-[#10261c] light:text-[#019440] light:border-emerald-500/20"></div>
    `
    const result = await postcss([
      tailwindcss({
        ...tailwindConfig,
        content: [{ raw: rawTemplate }],
      }),
    ]).process('@tailwind utilities;', { from: undefined })

    const css = result.css
    assert.ok(css.includes('html[data-theme="light"]:not(#_):not(#_) .light\\:bg-\\[\\#f0f7f3\\]'), 'must compile light:bg-[#f0f7f3]')
    assert.ok(css.includes('html[data-theme="light"]:not(#_):not(#_) .light\\:bg-\\[\\#eaf5ee\\]'), 'must compile light:bg-[#eaf5ee]')
    assert.ok(css.includes('html[data-theme="light"]:not(#_):not(#_) .light\\:bg-white'), 'must compile light:bg-white')
    assert.ok(css.includes('html[data-theme="light"]:not(#_):not(#_) .light\\:text-\\[\\#10261c\\]'), 'must compile light:text-[#10261c]')
    assert.ok(css.includes('html[data-theme="light"]:not(#_):not(#_) .light\\:text-\\[\\#019440\\]'), 'must compile light:text-[#019440]')
  })
})
