import { describe, it, expect } from 'vitest'
import { parseInviteCode } from '@/utils/invite'

describe('invite utils', () => {
  describe('parseInviteCode', () => {
    it('returns raw code as-is', () => {
      expect(parseInviteCode('abc123')).toBe('ABC123')
    })

    it('extracts code from full URL', () => {
      expect(parseInviteCode('https://koerbi.app/invite/abc123')).toBe('ABC123')
    })

    it('extracts code from path', () => {
      expect(parseInviteCode('/invite/abc123')).toBe('ABC123')
    })

    it('trims whitespace', () => {
      expect(parseInviteCode('  abc123  ')).toBe('ABC123')
    })

    it('handles URL with trailing slash', () => {
      expect(parseInviteCode('https://koerbi.app/invite/xyz/')).toBe('XYZ')
    })

    it('extracts code from invite query parameter', () => {
      expect(parseInviteCode('https://koerbi.app/onboarding?invite=ab12cd34')).toBe('AB12CD34')
    })
  })
})
