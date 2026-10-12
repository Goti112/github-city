import { isValidUsername } from './github.js'

const setMeta = (html: string, property: string, content: string): string =>
  html.replace(new RegExp(`(<meta property="${property}" content=")[^"]*(")`), `$1${content}$2`)

// Social crawlers do not run JavaScript, so per-city share cards must be in the served HTML.
// Only GitHub-valid usernames (letters, digits, dashes) get through, so nothing needs escaping.
export const personalizeHtml = (html: string, login: string, origin: string): string => {
  if (!isValidUsername(login)) {
    return html
  }

  const title = `La ciudad de @${login} · GitHub City`
  const image = `${origin}/api/og/${login}`
  let result = html.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
  result = setMeta(result, 'og:title', title)
  result = setMeta(result, 'og:description', `Los repositorios de @${login} convertidos en una ciudad 3D que puedes recorrer.`)
  result = setMeta(result, 'og:url', `${origin}/ciudad/${login}`)
  result = setMeta(result, 'og:image', image)
  return result.replace(
    '</head>',
    `<meta name="twitter:image" content="${image}" />\n<meta property="og:image:width" content="1200" />\n<meta property="og:image:height" content="630" />\n</head>`,
  )
}
