import { describe, expect, it } from 'vitest'
import type { Repo } from './types'
import {
  NEUTRAL_COLOR,
  OTHER_DISTRICT,
  PLAZA_RADIUS,
  buildingHeight,
  cityLayout,
  desaturate,
  litRatio,
  plotSize,
  spiral,
} from './cityLayout'

const now = new Date('2026-10-09T00:00:00.000Z')
const millisecondsPerDay = 24 * 60 * 60 * 1000

const makeRepo = (index: number, overrides: Partial<Repo>): Repo => ({
  name: `repo-${index}`,
  description: null,
  url: `https://github.com/example/repo-${index}`,
  stars: 0,
  language: 'TypeScript',
  languageColor: '#3178c6',
  commits: index,
  lastPush: '2026-10-01T00:00:00.000Z',
  ...overrides,
})

const daysAgo = (days: number): string =>
  new Date(now.getTime() - days * millisecondsPerDay).toISOString()

describe('buildingHeight', () => {
  it('uses a logarithmic height scale', () => {
    expect(buildingHeight(0)).toBe(1)
    expect(buildingHeight(1)).toBe(2.5)
    expect(buildingHeight(2000)).toBeLessThan(18)
  })
})

describe('plotSize', () => {
  it.each([
    { stars: 0, expected: 1 },
    { stars: 1, expected: 1.5 },
    { stars: 9, expected: 1.5 },
    { stars: 10, expected: 2 },
  ])('maps $stars stars to a $expected unit plot', ({ stars, expected }) => {
    expect(plotSize(stars)).toBe(expected)
  })
})

describe('litRatio', () => {
  it('keeps recent and future repositories fully lit', () => {
    expect(litRatio(daysAgo(10), now)).toBe(1)
    expect(litRatio(daysAgo(30), now)).toBe(1)
    expect(litRatio(daysAgo(-2), now)).toBe(1)
  })

  it('dims inactive repositories linearly to the minimum', () => {
    expect(litRatio(daysAgo(197), now)).toBeCloseTo(0.525, 2)
    expect(litRatio(daysAgo(365), now)).toBe(0.05)
    expect(litRatio(daysAgo(800), now)).toBe(0.05)
  })
})

describe('desaturate', () => {
  it('reduces saturation and returns a lowercase six-digit hex color', () => {
    const color = desaturate('#3178c6')

    expect(color).not.toBe('#3178c6')
    expect(color).toMatch(/^#[0-9a-f]{6}$/)
  })
})

describe('spiral', () => {
  it('starts at the origin and returns the nine cells of the surrounding square', () => {
    const coordinates = spiral(9)
    const coordinateKeys = new Set(coordinates.map(([x, z]) => `${x},${z}`))
    const expectedKeys = new Set(
      Array.from({ length: 9 }, (_, index) => {
        const x = (index % 3) - 1
        const z = Math.floor(index / 3) - 1
        return `${x},${z}`
      }),
    )

    expect(spiral(1)).toEqual([[0, 0]])
    expect(coordinates).toHaveLength(9)
    expect(coordinateKeys.size).toBe(9)
    expect(coordinateKeys).toEqual(expectedKeys)
  })
})

describe('cityLayout', () => {
  it('returns no buildings for an empty city', () => {
    expect(cityLayout([], now)).toEqual([])
  })

  it('places a single building outside the empty plaza', () => {
    const buildings = cityLayout([makeRepo(0, {})], now)

    expect(buildings).toHaveLength(1)
    expect([buildings[0]?.x, buildings[0]?.z]).not.toEqual([0, 0])
  })

  it('centers the tallest building in its district', () => {
    const repos = Array.from({ length: 9 }, (_, index) => makeRepo(index, {
      commits: index === 0 ? 2000 : index,
    }))
    const buildings = cityLayout(repos, now)
    const tallest = buildings.find((building) => building.repoName === 'repo-0')
    if (tallest === undefined) {
      throw new Error('Expected the tallest building to exist')
    }

    const centroidX = buildings.reduce((sum, building) => sum + building.x, 0) / buildings.length
    const centroidZ = buildings.reduce((sum, building) => sum + building.z, 0) / buildings.length
    expect(tallest.x).toBeCloseTo(centroidX)
    expect(tallest.z).toBeCloseTo(centroidZ)
  })

  it('keeps every plot outside the central plaza', () => {
    const languages = ['TypeScript', 'Java', 'Rust', 'Go']
    const repos = Array.from({ length: 40 }, (_, index) => makeRepo(index, {
      language: languages[index % languages.length] ?? null,
      stars: 20,
    }))

    for (const building of cityLayout(repos, now)) {
      const nearestX = Math.max(Math.abs(building.x) - building.width / 2, 0)
      const nearestZ = Math.max(Math.abs(building.z) - building.depth / 2, 0)
      expect(Math.hypot(nearestX, nearestZ)).toBeGreaterThanOrEqual(PLAZA_RADIUS)
    }
  })

  it('packs small districts close to the plaza next to a large one', () => {
    const big = Array.from({ length: 36 }, (_, index) => makeRepo(index, { language: 'JavaScript' }))
    const small = ['Rust', 'Go', 'Lean', 'Python', 'Ruby', 'C'].map((language, index) =>
      makeRepo(100 + index, { language }))
    const buildings = cityLayout([...big, ...small], now)
    const bigRadius = Math.max(...buildings
      .filter((building) => building.district === 'JavaScript')
      .map((building) => Math.hypot(building.x, building.z)))

    for (const building of buildings.filter((candidate) => candidate.district !== 'JavaScript')) {
      expect(Math.hypot(building.x, building.z)).toBeLessThanOrEqual(bigRadius)
    }
  })

  it('keeps 100 repositories in language districts without overlapping plots', () => {
    const languages: Array<string | null> = ['TypeScript', 'Java', 'Rust', 'Python', 'Go', null]
    const repos = Array.from({ length: 100 }, (_, index) => {
      const language = languages[index % languages.length]
      if (language === undefined) {
        throw new Error('Expected a language entry')
      }

      return makeRepo(index, {
        language,
        languageColor: language === null ? null : '#3178c6',
        stars: index % 11,
      })
    })
    const originalRepos = structuredClone(repos)
    const buildings = cityLayout(repos, now)
    const reposByName = new Map(repos.map((repo) => [repo.name, repo]))

    expect(buildings).toHaveLength(100)
    expect(repos).toEqual(originalRepos)

    for (const building of buildings) {
      const repo = reposByName.get(building.repoName)
      if (repo === undefined) {
        throw new Error(`Unexpected building for repository ${building.repoName}`)
      }
      expect(building.district).toBe(repo.language ?? OTHER_DISTRICT)
    }

    for (let leftIndex = 0; leftIndex < buildings.length; leftIndex += 1) {
      const left = buildings[leftIndex]
      if (left === undefined) {
        throw new Error(`Expected building at index ${leftIndex}`)
      }

      for (let rightIndex = leftIndex + 1; rightIndex < buildings.length; rightIndex += 1) {
        const right = buildings[rightIndex]
        if (right === undefined) {
          throw new Error(`Expected building at index ${rightIndex}`)
        }

        const overlapsX = Math.abs(left.x - right.x) < (left.width + right.width) / 2
        const overlapsZ = Math.abs(left.z - right.z) < (left.depth + right.depth) / 2
        expect(overlapsX && overlapsZ).toBe(false)
      }
    }
  })

  it('puts repositories without languages into one neutral district', () => {
    const buildings = cityLayout([
      makeRepo(0, { language: null, languageColor: null }),
      makeRepo(1, { language: null, languageColor: null }),
    ], now)

    expect(buildings.every((building) => building.district === OTHER_DISTRICT)).toBe(true)
    expect(buildings.every((building) => building.color === NEUTRAL_COLOR)).toBe(true)
  })

  it('keeps the language district but uses the neutral color when GitHub has no color for it', () => {
    const [building] = cityLayout([makeRepo(0, { language: 'Lean', languageColor: null })], now)

    expect(building?.district).toBe('Lean')
    expect(building?.color).toBe(NEUTRAL_COLOR)
  })
})
