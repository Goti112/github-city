type Dated = { createdYear: number }

export type TimelineRange = { first: number; last: number }

// Years the history slider covers: from the first repository to today (at least two stops).
export const timelineRange = (buildings: Dated[], now: Date): TimelineRange | null => {
  if (buildings.length === 0) {
    return null
  }
  const last = now.getUTCFullYear()
  const first = Math.min(...buildings.map((building) => building.createdYear), last - 1)
  return { first, last }
}

export const builtBy = (buildings: Dated[], year: number): number =>
  buildings.filter((building) => building.createdYear <= year).length
