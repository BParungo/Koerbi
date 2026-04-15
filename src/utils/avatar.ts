export function getAvatarEmoji(value: string | null | undefined): string {
  if (!value?.startsWith('emoji:')) return ''
  return value.slice(6)
}

export function getAvatarImageUrl(value: string | null | undefined): string {
  if (!value || value.startsWith('emoji:')) return ''

  // Backward compatibility: show previously stored https image URLs.
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'https:' ? parsed.toString() : ''
  } catch {
    return ''
  }
}

export function getAvatarFallback(value: string | null | undefined, name: string): string {
  return getAvatarEmoji(value) || name.slice(0, 2).toUpperCase()
}
