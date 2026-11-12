import assert from 'node:assert/strict'
import { test } from 'node:test'

let moduleId = 0
const api = 'https://sports.example.test'
const liveMatch = {
  id: 'match-1', status: 'live', sport: 'basketball',
  startTime: '2026-11-12T00:00:00Z',
  home: { name: 'Home' }, away: { name: 'Away' },
}

async function setup(t, fetch) {
  for (const [key, value] of Object.entries({
    $fetch: fetch,
    createError: options => Object.assign(new Error(options.statusMessage), options),
  })) {
    const original = Object.getOwnPropertyDescriptor(globalThis, key)
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value })
    t.after(() => {
      if (original) Object.defineProperty(globalThis, key, original)
      else delete globalThis[key]
    })
  }
  return import(`../server/utils/kadarioApi.ts?cache-test=${moduleId++}`)
}

test('20 simultaneous inplay callers share one scores fetch and normalized result', async t => {
  let calls = 0
  let release
  const gate = new Promise(resolve => { release = resolve })
  const { getLiveInplayEvents } = await setup(t, async () => {
    calls++
    await gate
    return { code: 0, data: { results: [liveMatch] } }
  })

  const pending = Array.from({ length: 20 }, () => getLiveInplayEvents(api, 'site'))
  await Promise.resolve()
  assert.equal(calls, 1)
  release()
  const results = await Promise.all(pending)
  assert.ok(results.every(result => result === results[0]))
  assert.equal(results[0][0].home_team, 'Home')
  assert.equal(await getLiveInplayEvents(api, 'site'), results[0])
  assert.equal(calls, 1)
})

test('inplay fallback shares the catalog with concurrent direct catalog callers', async t => {
  const calls = new Map()
  const { getLiveInplayEvents, getKadarioCatalog } = await setup(t, async path => {
    calls.set(path, (calls.get(path) ?? 0) + 1)
    await Promise.resolve()
    if (path.includes('/scores')) return { code: 0, data: { results: [] } }
    if (path.includes('/hoopslive/')) return { code: 0, data: { games: [] } }
    if (path === '/livestream') return { code: 0, data: { results: [liveMatch] } }
    return { code: 0, data: { features: { live: true } } }
  })

  const results = await Promise.all([
    ...Array.from({ length: 20 }, () => getLiveInplayEvents(api, 'site')),
    ...Array.from({ length: 10 }, () => getKadarioCatalog(api, 'site', false, ['basketball', 'football'])),
  ])
  assert.equal(calls.size, 5)
  assert.ok([...calls.values()].every(count => count === 1))
  assert.equal(results[0][0].id, 'match-1')
  assert.equal(results.at(-1).results[0].id, 'match-1')
})

test('valid empty live results are cached instead of repeating the fallback chain', async t => {
  let calls = 0
  const { getLiveInplayEvents } = await setup(t, async path => {
    calls++
    if (path.includes('/scores')) return { code: 0, data: { results: [] } }
    if (path.includes('/hoopslive/')) return { code: 0, data: { games: [] } }
    return { code: 0, data: { features: { live: false } } }
  })

  assert.deepEqual(await getLiveInplayEvents(api, 'site'), [])
  assert.deepEqual(await getLiveInplayEvents(api, 'site'), [])
  assert.equal(calls, 4)
})

test('different upstream configurations and catalog options do not share cached data', async t => {
  let calls = 0
  const { getLiveInplayEvents, getKadarioCatalog } = await setup(t, async path => {
    calls++
    if (path.includes('/scores')) return { code: 0, data: { results: [liveMatch] } }
    return { code: 0, data: { games: [{ matchId: 'hoops-1', sport: 'basketball', home: liveMatch.home, away: liveMatch.away }] } }
  })

  await Promise.all([
    getLiveInplayEvents(api, 'one'),
    getLiveInplayEvents('https://other.example.test', 'one'),
    getLiveInplayEvents(api, 'two'),
    getLiveInplayEvents(api, 'one', `${api}/custom/scores`),
  ])
  assert.equal(calls, 4)
  await Promise.all([
    getKadarioCatalog(api, 'site'),
    getKadarioCatalog(api, 'site', true),
    getKadarioCatalog(api, 'site', false, ['football']),
    getKadarioCatalog(api, 'site', false, ['basketball'], `${api}/custom/live`),
  ])
  assert.equal(calls, 8)
})

test('live results expire after five seconds and refresh once', async t => {
  let now = 100000
  let calls = 0
  t.mock.method(Date, 'now', () => now)
  const { getLiveInplayEvents } = await setup(t, async () => {
    calls++
    return { code: 0, data: { results: [liveMatch] } }
  })

  const first = await getLiveInplayEvents(api, 'site')
  now += 4999
  assert.equal(await getLiveInplayEvents(api, 'site'), first)
  now += 2
  const refreshed = await Promise.all(Array.from({ length: 20 }, () => getLiveInplayEvents(api, 'site')))
  assert.notEqual(refreshed[0], first)
  assert.ok(refreshed.every(result => result === refreshed[0]))
  assert.equal(calls, 2)
})

test('failed requests release both pending entries and can be retried', async t => {
  let failing = true
  let calls = 0
  t.mock.method(console, 'warn', () => {})
  const { getLiveInplayEvents, getKadarioCatalog } = await setup(t, async path => {
    calls++
    if (failing) throw new Error('upstream unavailable')
    if (path.includes('/scores')) return { code: 0, data: { results: [liveMatch] } }
    return { code: 0, data: { games: [{ matchId: 'hoops-1', sport: 'basketball', home: liveMatch.home, away: liveMatch.away }] } }
  })

  const failed = await Promise.allSettled(Array.from({ length: 20 }, () => getLiveInplayEvents(api, 'site')))
  assert.ok(failed.every(result => result.status === 'rejected' && result.reason.statusCode === 502))
  assert.equal(calls, 5)
  failing = false
  assert.equal((await getLiveInplayEvents(api, 'site')).length, 1)
  assert.equal((await getKadarioCatalog(api, 'site', false, ['basketball', 'football'])).results.length, 2)
  assert.equal(calls, 8)
})

test('many distinct configurations evict older cached results', async t => {
  let calls = 0
  const { getLiveInplayEvents } = await setup(t, async () => {
    calls++
    return { code: 0, data: { results: [liveMatch] } }
  })

  for (let site = 0; site < 40; site++) await getLiveInplayEvents(api, String(site))
  await getLiveInplayEvents(api, '39')
  assert.equal(calls, 40)
  await getLiveInplayEvents(api, '0')
  assert.equal(calls, 41)
})
