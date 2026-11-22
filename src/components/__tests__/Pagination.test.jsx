import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Pagination } from '../shared/Pagination'

describe('Pagination', () => {
  it('renders nothing when there is only one page', () => {
    const { container } = render(<Pagination page={1} count={5} pageSize={10} onPageChange={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the visible range', () => {
    render(<Pagination page={1} count={25} pageSize={10} onPageChange={() => {}} />)
    expect(screen.getByText('Showing 1–10 of 25')).toBeInTheDocument()
  })

  it('goes to the next page', () => {
    const onPageChange = vi.fn()
    render(<Pagination page={1} count={25} pageSize={10} onPageChange={onPageChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }))
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('disables Previous on the first page and Next on the last', () => {
    const { rerender } = render(<Pagination page={1} count={25} pageSize={10} onPageChange={() => {}} />)
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled()
    rerender(<Pagination page={3} count={25} pageSize={10} onPageChange={() => {}} />)
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled()
  })

  it('marks the current page', () => {
    render(<Pagination page={2} count={25} pageSize={10} onPageChange={() => {}} />)
    expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page')
  })
})
