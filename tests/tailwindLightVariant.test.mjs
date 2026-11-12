import test from 'node:test'
import assert from 'node:assert/strict'
import postcss from 'postcss'
import tailwindcss from 'tailwindcss'
import tailwindConfig from '../tailwind.config.ts'

test('Tailwind Light Variant Suite', async (t) => {
  await t.test('Case 1: tailwind.config exports light variant and darkMode configuration', () => {
    assert.ok(Array.isArray(tailwindConfig.plugins), 'plugins array must exist')
    assert.equal(tailwindConfig.plugins.length, 1, 'must have 1 custom plugin registered')
    assert.deepEqual(
      tailwindConfig.darkMode,
      ['class', '[data-theme="dark"]'],
      'darkMode must target data-theme="dark"'
    )
  })

  await t.test('Case 2: light:text-white compiles with [data-theme="light"] and .light ancestor selectors', async () => {
    const rawHtml = '<div class="text-[#8e9491] light:text-white"></div>'
    const result = await postcss([
      tailwindcss({
        ...tailwindConfig,
        content: [{ raw: rawHtml }],
      }),
    ]).process('@tailwind utilities;', { from: undefined })

    const css = result.css
    assert.ok(
      css.includes('html[data-theme="light"]:not(#_):not(#_) .light\\:text-white'),
      'CSS must contain html[data-theme="light"]:not(#_):not(#_) .light\\:text-white'
    )
    assert.ok(
      css.includes('.light:not(#_):not(#_) .light\\:text-white'),
      'CSS must contain .light:not(#_):not(#_) .light\\:text-white'
    )
    assert.ok(
      css.includes('255 255 255'),
      'CSS must set white color value (255 255 255)'
    )
  })

  await t.test('Case 3: light background and interactive utilities generate valid CSS', async () => {
    const rawHtml = '<button class="bg-[#242625] light:bg-[#f2f4f3] light:hover:text-black"></button>'
    const result = await postcss([
      tailwindcss({
        ...tailwindConfig,
        content: [{ raw: rawHtml }],
      }),
    ]).process('@tailwind utilities;', { from: undefined })

    const css = result.css
    assert.ok(
      css.includes('html[data-theme="light"]:not(#_):not(#_) .light\\:bg-\\[\\#f2f4f3\\]'),
      'CSS must generate light:bg-[#f2f4f3]'
    )
    assert.ok(
      css.includes('html[data-theme="light"]:not(#_):not(#_) .light\\:hover\\:text-black:hover'),
      'CSS must support stacked light:hover:text-black'
    )
  })

  await t.test('Case 4: dark utilities generate selector matching data-theme="dark"', async () => {
    const rawHtml = '<div class="dark:text-white"></div>'
    const result = await postcss([
      tailwindcss({
        ...tailwindConfig,
        content: [{ raw: rawHtml }],
      }),
    ]).process('@tailwind utilities;', { from: undefined })

    const css = result.css
    assert.ok(
      css.includes('.dark\\:text-white:is([data-theme="dark"] *)'),
      'CSS must generate dark:text-white scoped to [data-theme="dark"]'
    )
  })
})
