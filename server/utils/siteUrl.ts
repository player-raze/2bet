import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { H3Event } from 'h3'

/**
 * Reads a key directly from .env (checking cwd and parent directory when running inside .output).
 */
export async function readDotEnvValue(key: string): Promise<string | undefined> {
  const candidates = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '../.env'),
  ]

  for (const envPath of candidates) {
    try {
      const content = await fs.readFile(envPath, 'utf8')
      const match = content.match(new RegExp(`^[ \\t]*${key}[ \\t]*=[ \\t]*(.*)$`, 'm'))
      if (match) {
        const rawVal = (match[1] ?? '').trim()
        if (!rawVal) return ''
        const quoted = rawVal.match(/^(?:"([^"\r\n]*)"|'([^'\r\n]*)')/)
        if (quoted) return (quoted[1] ?? quoted[2] ?? '').trim()
        return rawVal.split('#')[0]?.trim() ?? ''
      }
    } catch {
      // Ignore missing or unreadable .env files
    }
  }

  return undefined
}

/**
 * Resolves runtime siteUrl, checking live env and .env before baked Nuxt runtimeConfig.
 */
export async function resolveRuntimeSiteUrl(event: H3Event): Promise<string> {
  const nuxtPublicEnv = (process.env.NUXT_PUBLIC_SITE_URL || '').trim()
  if (nuxtPublicEnv) {
    return nuxtPublicEnv.replace(/\/+$/, '')
  }

  const dotEnvUrl = (
    (await readDotEnvValue('NUXT_PUBLIC_SITE_URL'))
    || (await readDotEnvValue('SITE_URL'))
    || ''
  ).trim()
  if (dotEnvUrl) {
    return dotEnvUrl.replace(/\/+$/, '')
  }

  const processSiteUrl = (process.env.SITE_URL || '').trim()
  if (processSiteUrl) {
    return processSiteUrl.replace(/\/+$/, '')
  }

  const config = useRuntimeConfig(event)
  return String(config.public.siteUrl || 'https://2bet.com').replace(/\/+$/, '')
}

/**
 * Reads a generated sitemap XML file when its <loc> domain already matches the active siteUrl.
 */
export async function readMatchingGeneratedFile(
  filename: string,
  siteUrl: string,
): Promise<string | null> {
  const cleanUrl = siteUrl.replace(/\/+$/, '')
  const candidates = [
    path.resolve(process.cwd(), '.output/public', filename),
    path.resolve(process.cwd(), 'public', filename),
    path.resolve(process.cwd(), '../.output/public', filename),
  ]

  for (const filePath of candidates) {
    try {
      const content = await fs.readFile(filePath, 'utf8')
      if (content.includes(`<loc>${cleanUrl}/`)) {
        return content
      }
    } catch {
      // Ignore missing generated file and fall back to dynamic XML generation
    }
  }

  return null
}
