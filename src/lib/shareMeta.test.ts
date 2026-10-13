import { describe, expect, it } from 'vitest'
import { personalizeDuelHtml, personalizeHtml } from './shareMeta'

const html = `<head>
<meta property="og:title" content="GitHub City" />
<meta property="og:description" content="Convierte cualquier perfil de GitHub en una ciudad 3D" />
<meta property="og:url" content="https://city.miquelmanzano.com" />
<meta property="og:image" content="https://city.miquelmanzano.com/og.png" />
<title>GitHub City</title>
</head>`

const origin = 'https://city.miquelmanzano.com'

describe('personalizeHtml', () => {
  it('points the share card at the user city image and page', () => {
    const result = personalizeHtml(html, 'Goti112', origin)

    expect(result).toContain('<title>La ciudad de @Goti112 · GitHub City</title>')
    expect(result).toContain('content="La ciudad de @Goti112 · GitHub City"')
    expect(result).toContain('content="https://city.miquelmanzano.com/api/og/Goti112"')
    expect(result).toContain('content="https://city.miquelmanzano.com/ciudad/Goti112"')
    expect(result).toContain('twitter:image')
    expect(result).not.toContain('/og.png')
  })

  it('leaves the page untouched for an invalid username', () => {
    expect(personalizeHtml(html, '"><script>alert(1)</script>', origin)).toBe(html)
  })
})

describe('personalizeDuelHtml', () => {
  it('points the share card at the duel image and page', () => {
    const result = personalizeDuelHtml(html, 'gaearon', 'Goti112', origin)

    expect(result).toContain('<title>@gaearon vs @Goti112 · Duelo de ciudades · GitHub City</title>')
    expect(result).toContain('content="https://city.miquelmanzano.com/api/og-duel?a=gaearon&amp;b=Goti112"')
    expect(result).toContain('content="https://city.miquelmanzano.com/vs/gaearon/Goti112"')
  })

  it('leaves the page untouched if either username is invalid', () => {
    expect(personalizeDuelHtml(html, 'gaearon', '<x>', origin)).toBe(html)
  })
})

describe('English share cards', () => {
  it('translates the city card and keeps the language in its links', () => {
    const result = personalizeHtml(html, 'Goti112', origin, 'en')
    expect(result).toContain("<title>@Goti112's city · GitHub City</title>")
    expect(result).toContain('content="https://city.miquelmanzano.com/api/og/Goti112?lang=en"')
    expect(result).toContain('content="https://city.miquelmanzano.com/ciudad/Goti112?lang=en"')
  })

  it('translates the duel card', () => {
    const result = personalizeDuelHtml(html, 'gaearon', 'Goti112', origin, 'en')
    expect(result).toContain('City duel')
    expect(result).toContain('a=gaearon&amp;b=Goti112&amp;lang=en')
  })
})
