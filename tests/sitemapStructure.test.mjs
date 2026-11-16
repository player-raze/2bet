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

  test('Case 11: sitemap generator and runtime routes read .env SITE_URL without stale static cache', async () => {
    const { generateSitemapFile, readDotEnvMap } = await import('../scripts/generate-sitemap.mjs')
    const os = await import('node:os')
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), '2bet-env-sitemap-'))
    const envFile = path.join(tmpDir, '.env')
    try {
      fs.writeFileSync(envFile, 'SITE_NAME=\'2bet\'\nSITE_URL=https://2bet52.com/\nBYBET_REDIRECT_CODE=\n', 'utf8')
      const parsed = readDotEnvMap(envFile)
      assert.equal(parsed.SITE_URL, 'https://2bet52.com/')
      assert.equal(parsed.BYBET_REDIRECT_CODE, '')

      const res = await generateSitemapFile(undefined, { envPath: envFile })
      assert.equal(res.siteUrl, 'https://2bet52.com')
      const pagesContent = fs.readFileSync(res.pagesPath, 'utf8')
      const indexContent = fs.readFileSync(res.indexPath, 'utf8')
      assert.ok(pagesContent.includes('<loc>https://2bet52.com/</loc>'))
      assert.ok(indexContent.includes('<loc>https://2bet52.com/sitemap-pages.xml</loc>'))
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true })
      await generateSitemapFile(process.env.SITE_URL || 'https://2bet.com')
    }

    const nuxtConfig = fs.readFileSync(path.join(rootDir, 'nuxt.config.ts'), 'utf8')
    assert.match(nuxtConfig, /\*\*\/sitemap-pages\.xml/)
    assert.match(nuxtConfig, /\*\*\/sitemap-index\.xml/)

    const siteUrlUtil = fs.readFileSync(path.join(rootDir, 'server/utils/siteUrl.ts'), 'utf8')
    assert.match(siteUrlUtil, /resolveRuntimeSiteUrl/)
    assert.match(siteUrlUtil, /readDotEnvValue\(['"]SITE_URL['"]\)/)
  })

  test('Case 12: schemas and links resolve dynamically from SITE_URL while keeping https://2bet.com fallback', async () => {
    const collectVueFiles = (dir) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      const files = []
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          files.push(...collectVueFiles(fullPath))
        } else if (entry.name.endsWith('.vue')) {
          files.push(fullPath)
        }
      }
      return files
    }

    const vueFiles = [
      ...collectVueFiles(path.join(rootDir, 'components')),
      ...collectVueFiles(path.join(rootDir, 'pages')),
    ]

    for (const filePath of vueFiles) {
      const content = fs.readFileSync(filePath, 'utf8')
      const rel = path.relative(rootDir, filePath)
      assert.doesNotMatch(
        content,
        /https?:\/\/2bet\.com\//,
        `${rel} must use runtime siteUrl instead of hardcoded https://2bet.com/...`,
      )
      assert.doesNotMatch(
        content,
        /chickenkiller/i,
        `${rel} must never hardcode chickenkiller as a fallback`,
      )
    }

    for (const codePath of [
      'composables/useAppSeo.ts',
      'server/utils/siteUrl.ts',
      'server/utils/sitemap.ts',
      'server/plugins/runtimeEnvSync.ts',
      'scripts/generate-sitemap.mjs',
      'scripts/generate-llms-txt.mjs',
      'nuxt.config.ts',
    ]) {
      const content = fs.readFileSync(path.join(rootDir, codePath), 'utf8')
      assert.doesNotMatch(content, /chickenkiller/i, `${codePath} must never hardcode chickenkiller`)
    }

    const useAppSeoSrc = fs.readFileSync(path.join(rootDir, 'composables/useAppSeo.ts'), 'utf8')
    assert.match(useAppSeoSrc, /DEFAULT_SITE_URL\s*=\s*'https:\/\/2bet\.com'/)
    assert.match(useAppSeoSrc, /export const useSiteUrl\s*=/)

    const runtimeEnvSyncSrc = fs.readFileSync(path.join(rootDir, 'server/plugins/runtimeEnvSync.ts'), 'utf8')
    assert.match(runtimeEnvSyncSrc, /config\.public\.siteUrl/)

    const { generateSitemapFile } = await import('../scripts/generate-sitemap.mjs')
    const os = await import('node:os')
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), '2bet-custom-origin-'))
    const chickenEnv = path.join(tmpDir, 'chicken.env')
    const emptyEnv = path.join(tmpDir, 'empty.env')
    try {
      fs.writeFileSync(chickenEnv, 'SITE_URL=http://thechikin.chickenkiller.com/\n', 'utf8')
      const customRes = await generateSitemapFile(undefined, { envPath: chickenEnv })
      assert.equal(customRes.siteUrl, 'http://thechikin.chickenkiller.com')
      assert.ok(fs.readFileSync(customRes.indexPath, 'utf8').includes('<loc>http://thechikin.chickenkiller.com/sitemap-pages.xml</loc>'))
      assert.ok(fs.readFileSync(customRes.pagesPath, 'utf8').includes('<loc>http://thechikin.chickenkiller.com/bonuses</loc>'))

      fs.writeFileSync(emptyEnv, 'SITE_URL=\n', 'utf8')
      const fallbackRes = await generateSitemapFile(undefined, { envPath: emptyEnv })
      assert.equal(fallbackRes.siteUrl, 'https://2bet.com')
      assert.ok(fs.readFileSync(fallbackRes.indexPath, 'utf8').includes('<loc>https://2bet.com/sitemap-pages.xml</loc>'))
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true })
      await generateSitemapFile()
    }
  })

  test('Case 13: commented-out pending paths in server/utils/sitemap.ts stay excluded from generated sitemap', async () => {
    const sitemapMod = jiti(path.join(rootDir, 'server/utils/sitemap.ts'))
    const { generateSitemapFile } = await import('../scripts/generate-sitemap.mjs')

    const res = await generateSitemapFile('https://2bet.com')
    const pagesXml = fs.readFileSync(res.pagesPath, 'utf8')
    const generatedLocs = [...pagesXml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1])
    const expectedLocs = sitemapMod.getSitemapEntries().map(e => `https://2bet.com${e.path}`)

    assert.deepEqual(generatedLocs, expectedLocs, 'Generated sitemap URLs must match server/utils/sitemap.ts 1:1')

    const commentedOutPaths = [
      '/sports/popular/outright',
      '/sports/basketball',
      '/sports/soccer',
      '/sports/baseball',
      '/sports/tennis',
      '/tutorial/transactions/deposit',
      '/tutorial/transactions/withdraw',
      '/responsible-gaming',
      '/privacy-policy',
      '/terms-of-use',
      '/help/contact-us',
      '/legal/general-terms',
      '/legal/cookie-policy',
    ]

    for (const p of commentedOutPaths) {
      assert.ok(!generatedLocs.includes(`https://2bet.com${p}`), `${p} must stay excluded while commented out`)
    }
    assert.ok(!generatedLocs.some(loc => loc.includes('/egames/bingo/')), 'Commented-out bingo routes must stay excluded')
    assert.ok(generatedLocs.includes('https://2bet.com/about-us'), 'Active /about-us route from server/utils/sitemap.ts must be included')
    assert.ok(generatedLocs.includes('https://2bet.com/bonuses/new-member'), 'Active /bonuses/new-member route from server/utils/sitemap.ts must be included')
  })
})
