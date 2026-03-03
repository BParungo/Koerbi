import { describe, it, expect } from 'vitest'
import { parseInviteCode } from '@/utils/invite'

describe('invite utils', () => {
  describe('parseInviteCode', () => {
    it('returns raw code as-is', () => {
      expect(parseInviteCode('abc123')).toBe('abc123')
    })

    it('extracts code from full URL', () => {
      expect(parseInviteCode('https://koerbi.app/invite/abc123')).toBe('abc123')
    })

    it('extracts code from path', () => {
      expect(parseInviteCode('/invite/abc123')).toBe('abc123')
    })

    it('trims whitespace', () => {
      expect(parseInviteCode('  abc123  ')).toBe('abc123')
    })

    it('handles URL with trailing slash', () => {
      expect(parseInviteCode('https://koerbi.app/invite/xyz/')).toBe('xyz/')
    })
  })
})
