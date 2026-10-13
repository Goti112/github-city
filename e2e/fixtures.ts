import type { Page } from '@playwright/test'
import type { CityResponse, Repo } from '../src/lib/types'

const repo = (name: string, language: string, color: string, commits: number, stars: number, created: string, pushed: string): Repo => ({
  name,
  description: `Descripción de ${name}`,
  url: `https://github.com/example/${name}`,
  stars,
  language,
  languageColor: color,
  commits,
  lastPush: pushed,
  createdAt: created,
})

export const cities: Record<string, CityResponse> = {
  ana: {
    user: { login: 'ana', name: 'Ana Dev', avatarUrl: '/avatar-placeholder.svg' },
    repos: [
      repo('portfolio', 'TypeScript', '#3178c6', 120, 4, '2021-03-01T00:00:00Z', '2026-10-01T00:00:00Z'),
      repo('tienda-api', 'Java', '#b07219', 300, 12, '2019-05-01T00:00:00Z', '2026-09-20T00:00:00Z'),
      repo('app-android', 'Kotlin', '#A97BFF', 80, 0, '2022-01-10T00:00:00Z', '2025-01-01T00:00:00Z'),
      repo('blog', 'TypeScript', '#3178c6', 40, 1, '2023-06-01T00:00:00Z', '2026-10-05T00:00:00Z'),
      repo('scripts', 'Python', '#3572A5', 15, 0, '2020-02-02T00:00:00Z', '2024-02-02T00:00:00Z'),
      repo('practicas-dam', 'Java', '#b07219', 210, 2, '2024-09-01T00:00:00Z', '2026-06-01T00:00:00Z'),
    ],
    activity: { totalContributions: 420, last30Days: 30 },
  },
  bea: {
    user: { login: 'bea', name: 'Bea Code', avatarUrl: '/avatar-placeholder.svg' },
    repos: [repo('hola-mundo', 'JavaScript', '#f1e05a', 3, 0, '2025-01-01T00:00:00Z', '2025-01-02T00:00:00Z')],
    activity: { totalContributions: 12, last30Days: 0 },
  },
}

// Serve /api/city/:user from the fixtures above; unknown users get the real API's 404.
export const mockGithub = async (page: Page): Promise<void> => {
  await page.route('**/api/city/**', async (route) => {
    const login = new URL(route.request().url()).pathname.split('/').pop() ?? ''
    const city = cities[login]
    await route.fulfill(city === undefined
      ? { status: 404, json: { error: 'USER_NOT_FOUND' } }
      : { status: 200, json: city })
  })
}
