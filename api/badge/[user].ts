import { badgeSvg } from '../../src/lib/badge.js'
import { cityStats } from '../../src/lib/cityStats.js'
import { loadCity } from '../_lib/loadCity.js'

// README badge: <img src="https://city.miquelmanzano.com/api/badge/:user">
export const GET = async (request: Request): Promise<Response> => {
  const url = new URL(request.url)
  const login = decodeURIComponent(url.pathname.split('/').pop() ?? '')
  const lang = url.searchParams.get('lang') === 'en' ? 'en' : 'es'
  const result = await loadCity(login)
  const svg = result.ok
    ? badgeSvg({
        title: cityStats(result.city.repos, new Date()).title,
        buildings: result.city.repos.length,
        stars: result.city.repos.reduce((sum, repo) => sum + repo.stars, 0),
      }, lang)
    : badgeSvg({ message: lang === 'en' ? 'profile unavailable' : 'perfil no disponible' }, lang)

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      // GitHub proxies README images through its camo cache, which honours max-age.
      'Cache-Control': result.ok
        ? 'public, max-age=3600, s-maxage=21600, stale-while-revalidate=86400'
        : 'public, max-age=300, s-maxage=300',
    },
  })
}
