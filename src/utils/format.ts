/**
 * Format an ISO date string to a localized German date.
 * Example: "2026-03-05T12:00:00Z" → "5. März 2026"
 */
export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('de-DE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Format a number with German locale.
 * Example: 1234.5 → "1.234,5"
 */
export function formatNumber(n: number): string {
  return n.toLocaleString('de-DE')
}
