export function formatBlogReadTime(value: string, locale: string): string {
  const time = value.trim()
  if (!time) return ''
  return /^\d+(?:\.\d+)?$/.test(time)
    ? `${time} ${locale === 'pt' ? 'min de leitura' : 'min read'}`
    : time
}
