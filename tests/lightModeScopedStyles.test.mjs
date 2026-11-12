import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { compileStyle, parse } from '@vue/compiler-sfc'
import postcss from 'postcss'

const files = [
  'components/sports/SportsCategorySection.vue',
  'components/tutorial/TutorialOutcomeGraphic.vue',
  'components/game-rules/GameRulesNav.vue',
  'components/ByBetSpinner.vue',
  'components/ReferenceGameSection.vue',
  'pages/explore/bonus/[id].vue',
]

for (const file of files) {
  test(`${file}: compiled light overrides retain their component target`, () => {
    const filename = new URL(`../${file}`, import.meta.url)
    const { descriptor } = parse(readFileSync(filename, 'utf8'))
    const scopeId = 'data-v-light-mode-regression'
    const themeSelectors = []

    for (const style of descriptor.styles.filter(style => style.scoped)) {
      const result = compileStyle({ source: style.content, filename: file, id: scopeId, scoped: true })
      assert.deepEqual(result.errors, [])
      postcss.parse(result.code).walkRules(rule => {
        themeSelectors.push(...rule.selectors.filter(selector => /data-theme|\.light\b/.test(selector)))
      })
    }

    assert.ok(themeSelectors.length > 0, 'expected light-mode overrides')
    for (const selector of themeSelectors) {
      // A leading :global(theme) can discard everything after it, hiding <html> itself.
      assert.ok(selector.includes(`[${scopeId}]`), `theme rule escaped its component: ${selector}`)
    }
  })
}
