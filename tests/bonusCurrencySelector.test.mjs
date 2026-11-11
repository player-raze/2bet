import test, { describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { BONUS_CURRENCIES, getBonusCurrency } from '../data/bonus-currencies.ts'

describe('Bonus Currency Selector Suite', () => {
  const componentPath = path.resolve('components/bonuses/BonusCurrencySelector.vue')
  const componentSource = fs.readFileSync(componentPath, 'utf-8')

  test('Case 1: BONUS_CURRENCIES defines an entry for "all" with a valid icon', () => {
    const allCurrency = BONUS_CURRENCIES.find(c => c.code === 'all')
    assert.ok(allCurrency, 'BONUS_CURRENCIES must include an entry for "all"')
    assert.equal(allCurrency.label, 'All')
    assert.ok(allCurrency.icon.startsWith('data:image/svg+xml'), 'all currency must have valid svg icon')
  })

  test('Case 2: getBonusCurrency("all") returns the "all" currency entry', () => {
    const currency = getBonusCurrency('all')
    assert.equal(currency.code, 'all')
    assert.equal(currency.label, 'All')
  })

  test('Case 3: BonusCurrencySelector does not force BRL when modelValue is "all"', () => {
    assert.doesNotMatch(
      componentSource,
      /props\.modelValue\s*===\s*['"]all['"]\s*\?\s*['"]BRL['"]/,
      'BonusCurrencySelector must not force BRL when modelValue is "all"',
    )
  })

  test('Case 4: triggerCurrency computes the matching currency based on modelValue or defaults to "all"', () => {
    assert.match(
      componentSource,
      /const triggerCurrency\s*=\s*computed\(\(\)\s*=>\s*\{[\s\S]*?props\.currencies\.find/,
      'triggerCurrency must look up currency matching modelValue in props.currencies',
    )
  })
})
