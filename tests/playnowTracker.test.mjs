import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import http from 'node:http'
import { resolve } from 'node:path'
import { test } from 'node:test'
import { createJiti } from 'jiti'
import {
  buildPlaynowClickPayload,
  buildPlaynowTrackerUrl,
  closestTrackableElement,
  cssPath,
  sendPlaynowClick,
  setupPlaynowTracker,
} from '../utils/playnowTracker.ts'

const rootDir = process.cwd()
const jiti = createJiti(import.meta.url, {
  alias: {
    '~': rootDir,
    '@': rootDir,
  },
})
const { normalizePlaynowClickPayload, recordPlaynowClick } = jiti(
  resolve(rootDir, 'server/utils/bloggerist.ts'),
)

function createMockDomElement({
  tagName = 'BUTTON',
  id = '',
  className = '',
  textContent = '',
  attributes = {},
  disabled = false,
  parent = null,
  children = [],
} = {}) {
  const attrs = { ...attributes }
  if (id) attrs.id = id
  if (disabled) attrs.disabled = ''

  const el = {
    nodeType: 1,
    tagName: tagName.toUpperCase(),
    id,
    className,
    textContent,
    value: attrs.value ?? '',
    href: attrs.href ?? '',
    disabled,
    parentElement: parent,
    parentNode: parent,
    children,
    hasAttribute(name) {
      return Object.prototype.hasOwnProperty.call(attrs, name)
    },
    getAttribute(name) {
      if (name === 'class') return className
      return Object.prototype.hasOwnProperty.call(attrs, name) ? attrs[name] : null
    },
    matches(selector) {
      const parts = selector.split(',').map(s => s.trim()).filter(Boolean)
      const tagLower = el.tagName.toLowerCase()
      const clsList = String(el.className || '').split(/\s+/).filter(Boolean)

      return parts.some((part) => {
        if (part === tagLower) return true
        if (part === 'a[href]') return tagLower === 'a' && el.hasAttribute('href')
        if (part === 'input[type="button"]') return tagLower === 'input' && attrs.type === 'button'
        if (part === 'input[type="submit"]') return tagLower === 'input' && attrs.type === 'submit'
        if (part === 'input[type="reset"]') return tagLower === 'input' && attrs.type === 'reset'
        if (part === '[class*="btn-"]') return clsList.some(c => c.includes('btn-'))
        if (part === '[class*="-btn"]') return clsList.some(c => c.includes('-btn'))
        if (part.startsWith('.')) return clsList.includes(part.slice(1))
        const attrMatch = part.match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/)
        if (attrMatch) {
          const [, attrName, attrVal] = attrMatch
          if (!el.hasAttribute(attrName)) return false
          return attrVal === undefined ? true : attrs[attrName] === attrVal
        }
        return false
      })
    },
    closest(selector) {
      let cur = el
      while (cur) {
        if (cur.matches?.(selector)) return cur
        cur = cur.parentElement
      }
      return null
    },
    querySelector(selector) {
      const queue = [...(el.children || [])]
      while (queue.length) {
        const child = queue.shift()
        if (child?.matches?.(selector)) return child
        if (child?.children?.length) queue.push(...child.children)
      }
      return null
    },
  }
  return el
}

test('bloggerist directory remains completely untouched', () => {
  const status = execFileSync('git', ['-C', resolve(process.cwd(), 'bloggerist'), 'status', '--short'], {
    encoding: 'utf8',
  }).trim()
  assert.equal(status, '', `bloggerist folder must not be modified, found:\n${status}`)
})

test('PHP router scripts/bloggerist-router.php has valid syntax and handles /api/playnow-tracker', () => {
  const routerPath = resolve(process.cwd(), 'scripts/bloggerist-router.php')
  const routerSrc = readFileSync(routerPath, 'utf8')
  assert.match(routerSrc, /\/api\/playnow-tracker/)
  assert.match(routerSrc, /Access-Control-Allow-Origin/)
  assert.match(routerSrc, /\/api\/playnow-click\.php/)

  const lintOut = execFileSync('php', ['-l', routerPath], { encoding: 'utf8' })
  assert.match(lintOut, /No syntax errors detected/)
})

test('Nuxt runtime config, env sync, and global plugin wire BLOGGERIST_URL/api/playnow-tracker', () => {
  const nuxtConfig = readFileSync(resolve(process.cwd(), 'nuxt.config.ts'), 'utf8')
  const runtimeSync = readFileSync(resolve(process.cwd(), 'server/plugins/runtimeEnvSync.ts'), 'utf8')
  const pluginSrc = readFileSync(resolve(process.cwd(), 'plugins/playnowTracker.client.ts'), 'utf8')

  assert.match(nuxtConfig, /bloggeristUrl,/, 'runtimeConfig.public must expose bloggeristUrl')
  assert.match(runtimeSync, /config\.public\.bloggeristUrl\s*=\s*resolvedBloggeristUrl/)
  assert.match(pluginSrc, /setupPlaynowTracker\(\{\s*bloggeristUrl\s*\}\)/)

  assert.equal(buildPlaynowTrackerUrl('http://localhost:8082/'), 'http://localhost:8082/api/playnow-tracker')
  assert.equal(buildPlaynowTrackerUrl('https://cms.2bet.com'), 'https://cms.2bet.com/api/playnow-tracker')
  assert.equal(buildPlaynowTrackerUrl(''), '/api/playnow-tracker')
})

test('closestTrackableElement and buildPlaynowClickPayload track buttons, links, role=button, and cards', () => {
  const section = createMockDomElement({
    tagName: 'SECTION',
    id: 'slots-grid',
    attributes: { 'aria-label': 'Top Slots' },
  })
  const iconSvg = createMockDomElement({
    tagName: 'SVG',
    className: { baseVal: 'icon' },
    attributes: {},
  })
  const button = createMockDomElement({
    tagName: 'BUTTON',
    id: 'play-btn',
    className: 'primary-btn px-4 py-2',
    textContent: '  Start   Now  ',
    attributes: { name: 'start-game', 'data-playnow-url': '/playnow' },
    parent: section,
    children: [iconSvg],
  })
  iconSvg.parentElement = button
  iconSvg.parentNode = button

  assert.equal(closestTrackableElement(iconSvg), button)

  const payload = buildPlaynowClickPayload(
    button,
    { clientX: 120.4, clientY: 250.8 },
    {
      pageUrl: 'https://2bet.com/egames/slots',
      pagePath: '/egames/slots',
      pageTitle: 'Slots | 2bet',
      referrer: 'https://2bet.com/',
      origin: 'https://2bet.com',
    },
  )

  assert.deepEqual(payload, {
    pageUrl: 'https://2bet.com/egames/slots',
    pagePath: '/egames/slots',
    pageTitle: 'Slots | 2bet',
    referrer: 'https://2bet.com/',
    targetUrl: 'https://2bet.com/playnow',
    buttonText: 'Start Now',
    buttonClass: 'primary-btn px-4 py-2',
    buttonId: 'play-btn',
    buttonName: 'start-game',
    buttonTag: 'button',
    section: 'Top Slots',
    selector: 'button#play-btn',
    location: '/egames/slots | Top Slots | Start Now',
    x: 120,
    y: 251,
  })

  const heading = createMockDomElement({ tagName: 'H3', textContent: 'Fortune Tiger' })
  const gameCard = createMockDomElement({
    tagName: 'DIV',
    className: 'game-card rounded',
    textContent: 'RTP 96.81% Fortune Tiger PG',
    parent: section,
    children: [heading],
  })
  heading.parentElement = gameCard

  assert.equal(closestTrackableElement(gameCard), gameCard)
  const cardPayload = buildPlaynowClickPayload(gameCard, undefined, {
    pageUrl: 'https://2bet.com/egames/slots',
    pagePath: '/egames/slots',
  })
  assert.equal(cardPayload.buttonText, 'Fortune Tiger')
  assert.equal(cardPayload.targetUrl, '/egames/slots')
  assert.match(cssPath(gameCard), /div\.game-card\.rounded$/)

  const disabledButton = createMockDomElement({
    tagName: 'BUTTON',
    textContent: 'Disabled',
    disabled: true,
    parent: section,
  })
  assert.equal(closestTrackableElement(disabledButton), null)
})

test('sendPlaynowClick starts at BLOGGERIST_URL/api/playnow-tracker and falls back to /api/playnow-tracker', async () => {
  const originalFetch = globalThis.fetch
  const calls = []

  try {
    globalThis.fetch = async (url, init) => {
      calls.push({ url, init })
      return new Response(JSON.stringify({ ok: true, totalClicks: 1, locationClicks: 1 }), { status: 200 })
    }

    const okDirect = await sendPlaynowClick(
      normalizePlaynowClickPayload({ buttonText: 'Login', pagePath: '/' }),
      'http://localhost:8082',
    )
    assert.equal(okDirect, true)
    assert.equal(calls.length, 1)
    assert.equal(calls[0].url, 'http://localhost:8082/api/playnow-tracker')
    assert.equal(calls[0].init.method, 'POST')

    calls.length = 0
    globalThis.fetch = async (url, init) => {
      calls.push({ url, init })
      if (url === 'http://localhost:8082/api/playnow-tracker') {
        return new Response('Not Found', { status: 404 })
      }
      return new Response(JSON.stringify({ ok: true, totalClicks: 2, locationClicks: 1 }), { status: 200 })
    }

    const okFallback = await sendPlaynowClick(
      normalizePlaynowClickPayload({ buttonText: 'Cadastro', pagePath: '/bonuses' }),
      'http://localhost:8082',
    )
    assert.equal(okFallback, true)
    assert.deepEqual(
      calls.map(c => c.url),
      ['http://localhost:8082/api/playnow-tracker', '/api/playnow-tracker'],
    )
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('recordPlaynowClick tries /api/playnow-tracker first then /api/playnow-click.php with forwarded IP headers', async () => {
  const requests = []
  let trackerStatus = 404

  const server = http.createServer(async (req, res) => {
    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    const body = Buffer.concat(chunks).toString('utf8')
    requests.push({
      url: req.url,
      method: req.method,
      headers: req.headers,
      body: body ? JSON.parse(body) : null,
    })

    if (req.url === '/api/playnow-tracker' && trackerStatus !== 200) {
      res.writeHead(trackerStatus, { 'Content-Type': 'text/plain' })
      res.end('Not found')
      return
    }

    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true, totalClicks: 42, locationClicks: 7 }))
  })

  await new Promise(resolveListen => server.listen(0, '127.0.0.1', resolveListen))
  const address = server.address()
  const mockOrigin = `http://127.0.0.1:${address.port}`

  try {
    const fakeEvent = {
      context: { nitro: { runtimeConfig: { bloggeristUrl: mockOrigin } } },
      node: {
        req: {
          headers: {
            'x-forwarded-for': '203.0.113.10',
            'user-agent': '2bet-test-agent',
            referer: 'https://2bet.com/egames/slots',
          },
          socket: { remoteAddress: '127.0.0.1' },
        },
      },
    }

    // Also test global Nuxt runtimeConfig resolution fallback when nitro runtimeConfig isn't on event.context
    globalThis.useRuntimeConfig = () => ({ bloggeristUrl: mockOrigin })

    const resultFallback = await recordPlaynowClick(fakeEvent, {
      buttonText: 'Start Now',
      pagePath: '/egames/slots',
      targetUrl: 'https://2bet52.com/slotMachine/main',
    })

    assert.equal(resultFallback.ok, true)
    assert.equal(resultFallback.totalClicks, 42)
    assert.deepEqual(
      requests.map(r => r.url),
      ['/api/playnow-tracker', '/api/playnow-click.php'],
    )
    assert.equal(requests[1].headers['x-forwarded-for'], '203.0.113.10')
    assert.equal(requests[1].headers['x-real-ip'], '203.0.113.10')
    assert.equal(requests[1].headers['user-agent'], '2bet-test-agent')
    assert.equal(requests[1].body.buttonText, 'Start Now')

    requests.length = 0
    trackerStatus = 200
    const resultDirect = await recordPlaynowClick(fakeEvent, {
      buttonText: 'Deposit',
      pagePath: '/',
    })
    assert.equal(resultDirect.ok, true)
    assert.deepEqual(requests.map(r => r.url), ['/api/playnow-tracker'])
  } finally {
    delete globalThis.useRuntimeConfig
    await new Promise(resolveClose => server.close(resolveClose))
  }
})

test('setupPlaynowTracker attaches capture-phase click listener to document', () => {
  const originalDocument = globalThis.document
  const originalFetch = globalThis.fetch
  const listeners = []
  const fetchedUrls = []

  try {
    globalThis.document = {
      title: '2bet',
      referrer: '',
      addEventListener(type, fn, capture) {
        listeners.push({ type, fn, capture })
      },
      removeEventListener(type, fn, capture) {
        const idx = listeners.findIndex(l => l.type === type && l.fn === fn && l.capture === capture)
        if (idx !== -1) listeners.splice(idx, 1)
      },
    }
    globalThis.fetch = async (url) => {
      fetchedUrls.push(url)
      return new Response(JSON.stringify({ ok: true }), { status: 200 })
    }

    const teardown = setupPlaynowTracker({ bloggeristUrl: 'http://localhost:8082' })
    assert.equal(listeners.length, 1)
    assert.equal(listeners[0].type, 'click')
    assert.equal(listeners[0].capture, true)

    const btn = createMockDomElement({
      tagName: 'BUTTON',
      textContent: 'Entrar',
    })
    listeners[0].fn({ target: btn, clientX: 10, clientY: 20 })
    assert.equal(fetchedUrls[0], 'http://localhost:8082/api/playnow-tracker')

    teardown()
    assert.equal(listeners.length, 0)
  } finally {
    globalThis.document = originalDocument
    globalThis.fetch = originalFetch
  }
})
