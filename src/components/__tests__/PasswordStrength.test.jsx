import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PasswordStrength } from '../shared/PasswordStrength'

describe('PasswordStrength', () => {
  it('renders nothing for an empty password', () => {
    const { container } = render(<PasswordStrength value="" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows "Too weak" for a very weak password', () => {
    render(<PasswordStrength value="abc" />)
    expect(screen.getByText('Too weak')).toBeInTheDocument()
  })

  it('shows "Strong" for a password meeting every rule', () => {
    render(<PasswordStrength value="Abcdef1!" />)
    expect(screen.getByText('Strong')).toBeInTheDocument()
  })

  it('lists all five requirements', () => {
    render(<PasswordStrength value="a" />)
    expect(screen.getAllByRole('listitem')).toHaveLength(5)
  })
})
