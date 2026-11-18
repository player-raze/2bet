import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const rootDir = path.resolve(import.meta.dirname, '..')
const read = relPath => fs.readFileSync(path.join(rootDir, relPath), 'utf8')

describe('Sports Pages Heading Hierarchy', () => {
  it('uses h2 for sports category banners in SportsCategorySection', () => {
    const src = read('components/sports/SportsCategorySection.vue')
    assert.match(src, /<h2 v-if="shouldShowBanner" class="sports-category-section__heading">/)
    assert.match(src, /class="sports-category-banner\b/)
  })

  it('uses h3 for leagues under sports/popular/* and h2 on standalone upcoming, pre-match, inplay, and live views', () => {
    for (const file of [
      'components/sports/tabs/Upcoming.vue',
      'components/sports/tabs/Prematch.vue',
      'components/sports/InplayMatches.vue',
    ]) {
      const src = read(file)
      assert.match(
        src,
        /<component :is="isPopular \? 'h3' : 'h2'" class="league-preview-title">/,
        `${file} must render h3 under popular and h2 on standalone sports pages`,
      )
    }

    const leagueTabSrc = read('components/sports/tabs/League.vue')
    assert.match(leagueTabSrc, /const leagueHeadingTag = computed\(\(\) => \(!isPopular\.value && props\.hideSportTitle\) \? 'h2' : 'h3'\)/)
    assert.match(leagueTabSrc, /<component :is="leagueHeadingTag" class="league-preview-title">/)

    const outrightSrc = read('components/sports/tabs/Outright.vue')
    assert.match(outrightSrc, /<component :is="isPopular \? 'h3' : 'h2'" class="league-card-title">/)

    const outrightInnerSrc = read('components/sports/tabs/OutrightInner.vue')
    assert.match(outrightInnerSrc, /<component :is="isPopular \? 'h3' : 'h2'" class="league-preview-title">/)
    assert.match(outrightInnerSrc, /<component :is="isPopular \? 'h4' : 'h3'" class="outright-market-title pb-1\.5">/)
  })

  it('uses h2 for country groups and h3 for leagues in LeagueDirectory', () => {
    const dirSrc = read('components/sports/LeagueDirectory.vue')
    const h2Matches = dirSrc.match(/<h2 class="league-directory-heading">/g) || []
    assert.equal(h2Matches.length, 2, 'LeagueDirectory should use h2 for Popular Leagues and country section headers')

    const h3Count = (dirSrc.match(/<h3\b/g) || []).length
    assert.equal(h3Count, 2, 'LeagueDirectory should use h3 for league titles in both popular strip and country rows')
  })

  it('resets heading wrapper margins and typography cleanly without altering card/banner layout', () => {
    const sportsCss = read('assets/css/sports.css')
    assert.match(sportsCss, /\.sports-page \.sports-category-section__heading,\s*\.sports-page \.league-preview-title,\s*\.sports-page \.league-group \.league-preview-title/)
  })
})
