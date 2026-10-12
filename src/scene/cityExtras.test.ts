import { describe, expect, it } from 'vitest'
import { CELL, PLAZA_RADIUS } from '../lib/cityLayout'
import type { Building } from '../lib/types'
import { focusPose, introStartPosition, pickLandmark, streetLines } from './cityExtras'

const makeBuilding = (overrides: Partial<Building>): Building => ({
  repoName: 'repo',
  x: 12,
  z: 0,
  width: 1,
  depth: 1,
  height: 5,
  color: '#ffffff',
  litRatio: 1,
  district: 'TypeScript',
  stars: 0,
  createdYear: 2020,
  ...overrides,
})

describe('pickLandmark', () => {
  it('returns null for an empty city', () => {
    expect(pickLandmark([])).toBeNull()
  })

  it('picks the most starred repository', () => {
    const buildings = [
      makeBuilding({ repoName: 'tall', height: 30, stars: 2 }),
      makeBuilding({ repoName: 'famous', height: 8, stars: 120 }),
    ]
    expect(pickLandmark(buildings)).toBe(1)
  })

  it('falls back to the tallest building when nothing has stars', () => {
    const buildings = [
      makeBuilding({ repoName: 'short', height: 4 }),
      makeBuilding({ repoName: 'tall', height: 19 }),
    ]
    expect(pickLandmark(buildings)).toBe(1)
  })
})

describe('streetLines', () => {
  it('runs streets between plots, never through a building centre', () => {
    const lines = streetLines(30)
    expect(lines.length).toBeGreaterThan(0)
    for (const line of lines) {
      const cellsFromStreet = line.offset / CELL - 0.5
      expect(Math.abs(cellsFromStreet - Math.round(cellsFromStreet))).toBeCloseTo(0)
      expect(Math.abs(line.offset)).toBeLessThan(30)
      expect(line.extent).toBeGreaterThan(0)
      expect(line.offset ** 2 + line.extent ** 2).toBeCloseTo(30 ** 2)
    }
  })

  it('has streets on both axes', () => {
    const axes = new Set(streetLines(30).map((line) => line.axis))
    expect(axes).toEqual(new Set(['x', 'z']))
  })

  it('returns no streets for a city that is only the plaza', () => {
    expect(streetLines(0)).toEqual([])
  })
})

describe('introStartPosition', () => {
  it('starts higher and further away than the final framing', () => {
    const end: [number, number, number] = [30, 26, 30]
    const start = introStartPosition(end, [0, 2, 0])

    expect(start[1]).toBeGreaterThan(end[1])
    expect(Math.hypot(start[0], start[2])).toBeGreaterThan(Math.hypot(end[0], end[2]))
  })

  it('never starts inside the plaza even for tiny cities', () => {
    const start = introStartPosition([1, 1, 1], [0, 0, 0])
    expect(Math.hypot(...start)).toBeGreaterThan(PLAZA_RADIUS)
  })
})

describe('focusPose', () => {
  const building = makeBuilding({ x: 20, z: -6, height: 12 })

  it('looks at the selected building', () => {
    const pose = focusPose(building, [60, 50, 60], [0, 2, 0])
    expect(pose.target[0]).toBe(20)
    expect(pose.target[2]).toBe(-6)
    expect(pose.target[1]).toBeGreaterThan(0)
    expect(pose.target[1]).toBeLessThan(12)
  })

  it('stays a sensible distance away and above the ground', () => {
    const pose = focusPose(building, [60, 50, 60], [0, 2, 0])
    const distance = Math.hypot(
      pose.position[0] - pose.target[0],
      pose.position[1] - pose.target[1],
      pose.position[2] - pose.target[2],
    )
    expect(distance).toBeGreaterThanOrEqual(12)
    expect(distance).toBeLessThanOrEqual(45)
    expect(pose.position[1]).toBeGreaterThan(pose.target[1])
  })

  it('approaches from the side the viewer was already looking from', () => {
    const pose = focusPose(building, [60, 50, 60], [0, 2, 0])
    const dot = (pose.position[0] - pose.target[0]) * 60 + (pose.position[2] - pose.target[2]) * 60
    expect(dot).toBeGreaterThan(0)
  })

  it('copes with a camera straight above its target', () => {
    const pose = focusPose(building, [0, 80, 0], [0, 0, 0])
    expect(pose.position.every(Number.isFinite)).toBe(true)
  })
})
