import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const rootDir = path.resolve(import.meta.dirname, '..')
const read = relPath => fs.readFileSync(path.join(rootDir, relPath), 'utf8')

describe('Casino, Poker, Slots, Jackpot, and Bonuses Heading Hierarchy', () => {
  it('uses h2 for all featured categories and h3 for featured game titles on live-casino/featured', () => {
    const lobby = read('components/live-casino/LiveCasinoLobby.vue')
    const featuredBlock = lobby.match(/const featuredSections = computed\([\s\S]*?\]\.map/)?.[0] || ''
    assert.ok(featuredBlock.length > 0, 'featuredSections must exist in LiveCasinoLobby.vue')
    assert.doesNotMatch(featuredBlock, /headerTag:\s*'span'/)
    assert.equal((featuredBlock.match(/headerTag:\s*'h2'/g) || []).length, 5)

    const section = read('components/live-casino/LiveCasinoTableSection.vue')
    assert.match(section, /:title-tag="featured \? 'h3' : \(computedHeaderTag === 'span' \? 'h2' : 'span'\)"/)

    const card = read('components/live-casino/LiveCasinoTableCard.vue')
    assert.match(card, /titleTag\?:\s*'h2' \| 'h3' \| 'span'/)
  })

  it('uses h2 category + h3 game names on poker lobby and h3 game names on poker categories', () => {
    const pokerCatalogue = read('components/poker/PokerCatalogue.vue')
    assert.match(pokerCatalogue, /<h2 :id="`poker-heading-\$\{section\.key\}`">\{\{ section\.label \}\}<\/h2>/)
    assert.match(pokerCatalogue, /<h2 v-else class="sr-only">\{\{ section\.label \}\}<\/h2>/)

    const pokerCard = read('components/poker/PokerGameCard.vue')
    assert.match(pokerCard, /<h3 class="poker-game-title" :title="game\.title">\{\{ game\.title \}\}<\/h3>/)
  })

  it('uses h2 category + h3 game names on egames/slots and h2 game names on egames/slots/*', () => {
    const slotsIndex = read('pages/explore/egames/slots/index.vue')
    assert.match(slotsIndex, /<h2 class="text-\[15px\] font-bold text-white tracking-tight">\{\{ translate\(section\.title\) \}\}<\/h2>/)
    assert.equal((slotsIndex.match(/title-tag="h3"/g) || []).length, 2)

    const slotsCat = read('pages/explore/egames/slots/\[category\].vue'.replaceAll('\\', ''))
    assert.equal((slotsCat.match(/title-tag="h2"/g) || []).length, 2)

    const gameCard = read('components/game-cards/GameCard.vue')
    assert.match(gameCard, /titleTag\?:\s*'span' \| 'h2' \| 'h3'/)
    assert.match(gameCard, /<component :is="titleTag" class="m-0 min-w-0 truncate text-\[12px\] font-semibold/)
  })

  it('uses h2 provider/standalone/winners + h3 game names on egames/jackpot/all and egames/jackpot/*', () => {
    const providerPage = read('pages/explore/egames/jackpot/[provider].vue')
    assert.match(providerPage, /<h2 class="sr-only">\{\{ section\.provider \}\}<\/h2>/)
    assert.match(providerPage, /<h2 class="m-0 flex min-w-0 items-center">\s*<NuxtLink[\s\S]*?id="standalone-jackpot-title"/)
    assert.equal((providerPage.match(/title-tag="h3"/g) || []).length, 2)

    const standalonePage = read('pages/explore/egames/jackpot/standalone.vue')
    assert.match(standalonePage, /<h2 v-if="filteredGames\.length" class="sr-only">\{\{ translate\('Standalone jackpot games'\) \}\}<\/h2>/)
    assert.match(standalonePage, /title-tag="h3"/)

    const winnersCard = read('components/jackpot/JackpotWinnersCard.vue')
    assert.match(winnersCard, /<h2 [^>]*>\{\{ translate\('Winners List'\) \}\}<\/h2>/)
  })

  it('uses h2 category + h3 bonus name on /bonuses and h2 bonus name on /bonuses/*', () => {
    const bonusListing = read('components/bonuses/BonusListing.vue')
    assert.match(bonusListing, /<h2 class="promotion-group__title">\{\{ translate\(section\.title\) \}\}<\/h2>/)
    assert.match(bonusListing, /<h3 class="text-\[#efefef\] light:text-\[#10261c\]">\{\{ translate\(promotion\.title\) \}\}<\/h3>/)

    const mobileBonus = read('components/bonuses/MobileBonusListing.vue')
    assert.match(mobileBonus, /<h2 class="text-white light:text-\[#10261c\]">\{\{ translate\(section\.title\) \}\}<\/h2>/)
    assert.match(mobileBonus, /<h3 class="text-white light:text-\[#10261c\]">\{\{ translate\(promotion\.title\) \}\}<\/h3>/)

    const categoryListing = read('components/bonuses/BonusCategoryListing.vue')
    assert.equal((categoryListing.match(/<h2 class="text-white light:text-white">\{\{ translate\(promotion\.title\) \}\}<\/h2>/g) || []).length, 2)
  })
})
