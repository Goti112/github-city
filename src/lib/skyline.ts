import type { Repo } from './types.js'

export type SkylineBar = {
  name: string
  x: number
  width: number
  height: number
  color: string
  lit: boolean // pushed in the last 30 days
}

const millisecondsPerDay = 24 * 60 * 60 * 1000
const gapRatio = 0.22 // fraction of each slot left as a gap between buildings

// Flat front-on skyline for the 2D share image: tallest repo in the middle, decreasing outwards.
export const skylineBars = (
  repos: Repo[],
  box: { width: number; height: number },
  maxBars: number,
  now: Date = new Date(),
): SkylineBar[] => {
  const tallestFirst = [...repos].sort((left, right) => right.commits - left.commits).slice(0, maxBars)
  if (tallestFirst.length === 0) {
    return []
  }

  // Alternate right/left around the centre so the silhouette peaks in the middle.
  const ordered: Repo[] = []
  tallestFirst.forEach((repo, index) => {
    if (index % 2 === 0) {
      ordered.push(repo)
    } else {
      ordered.unshift(repo)
    }
  })

  const maxLog = Math.log2((tallestFirst[0]?.commits ?? 0) + 1) || 1
  const slot = box.width / ordered.length
  const minHeight = box.height * 0.14

  return ordered.map((repo, index): SkylineBar => ({
    name: repo.name,
    x: index * slot + (slot * gapRatio) / 2,
    width: slot * (1 - gapRatio),
    height: minHeight + (box.height - minHeight) * (Math.log2(repo.commits + 1) / maxLog),
    color: repo.languageColor ?? '#8a8f98',
    lit: (now.getTime() - Date.parse(repo.lastPush)) / millisecondsPerDay <= 30,
  }))
}
