import { describe, expect, it } from 'vitest'
import { tooltipTransform } from './tooltipTransform'

const viewport = { width: 1024, height: 768 }

describe('tooltipTransform', () => {
  it('sits below-right of the pointer when there is room', () => {
    expect(tooltipTransform({ x: 100, y: 100 }, viewport)).toBe('translate(14px, 14px)')
  })

  it('flips to the left near the right edge', () => {
    expect(tooltipTransform({ x: 1000, y: 100 }, viewport)).toBe('translate(calc(-100% - 14px), 14px)')
  })

  it('flips above near the bottom edge', () => {
    expect(tooltipTransform({ x: 100, y: 750 }, viewport)).toBe('translate(14px, calc(-100% - 14px))')
  })
})
