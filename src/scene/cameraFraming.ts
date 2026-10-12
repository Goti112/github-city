import { PLAZA_RADIUS } from '../lib/cityLayout'
import type { Building } from '../lib/types'

export const CAMERA_FOV = 45

export type CameraFraming = {
  position: [number, number, number]
  target: [number, number, number]
  maxDistance: number
  fogNear: number
  fogFar: number
}

// Diagonal three-quarter view, slightly above the horizon.
const viewDirection = (() => {
  const length = Math.hypot(1, 0.85, 1)
  return [1 / length, 0.85 / length, 1 / length] as const
})()

// The bounding sphere overestimates the city's silhouette, so wide screens (with spare horizontal
// room) can sit closer than a perfect fit; square and portrait keep a margin so nothing is clipped.
const framingMargin = (aspect: number): number => (aspect >= 1.3 ? 0.86 : 1.05)

// Radius of the circle on the ground that contains every plot (and at least the plaza).
export const cityRadius = (buildings: Building[]): number => buildings.reduce(
  (radius, building) =>
    Math.max(radius, Math.hypot(building.x, building.z) + Math.max(building.width, building.depth) / 2),
  PLAZA_RADIUS,
)

export const cameraFraming = (buildings: Building[], aspect = 1): CameraFraming => {
  const groundRadius = cityRadius(buildings)
  const tallest = buildings.reduce((height, building) => Math.max(height, building.height), 5)

  const targetY = tallest / 4
  // Bounding sphere around the target that contains the ground footprint and the tallest roof.
  const sphereRadius = Math.hypot(groundRadius, tallest - targetY)
  // The fov is vertical; on portrait screens the horizontal half-angle is the narrower one.
  const halfVerticalFov = (CAMERA_FOV / 2) * (Math.PI / 180)
  const halfFov = Math.min(halfVerticalFov, Math.atan(Math.tan(halfVerticalFov) * aspect))
  const distance = (sphereRadius / Math.sin(halfFov)) * framingMargin(aspect)

  return {
    position: [
      viewDirection[0] * distance,
      targetY + viewDirection[1] * distance,
      viewDirection[2] * distance,
    ],
    target: [0, targetY, 0],
    maxDistance: distance * 2.5,
    // Clear up to the centre of the city, fading out well past its far edge.
    fogNear: distance,
    fogFar: distance + sphereRadius * 4,
  }
}
