import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from '../ui/Badge'

describe('Badge', () => {
  it('renders its text', () => {
    render(<Badge>Published</Badge>)
    expect(screen.getByText('Published')).toBeInTheDocument()
  })

  it('applies the variant classes', () => {
    render(<Badge variant="success">Live</Badge>)
    expect(screen.getByText('Live')).toHaveClass('text-success')
  })

  it('merges a custom className', () => {
    render(<Badge className="my-custom">Hi</Badge>)
    expect(screen.getByText('Hi')).toHaveClass('my-custom')
  })
})
