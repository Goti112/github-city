import type { Repo } from './types'

export type CityStats = {
  title: string
  population: number // total commits
  stars: number
  districts: number
  litBuildings: number // pushed in the last 30 days
  tallest: { name: string; commits: number } | null
  topLanguage: { name: string; share: number } | null // share of all repos
}

const millisecondsPerDay = 24 * 60 * 60 * 1000

export const cityTitle = (repoCount: number): string => {
  if (repoCount === 0) {
    return 'Solar en obras'
  }
  if (repoCount < 5) {
    return 'Aldea'
  }
  if (repoCount < 15) {
    return 'Pueblo'
  }
  if (repoCount < 40) {
    return 'Ciudad'
  }
  return 'Metrópolis'
}

export const cityStats = (repos: Repo[], now: Date): CityStats => {
  const languageCounts = new Map<string, number>()
  let tallest: CityStats['tallest'] = null
  let litBuildings = 0

  for (const repo of repos) {
    if (repo.language !== null) {
      languageCounts.set(repo.language, (languageCounts.get(repo.language) ?? 0) + 1)
    }
    if (tallest === null || repo.commits > tallest.commits) {
      tallest = { name: repo.name, commits: repo.commits }
    }
    if ((now.getTime() - Date.parse(repo.lastPush)) / millisecondsPerDay <= 30) {
      litBuildings += 1
    }
  }

  const [topName, topCount] = [...languageCounts.entries()]
    .sort(([leftName, left], [rightName, right]) => right - left || leftName.localeCompare(rightName))[0] ?? []

  return {
    title: cityTitle(repos.length),
    population: repos.reduce((sum, repo) => sum + repo.commits, 0),
    stars: repos.reduce((sum, repo) => sum + repo.stars, 0),
    // Repos without a language form their own "Otros" district.
    districts: languageCounts.size + (repos.some((repo) => repo.language === null) ? 1 : 0),
    litBuildings,
    tallest,
    topLanguage: topName === undefined || topCount === undefined
      ? null
      : { name: topName, share: topCount / repos.length },
  }
}
