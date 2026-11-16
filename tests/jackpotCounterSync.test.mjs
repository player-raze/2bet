import { it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import { ref, watch } from 'vue'

const compiled = ts.transpileModule(
  readFileSync(new URL('../composables/useJackpotCounter.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText

function createBrowser(initial = 1_500) {
  const storage = new Map([['2bet-jackpot:jdb', String(initial)]])
  const tabs = []
  const timers = new Map()
  const frames = new Map()
  const locks = new Map()
  let now = 100_000
  let timerId = 0

  function createTab(serverAmount = initial, reducedMotion = true) {
    const mounts = []
    const unmounts = []
    const stops = []
    const states = new Map()
    const storageListeners = new Set()
    const document = { hidden: false }
    const tab = { storageListeners, document }
    tabs.push(tab)
    const exports = {}
    const context = vm.createContext({
      exports,
      ref,
      watch: (source, callback) => stops.push(watch(source, callback, { flush: 'sync' })),
      useState: (key, init) => {
        if (!states.has(key)) states.set(key, ref(init()))
        return states.get(key)
      },
      onMounted: callback => mounts.push(callback),
      onBeforeUnmount: callback => unmounts.push(callback),
      document,
      window: {
        matchMedia: () => ({ matches: reducedMotion }),
        requestAnimationFrame: callback => {
          const id = ++timerId
          frames.set(id, callback)
          return id
        },
        cancelAnimationFrame: id => frames.delete(id),
        addEventListener: (type, callback) => {
          if (type === 'storage') storageListeners.add(callback)
        },
        removeEventListener: (type, callback) => storageListeners.delete(callback),
      },
      navigator: {
        locks: {
          request: (name, callback) => {
            const result = (locks.get(name) ?? Promise.resolve()).then(callback)
            locks.set(name, result)
            return result
          },
        },
      },
      Date: { now: () => now },
      performance: { now: () => now },
      localStorage: {
        getItem: key => storage.get(key) ?? null,
        setItem: (key, value) => {
          if (storage.get(key) === value) return
          storage.set(key, value)
          for (const other of tabs) {
            if (other !== tab) {
              for (const listener of other.storageListeners) listener({ key, newValue: value })
            }
          }
        },
      },
      setTimeout: (callback, delay) => {
        const id = ++timerId
        timers.set(id, { tab, at: now + delay, callback })
        return id
      },
      clearTimeout: id => timers.delete(id),
      $fetch: async () => ({ jdb: serverAmount }),
    })
    vm.runInContext(compiled, context)

    tab.mountCounter = () => {
      const counter = exports.useJackpotCounter({
        ...exports.JDB_JACKPOT_COUNTER,
        step: [1, 1],
        decreaseStep: [1, 1],
        increaseProbability: 1,
      })
      mounts.splice(0).forEach(callback => callback())
      return counter
    }
    tab.unmount = () => {
      unmounts.splice(0).forEach(callback => callback())
      stops.splice(0).forEach(stop => stop())
    }
    return tab
  }

  async function advance(ms) {
    now += ms
    const due = [...timers].filter(([, timer]) => timer.at <= now)
    for (const [id] of due) timers.delete(id)
    await Promise.all(due.map(([, timer]) => timer.callback()))
  }

  function frame(ms) {
    now += ms
    const pending = [...frames.values()]
    frames.clear()
    pending.forEach(callback => callback(now))
  }

  return { createTab, advance, frame, storage }
}

it('keeps homepage and jackpot tabs equal and advances the shared pool once per tick', async () => {
  const browser = createBrowser()
  const homepage = browser.createTab()
  const jackpotPage = browser.createTab()
  const homeCounter = homepage.mountCounter()
  const pageCounter = jackpotPage.mountCounter()

  for (let tick = 1; tick <= 3; tick++) {
    await browser.advance(3_000)
    assert.equal(homeCounter.displayAmount.value, 1_500 + tick)
    assert.equal(pageCounter.displayAmount.value, homeCounter.displayAmount.value)
    assert.equal(Number(browser.storage.get('2bet-jackpot:jdb')), 1_500 + tick)
  }
  homepage.unmount()
  jackpotPage.unmount()
})

it('preserves the latest amount on navigation instead of restoring an old server snapshot', async () => {
  const browser = createBrowser(4_200)
  const tab = browser.createTab(1_500)
  const homepage = tab.mountCounter()
  await browser.advance(3_000)
  assert.equal(homepage.amount.value, 4_201)
  tab.unmount()

  const jackpotPage = tab.mountCounter()
  await Promise.resolve()
  assert.equal(jackpotPage.amount.value, 4_201)
  assert.equal(jackpotPage.displayAmount.value, 4_201)
  tab.unmount()
})

it('animates both tabs through the same intermediate values and settles after 1.2 seconds', async () => {
  const browser = createBrowser()
  const homepage = browser.createTab(1_500, false)
  const jackpotPage = browser.createTab(1_500, false)
  const homeCounter = homepage.mountCounter()
  const pageCounter = jackpotPage.mountCounter()

  await browser.advance(3_000)
  assert.equal(homeCounter.displayAmount.value, 1_500)
  browser.frame(600)
  assert.ok(homeCounter.displayAmount.value > 1_500 && homeCounter.displayAmount.value < 1_501)
  assert.equal(homeCounter.displayAmount.value, pageCounter.displayAmount.value)
  browser.frame(600)
  assert.equal(homeCounter.displayAmount.value, 1_501)
  assert.equal(pageCounter.displayAmount.value, 1_501)
  homepage.unmount()
  jackpotPage.unmount()
})

it('lets the visible tab continue when the other tab is hidden or closed', async () => {
  const browser = createBrowser()
  const homepage = browser.createTab()
  const jackpotPage = browser.createTab()
  const homeCounter = homepage.mountCounter()
  const pageCounter = jackpotPage.mountCounter()
  homepage.document.hidden = true

  await browser.advance(3_000)
  assert.equal(homeCounter.displayAmount.value, 1_501)
  assert.equal(pageCounter.displayAmount.value, 1_501)
  homepage.unmount()
  await browser.advance(3_000)
  assert.equal(pageCounter.displayAmount.value, 1_502)
  jackpotPage.unmount()
})
