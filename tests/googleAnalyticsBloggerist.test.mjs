import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import http from 'node:http'
import { resolve } from 'node:path'
import { test } from 'node:test'
import { createJiti } from 'jiti'

const rootDir = process.cwd()
const jiti = createJiti(import.meta.url, {
  alias: {
    '~': rootDir,
    '@': rootDir,
  },
})

const {
  clearBloggeristSeoSettingsCache,
  normalizeGoogleAnalyticsId,
  normalizeGoogleTagId,
  readBloggeristSeoSettings,
} = jiti(resolve(rootDir, 'server/utils/bloggerist.ts'))

test('bloggerist directory remains untouched', () => {
  const status = execFileSync('git', ['-C', resolve(rootDir, 'bloggerist'), 'status', '--short'], {
    encoding: 'utf8',
  }).trim()
  assert.equal(status, '', `bloggerist folder must remain clean, found:\n${status}`)
})

test('PHP dev router allows /api/settings/seo.php and passes syntax check', () => {
  const routerPath = resolve(rootDir, 'scripts/bloggerist-router.php')
  const routerSrc = readFileSync(routerPath, 'utf8')
  assert.match(routerSrc, /settings\/\[\^\/\]\+/)

  const lint = execFileSync('php', ['-l', routerPath], { encoding: 'utf8' })
  assert.match(lint, /No syntax errors detected/)
})

test('normalizeGoogleAnalyticsId validates GA4 measurement IDs and blocks invalid input', () => {
  assert.equal(normalizeGoogleAnalyticsId('G-ABC1234567'), 'G-ABC1234567')
  assert.equal(normalizeGoogleAnalyticsId(' "g-abc1234567" '), 'G-ABC1234567')
  assert.equal(normalizeGoogleAnalyticsId('<script>alert(1)</script>'), '')
  assert.equal(normalizeGoogleAnalyticsId('UA-123456-1'), '')
  assert.equal(normalizeGoogleAnalyticsId('G-ABC'), '')
  assert.equal(normalizeGoogleAnalyticsId(''), '')
})

test('normalizeGoogleTagId validates Google Tag / GTM IDs and blocks invalid input', () => {
  assert.equal(normalizeGoogleTagId('GTM-W5X9K2P'), 'GTM-W5X9K2P')
  assert.equal(normalizeGoogleTagId(' "gt-abc12345" '), 'GT-ABC12345')
  assert.equal(normalizeGoogleTagId('G-ABC1234567'), 'G-ABC1234567')
  assert.equal(normalizeGoogleTagId('AW-123456789'), 'AW-123456789')
  assert.equal(normalizeGoogleTagId('<script>alert(1)</script>'), '')
  assert.equal(normalizeGoogleTagId('GTM-12'), '')
  assert.equal(normalizeGoogleTagId(''), '')
})

test('readBloggeristSeoSettings fetches google_analytics_id and google_tag from BLOGGERIST_URL/api/settings/seo.php', async () => {
  clearBloggeristSeoSettingsCache()
  let requestCount = 0
  let mockId = 'G-TEST123456'
  let mockSettingsExtras = { google_tag_id: 'GTM-TEST999' }

  const server = http.createServer((req, res) => {
    requestCount += 1
    if (req.url === '/api/settings/seo.php') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({
        ok: true,
        settings: {
          website_name: '2bet',
          google_analytics_id: mockId,
          ...mockSettingsExtras,
        },
      }))
      return
    }
    res.writeHead(404)
    res.end()
  })

  await new Promise(done => server.listen(0, '127.0.0.1', done))
  const { port } = server.address()
  const mockOrigin = `http://127.0.0.1:${port}`

  try {
    globalThis.useRuntimeConfig = () => ({ bloggeristUrl: mockOrigin })
    const fakeEvent = { context: { nitro: { runtimeConfig: { bloggeristUrl: mockOrigin } } } }

    const first = await readBloggeristSeoSettings(fakeEvent)
    assert.equal(first.googleAnalyticsId, 'G-TEST123456')
    assert.equal(first.googleTagId, 'GTM-TEST999')
    assert.equal(requestCount, 1)

    // Subsequent call within TTL reuses cached value
    const cached = await readBloggeristSeoSettings(fakeEvent)
    assert.equal(cached.googleAnalyticsId, 'G-TEST123456')
    assert.equal(cached.googleTagId, 'GTM-TEST999')
    assert.equal(requestCount, 1)

    // Alternate key names (google_tag / gtm_id) work transparently
    clearBloggeristSeoSettingsCache()
    mockSettingsExtras = { google_tag_id: '', google_tag: 'GT-ALT12345' }
    const altKey = await readBloggeristSeoSettings(fakeEvent)
    assert.equal(altKey.googleTagId, 'GT-ALT12345')

    // Unsafe values from upstream are sanitized out
    clearBloggeristSeoSettingsCache()
    mockId = '<script>bad</script>'
    mockSettingsExtras = { google_tag: '<img src=x onerror=alert(1)>' }
    const sanitized = await readBloggeristSeoSettings(fakeEvent)
    assert.equal(sanitized.googleAnalyticsId, '')
    assert.equal(sanitized.googleTagId, '')
  } finally {
    delete globalThis.useRuntimeConfig
    clearBloggeristSeoSettingsCache()
    await new Promise(done => server.close(done))
  }
})

test('nuxt.config.ts, runtimeEnvSync.ts, and app.vue wire googleAnalyticsId and googleTagId into head scripts', () => {
  const nuxtConfig = readFileSync(resolve(rootDir, 'nuxt.config.ts'), 'utf8')
  const runtimeSync = readFileSync(resolve(rootDir, 'server/plugins/runtimeEnvSync.ts'), 'utf8')
  const appVue = readFileSync(resolve(rootDir, 'app.vue'), 'utf8')

  assert.match(nuxtConfig, /GOOGLE_ANALYTICS_ID/)
  assert.match(nuxtConfig, /GOOGLE_TAG_ID/)
  assert.match(nuxtConfig, /googleAnalyticsId,/)
  assert.match(nuxtConfig, /googleTagId,/)
  assert.match(runtimeSync, /readBloggeristSeoSettings\(event\)/)
  assert.match(runtimeSync, /config\.public\.googleAnalyticsId\s*=\s*bloggeristSeo\.googleAnalyticsId\s*\|\|\s*envGaId/)
  assert.match(runtimeSync, /config\.public\.googleTagId\s*=\s*bloggeristSeo\.googleTagId\s*\|\|\s*envGoogleTagId/)
  assert.match(appVue, /https:\/\/www\.googletagmanager\.com\/gtm\.js\?id=/)
  assert.match(appVue, /https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=/)
  assert.match(appVue, /gtag\('js',new Date\(\)\)/)
  assert.match(appVue, /gtag\("config"/)
})
