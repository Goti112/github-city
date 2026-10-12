import { personalizeDuelHtml, personalizeHtml } from './src/lib/shareMeta.js'

// Vercel Routing Middleware: serve city and duel pages with share tags for those users.
export const config = { matcher: ['/ciudad/:user', '/vs/:left/:right'] }

export default async function middleware(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const [, section = '', first = '', second = ''] = url.pathname.split('/').map(decodeURIComponent)
  const page = await fetch(new URL('/index.html', url.origin))
  const html = await page.text()
  const personalized = section === 'vs'
    ? personalizeDuelHtml(html, first, second, url.origin)
    : personalizeHtml(html, first, url.origin)

  return new Response(personalized, {
    status: page.status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=0, must-revalidate' },
  })
}
