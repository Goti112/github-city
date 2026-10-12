export type Lighting = {
  sky: string
  sun: number
  ambient: number
  windowGlow: number
  bloom: number
}

type KeyframeName = 'day' | 'sunset' | 'night'

export const KEYFRAMES: Record<KeyframeName, Lighting> = {
  day: {
    sky: '#87ceeb',
    sun: 2,
    ambient: 1,
    windowGlow: 0,
    bloom: 0,
  },
  sunset: {
    sky: '#ff7043',
    sun: 1.25,
    ambient: 0.65,
    windowGlow: 0.25,
    bloom: 0,
  },
  night: {
    sky: '#0a1422',
    sun: 0.35,
    ambient: 0.42,
    windowGlow: 1.5,
    bloom: 0.7,
  },
}

const interpolateNumber = (start: number, end: number, progress: number): number =>
  start + (end - start) * progress

const interpolateColor = (start: string, end: string, progress: number): string => {
  const channels = [0, 2, 4].map((offset) => {
    const startChannel = Number.parseInt(start.slice(offset + 1, offset + 3), 16)
    const endChannel = Number.parseInt(end.slice(offset + 1, offset + 3), 16)
    return Math.round(interpolateNumber(startChannel, endChannel, progress))
      .toString(16)
      .padStart(2, '0')
  })

  return `#${channels.join('')}`
}

const interpolateLighting = (start: Lighting, end: Lighting, progress: number): Lighting => ({
  sky: interpolateColor(start.sky, end.sky, progress),
  sun: interpolateNumber(start.sun, end.sun, progress),
  ambient: interpolateNumber(start.ambient, end.ambient, progress),
  windowGlow: interpolateNumber(start.windowGlow, end.windowGlow, progress),
  bloom: interpolateNumber(start.bloom, end.bloom, progress),
})

export const lightingAt = (t: number): Lighting => {
  if (!Number.isFinite(t)) {
    throw new RangeError(`El momento del día debe ser finito; recibido: ${t}`)
  }

  const clampedTime = Math.max(0, Math.min(1, t))
  if (clampedTime === 0) {
    return KEYFRAMES.day
  }
  if (clampedTime === 0.5) {
    return KEYFRAMES.sunset
  }
  if (clampedTime === 1) {
    return KEYFRAMES.night
  }
  if (clampedTime < 0.5) {
    return interpolateLighting(KEYFRAMES.day, KEYFRAMES.sunset, clampedTime * 2)
  }

  return interpolateLighting(KEYFRAMES.sunset, KEYFRAMES.night, (clampedTime - 0.5) * 2)
}
