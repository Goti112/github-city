import { describe, expect, it } from 'vitest'
import { builtBy, timelineRange } from './timeline'

const now = new Date('2026-10-13T00:00:00.000Z')
const building = (createdYear: number): { createdYear: number } => ({ createdYear })

describe('timelineRange', () => {
  it('has no range for an empty city', () => {
    expect(timelineRange([], now)).toBeNull()
  })

  it('runs from the first repository to the current year', () => {
    expect(timelineRange([building(2019), building(2015), building(2023)], now)).toEqual({ first: 2015, last: 2026 })
  })

  it('still spans at least one year when everything is from this year', () => {
    expect(timelineRange([building(2026)], now)).toEqual({ first: 2025, last: 2026 })
  })
})

describe('builtBy', () => {
  it('counts buildings that existed by the end of a year', () => {
    const buildings = [building(2015), building(2019), building(2019), building(2023)]
    expect(builtBy(buildings, 2014)).toBe(0)
    expect(builtBy(buildings, 2019)).toBe(3)
    expect(builtBy(buildings, 2026)).toBe(4)
  })
})
