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
  const match = trimmed.match(/\/invite\/(.+)$/)
  return match?.[1] ?? trimmed
}
