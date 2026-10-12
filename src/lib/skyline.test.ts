import { describe, expect, it } from 'vitest'
import { skylineBars } from './skyline'
import type { Repo } from './types'

const makeRepo = (name: string, commits: number): Repo => ({
  name,
  description: null,
  url: `https://github.com/example/${name}`,
  stars: 0,
  language: 'TypeScript',
  languageColor: '#3178c6',
  commits,
  lastPush: '2026-10-01T00:00:00.000Z',
  createdAt: '2020-01-01T00:00:00.000Z',
})

const box = { width: 600, height: 400 }

describe('skylineBars', () => {
  it('draws nothing for an empty profile', () => {
    expect(skylineBars([], box, 18)).toEqual([])
  })

  it('keeps at most the requested number of buildings, the tallest ones', () => {
    const repos = Array.from({ length: 30 }, (_, index) => makeRepo(`r${index}`, index * 10))
    const bars = skylineBars(repos, box, 18)

    expect(bars).toHaveLength(18)
    expect(bars.map((bar) => bar.name)).not.toContain('r0')
  })

  it('puts the tallest building in the middle of the skyline', () => {
    const repos = [makeRepo('a', 1), makeRepo('b', 500), makeRepo('c', 20), makeRepo('d', 3), makeRepo('e', 90)]
    const bars = skylineBars(repos, box, 18)
    const tallest = bars.reduce((best, bar) => (bar.height > best.height ? bar : best))

    expect(tallest.name).toBe('b')
    expect(bars.indexOf(tallest)).toBe(Math.floor(bars.length / 2))
  })

  it('fits every bar inside the box without overlaps', () => {
    const repos = Array.from({ length: 12 }, (_, index) => makeRepo(`r${index}`, 2 ** index))
    const bars = skylineBars(repos, box, 18)

    bars.forEach((bar, index) => {
      expect(bar.x).toBeGreaterThanOrEqual(0)
      expect(bar.x + bar.width).toBeLessThanOrEqual(box.width)
      expect(bar.height).toBeGreaterThan(0)
      expect(bar.height).toBeLessThanOrEqual(box.height)
      const next = bars[index + 1]
      if (next !== undefined) {
        expect(bar.x + bar.width).toBeLessThanOrEqual(next.x)
      }
    })
  })
})
