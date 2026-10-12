import { describe, expect, it } from 'vitest'
import { PLAZA_RADIUS } from '../lib/cityLayout'
import type { Building } from '../lib/types'
import { CAMERA_FOV, cameraFraming } from './cameraFraming'

const makeBuilding = (x: number, z: number, height: number): Building => ({
  repoName: `repo-${x}-${z}`,
  x,
  z,
  width: 2,
  depth: 2,
  height,
  color: '#ffffff',
  litRatio: 1,
  district: 'TypeScript',
  stars: 0,
  createdYear: 2020,
})

const halfFov = (CAMERA_FOV / 2) * (Math.PI / 180)

describe('cameraFraming', () => {
  it('frames at least the plaza for an empty city', () => {
    const framing = cameraFraming([])
    const distance = Math.hypot(...framing.position)

    expect(distance * Math.sin(halfFov)).toBeGreaterThanOrEqual(PLAZA_RADIUS)
  })

  it('moves the camera back far enough to fit a very tall building', () => {
    const short = cameraFraming([makeBuilding(12, 0, 5)])
    const tall = cameraFraming([makeBuilding(12, 0, 32)])
    const [x, y, z] = tall.position
    const distanceToTarget = Math.hypot(x - tall.target[0], y - tall.target[1], z - tall.target[2])

    expect(Math.hypot(...tall.position)).toBeGreaterThan(Math.hypot(...short.position))
    expect(distanceToTarget * Math.sin(halfFov)).toBeGreaterThanOrEqual(32 / 2)
  })

  it('starts the fog behind the city centre, never in front of it', () => {
    for (const buildings of [[], [makeBuilding(12, 0, 30)], [makeBuilding(90, 90, 10)]]) {
      const framing = cameraFraming(buildings)
      const distanceToTarget = Math.hypot(
        framing.position[0] - framing.target[0],
        framing.position[1] - framing.target[1],
        framing.position[2] - framing.target[2],
      )

      expect(framing.fogNear).toBeGreaterThanOrEqual(distanceToTarget)
      expect(framing.fogFar).toBeGreaterThan(framing.fogNear)
      expect(framing.maxDistance).toBeGreaterThan(distanceToTarget)
    }
  })

  it('backs off on portrait screens so the city fits horizontally', () => {
    const buildings = [makeBuilding(40, 0, 5)]
    const landscape = cameraFraming(buildings, 16 / 9)
    const portrait = cameraFraming(buildings, 375 / 812)
    const halfHorizontalFov = Math.atan(Math.tan(halfFov) * (375 / 812))

    expect(Math.hypot(...portrait.position)).toBeGreaterThan(Math.hypot(...landscape.position))
    expect(Math.hypot(...portrait.position) * Math.sin(halfHorizontalFov)).toBeGreaterThanOrEqual(41)
  })

  it('grows with the size of the city', () => {
    const small = cameraFraming([makeBuilding(12, 0, 5)])
    const big = cameraFraming([makeBuilding(80, 80, 5)])

    expect(Math.hypot(...big.position)).toBeGreaterThan(Math.hypot(...small.position))
  })
})
