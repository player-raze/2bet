import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { DEFAULT_THEME_PREFERENCE } from '../composables/useSitePreferences.ts'

test('Theme Preference Default Suite', async (t) => {
  await t.test('Case 1: DEFAULT_THEME_PREFERENCE is strictly set to dark', () => {
    assert.equal(DEFAULT_THEME_PREFERENCE, 'dark')
  })

  await t.test('Case 2: useCookie and useState in useSiteTheme default to dark', () => {
    const preferencesSource = readFileSync(
      resolve(process.cwd(), 'composables/useSitePreferences.ts'),
      'utf8'
    )

    // Ensure themeCookie defaults to DEFAULT_THEME_PREFERENCE or 'dark'
    assert.match(
      preferencesSource,
      /useCookie<ThemePreference>\('2bet-theme',\s*\{\s*default:\s*\(\)\s*=>\s*DEFAULT_THEME_PREFERENCE/
    )

    // Ensure fallback when cookie is unset or invalid is DEFAULT_THEME_PREFERENCE
    assert.match(
      preferencesSource,
      /useState<ThemePreference>\('2bet-theme-preference',\s*\(\)\s*=>\s*\{\s*return isThemePreference\(themeCookie\.value\)\s*\?\s*themeCookie\.value\s*:\s*DEFAULT_THEME_PREFERENCE/
    )
  })

  await t.test('Case 3: nuxt.config.ts theme-color meta tag defaults to dark palette', () => {
    const nuxtConfigSource = readFileSync(
      resolve(process.cwd(), 'nuxt.config.ts'),
      'utf8'
    )
    assert.match(nuxtConfigSource, /content:\s*'#080D0B'/)
  })
})
