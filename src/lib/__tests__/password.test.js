import { describe, it, expect } from 'vitest'
import { isStrongPassword, passwordStrength, passwordField } from '../password'

describe('isStrongPassword', () => {
  it('accepts a password that meets every rule', () => {
    expect(isStrongPassword('Abcdef1!')).toBe(true)
  })

  it.each([
    ['too short', 'Ab1!'],
    ['no uppercase', 'abcdef1!'],
    ['no lowercase', 'ABCDEF1!'],
    ['no number', 'Abcdefg!'],
    ['no special character', 'Abcdefg1'],
  ])('rejects a password with %s', (_label, pw) => {
    expect(isStrongPassword(pw)).toBe(false)
  })
})

describe('passwordStrength', () => {
  it('is 0 for an empty password', () => {
    expect(passwordStrength('')).toBe(0)
  })

  it('is 4 for a fully strong password', () => {
    expect(passwordStrength('Abcdef1!')).toBe(4)
  })

  it('never goes above 1 when shorter than 8 characters', () => {
    expect(passwordStrength('Ab1!')).toBeLessThanOrEqual(1)
  })
})

describe('passwordField (zod)', () => {
  it('passes a strong password', () => {
    expect(passwordField().safeParse('Abcdef1!').success).toBe(true)
  })

  it('fails a weak password', () => {
    expect(passwordField().safeParse('abc').success).toBe(false)
  })

  it('uses the given field name in the error message', () => {
    const result = passwordField('New password').safeParse('')
    expect(result.error.issues[0].message).toBe('New password is required')
  })
})
