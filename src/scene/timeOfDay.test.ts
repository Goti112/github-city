import { describe, expect, it } from 'vitest'
import { KEYFRAMES, lightingAt } from './timeOfDay'

describe('lightingAt', () => {
  it('returns the day, sunset, and night keyframes', () => {
    expect(lightingAt(0)).toEqual(KEYFRAMES.day)
    expect(lightingAt(0.5)).toEqual(KEYFRAMES.sunset)
    expect(lightingAt(1)).toEqual(KEYFRAMES.night)
  })

  it('interpolates colors and intensities between keyframes', () => {
    const lighting = lightingAt(0.25)

    expect(lighting.sky).toBe('#c39f97')
    expect(lighting.sun).toBe((KEYFRAMES.day.sun + KEYFRAMES.sunset.sun) / 2)
    expect(lighting.ambient).toBeGreaterThan(KEYFRAMES.sunset.ambient)
    expect(lighting.ambient).toBeLessThan(KEYFRAMES.day.ambient)
    expect(lighting.windowGlow).toBeGreaterThan(KEYFRAMES.day.windowGlow)
    expect(lighting.windowGlow).toBeLessThan(KEYFRAMES.sunset.windowGlow)
  })

  it('clamps values outside the day and night range', () => {
    expect(lightingAt(-1)).toEqual(KEYFRAMES.day)
    expect(lightingAt(2)).toEqual(KEYFRAMES.night)
  })

  it('disables bloom at the day and sunset keyframes', () => {
    expect(KEYFRAMES.day.bloom).toBe(0)
    expect(KEYFRAMES.sunset.bloom).toBe(0)
  })
})
