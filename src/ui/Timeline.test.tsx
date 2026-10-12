// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Timeline from './Timeline'

const range = { first: 2018, last: 2026 }

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('Timeline', () => {
  it('shows today and the full city by default', () => {
    render(<Timeline range={range} year={null} builtCount={6} total={6} onChange={vi.fn()} />)
    expect(screen.getByText('2026')).toBeTruthy()
    expect(screen.getByRole('slider').getAttribute('aria-valuetext')).toBe('2026: 6 de 6 edificios')
  })

  it('reports the chosen year, and null when dragged back to today', () => {
    const onChange = vi.fn()
    const { rerender } = render(<Timeline range={range} year={null} builtCount={6} total={6} onChange={onChange} />)

    fireEvent.change(screen.getByRole('slider'), { target: { value: '2020' } })
    expect(onChange).toHaveBeenLastCalledWith(2020)

    // The parent stores the year, as CityPage does.
    rerender(<Timeline range={range} year={2020} builtCount={3} total={6} onChange={onChange} />)
    fireEvent.change(screen.getByRole('slider'), { target: { value: '2026' } })
    expect(onChange).toHaveBeenLastCalledWith(null)
  })

  it('replays history from an empty plot, one year per tick', () => {
    vi.useFakeTimers()
    const onChange = vi.fn()
    const { rerender } = render(<Timeline range={range} year={null} builtCount={6} total={6} onChange={onChange} />)

    fireEvent.click(screen.getByRole('button', { name: 'Ver cómo se construyó la ciudad' }))
    expect(onChange).toHaveBeenLastCalledWith(2017)

    rerender(<Timeline range={range} year={2017} builtCount={0} total={6} onChange={onChange} />)
    act(() => {
      vi.advanceTimersByTime(900)
    })
    expect(onChange).toHaveBeenLastCalledWith(2018)
  })
})
