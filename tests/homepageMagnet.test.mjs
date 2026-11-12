import assert from 'node:assert/strict'
import { test } from 'node:test'
import { setupHomepageMagnet } from '../composables/useHomepageMagnet.ts'

class EventSurface {
  listeners = new Map()

  addEventListener(type, handler, options) {
    const entries = this.listeners.get(type) ?? []
    entries.push({ handler, capture: options === true || Boolean(options?.capture) })
    this.listeners.set(type, entries)
  }

  removeEventListener(type, handler, options) {
    const capture = options === true || Boolean(options?.capture)
    this.listeners.set(type, (this.listeners.get(type) ?? []).filter(entry =>
      entry.handler !== handler || entry.capture !== capture,
    ))
  }

  dispatch(type, event = {}) {
    for (const { handler } of [...(this.listeners.get(type) ?? [])]) handler(event)
  }

  get listenerCount() {
    return [...this.listeners.values()].reduce((count, entries) => count + entries.length, 0)
  }
}

class TestNode extends EventSurface {
  parent = null

  append(child) {
    child.parent = this
    return child
  }

  contains(node) {
    for (let current = node; current; current = current.parent) {
      if (current === this) return true
    }
    return false
  }
}

class TestElement extends TestNode {
  control = false
  disabled = false
  ariaDisabled = false
  inert = false

  matches(selector) {
    if (selector === '[inert]') return this.inert
    if (selector.includes(':disabled')) return this.disabled || this.ariaDisabled
    return this.control
  }

  closest(selector) {
    for (let current = this; current; current = current.parent) {
      if (current instanceof TestElement && current.matches(selector)) return current
    }
    return null
  }
}

class TestHTMLElement extends TestElement {
  style = { translate: '2px 3px', transition: 'opacity 150ms', transform: 'rotate(5deg)' }
  bounds = { left: 100, top: 50, width: 100, height: 40 }

  getBoundingClientRect() {
    return this.bounds
  }
}

function harness(t, matches = true) {
  const view = new EventSurface()
  const motion = Object.assign(new EventSurface(), { matches })
  const frames = new Map()
  const timers = new Map()
  let nextId = 1
  Object.assign(view, {
    Element: TestElement,
    HTMLElement: TestHTMLElement,
    Node: TestNode,
    matchMedia: () => motion,
    getComputedStyle: element => ({ transition: element.style.transition }),
    requestAnimationFrame: callback => { const id = nextId++; frames.set(id, callback); return id },
    cancelAnimationFrame: id => frames.delete(id),
    setTimeout: callback => { const id = nextId++; timers.set(id, callback); return id },
    clearTimeout: id => timers.delete(id),
  })
  const root = new TestHTMLElement()
  root.ownerDocument = { defaultView: view }
  const control = root.append(new TestHTMLElement())
  control.control = true
  const icon = control.append(new TestElement())
  const cleanup = setupHomepageMagnet(root)
  t.after(cleanup)
  const flush = queue => {
    for (const [id, callback] of [...queue]) {
      queue.delete(id)
      callback()
    }
  }
  return {
    root, control, icon, view, motion, frames, timers, cleanup,
    move: (target = icon, extra = {}) => root.dispatch('pointermove', {
      target, pointerType: 'mouse', clientX: 170, clientY: 80, ...extra,
    }),
    flushFrames: () => flush(frames),
    flushTimers: () => flush(timers),
  }
}

test('homepage magnet moves a contained control and restores its own styles on leave', t => {
  const h = harness(t)
  h.move(h.icon, { clientX: 10000, clientY: 10000 })
  h.move()
  assert.equal(h.frames.size, 1, 'pointer updates share one animation frame')
  h.flushFrames()
  assert.equal(h.control.style.translate, '3.60px 1.80px')
  assert.equal(h.control.style.transform, 'rotate(5deg)', 'existing transforms are preserved')
  assert.match(h.control.style.transition, /translate 240ms/)

  h.root.dispatch('pointerout', { relatedTarget: h.icon })
  assert.equal(h.timers.size, 0, 'moving between children of the control keeps it active')
  h.root.dispatch('pointerleave')
  assert.equal(h.control.style.translate, '0px 0px')
  assert.equal(h.timers.size, 1)
  h.flushTimers()
  assert.equal(h.control.style.translate, '2px 3px')
  assert.equal(h.control.style.transition, 'opacity 150ms')
})

test('homepage magnet clamps movement near the control edges', t => {
  const h = harness(t)
  h.move(h.icon, { clientX: 10000, clientY: -10000 })
  h.flushFrames()
  assert.equal(h.control.style.translate, '7.00px -5.00px')
})

test('homepage magnet excludes controls outside the homepage and disabled or inert controls', t => {
  const h = harness(t)
  for (const area of ['header', 'sidebar', 'mobile-bottom-nav']) {
    const outside = new TestHTMLElement()
    outside.control = true
    outside.area = area
    h.move(outside)
    assert.equal(outside.style.translate, '2px 3px')
  }
  h.control.disabled = true
  h.move()
  h.control.disabled = false
  h.control.ariaDisabled = true
  h.move()
  h.control.ariaDisabled = false
  h.control.inert = true
  h.move()
  assert.equal(h.frames.size, 0)
  assert.equal(h.control.style.translate, '2px 3px')
})

test('touch, pen, and reduced-motion/coarse-pointer input do not move homepage controls', t => {
  const h = harness(t)
  h.move(h.icon, { pointerType: 'touch' })
  h.move(h.icon, { pointerType: 'pen' })
  h.motion.matches = false
  h.move()
  h.flushFrames()
  assert.equal(h.control.style.translate, '2px 3px')
  assert.equal(h.frames.size, 0)
})

test('scroll, resize, blur, focus, and motion preference changes reset the effect', async t => {
  for (const event of ['scroll', 'resize', 'blur', 'focusin', 'change']) {
    await t.test(event, st => {
      const h = harness(st)
      h.move()
      h.flushFrames()
      assert.notEqual(h.control.style.translate, '2px 3px')
      if (event === 'change') {
        h.motion.matches = false
        h.motion.dispatch(event)
      } else if (event === 'focusin') h.root.dispatch(event)
      else h.view.dispatch(event)
      assert.equal(h.control.style.translate, '2px 3px')
      assert.equal(h.control.style.transition, 'opacity 150ms')
      assert.equal(h.timers.size, 0)
    })
  }
})

test('cleanup cancels queued work, restores all controls, and removes its listeners', t => {
  const h = harness(t)
  h.move()
  h.flushFrames()
  h.root.dispatch('pointerleave')
  const second = h.root.append(new TestHTMLElement())
  second.control = true
  h.move(second)
  assert.equal(h.timers.size, 1)
  assert.equal(h.frames.size, 1)
  h.cleanup()
  assert.equal(h.frames.size, 0)
  assert.equal(h.timers.size, 0)
  assert.equal(h.control.style.translate, '2px 3px')
  assert.equal(second.style.translate, '2px 3px')
  assert.equal(second.style.transition, 'opacity 150ms')
  assert.equal(h.root.listenerCount + h.view.listenerCount + h.motion.listenerCount, 0)
})
