import { CELL, PLAZA_RADIUS } from '../lib/cityLayout'
import type { Building } from '../lib/types'

type Vector3 = [number, number, number]

export type StreetLine = {
  axis: 'x' | 'z' // direction cars travel along
  offset: number // fixed coordinate on the other axis
  extent: number // half length of the street inside the city circle
}

// The city's showpiece: the most starred repo, or the tallest when nobody starred anything yet.
export const pickLandmark = (buildings: Building[]): number | null => {
  let best: number | null = null
  buildings.forEach((building, index) => {
    const current = best === null ? undefined : buildings[best]
    if (
      current === undefined
      || building.stars > current.stars
      || (building.stars === current.stars && building.height > current.height)
    ) {
      best = index
    }
  })
  return best
}

// Plots sit on multiples of CELL, so streets run halfway between them, clipped to the city circle.
export const streetLines = (radius: number): StreetLine[] => {
  const lines: StreetLine[] = []
  const maxIndex = Math.floor(radius / CELL)
  for (let index = -maxIndex - 1; index <= maxIndex; index += 1) {
    const offset = (index + 0.5) * CELL
    if (Math.abs(offset) >= radius) {
      continue
    }
    const extent = Math.sqrt(radius ** 2 - offset ** 2)
    lines.push({ axis: 'x', offset, extent }, { axis: 'z', offset, extent })
  }
  return lines
}

// Opening shot: high above and swung round by ~70°, so the fly-in sweeps across the skyline.
export const introStartPosition = (end: Vector3, target: Vector3): Vector3 => {
  const angle = (-70 * Math.PI) / 180
  const relativeX = end[0] - target[0]
  const relativeZ = end[2] - target[2]
  const horizontal = Math.max(Math.hypot(relativeX, relativeZ), PLAZA_RADIUS) * 1.8
  const heading = Math.atan2(relativeZ, relativeX) + angle
  return [
    target[0] + Math.cos(heading) * horizontal,
    Math.max(end[1], PLAZA_RADIUS) * 2.4,
    target[2] + Math.sin(heading) * horizontal,
  ]
}
