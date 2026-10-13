import type { ReactNode } from 'react'
import { cityStats } from '../src/lib/cityStats.js'
import { compareCities, type ComparableCity } from '../src/lib/compare.js'
import type { CityResponse } from '../src/lib/types.js'
import { cityTitles, strings } from '../src/i18n/strings.js'
import { loadCity } from './_lib/loadCity.js'
import { avatar, card, div, fallbackCard, footer, numberFormat } from './_lib/ogParts.js'

// Share card for /vs/:left/:right duels: both players, the score and the verdict.
const comparable = (city: CityResponse, now: Date): ComparableCity => {
  const stats = cityStats(city.repos, now)
  return {
    buildings: city.repos.length,
    population: stats.population,
    stars: stats.stars,
    districts: stats.districts,
    litBuildings: stats.litBuildings,
    contributions: city.activity.totalContributions,
  }
}

const player = (city: CityResponse, title: string, buildings: string, winner: boolean): ReactNode => div(
  { display: 'flex', flexDirection: 'column', alignItems: 'center', width: 360 },
  div({ display: 'flex', fontSize: 44, height: 56 }, winner ? '👑' : ''),
  div(
    { display: 'flex', borderRadius: 70, border: `4px solid ${winner ? '#ffd166' : 'rgba(191,221,225,0.25)'}` },
    avatar(city.user.avatarUrl, 132),
  ),
  div({ display: 'flex', fontSize: 40, fontWeight: 700, marginTop: 18 }, city.user.name ?? city.user.login),
  div({ display: 'flex', fontSize: 24, color: '#8fa3b1', marginTop: 4 }, `@${city.user.login} · ${title}`),
  div({ display: 'flex', fontSize: 24, color: '#a9bac5', marginTop: 10 }, buildings),
)

export const GET = async (request: Request): Promise<Response> => {
  const params = new URL(request.url).searchParams
  const en = params.get('lang') === 'en'
  const t = strings[en ? 'en' : 'es']
  const titleOf = (city: CityResponse): string => {
    const title = cityStats(city.repos, now).title
    return en ? cityTitles[title] ?? title : title
  }
  const size = (city: CityResponse): string => `${numberFormat.format(city.repos.length)} ${t.buildings.toLowerCase()}`
  const [left, right] = await Promise.all([loadCity(params.get('a') ?? ''), loadCity(params.get('b') ?? '')])
  if (!left.ok || !right.ok) {
    return fallbackCard()
  }

  const now = new Date()
  const result = compareCities(comparable(left.city, now), comparable(right.city, now))
  const verdict = result.overall === 'tie'
    ? t.tie
    : t.wins(result.overall === 'left' ? left.city.user.login : right.city.user.login)

  return card(true, [
    div(
      { display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', paddingTop: 44 },
      div({ display: 'flex', fontSize: 24, color: '#73e0c0', letterSpacing: 6 }, `GITHUB CITY · ${t.duelHeading.toUpperCase()}`),
      div(
        { display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
        player(left.city, titleOf(left.city), size(left.city), result.overall === 'left'),
        div(
          { display: 'flex', flexDirection: 'column', alignItems: 'center', width: 260 },
          div({ display: 'flex', fontSize: 96, fontWeight: 800 }, `${result.score.left} – ${result.score.right}`),
          div({ display: 'flex', fontSize: 30, color: '#ffd166', marginTop: 4 }, verdict),
        ),
        player(right.city, titleOf(right.city), size(right.city), result.overall === 'right'),
      ),
    ),
    footer(),
  ])
}
