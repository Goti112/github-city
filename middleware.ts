import { personalizeHtml } from './src/lib/shareMeta.js'

// Vercel Routing Middleware: serve /ciudad/:user with share tags for that user's city.
export const config = { matcher: '/ciudad/:user' }

export default async function middleware(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const login = decodeURIComponent(url.pathname.split('/')[2] ?? '')
  const page = await fetch(new URL('/index.html', url.origin))
  const html = personalizeHtml(await page.text(), login, url.origin)

  return new Response(html, {
    status: page.status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=0, must-revalidate' },
  })
}
