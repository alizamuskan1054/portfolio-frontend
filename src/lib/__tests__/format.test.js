import { describe, it, expect } from 'vitest'
import { formatDate, formatDateTime, formatRelative, formatNumber } from '../format'

describe('formatDate', () => {
  it('formats a valid date', () => {
    expect(formatDate('2024-01-15T12:00:00Z')).toBe('Jan 15, 2024')
  })

  it('returns a dash for empty or invalid values', () => {
    expect(formatDate(null)).toBe('—')
    expect(formatDate('')).toBe('—')
    expect(formatDate('not-a-date')).toBe('—')
  })
})

describe('formatDateTime', () => {
  it('returns a dash for empty values', () => {
    expect(formatDateTime(undefined)).toBe('—')
  })

  it('includes the year for a valid value', () => {
    expect(formatDateTime('2024-01-15T12:00:00Z')).toContain('2024')
  })
})

describe('formatRelative', () => {
  it('says "just now" for the current moment', () => {
    expect(formatRelative(new Date())).toBe('just now')
  })

  it('formats hours in the past', () => {
    expect(formatRelative(new Date(Date.now() - 2 * 3600 * 1000))).toBe('2 hours ago')
  })

  it('returns a dash for invalid values', () => {
    expect(formatRelative('nope')).toBe('—')
  })
})

describe('formatNumber', () => {
  it('adds thousand separators', () => {
    expect(formatNumber(1234567)).toBe('1,234,567')
  })

  it('treats null/undefined as 0', () => {
    expect(formatNumber(null)).toBe('0')
    expect(formatNumber(undefined)).toBe('0')
  })
})
