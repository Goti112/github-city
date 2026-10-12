import { describe, expect, it } from 'vitest'
import { cityStats, cityTitle } from './cityStats'
import type { Repo } from './types'

const now = new Date('2026-10-13T00:00:00.000Z')

const makeRepo = (overrides: Partial<Repo>): Repo => ({
  name: 'repo',
  description: null,
  url: 'https://github.com/example/repo',
  stars: 0,
  language: 'TypeScript',
  languageColor: '#3178c6',
  commits: 10,
  lastPush: '2026-10-01T00:00:00.000Z',
  createdAt: '2020-01-01T00:00:00.000Z',
  ...overrides,
})

describe('cityTitle', () => {
  it('grows from a village to a metropolis with the number of repositories', () => {
    expect(cityTitle(0)).toBe('Solar en obras')
    expect(cityTitle(3)).toBe('Aldea')
    expect(cityTitle(8)).toBe('Pueblo')
    expect(cityTitle(20)).toBe('Ciudad')
    expect(cityTitle(60)).toBe('Metrópolis')
  })
})

describe('cityStats', () => {
  it('summarises an empty profile without crashing', () => {
    const stats = cityStats([], now)

    expect(stats.population).toBe(0)
    expect(stats.topLanguage).toBeNull()
    expect(stats.tallest).toBeNull()
    expect(stats.title).toBe('Solar en obras')
  })

  it('counts commits as population and stars as tourists', () => {
    const stats = cityStats([
      makeRepo({ name: 'a', commits: 100, stars: 3 }),
      makeRepo({ name: 'b', commits: 50, stars: 7 }),
    ], now)

    expect(stats.population).toBe(150)
    expect(stats.stars).toBe(10)
  })

  it('finds the tallest building and the dominant language', () => {
    const stats = cityStats([
      makeRepo({ name: 'small', commits: 5, language: 'Java' }),
      makeRepo({ name: 'giant', commits: 900, language: 'TypeScript' }),
      makeRepo({ name: 'mid', commits: 40, language: 'TypeScript' }),
      makeRepo({ name: 'docs', commits: 2, language: null }),
    ], now)

    expect(stats.tallest).toEqual({ name: 'giant', commits: 900 })
    expect(stats.topLanguage).toEqual({ name: 'TypeScript', share: 0.5 })
    expect(stats.districts).toBe(3)
  })

  it('counts buildings with recent activity as lit', () => {
    const stats = cityStats([
      makeRepo({ lastPush: '2026-10-10T00:00:00.000Z' }),
      makeRepo({ lastPush: '2025-01-01T00:00:00.000Z' }),
    ], now)

    expect(stats.litBuildings).toBe(1)
  })
})
