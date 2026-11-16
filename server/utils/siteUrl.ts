import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { H3Event } from 'h3'

let cachedDotEnv: { envPath: string | null; raw: string; values: Record<string, string> } | null = null

export function parseDotEnvContent(content: string): Record<string, string> {
  const parsed: Record<string, string> = {}
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^[ \t]*([\w.-]+)[ \t]*=[ \t]*(.*)$/)
    if (!match) continue
    const key = match[1]
    const rawVal = (match[2] ?? '').trim()
    if (!rawVal) {
      parsed[key] = ''
      continue
    }
    const quoted = rawVal.match(/^(?:"([^"\r\n]*)"|'([^'\r\n]*)')/)
    parsed[key] = quoted ? (quoted[1] ?? quoted[2] ?? '').trim() : (rawVal.split('#')[0]?.trim() ?? '')
  }
  return parsed
}

/**
 * Reads and parses key=value pairs from .env (checking cwd and parent directory when running inside .output).
 */
export async function readDotEnvMap(): Promise<Record<string, string>> {
  const candidates = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '../.env'),
  ]

  for (const envPath of candidates) {
    try {
      const content = await fs.readFile(envPath, 'utf8')
      if (cachedDotEnv && cachedDotEnv.envPath === envPath && cachedDotEnv.raw === content) {
        return cachedDotEnv.values
      }
      const values = parseDotEnvContent(content)
      cachedDotEnv = { envPath, raw: content, values }
      return values
    } catch {
      // Ignore missing or unreadable .env files
    }
  }

  cachedDotEnv = { envPath: null, raw: '', values: {} }
  return {}
}

/**
 * Reads a key directly from .env (checking cwd and parent directory when running inside .output).
 */
export async function readDotEnvValue(key: string): Promise<string | undefined> {
  const envMap = await readDotEnvMap()
  return Object.prototype.hasOwnProperty.call(envMap, key) ? envMap[key] : undefined
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
