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

// Margin so the city does not touch the screen edges (and survives portrait aspect ratios).
const framingMargin = 1.05

export const cameraFraming = (buildings: Building[], aspect = 1): CameraFraming => {
  const groundRadius = buildings.reduce(
    (radius, building) =>
      Math.max(radius, Math.hypot(building.x, building.z) + Math.max(building.width, building.depth) / 2),
    PLAZA_RADIUS,
  )
  const tallest = buildings.reduce((height, building) => Math.max(height, building.height), 5)

  const targetY = tallest / 4
  // Bounding sphere around the target that contains the ground footprint and the tallest roof.
  const sphereRadius = Math.hypot(groundRadius, tallest - targetY)
  // The fov is vertical; on portrait screens the horizontal half-angle is the narrower one.
  const halfVerticalFov = (CAMERA_FOV / 2) * (Math.PI / 180)
  const halfFov = Math.min(halfVerticalFov, Math.atan(Math.tan(halfVerticalFov) * aspect))
  const distance = (sphereRadius / Math.sin(halfFov)) * framingMargin

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
