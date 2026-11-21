export const GOOGLE_ANALYTICS_ID_PATTERN = /^G-[A-Z0-9]{4,32}$/i
export const GOOGLE_TAG_ID_PATTERN = /^(?:GTM|GT|G|AW|DC)-[A-Z0-9]{4,32}$/i

export function normalizeTrackingId(value: unknown, pattern: RegExp): string {
  const cleaned = String(value ?? '').trim().replace(/^['"]+|['"]+$/g, '')
  if (!pattern.test(cleaned)) {
    return ''
  }
  return cleaned.toUpperCase()
}

export function normalizeGoogleAnalyticsId(value: unknown): string {
  return normalizeTrackingId(value, GOOGLE_ANALYTICS_ID_PATTERN)
}

export function normalizeGoogleTagId(value: unknown): string {
  return normalizeTrackingId(value, GOOGLE_TAG_ID_PATTERN)
}
