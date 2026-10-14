import { ImageResponse } from '@vercel/og'
import { createElement as h, type CSSProperties, type ReactElement, type ReactNode } from 'react'

// Shared building blocks for the 1200x630 share cards (@vercel/og renders a flexbox subset).
export const WIDTH = 1200
export const HEIGHT = 630
export const numberFormats = { es: new Intl.NumberFormat('es', { useGrouping: 'always' }), en: new Intl.NumberFormat('en', { useGrouping: 'always' }) }

export const div = (style: CSSProperties, ...children: ReactNode[]): ReactElement => h('div', { style }, ...children)

export const avatar = (src: string, size: number): ReactElement =>
  h('img', { src, width: size, height: size, style: { borderRadius: size / 2 } })

export const footer = (): ReactNode => div(
  { position: 'absolute', left: 64, bottom: 44, fontSize: 24, color: '#73e0c0', display: 'flex' },
  'city.miquelmanzano.com',
)

export const fallbackCard = (): ImageResponse => card(false, div(
  { display: 'flex', flexDirection: 'column', padding: 64, justifyContent: 'center' },
  div({ fontSize: 26, color: '#73e0c0', letterSpacing: 4 }, 'GITHUB CITY'),
  div({ fontSize: 76, fontWeight: 700, marginTop: 12 }, 'Un perfil. Una ciudad.'),
  footer(),
))

// Real cards are cached for a day at the edge; the fallback only briefly, so a fixed profile recovers soon.
export const card = (cacheable: boolean, children: ReactNode): ImageResponse => new ImageResponse(
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
      'Cache-Control': cacheable ? 'public, s-maxage=86400, stale-while-revalidate=604800' : 'public, s-maxage=300',
    },
  },
)
