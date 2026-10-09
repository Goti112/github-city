import { describe, expect, it } from 'vitest'
import { isClickGesture } from './isClickGesture'

describe('isClickGesture', () => {
  it('accepts movement within Fiber click tolerance', () => {
    expect(isClickGesture(0)).toBe(true)
    expect(isClickGesture(2)).toBe(true)
  })

  it('rejects movement beyond Fiber click tolerance', () => {
    expect(isClickGesture(3)).toBe(false)
  })
})
