import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EmptyState } from '../shared/EmptyState'
import { ErrorState } from '../shared/ErrorState'

describe('EmptyState', () => {
  it('shows title and description', () => {
    render(<EmptyState title="No projects" description="Add your first one" />)
    expect(screen.getByRole('heading', { name: 'No projects' })).toBeInTheDocument()
    expect(screen.getByText('Add your first one')).toBeInTheDocument()
  })

  it('renders the action when given', () => {
    render(<EmptyState title="Empty" action={<button>Add</button>} />)
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument()
  })
})

describe('ErrorState', () => {
  it('shows an alert with the default message', () => {
    render(<ErrorState />)
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong')
  })

  it('calls onRetry when "Try again" is clicked', () => {
    const onRetry = vi.fn()
    render(<ErrorState onRetry={onRetry} />)
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('hides the retry button without onRetry', () => {
    render(<ErrorState />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
