import { ImageResponse } from '@vercel/og'
import { createElement as h, type CSSProperties, type ReactElement, type ReactNode } from 'react'
import { cityStats } from '../../src/lib/cityStats.js'
import { skylineBars } from '../../src/lib/skyline.js'
import { loadCity } from '../_lib/loadCity.js'

// Share card shown by LinkedIn / X / WhatsApp for /ciudad/:user links.
const WIDTH = 1200
const HEIGHT = 630
const SKYLINE = { width: 560, height: 390 }
const numberFormat = new Intl.NumberFormat('es')

const div = (style: CSSProperties, ...children: ReactNode[]): ReactElement => h('div', { style }, ...children)

const stat = (label: string, value: number): ReactNode => div(
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

const card = (title: string, children: ReactNode): ImageResponse => new ImageResponse(
  div(
    {
      width: WIDTH,
      height: HEIGHT,
      display: 'flex',
      position: 'relative',
      background: 'linear-gradient(180deg, #050b14 0%, #0a1422 55%, #15263a 100%)',
      fontFamily: 'sans-serif',
      color: '#f3f7fa',
    },
    children,
  ),
  {
    width: WIDTH,
    height: HEIGHT,
    headers: {
      'Cache-Control': title === 'fallback' ? 'public, s-maxage=300' : 'public, s-maxage=86400, stale-while-revalidate=604800',
    },
  },
)

const footer = (): ReactNode => div(
  { position: 'absolute', left: 64, bottom: 44, fontSize: 24, color: '#73e0c0', display: 'flex' },
  'city.miquelmanzano.com',
)

export const GET = async (request: Request): Promise<Response> => {
  const login = new URL(request.url).pathname.split('/').pop() ?? ''
  const result = await loadCity(decodeURIComponent(login))

  if (!result.ok) {
    return card('fallback', div(
      { display: 'flex', flexDirection: 'column', padding: 64, justifyContent: 'center' },
      div({ fontSize: 26, color: '#73e0c0', letterSpacing: 4 }, 'GITHUB CITY'),
      div({ fontSize: 76, fontWeight: 700, marginTop: 12 }, 'Un perfil. Una ciudad.'),
      footer(),
    ))
  }

  const { city } = result
  const stats = cityStats(city.repos, new Date())
  const bars = skylineBars(city.repos, SKYLINE, 16)

  return card(city.user.login, [
    div(
      { display: 'flex', flexDirection: 'column', padding: '64px 0 0 64px', width: 600 },
      div({ fontSize: 24, color: '#73e0c0', letterSpacing: 4, display: 'flex' }, `GITHUB CITY · ${stats.title.toUpperCase()}`),
      div({ display: 'flex', alignItems: 'center', marginTop: 26 },
        h('img', { src: city.user.avatarUrl, width: 96, height: 96, style: { borderRadius: 48, marginRight: 24 } }),
        div({ display: 'flex', flexDirection: 'column' },
          div({ fontSize: 56, fontWeight: 700, lineHeight: 1.05 }, city.user.name ?? city.user.login),
          div({ fontSize: 28, color: '#8fa3b1', marginTop: 6 }, `@${city.user.login}`),
        ),
      ),
      div({ display: 'flex', marginTop: 48 },
        stat('Edificios', city.repos.length),
        stat('Habitantes', stats.population),
        stat('Estrellas', stats.stars),
      ),
    ),
    div(
      { position: 'absolute', right: 56, bottom: 0, width: SKYLINE.width, height: SKYLINE.height, display: 'flex' },
      ...bars.map(building),
    ),
    footer(),
  ])
}
