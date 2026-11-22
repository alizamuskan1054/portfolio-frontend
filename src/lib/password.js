import { z } from 'zod'

// Strong password ke rules: UI checklist aur zod validation dono yahin se chalte hain.
export const PASSWORD_RULES = [
  { key: 'length', label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { key: 'upper', label: 'One uppercase letter (A-Z)', test: (p) => /[A-Z]/.test(p) },
  { key: 'lower', label: 'One lowercase letter (a-z)', test: (p) => /[a-z]/.test(p) },
  { key: 'number', label: 'One number (0-9)', test: (p) => /\d/.test(p) },
  {
    key: 'special',
    label: 'One special character (! @ #)',
    test: (p) => /[^A-Za-z0-9]/.test(p),
  },
]

export const STRENGTH_LEVELS = [
  { label: 'Too weak', tone: 'danger' },
  { label: 'Weak', tone: 'danger' },
  { label: 'Fair', tone: 'warning' },
  { label: 'Good', tone: 'primary' },
  { label: 'Strong', tone: 'success' },
]

// 0..4. 8 se kam characters ho to kabhi "Fair" se upar nahi.
export function passwordStrength(password = '') {
  if (!password) return 0
  const passed = PASSWORD_RULES.filter((r) => r.test(password)).length
  const score = Math.max(0, passed - 1) // length ke ilawa 4 rules => 0..4
  return password.length < 8 ? Math.min(score, 1) : score
}

export const isStrongPassword = (password = '') =>
  PASSWORD_RULES.every((r) => r.test(password))

// zod: z.object({ password: passwordField('Password') })
export const passwordField = (name = 'Password') =>
  z
    .string()
    .min(1, `${name} is required`)
    .refine(isStrongPassword, `${name} does not meet all the requirements below`)
