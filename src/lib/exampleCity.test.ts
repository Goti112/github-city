import { describe, expect, it, vi } from 'vitest'
import { EXAMPLE_CITY } from './exampleCity'

describe('EXAMPLE_CITY', () => {
  it('is a busy demo city with several districts', () => {
    const languages = new Set(EXAMPLE_CITY.repos.map((repo) => repo.language))

    expect(EXAMPLE_CITY.repos.length).toBeGreaterThanOrEqual(40)
    expect(languages.size).toBeGreaterThanOrEqual(6)
  })

  it('is not attributed to a real GitHub profile', () => {
    expect(EXAMPLE_CITY.repos.every((repo) => !repo.url.includes('miquel-manzano'))).toBe(true)
    expect(EXAMPLE_CITY.user.login).not.toBe('miquel-manzano')
  })

  it('is deterministic between builds', async () => {
    vi.resetModules()
    const { EXAMPLE_CITY: again } = await import('./exampleCity')
    expect(again.repos.map((repo) => [repo.name, repo.commits, repo.stars]))
      .toEqual(EXAMPLE_CITY.repos.map((repo) => [repo.name, repo.commits, repo.stars]))
  })
})
