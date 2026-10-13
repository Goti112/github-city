import type { ReactNode } from 'react'
import { cityStats } from '../../src/lib/cityStats.js'
import { skylineBars } from '../../src/lib/skyline.js'
import { cityTitles, strings } from '../../src/i18n/strings.js'
import { loadCity } from '../_lib/loadCity.js'
import { avatar, card, div, fallbackCard, footer, numberFormats } from '../_lib/ogParts.js'

// Share card shown by LinkedIn / X / WhatsApp for /ciudad/:user links.
const SKYLINE = { width: 560, height: 390 }

const stat = (label: string, value: number, numberFormat: Intl.NumberFormat): ReactNode => div(
  { display: 'flex', flexDirection: 'column', marginRight: 44 },
  div({ fontSize: 22, color: '#8fa3b1' }, label),
  div({ fontSize: 44, fontWeight: 700, color: '#f3f7fa' }, numberFormat.format(value)),
)

const building = (bar: ReturnType<typeof skylineBars>[number]): ReactNode => {
  const columns = Math.max(1, Math.floor(bar.width / 11))
  const rows = Math.max(1, Math.floor((bar.height - 14) / 15))
  const windows: ReactNode[] = []
  for (let index = 0; index < columns * rows && index < 160; index += 1) {
    // Deterministic pattern; recently active repos are mostly lit.
    const lit = ((index * 7 + bar.name.length * 13) % 10) < (bar.lit ? 8 : 2)
    windows.push(div({ width: 5, height: 7, margin: '4px 3px', background: lit ? '#ffd27a' : 'rgba(255,255,255,0.07)' }))
  }
  return div(
    {
      position: 'absolute',
      left: bar.x,
      bottom: 0,
      width: bar.width,
      height: bar.height,
      display: 'flex',
      flexWrap: 'wrap',
      alignContent: 'flex-start',
      justifyContent: 'center',
      paddingTop: 8,
      background: `linear-gradient(180deg, ${bar.color}66 0%, #0d1824 100%)`,
      borderTop: `3px solid ${bar.color}`,
    },
    ...windows,
  )
}

export const GET = async (request: Request): Promise<Response> => {
  const t = strings[new URL(request.url).searchParams.get('lang') === 'en' ? 'en' : 'es']
  const en = t === strings.en
  const numberFormat = numberFormats[en ? 'en' : 'es']
  const login = new URL(request.url).pathname.split('/').pop() ?? ''
  const result = await loadCity(decodeURIComponent(login))

  if (!result.ok) {
    return fallbackCard()
  }

  const { city } = result
  const stats = cityStats(city.repos, new Date())
  const bars = skylineBars(city.repos, SKYLINE, 16)

  return card(true, [
    div(
      { display: 'flex', flexDirection: 'column', padding: '64px 0 0 64px', width: 600 },
      div({ fontSize: 24, color: '#73e0c0', letterSpacing: 4, display: 'flex' }, `GITHUB CITY · ${(en ? cityTitles[stats.title] ?? stats.title : stats.title).toUpperCase()}`),
      div({ display: 'flex', alignItems: 'center', marginTop: 26 },
        div({ display: 'flex', marginRight: 24 }, avatar(city.user.avatarUrl, 96)),
        div({ display: 'flex', flexDirection: 'column' },
          div({ fontSize: 56, fontWeight: 700, lineHeight: 1.05 }, city.user.name ?? city.user.login),
          div({ fontSize: 28, color: '#8fa3b1', marginTop: 6 }, `@${city.user.login}`),
        ),
      ),
      div({ display: 'flex', marginTop: 48 },
        stat(t.buildings, city.repos.length, numberFormat),
        stat(t.population, stats.population, numberFormat),
        stat(t.stars, stats.stars, numberFormat),
      ),
    ),
    div(
      { position: 'absolute', right: 56, bottom: 0, width: SKYLINE.width, height: SKYLINE.height, display: 'flex' },
      ...bars.map(building),
    ),
    footer(),
  ])
}
