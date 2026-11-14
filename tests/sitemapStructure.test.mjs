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
    assert.ok(paths.includes('/entertainment/poker/fishing'), 'Must include /entertainment/poker/fishing')
    assert.ok(paths.includes('/entertainment/poker/mahjong'), 'Must include /entertainment/poker/mahjong')
    assert.ok(paths.includes('/entertainment/poker/baccarat'), 'Must include /entertainment/poker/baccarat')
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
    await generateSitemapFile('https://2bet.br')

    const pagesPath = path.join(rootDir, 'public/sitemap-pages.xml')
    const indexPath = path.join(rootDir, 'public/sitemap-index.xml')

    assert.ok(fs.existsSync(pagesPath), 'public/sitemap-pages.xml must exist')
    assert.ok(fs.existsSync(indexPath), 'public/sitemap-index.xml must exist')

    const pagesContent = fs.readFileSync(pagesPath, 'utf8')
    const indexContent = fs.readFileSync(indexPath, 'utf8')

    assert.ok(pagesContent.includes('https://2bet.br/entertainment/poker'), 'sitemap-pages.xml must contain poker')
    assert.ok(indexContent.includes('https://2bet.br/sitemap-pages.xml'), 'sitemap-index.xml must contain sitemap-pages.xml')
    assert.ok(indexContent.includes('https://2bet.br/sitemap-blog.php'), 'sitemap-index.xml must contain sitemap-blog.php')
  })

  test('Case 7: robots.txt disallows preview URLs for all user agents and Googlebot', () => {
    const robotsPath = path.join(rootDir, 'server/routes/robots.txt.ts')
    const content = fs.readFileSync(robotsPath, 'utf8')
    assert.ok(content.includes('Disallow: /*?*preview='), 'Must disallow /*?*preview=')
    assert.ok(content.includes('User-agent: Googlebot'), 'Must explicitly mention Googlebot')
  })
})
