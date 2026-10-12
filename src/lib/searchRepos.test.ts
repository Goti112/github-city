import { describe, expect, it } from 'vitest'
import { searchRepos } from './searchRepos'
import type { Repo } from './types'

const makeRepo = (name: string, commits: number, language: string | null = 'TypeScript'): Repo => ({
  name,
  description: null,
  url: `https://github.com/example/${name}`,
  stars: 0,
  language,
  languageColor: null,
  commits,
  lastPush: '2026-10-01T00:00:00.000Z',
  createdAt: '2020-01-01T00:00:00.000Z',
})

const repos = [
  makeRepo('portfolio', 69),
  makeRepo('react-hot-loader', 1890, 'JavaScript'),
  makeRepo('overreacted.io', 334),
  makeRepo('spotybits', 17, 'PHP'),
]

describe('searchRepos', () => {
  it('lists the biggest buildings first when the query is empty', () => {
    expect(searchRepos(repos, '', 3).map((repo) => repo.name)).toEqual(['react-hot-loader', 'overreacted.io', 'portfolio'])
  })

  it('matches names case-insensitively and ignores surrounding spaces', () => {
    expect(searchRepos(repos, '  SPOTY ', 10).map((repo) => repo.name)).toEqual(['spotybits'])
  })

  it('ranks prefix matches above matches in the middle of the name', () => {
    expect(searchRepos(repos, 're', 10).map((repo) => repo.name)).toEqual(['react-hot-loader', 'overreacted.io'])
  })

  it('also finds repositories by language', () => {
    expect(searchRepos(repos, 'php', 10).map((repo) => repo.name)).toEqual(['spotybits'])
  })

  it('returns nothing when nothing matches', () => {
    expect(searchRepos(repos, 'zzz', 10)).toEqual([])
  })
})
