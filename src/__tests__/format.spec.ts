import { describe, it, expect } from 'vitest'
import { formatDate, formatNumber } from '@/utils/format'

describe('format utils', () => {
  describe('formatDate', () => {
    it('formats ISO date to German locale', () => {
      const result = formatDate('2026-03-05T12:00:00Z')
      expect(result).toContain('5')
      expect(result).toContain('März')
      expect(result).toContain('2026')
    })

    it('formats a different date correctly', () => {
      const result = formatDate('2025-12-24T00:00:00Z')
      expect(result).toContain('24')
      expect(result).toContain('Dezember')
      expect(result).toContain('2025')
    })
  })

  describe('formatNumber', () => {
    it('formats integers', () => {
      expect(formatNumber(1234)).toBe('1.234')
    })

    it('formats decimals with German locale', () => {
      expect(formatNumber(1234.5)).toBe('1.234,5')
    })

    it('formats zero', () => {
      expect(formatNumber(0)).toBe('0')
    })
  })
})
