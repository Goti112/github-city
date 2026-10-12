import type { Repo } from './types.js'

// Rank: name starts with the query, then name contains it, then language matches; ties by size.
export const searchRepos = (repos: Repo[], rawQuery: string, limit: number): Repo[] => {
  const query = rawQuery.trim().toLowerCase()
  const rank = (repo: Repo): number => {
    if (query === '') {
      return 0
    }
    const name = repo.name.toLowerCase()
    if (name.startsWith(query)) {
      return 0
    }
    if (name.includes(query)) {
      return 1
    }
    if (repo.language?.toLowerCase().includes(query)) {
      return 2
    }
    return -1
  }

  return repos
    .map((repo) => ({ repo, score: rank(repo) }))
    .filter(({ score }) => score >= 0)
    .sort((left, right) => left.score - right.score || right.repo.commits - left.repo.commits)
    .slice(0, limit)
    .map(({ repo }) => repo)
}
