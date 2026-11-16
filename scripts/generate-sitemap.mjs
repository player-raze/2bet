import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { createJiti } from 'jiti'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

export function readDotEnvMap(envPath = path.resolve(rootDir, '.env')) {
  const parsed = {}
  try {
    if (!fs.existsSync(envPath)) return parsed
    const content = fs.readFileSync(envPath, 'utf-8')
    for (const line of content.split(/\r?\n/)) {
      const match = line.match(/^[ \t]*([\w.-]+)[ \t]*=[ \t]*(.*)$/)
      if (!match) continue
      const key = match[1]
      const rawVal = (match[2] ?? '').trim()
      if (!rawVal) {
        parsed[key] = ''
        continue
      }
      const quoted = rawVal.match(/^(?:"([^"\r\n]*)"|'([^'\r\n]*)')/)
      parsed[key] = quoted ? (quoted[1] ?? quoted[2] ?? '').trim() : rawVal.split('#')[0].trim()
    }
  } catch {
    // Ignore unreadable .env
  }
  return parsed
}

const explicitEnvSiteUrl = (process.env.NUXT_PUBLIC_SITE_URL || process.env.SITE_URL || '').trim()

for (const [key, val] of Object.entries(readDotEnvMap())) {
  if (process.env[key] === undefined) {
    process.env[key] = val
  }
}

function getSourceFilesForPath(baseDir, urlPath) {
  const resolve = (...p) => path.join(baseDir, ...p)
  if (urlPath === '/') return [resolve('pages/index.vue'), resolve('data/homepage.ts')]
  if (urlPath.startsWith('/sports') || urlPath.startsWith('/explore/sports')) {
    return [resolve('data/sports.ts'), resolve('pages/explore/sports')]
  }
  if (urlPath.startsWith('/bonus/') || urlPath.startsWith('/explore/bonus/')) {
    return [resolve('data/promotions.ts'), resolve('data/bonus-details.json'), resolve('pages/explore/bonus/[id].vue')]
  }
  if (urlPath.startsWith('/bonuses') || urlPath.startsWith('/explore/bonuses')) {
    return [resolve('data/promotions.ts'), resolve('pages/explore/bonuses')]
  }
  if (urlPath.startsWith('/egames/slots') || urlPath.startsWith('/explore/egames/slots')) {
    return [resolve('data/slots.ts'), resolve('pages/explore/egames/slots')]
  }
  if (urlPath.startsWith('/egames/jackpot') || urlPath.startsWith('/explore/egames/jackpot')) {
    return [resolve('data/jackpot.ts'), resolve('pages/explore/egames/jackpot')]
  }
  if (urlPath.startsWith('/egames/bingo') || urlPath.startsWith('/explore/egames/bingo')) {
    return [resolve('data/bingo.ts'), resolve('pages/explore/egames/bingo')]
  }
  if (urlPath.startsWith('/entertainment/live-casino') || urlPath.startsWith('/explore/entertainment/live-casino')) {
    return [resolve('data/live-casino.ts'), resolve('data/live-casino-categories.ts'), resolve('pages/explore/entertainment/live-casino')]
  }
  if (urlPath.startsWith('/entertainment/poker') || urlPath.startsWith('/explore/entertainment/poker')) {
    return [resolve('data/poker.ts'), resolve('pages/explore/entertainment/poker')]
  }
  if (urlPath.startsWith('/game-rules/')) {
    const slug = urlPath.replace('/game-rules/', '')
    return [
      resolve(`data/${slug}.ts`),
      resolve(`data/${slug.replace('-rules', '')}-rules.ts`),
      resolve(`pages/game-rules/${slug}.vue`),
    ]
  }
  if (urlPath.startsWith('/tutorial')) {
    return [resolve('pages/tutorial.vue'), resolve('components/tutorial')]
  }
  if (urlPath === '/about-us') return [resolve('pages/about-us.vue')]
  if (urlPath === '/responsible-gaming') return [resolve('pages/responsible-gaming.vue'), resolve('pages/explore/help/responsible-gaming.vue')]
  if (urlPath === '/privacy-policy') return [resolve('pages/privacy-policy.vue'), resolve('pages/explore/legal/privacy-policy.vue')]
  if (urlPath === '/terms-of-use') return [resolve('pages/terms-of-use.vue'), resolve('pages/explore/legal/terms-of-service.vue')]
  if (urlPath === '/download-app') return [resolve('pages/download-app.vue')]
  if (urlPath === '/affiliate') return [resolve('pages/affiliate.vue')]
  if (urlPath.startsWith('/help/')) return [resolve(`pages/explore${urlPath}.vue`)]
  if (urlPath.startsWith('/legal/')) return [resolve(`pages/explore${urlPath}.vue`)]
  if (urlPath.startsWith('/egames/customer-service')) return [resolve('pages/explore/egames/customer-service')]
  if (urlPath.startsWith('/live-plaza')) return [resolve('pages/explore/live-plaza'), resolve('data/predictions.ts')]
  if (urlPath.startsWith('/account/')) return [resolve(`pages/explore${urlPath}.vue`), resolve(`pages/explore${urlPath}/index.vue`)]
  if (urlPath.startsWith('/explore/help/')) return [resolve(`pages${urlPath}.vue`)]
  if (urlPath.startsWith('/explore/legal/')) return [resolve(`pages${urlPath}.vue`)]
  if (urlPath.startsWith('/explore/egames/customer-service')) return [resolve('pages/explore/egames/customer-service')]
  if (urlPath.startsWith('/explore/live-plaza')) return [resolve('pages/explore/live-plaza'), resolve('data/predictions.ts')]
  return [resolve(`pages${urlPath}.vue`)]
}

function computePathHash(baseDir, urlPath) {
  const files = getSourceFilesForPath(baseDir, urlPath)
  const hash = crypto.createHash('sha1')
  let foundAny = false

  for (const filePath of files) {
    if (!fs.existsSync(filePath)) continue
    const stat = fs.statSync(filePath)
    if (stat.isDirectory()) {
      const dirFiles = fs.readdirSync(filePath).sort()
      for (const f of dirFiles) {
        const sub = path.join(filePath, f)
        if (fs.existsSync(sub) && fs.statSync(sub).isFile()) {
          hash.update(f + ':' + fs.readFileSync(sub))
          foundAny = true
        }
      }
    } else if (stat.isFile()) {
      hash.update(path.basename(filePath) + ':' + fs.readFileSync(filePath))
      foundAny = true
    }
  }

  if (!foundAny) {
    hash.update(urlPath)
  }
  return hash.digest('hex')
}

export async function generateSitemapFile(customSiteUrl, options = {}) {
  const envFromFile = readDotEnvMap(options.envPath)
  const fileSiteUrl = (envFromFile.NUXT_PUBLIC_SITE_URL || envFromFile.SITE_URL || '').trim()
  const resolvedEnvSiteUrl = options.envPath
    ? (fileSiteUrl || explicitEnvSiteUrl)
    : (explicitEnvSiteUrl || fileSiteUrl || (process.env.NUXT_PUBLIC_SITE_URL || process.env.SITE_URL || '').trim())
  const siteUrl = (customSiteUrl || resolvedEnvSiteUrl || 'https://2bet.com').replace(/\/+$/, '')
  const today = new Date().toISOString().split('T')[0]

  const jiti = createJiti(import.meta.url, {
    alias: {
      '~': rootDir,
      '@': rootDir,
    },
  })

  // Keep server/utils/sitemap.ts as the single source of truth so commented-out or edited routes stay excluded.
  const sitemapMod = jiti(path.join(rootDir, 'server/utils/sitemap.ts'))
  if (typeof sitemapMod?.getSitemapEntries !== 'function' || typeof sitemapMod?.formatSitemapPagesXml !== 'function' || typeof sitemapMod?.generateSitemapIndexXml !== 'function') {
    throw new Error('[sitemap] Failed to load sitemap helpers from server/utils/sitemap.ts')
  }

  const uniqueEntries = sitemapMod.getSitemapEntries().map((entry) => ({ ...entry }))

  // Load existing sitemap dates and content hashes
  const datesFilePath = path.join(rootDir, 'data/sitemap-dates.json')
  let datesMap = {}
  try {
    if (fs.existsSync(datesFilePath)) {
      datesMap = JSON.parse(fs.readFileSync(datesFilePath, 'utf8'))
    }
  } catch (err) {
    console.warn('[sitemap] Failed to load data/sitemap-dates.json, re-initializing', err.message)
    datesMap = {}
  }

  let datesChanged = false
  for (const entry of uniqueEntries) {
    const currentHash = computePathHash(rootDir, entry.path)
    const existing = datesMap[entry.path]
    if (existing && existing.hash === currentHash && existing.lastmod) {
      entry.lastmod = existing.lastmod
    } else {
      entry.lastmod = today
      datesMap[entry.path] = {
        lastmod: today,
        hash: currentHash,
      }
      datesChanged = true
    }
  }

  if (datesChanged) {
    fs.writeFileSync(datesFilePath, JSON.stringify(datesMap, null, 2) + '\n', 'utf8')
    console.log('[sitemap] Updated data/sitemap-dates.json with latest modified dates')
  }

  const pagesXml = sitemapMod.formatSitemapPagesXml(siteUrl, uniqueEntries, today)
  const indexXml = sitemapMod.generateSitemapIndexXml(siteUrl, today)

  const writeAtomic = (targetFile, content) => {
    const dir = path.dirname(targetFile)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    const tempFile = path.join(dir, `.${path.basename(targetFile)}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}.tmp`)
    fs.writeFileSync(tempFile, content, 'utf8')
    fs.renameSync(tempFile, targetFile)
  }

  // 1. Write to public/ directory
  const publicDir = path.join(rootDir, 'public')
  const pagesPath = path.join(publicDir, 'sitemap-pages.xml')
  const indexPath = path.join(publicDir, 'sitemap-index.xml')
  writeAtomic(pagesPath, pagesXml)
  writeAtomic(indexPath, indexXml)

  // Clean up legacy sitemap.xml in public/ if present
  const legacyPublicPath = path.join(publicDir, 'sitemap.xml')
  if (fs.existsSync(legacyPublicPath)) {
    try { fs.unlinkSync(legacyPublicPath) } catch { /* ignore */ }
  }

  // 2. Write to .output/public/ if build output exists
  const outputPublicDir = path.join(rootDir, '.output', 'public')
  let writtenToOutput = false
  if (fs.existsSync(outputPublicDir)) {
    const outputPagesPath = path.join(outputPublicDir, 'sitemap-pages.xml')
    const outputIndexPath = path.join(outputPublicDir, 'sitemap-index.xml')
    writeAtomic(outputPagesPath, pagesXml)
    writeAtomic(outputIndexPath, indexXml)

    const legacyOutputPath = path.join(outputPublicDir, 'sitemap.xml')
    if (fs.existsSync(legacyOutputPath)) {
      try { fs.unlinkSync(legacyOutputPath) } catch { /* ignore */ }
    }
    writtenToOutput = true
  }

  console.log(`[sitemap] Generated sitemap-pages.xml with ${uniqueEntries.length} URLs for ${siteUrl}`)
  console.log(`[sitemap] Generated sitemap-index.xml linking sitemap-pages.xml and sitemap-blog.php`)
  console.log(`[sitemap] Saved to: ${pagesPath} and ${indexPath}`)
  if (writtenToOutput) {
    console.log(`[sitemap] Saved to: ${outputPublicDir}/sitemap-pages.xml and ${outputPublicDir}/sitemap-index.xml`)
  }

  return {
    count: uniqueEntries.length,
    siteUrl,
    pagesPath,
    indexPath,
  }
}

// Run directly if invoked from CLI
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  generateSitemapFile().catch((err) => {
    console.error('[sitemap] Generation error:', err)
    process.exit(1)
  })
}

