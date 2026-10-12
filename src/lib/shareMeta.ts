import { isValidUsername } from './github.js'

type Share = { title: string; description: string; url: string; image: string }

const setMeta = (html: string, property: string, content: string): string =>
  html.replace(new RegExp(`(<meta property="${property}" content=")[^"]*(")`), `$1${content}$2`)

// Social crawlers do not run JavaScript, so per-page share cards must be in the served HTML.
// Only GitHub-valid usernames (letters, digits, dashes) get through, so nothing else needs escaping.
const applyShare = (html: string, { title, description, url, image }: Share): string => {
  let result = html.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
  result = setMeta(result, 'og:title', title)
  result = setMeta(result, 'og:description', description)
  result = setMeta(result, 'og:url', url)
  result = setMeta(result, 'og:image', image)
  return result.replace(
    '</head>',
    `<meta name="twitter:image" content="${image}" />\n<meta property="og:image:width" content="1200" />\n<meta property="og:image:height" content="630" />\n</head>`,
  )
}

export const personalizeHtml = (html: string, login: string, origin: string): string => {
  if (!isValidUsername(login)) {
    return html
  }
  return applyShare(html, {
    title: `La ciudad de @${login} · GitHub City`,
    description: `Los repositorios de @${login} convertidos en una ciudad 3D que puedes recorrer.`,
    url: `${origin}/ciudad/${login}`,
    image: `${origin}/api/og/${login}`,
  })
}

export const personalizeDuelHtml = (html: string, left: string, right: string, origin: string): string => {
  if (!isValidUsername(left) || !isValidUsername(right)) {
    return html
  }
  return applyShare(html, {
    title: `@${left} vs @${right} · Duelo de ciudades · GitHub City`,
    description: `¿Qué ciudad de GitHub es más grande? @${left} y @${right} se enfrentan edificio a edificio.`,
    url: `${origin}/vs/${left}/${right}`,
    // & must be escaped inside an HTML attribute.
    image: `${origin}/api/og-duel?a=${left}&amp;b=${right}`,
  })
}
