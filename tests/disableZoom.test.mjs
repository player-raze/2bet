import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { setupDisableZoom } from '../composables/useDisableZoom.ts'

test('Disable Zoom Suite', async (t) => {
  await t.test('Case 1: nuxt.config.ts contains unscalable viewport meta tag with viewport-fit=cover', () => {
    const configSource = readFileSync(resolve(process.cwd(), 'nuxt.config.ts'), 'utf8')
    assert.match(
      configSource,
      /name:\s*'viewport',\s*content:\s*'[^']*user-scalable=no[^']*'/
    )
    assert.match(
      configSource,
      /maximum-scale=1/
    )
    assert.match(
      configSource,
      /viewport-fit=cover/
    )
  })

  await t.test('Case 2: app.vue useHead defines unscalable viewport meta tag', () => {
    const appSource = readFileSync(resolve(process.cwd(), 'app.vue'), 'utf8')
    assert.match(
      appSource,
      /name:\s*'viewport',\s*content:\s*'[^']*user-scalable=no[^']*'/
    )
    assert.match(
      appSource,
      /setupDisableZoom\(\)/
    )
  })

  await t.test('Case 3: assets/css/main.css defines touch-action: pan-x pan-y on html and body', () => {
    const cssSource = readFileSync(resolve(process.cwd(), 'assets/css/main.css'), 'utf8')
    assert.match(
      cssSource,
      /html\s*\{[^}]*touch-action:\s*pan-x\s+pan-y;/
    )
    assert.match(
      cssSource,
      /body\s*\{[^}]*touch-action:\s*pan-x\s+pan-y;/
    )
    assert.match(
      cssSource,
      /touch-action:\s*manipulation;/
    )
  })

  await t.test('Case 4: setupDisableZoom registers and cleans up gesture, touch, wheel, and keydown listeners', () => {
    const listeners = new Map()
    const originalDoc = globalThis.document
    const originalWin = globalThis.window

    const mockAddListener = (map) => (event, handler, options) => {
      if (!map.has(event)) map.set(event, [])
      map.get(event).push({ handler, options })
    }

    const mockRemoveListener = (map) => (event, handler) => {
      const list = map.get(event) || []
      const index = list.findIndex((item) => item.handler === handler)
      if (index >= 0) list.splice(index, 1)
    }

    const docListeners = new Map()
    const winListeners = new Map()

    globalThis.document = {
      addEventListener: mockAddListener(docListeners),
      removeEventListener: mockRemoveListener(docListeners),
    }
    globalThis.window = {
      addEventListener: mockAddListener(winListeners),
      removeEventListener: mockRemoveListener(winListeners),
    }

    try {
      const cleanup = setupDisableZoom()

      // Verify iOS Safari gesture listeners
      assert.ok(docListeners.has('gesturestart'), 'Must listen to gesturestart')
      assert.ok(docListeners.has('gesturechange'), 'Must listen to gesturechange')
      assert.ok(docListeners.has('gestureend'), 'Must listen to gestureend')

      // Verify touchmove listener
      assert.ok(docListeners.has('touchmove'), 'Must listen to touchmove')

      // Verify wheel listener
      assert.ok(winListeners.has('wheel'), 'Must listen to wheel')

      // Verify keydown listener
      assert.ok(winListeners.has('keydown'), 'Must listen to keydown')

      // Test multi-touch prevention
      let touchPrevented = false
      const touchMoveHandler = docListeners.get('touchmove')[0].handler
      touchMoveHandler({
        touches: [{}, {}],
        preventDefault: () => {
          touchPrevented = true
        },
      })
      assert.equal(touchPrevented, true, 'Multi-touch touchmove must be prevented')

      // Test single-touch is NOT prevented
      let singleTouchPrevented = false
      touchMoveHandler({
        touches: [{}],
        preventDefault: () => {
          singleTouchPrevented = true
        },
      })
      assert.equal(singleTouchPrevented, false, 'Single touch scroll must not be prevented')

      // Test Ctrl+Wheel prevention
      let wheelPrevented = false
      const wheelHandler = winListeners.get('wheel')[0].handler
      wheelHandler({
        ctrlKey: true,
        preventDefault: () => {
          wheelPrevented = true
        },
      })
      assert.equal(wheelPrevented, true, 'Ctrl+wheel must be prevented')

      // Test normal wheel is NOT prevented
      let normalWheelPrevented = false
      wheelHandler({
        ctrlKey: false,
        preventDefault: () => {
          normalWheelPrevented = true
        },
      })
      assert.equal(normalWheelPrevented, false, 'Normal wheel must not be prevented')

      // Test keyboard zoom shortcuts
      let keyPrevented = false
      const keyHandler = winListeners.get('keydown')[0].handler
      keyHandler({
        ctrlKey: true,
        key: '+',
        preventDefault: () => {
          keyPrevented = true
        },
      })
      assert.equal(keyPrevented, true, 'Ctrl+plus keydown must be prevented')

      // Test cleanup
      cleanup()
      assert.equal(docListeners.get('gesturestart').length, 0, 'gesturestart must be removed')
      assert.equal(winListeners.get('wheel').length, 0, 'wheel listener must be removed')
    } finally {
      globalThis.document = originalDoc
      globalThis.window = originalWin
    }
  })
})
