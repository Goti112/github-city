import { describe, expect, it } from 'vitest'
import { personalizeHtml } from './shareMeta'

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
