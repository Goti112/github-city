import type { TimelineRange } from './timeline.js'

export type CityParams = { repo: string | null; year: number | null }

// ?repo=…&year=… lets a shared link reopen the same building and moment in history.
export const readCityParams = (
  params: URLSearchParams,
  repos: Array<{ name: string }>,
  range: TimelineRange | null,
): CityParams => {
  const repoParam = params.get('repo')
  const repo = repoParam !== null && repos.some(({ name }) => name === repoParam) ? repoParam : null

  const yearParam = params.get('year') ?? ''
  const year = /^\d{4}$/.test(yearParam) ? Number(yearParam) : null
  // The slider runs from the empty plot (first - 1) to today, which is "no year".
  const inHistory = year !== null && range !== null && year >= range.first - 1 && year < range.last

  return { repo, year: inHistory ? year : null }
}

export const writeCityParams = ({ repo, year }: CityParams): URLSearchParams => {
  const params = new URLSearchParams()
  if (repo !== null) {
    params.set('repo', repo)
  }
  if (year !== null) {
    params.set('year', String(year))
  }
  return params
}
