import test, { describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createJiti } from 'jiti'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

const jiti = createJiti(import.meta.url, {
  alias: {
    '~': rootDir,
    '@': rootDir,
  },
})

describe('Sitemap Architecture & Structure Suite', () => {
  test('Case 1: server/utils/sitemap.ts exports and includes /entertainment/poker', () => {
    const sitemapMod = jiti(path.join(rootDir, 'server/utils/sitemap.ts'))
    const entries = sitemapMod.getSitemapEntries()
    const paths = entries.map(e => e.path)

    assert.ok(paths.includes('/entertainment/poker'), 'Must include /entertainment/poker')
    assert.ok(paths.includes('/entertainment/poker/all'), 'Must include /entertainment/poker/all')
    assert.ok(paths.includes('/entertainment/poker/poker'), 'Must include /entertainment/poker/poker')
    assert.ok(paths.includes('/entertainment/poker/fishing'), 'Must include /entertainment/poker/fishing')
    assert.ok(paths.includes('/entertainment/poker/mahjong'), 'Must include /entertainment/poker/mahjong')
    assert.ok(paths.includes('/entertainment/poker/bullbull'), 'Must include /entertainment/poker/bullbull')
    assert.ok(paths.includes('/entertainment/poker/baccarat'), 'Must include /entertainment/poker/baccarat')
    assert.ok(paths.includes('/entertainment/poker/other'), 'Must include /entertainment/poker/other')
  })

  test('Case 2: generateSitemapXml produces valid urlset containing poker routes', () => {
    const sitemapMod = jiti(path.join(rootDir, 'server/utils/sitemap.ts'))
    const xml = sitemapMod.generateSitemapXml('https://2bet.br')
    assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'), 'Must start with XML declaration')
    assert.ok(xml.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'), 'Must define urlset namespace')
    assert.ok(xml.includes('<loc>https://2bet.br/entertainment/poker</loc>'), 'Must contain poker URL')
    assert.ok(xml.includes('<loc>https://2bet.br/entertainment/poker/fishing</loc>'), 'Must contain poker category URL')
  })

  test('Case 3: generateSitemapIndexXml lists sitemap-pages.xml and sitemap-blog.php', () => {
    const sitemapMod = jiti(path.join(rootDir, 'server/utils/sitemap.ts'))
    const indexXml = sitemapMod.generateSitemapIndexXml('https://2bet.br')
    assert.ok(indexXml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'), 'Must start with XML declaration')
    assert.ok(indexXml.includes('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'), 'Must define sitemapindex namespace')
    assert.ok(indexXml.includes('<loc>https://2bet.br/sitemap-pages.xml</loc>'), 'Must link to sitemap-pages.xml')
    assert.ok(indexXml.includes('<loc>https://2bet.br/sitemap-blog.php</loc>'), 'Must link to sitemap-blog.php')
  })

  test('Case 4: Root sitemap-blog.php exists and delegates to bloggerist/sitemap-blog.php', () => {
    const filePath = path.join(rootDir, 'sitemap-blog.php')
    assert.ok(fs.existsSync(filePath), 'sitemap-blog.php must exist at root')
    const content = fs.readFileSync(filePath, 'utf8')
    assert.ok(content.includes("require __DIR__ . '/bloggerist/sitemap-blog.php';"), 'Must require bloggerist/sitemap-blog.php')
  })

  test('Case 5: robots.txt route references sitemap-index.xml', () => {
    const robotsPath = path.join(rootDir, 'server/routes/robots.txt.ts')
    const content = fs.readFileSync(robotsPath, 'utf8')
    assert.ok(content.includes('sitemap-index.xml'), 'robots.txt must point to sitemap-index.xml')
    assert.ok(!content.includes('/sitemap.xml'), 'robots.txt should not point to legacy sitemap.xml')
  })

  test('Case 6: Generated public/sitemap-pages.xml and public/sitemap-index.xml match expected specs', async () => {
    const { generateSitemapFile } = await import('../scripts/generate-sitemap.mjs')
    try {
      await generateSitemapFile('https://2bet.br')

      const pagesPath = path.join(rootDir, 'public/sitemap-pages.xml')
      const indexPath = path.join(rootDir, 'public/sitemap-index.xml')

      assert.ok(fs.existsSync(pagesPath), 'public/sitemap-pages.xml must exist')
      assert.ok(fs.existsSync(indexPath), 'public/sitemap-index.xml must exist')

      const pagesContent = fs.readFileSync(pagesPath, 'utf8')
      const indexContent = fs.readFileSync(indexPath, 'utf8')

      assert.ok(pagesContent.includes('https://2bet.br/entertainment/poker'), 'sitemap-pages.xml must contain poker')
      assert.ok(pagesContent.includes('https://2bet.br/entertainment/poker/all'), 'sitemap-pages.xml must contain poker/all')
      assert.ok(pagesContent.includes('https://2bet.br/entertainment/poker/poker'), 'sitemap-pages.xml must contain poker/poker')
      assert.ok(indexContent.includes('https://2bet.br/sitemap-pages.xml'), 'sitemap-index.xml must contain sitemap-pages.xml')
      assert.ok(indexContent.includes('https://2bet.br/sitemap-blog.php'), 'sitemap-index.xml must contain sitemap-blog.php')
    } finally {
      await generateSitemapFile(process.env.SITE_URL || 'https://2bet.com')
    }
  })

  test('Case 7: robots.txt disallows preview URLs for all user agents and Googlebot', () => {
    const robotsPath = path.join(rootDir, 'server/routes/robots.txt.ts')
    const content = fs.readFileSync(robotsPath, 'utf8')
    assert.ok(content.includes('Disallow: /*?*preview='), 'Must disallow /*?*preview=')
    assert.ok(content.includes('User-agent: Googlebot'), 'Must explicitly mention Googlebot')
    assert.ok(content.includes('Allow: /'), 'Must allow indexing when INDEX_FOLLOW=true')
  })

  test('Case 8: hidden H1s, live-casino/inplay image alt attributes, and poker SEO metadata are configured cleanly', () => {
    const readRel = relPath => fs.readFileSync(path.join(rootDir, relPath), 'utf8')

    const srOnlyTargets = [
      'components/bonuses/BonusListing.vue',
      'components/bonuses/BonusCategoryListing.vue',
      'pages/explore/bonuses/terms-and-condition.vue',
      'pages/download-app.vue',
      'pages/explore/sports/live.vue',
      'components/SportsPopular.vue',
      'pages/explore/egames/slots/index.vue',
      'pages/explore/egames/slots/[category].vue',
      'pages/explore/entertainment/live-casino/index.vue',
      'components/live-casino/LiveCasinoLobby.vue',
      'pages/explore/live-plaza/home.vue',
      'pages/explore/live-plaza/experts.vue',
      'pages/explore/live-plaza/funds.vue',
      'pages/explore/live-plaza/expert-predictions.vue',
      'pages/explore/live-plaza/streamer/index.vue',
      'pages/explore/live-plaza/streamer/all.vue',
      'pages/explore/live-plaza/all-streamers.vue',
    ]

    for (const file of srOnlyTargets) {
      assert.match(readRel(file), /<h1[^>]*class="[^"]*sr-only[^"]*"/, `${file} must include an sr-only h1`)
    }

    assert.doesNotMatch(readRel('components/live-plaza/MobileLivePlazaHeader.vue'), /<h1>/)

    const tableSection = readRel('components/live-casino/LiveCasinoTableSection.vue')
    assert.match(tableSection, /:alt="`\$\{title\} emblem`"/)
    assert.match(tableSection, /:alt="`\$\{title\} preview`"/)

    const matchThumb = readRel('components/sports/MatchVideoThumbnail.vue')
    assert.match(matchThumb, /:alt="`\$\{label\} live stream preview`"/)

    const pokerCatalogue = readRel('components/poker/PokerCatalogue.vue')
    assert.match(pokerCatalogue, /POKER_SEO_COPY/)
    assert.match(pokerCatalogue, /canonicalPath/)
    assert.match(pokerCatalogue, /'@type': 'CollectionPage'/)
    assert.match(pokerCatalogue, /<h2 v-else class="sr-only">/)
  })

  test('Case 9: bonus detail page uses a single bonus-title h1 and banner image for og:image', () => {
    const bonusDetail = fs.readFileSync(path.join(rootDir, 'pages/explore/bonus/[id].vue'), 'utf8')
    assert.match(bonusDetail, /<MobileBonusHeader[^>]*heading-tag="span"/)
    assert.match(bonusDetail, /<SeoHeader[^>]*heading-tag="span"/s)
    assert.match(bonusDetail, /<h1 class="text-\[#f6f6f6\] light:text-\[#10261c\]">\{\{ bonus\.title \}\}<\/h1>/)
    assert.match(bonusDetail, /const seoImage = computed\(\(\) => \{\s*const raw = bonusBannerImageSrc\.value/)
  })

  test('Case 10: root robots.txt is copied verbatim into .output/public/robots.txt after build', async () => {
    const rootRobotsPath = path.join(rootDir, 'robots.txt')
    assert.ok(fs.existsSync(rootRobotsPath), 'Root robots.txt must exist so it can be customized directly')

    const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'))
    assert.match(pkg.scripts?.build || '', /node scripts\/copy-robots-txt\.mjs/, 'package.json build script must copy robots.txt')

    const { copyRobotsTxtFile } = await import('../scripts/copy-robots-txt.mjs')
    const os = await import('node:os')
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), '2bet-robots-test-'))
    try {
      const customSource = path.join(tmpDir, 'robots.txt')
      const customOutDir = path.join(tmpDir, '.output', 'public')
      const customContent = 'User-agent: *\nDisallow: /private-test/\nSitemap: https://example.com/sitemap-index.xml\n'
      fs.writeFileSync(customSource, customContent, 'utf8')

      const { targetPath } = copyRobotsTxtFile({ sourcePath: customSource, outputPublicDir: customOutDir })
      assert.equal(targetPath, path.join(customOutDir, 'robots.txt'))
      assert.equal(fs.readFileSync(targetPath, 'utf8'), customContent)
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    }
  })
})
