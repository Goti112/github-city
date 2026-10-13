import { isValidUsername } from './github.js'

type Share = { title: string; description: string; url: string; image: string }
export type ShareLang = 'es' | 'en'

const setMeta = (html: string, property: string, content: string): string =>
  html.replace(new RegExp(`(<meta property="${property}" content=")[^"]*(")`), `$1${content}$2`)

// Social crawlers do not run JavaScript, so per-page share cards must be in the served HTML.
// Only GitHub-valid usernames (letters, digits, dashes) get through, so nothing else needs escaping.
const applyShare = (html: string, { title, description, url, image }: Share, lang: ShareLang): string => {
  let result = html.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
  result = setMeta(result, 'og:title', title)
  result = setMeta(result, 'og:description', description)
  result = setMeta(result, 'og:url', url)
  result = setMeta(result, 'og:image', image)
  if (lang === 'en') {
    result = setMeta(result, 'og:locale', 'en_US').replace('<html lang="es">', '<html lang="en">')
  }
  return result.replace(
    '</head>',
    `<meta name="twitter:image" content="${image}" />\n<meta property="og:image:width" content="1200" />\n<meta property="og:image:height" content="630" />\n</head>`,
  )
}

export const personalizeHtml = (html: string, login: string, origin: string, lang: ShareLang = 'es'): string => {
  if (!isValidUsername(login)) {
    return html
  }
  const en = lang === 'en'
  return applyShare(html, {
    title: en ? `@${login}'s city · GitHub City` : `La ciudad de @${login} · GitHub City`,
    description: en
      ? `@${login}'s repositories turned into a 3D city you can explore.`
      : `Los repositorios de @${login} convertidos en una ciudad 3D que puedes recorrer.`,
    url: `${origin}/ciudad/${login}${en ? '?lang=en' : ''}`,
    image: `${origin}/api/og/${login}${en ? '?lang=en' : ''}`,
  }, lang)
}

export const personalizeDuelHtml = (html: string, left: string, right: string, origin: string, lang: ShareLang = 'es'): string => {
  if (!isValidUsername(left) || !isValidUsername(right)) {
    return html
  }
  const en = lang === 'en'
  return applyShare(html, {
    title: en ? `@${left} vs @${right} · City duel · GitHub City` : `@${left} vs @${right} · Duelo de ciudades · GitHub City`,
    description: en
      ? `Whose GitHub city is bigger? @${left} and @${right} go head to head, building by building.`
      : `¿Qué ciudad de GitHub es más grande? @${left} y @${right} se enfrentan edificio a edificio.`,
    url: `${origin}/vs/${left}/${right}${en ? '?lang=en' : ''}`,
    // & must be escaped inside an HTML attribute.
    image: `${origin}/api/og-duel?a=${left}&amp;b=${right}${en ? '&amp;lang=en' : ''}`,
  }, lang)
}
