import { describe, expect, it } from 'vitest'
import { badgeMarkdown, badgeSvg } from './badge'

describe('badgeSvg', () => {
  it('shows the city title and size', () => {
    const svg = badgeSvg({ title: 'Pueblo', buildings: 6, stars: 0 })

    expect(svg.startsWith('<svg')).toBe(true)
    expect(svg).toContain('GitHub City')
    expect(svg).toContain('Pueblo · 6 edificios')
    expect(svg).toContain('role="img"')
  })

  it('adds stars only when there are some, with thousands separators', () => {
    expect(badgeSvg({ title: 'Metrópolis', buildings: 61, stars: 45493 })).toContain('Metrópolis · 61 edificios · ★ 45.493')
    expect(badgeSvg({ title: 'Pueblo', buildings: 6, stars: 0 })).not.toContain('★')
  })

  it('uses the singular for a single building', () => {
    expect(badgeSvg({ title: 'Aldea', buildings: 1, stars: 0 })).toContain('Aldea · 1 edificio<')
  })

  it('escapes XML special characters', () => {
    expect(badgeSvg({ title: '<b>&"', buildings: 2, stars: 0 })).toContain('&lt;b&gt;&amp;&quot;')
  })

  it('can show a plain message instead of city data', () => {
    const svg = badgeSvg({ message: 'perfil no disponible' })
    expect(svg).toContain('>perfil no disponible<')
    expect(svg).not.toContain('edificio')
  })

  it('grows wider for longer labels', () => {
    const short = badgeSvg({ title: 'Aldea', buildings: 1, stars: 0 })
    const long = badgeSvg({ title: 'Metrópolis', buildings: 100, stars: 123456 })
    const width = (svg: string): number => Number(/width="(\d+)"/.exec(svg)?.[1])
    expect(width(long)).toBeGreaterThan(width(short))
  })
})

describe('badgeSvg in English', () => {
  it('translates the title and uses English number formatting', () => {
    expect(badgeSvg({ title: 'Metrópolis', buildings: 61, stars: 45493 }, 'en')).toContain('Metropolis · 61 buildings · ★ 45,493')
    expect(badgeSvg({ title: 'Aldea', buildings: 1, stars: 0 }, 'en')).toContain('Hamlet · 1 building<')
  })
})

describe('badgeMarkdown', () => {
  it('links the badge to the city page', () => {
    expect(badgeMarkdown('Goti112', 'https://city.miquelmanzano.com')).toBe(
      '[![Mi GitHub City](https://city.miquelmanzano.com/api/badge/Goti112)](https://city.miquelmanzano.com/ciudad/Goti112)',
    )
  })

  it('points to the English badge and city when asked', () => {
    expect(badgeMarkdown('Goti112', 'https://city.miquelmanzano.com', 'en')).toBe(
      '[![My GitHub City](https://city.miquelmanzano.com/api/badge/Goti112?lang=en)](https://city.miquelmanzano.com/ciudad/Goti112?lang=en)',
    )
  })
})
