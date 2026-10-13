export type BadgeData = { title: string; buildings: number; stars: number } | { message: string }

const numberFormat = new Intl.NumberFormat('es')

const escapeXml = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// Rough width of a string in 11px Verdana-ish text, like shields.io badges estimate it.
const textWidth = (text: string): number => Math.ceil(text.length * 6.6) + 20

// Shields-style badge for profile READMEs: "GitHub City | Pueblo · 6 edificios · ★ 12".
const valueParts = (data: BadgeData): string[] => {
  if ('message' in data) {
    return [data.message]
  }
  const parts = [data.title, `${numberFormat.format(data.buildings)} ${data.buildings === 1 ? 'edificio' : 'edificios'}`]
  if (data.stars > 0) {
    parts.push(`★ ${numberFormat.format(data.stars)}`)
  }
  return parts
}

export const badgeSvg = (data: BadgeData): string => {
  const label = 'GitHub City'
  const parts = valueParts(data)
  const value = escapeXml(parts.join(' · '))
  const labelWidth = textWidth(label) + 14 // room for the little skyline icon
  const valueWidth = textWidth(parts.join(' · '))
  const width = labelWidth + valueWidth

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="20" role="img" aria-label="${label}: ${value}">`,
    `<title>${label}: ${value}</title>`,
    '<linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#fff" stop-opacity=".12"/><stop offset="1" stop-opacity=".12"/></linearGradient>',
    `<clipPath id="r"><rect width="${width}" height="20" rx="4"/></clipPath>`,
    '<g clip-path="url(#r)">',
    `<rect width="${labelWidth}" height="20" fill="#0a1422"/>`,
    `<rect x="${labelWidth}" width="${valueWidth}" height="20" fill="#1d6f5c"/>`,
    `<rect width="${width}" height="20" fill="url(#s)"/>`,
    '</g>',
    // Tiny three-tower skyline with lit windows.
    '<g fill="#73e0c0"><rect x="6" y="9" width="3" height="7"/><rect x="10" y="5" width="3" height="11"/><rect x="14" y="7" width="3" height="9"/></g>',
    '<g fill="#ffd166"><rect x="11" y="7" width="1" height="1"/><rect x="11" y="10" width="1" height="1"/><rect x="15" y="9" width="1" height="1"/></g>',
    '<g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">',
    `<text x="${(labelWidth + 14) / 2}" y="14">${label}</text>`,
    `<text x="${labelWidth + valueWidth / 2}" y="14">${value}</text>`,
    '</g>',
    '</svg>',
  ].join('')
}

export const badgeMarkdown = (login: string, origin: string): string =>
  `[![Mi GitHub City](${origin}/api/badge/${login})](${origin}/ciudad/${login})`
