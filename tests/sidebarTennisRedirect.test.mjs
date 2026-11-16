import test, { describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { resolveTennisRedirectUrl, getEnvRedirectCode, getEnvRedirectUrl } from '../utils/sportsRedirect.ts'

describe('Sidebar Tennis External Redirect Suite', () => {
  const envCode = getEnvRedirectCode()
  const pQuery = envCode ? `?p=${encodeURIComponent(envCode)}` : ''

  test('Case 1: Standard URL correctly resolves to inplay tennis path with p=xjSD parameter', () => {
    const result = resolveTennisRedirectUrl('https://bybet.com', 'xjSD')
    assert.equal(result, 'https://bybet.com/sportEvents/inplay/tennis?p=xjSD')
  })

  test('Case 2: Trailing slashes are stripped cleanly and p=xjSD parameter is preserved', () => {
    const result = resolveTennisRedirectUrl('https://bybet.com/', 'xjSD')
    assert.equal(result, 'https://bybet.com/sportEvents/inplay/tennis?p=xjSD')

    const multiSlashResult = resolveTennisRedirectUrl('https://bybet.com///', 'xjSD')
    assert.equal(multiSlashResult, 'https://bybet.com/sportEvents/inplay/tennis?p=xjSD')
  })

  test('Case 3: Custom domain or staging redirect URL is supported with p=xjSD parameter', () => {
    const result = resolveTennisRedirectUrl('https://staging.bybet.com/', 'xjSD')
    assert.equal(result, 'https://staging.bybet.com/sportEvents/inplay/tennis?p=xjSD')
  })

  test('Case 4: Empty or undefined bybetRedirectUrl falls back to configured URL with inplay tennis path', () => {
    const expected = `${getEnvRedirectUrl().replace(/\/+$/, '')}/sportEvents/inplay/tennis${pQuery}`
    assert.equal(resolveTennisRedirectUrl(''), expected)
    assert.equal(resolveTennisRedirectUrl(undefined), expected)
  })

  test('Case 5: data/homepage.ts defines Tennis item using externalUrl helper with external flag', () => {
    const homepageSource = fs.readFileSync(path.resolve('data/homepage.ts'), 'utf-8')
    assert.match(
      homepageSource,
      /label:\s*'Tennis'[\s\S]*?to:\s*externalUrl\('sportEvents\/inplay\/tennis'\)[\s\S]*?external:\s*true/,
      'Tennis submenu item must link via externalUrl helper to tennis redirect url with external: true',
    )
  })

  test('Case 6: components/AppSidebar.vue handles external submenu items', () => {
    const sidebarSource = fs.readFileSync(path.resolve('components/AppSidebar.vue'), 'utf-8')
    assert.match(
      sidebarSource,
      /getSubmenuItemAttributes/,
      'AppSidebar must use getSubmenuItemAttributes to bind external link attributes',
    )
    assert.match(
      sidebarSource,
      /external:\s*true/,
      'AppSidebar getSubmenuItemAttributes must include external: true for external links',
    )
  })

  test('Case 7: Custom and empty BYBET_REDIRECT_CODE parameters are respected when passed', () => {
    const result = resolveTennisRedirectUrl('https://bybet.com', 'PROMO2026')
    assert.equal(result, 'https://bybet.com/sportEvents/inplay/tennis?p=PROMO2026')
    assert.equal(resolveTennisRedirectUrl('https://bybet.com', ''), 'https://bybet.com/sportEvents/inplay/tennis')
  })

  test('Case 8: data/homepage.ts defines History, Deposit, Withdraw, and VIP items using externalUrl(/login) with external: true', () => {
    const homepageSource = fs.readFileSync(path.resolve('data/homepage.ts'), 'utf-8')
    assert.match(
      homepageSource,
      /label:\s*'History'[\s\S]*?to:\s*externalUrl\('login'\)[\s\S]*?external:\s*true/,
      'History submenu item must link via externalUrl(/login) with external: true',
    )
    assert.match(
      homepageSource,
      /label:\s*'Deposit'[\s\S]*?to:\s*externalUrl\('login'\)[\s\S]*?external:\s*true/,
      'Deposit item must link via externalUrl(/login) with external: true',
    )
    assert.match(
      homepageSource,
      /label:\s*'Withdraw'[\s\S]*?to:\s*externalUrl\('login'\)[\s\S]*?external:\s*true/,
      'Withdraw item must link via externalUrl(/login) with external: true',
    )
    assert.match(
      homepageSource,
      /label:\s*'VIP'[\s\S]*?to:\s*externalUrl\('login'\)[\s\S]*?external:\s*true/,
      'VIP item must link via externalUrl(/login) with external: true',
    )
  })

  test('Case 9: components/sports/MobileSportsNav.vue supports custom external URLs in MobileSportNavItem', () => {
    const navSource = fs.readFileSync(path.resolve('components/sports/MobileSportsNav.vue'), 'utf-8')
    assert.match(
      navSource,
      /interface\s+MobileSportNavItem[\s\S]*?url\?:/m,
      'MobileSportNavItem interface must declare url?: string',
    )
    assert.match(
      navSource,
      /key:\s*'table-tennis'[\s\S]*?url:\s*'sportEvents\/incoming\/tableTennis'/,
      'Table Tennis item in MobileSportsNav must support custom url',
    )
    assert.match(
      navSource,
      /resolveExternalSportUrl/,
      'MobileSportsNav must contain resolveExternalSportUrl helper to format paths',
    )
  })
})
