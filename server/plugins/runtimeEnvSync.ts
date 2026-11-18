import { readDotEnvMap } from '~/server/utils/siteUrl'

function resolveEnvOverride(
  dotEnv: Record<string, string>,
  nuxtOverrideKey: string,
  envKey: string,
): string | undefined {
  if (process.env[nuxtOverrideKey] !== undefined) {
    return undefined
  }
  if (Object.prototype.hasOwnProperty.call(dotEnv, nuxtOverrideKey)) {
    return dotEnv[nuxtOverrideKey]
  }
  if (Object.prototype.hasOwnProperty.call(dotEnv, envKey)) {
    return dotEnv[envKey]
  }
  if (process.env[envKey] !== undefined) {
    return process.env[envKey]
  }
  return undefined
}

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('request', async (event) => {
    const dotEnv = await readDotEnvMap()
    const config = useRuntimeConfig(event)

    const siteUrlRaw = resolveEnvOverride(dotEnv, 'NUXT_PUBLIC_SITE_URL', 'SITE_URL')
    if (siteUrlRaw !== undefined) {
      const cleanSiteUrl = siteUrlRaw.trim().replace(/^['"]+|['"]+$/g, '').replace(/\/+$/, '')
      config.public.siteUrl = cleanSiteUrl || 'https://2bet.com'
    }

    const siteNameRaw = resolveEnvOverride(dotEnv, 'NUXT_PUBLIC_SITE_NAME', 'SITE_NAME')
    if (siteNameRaw !== undefined) {
      const cleanSiteName = siteNameRaw.trim().replace(/^['"]+|['"]+$/g, '')
      if (cleanSiteName) {
        config.public.siteName = cleanSiteName
      }
    }

    const redirectUrlRaw = resolveEnvOverride(dotEnv, 'NUXT_PUBLIC_BYBET_REDIRECT_URL', 'BYBET_REDIRECT_URL')
    if (redirectUrlRaw !== undefined) {
      const cleanRedirect = redirectUrlRaw.trim().replace(/\/+$/, '')
      config.public.bybetRedirectUrl = cleanRedirect || 'https://bybet.com'
    }

    const redirectCodeRaw = resolveEnvOverride(dotEnv, 'NUXT_PUBLIC_BYBET_REDIRECT_CODE', 'BYBET_REDIRECT_CODE')
    if (redirectCodeRaw !== undefined) {
      config.public.bybetRedirectCode = redirectCodeRaw.trim()
    }

    const indexFollowRaw = resolveEnvOverride(dotEnv, 'NUXT_PUBLIC_INDEX_FOLLOW', 'INDEX_FOLLOW')
    if (indexFollowRaw !== undefined) {
      config.public.indexFollow = indexFollowRaw.trim() === 'true'
    }

    const googleSiteVerificationRaw = resolveEnvOverride(
      dotEnv,
      'NUXT_PUBLIC_GOOGLE_SITE_VERIFICATION',
      'GOOGLE_SITE_VERIFICATION',
    )
    if (googleSiteVerificationRaw !== undefined) {
      config.public.googleSiteVerification = googleSiteVerificationRaw.trim().replace(/^['"]+|['"]+$/g, '')
    }

    const useOddsApiRaw = resolveEnvOverride(dotEnv, 'NUXT_PUBLIC_USE_ODDS_API', 'USE_ODDS_API')
    if (useOddsApiRaw !== undefined) {
      const enabled = useOddsApiRaw.trim() === 'true'
      config.public.useOddsApi = enabled
      config.useOddsApi = enabled
    }

    const oddsApiRaw = resolveEnvOverride(dotEnv, 'NUXT_ODDS_API', 'SPORTS_API')
    if (oddsApiRaw !== undefined && oddsApiRaw.trim()) {
      config.oddsApi = oddsApiRaw.trim()
    }

    const oddsApiKeyRaw = resolveEnvOverride(dotEnv, 'NUXT_ODDS_API_KEY', 'SPORTS_API_KEY')
    if (oddsApiKeyRaw !== undefined) {
      config.oddsApiKey = oddsApiKeyRaw.trim()
    }

    const kadarioApiRaw = resolveEnvOverride(dotEnv, 'NUXT_KADARIO_API', 'KADARIO_API')
    if (kadarioApiRaw !== undefined && kadarioApiRaw.trim()) {
      config.kadarioApi = kadarioApiRaw.trim()
    }

    const inplayApiRaw = resolveEnvOverride(dotEnv, 'NUXT_INPLAY_API', 'INPLAY_API')
    if (inplayApiRaw !== undefined && inplayApiRaw.trim()) {
      config.inplayApi = inplayApiRaw.trim()
    }

    const livestreamApiRaw = resolveEnvOverride(dotEnv, 'NUXT_LIVESTREAM_API', 'LIVESTREAM_API')
    if (livestreamApiRaw !== undefined && livestreamApiRaw.trim()) {
      config.livestreamApi = livestreamApiRaw.trim()
    }

    const bloggeristUrlRaw = resolveEnvOverride(dotEnv, 'NUXT_BLOGGERIST_URL', 'BLOGGERIST_URL')
    if (bloggeristUrlRaw !== undefined && bloggeristUrlRaw.trim()) {
      config.bloggeristUrl = bloggeristUrlRaw.trim()
    }
  })
})
