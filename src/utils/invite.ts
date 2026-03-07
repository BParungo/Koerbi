/**
 * Builds a full invite link from an invite code.
 */
export function buildInviteLink(inviteCode: string): string {
  const base = window.location.origin
  return `${base}/invite/${inviteCode}`
}

/**
 * Extracts the invite code from either a full link or a raw code string.
 * Accepts: "abc123", "https://koerbi.app/invite/abc123", "/invite/abc123"
 */
export function parseInviteCode(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) return ''

  const directPathMatch = trimmed.match(/\/invite\/([^/?#]+)/i)
  if (directPathMatch?.[1]) return directPathMatch[1].toUpperCase()

  try {
    const url = new URL(trimmed, window.location.origin)
    const queryCode = url.searchParams.get('invite')
    if (queryCode)
      return queryCode
        .trim()
        .replace(/[/?#].*$/, '')
        .toUpperCase()
  } catch {
    // Keep raw fallback for non-URL user input.
  }

  return trimmed
    .replace(/[/?#].*$/, '')
    .replace(/\/+$/, '')
    .toUpperCase()
}
