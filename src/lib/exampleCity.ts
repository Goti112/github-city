import type { CityResponse, Repo } from './types'

// Decorative city for the Home background and loading screen. It is generated, not a real
// profile, so nothing here is attributed to an actual GitHub user.
const languages: Array<[string, string]> = [
  ['TypeScript', '#3178c6'],
  ['JavaScript', '#f1e05a'],
  ['Python', '#3572A5'],
  ['Java', '#b07219'],
  ['Kotlin', '#A97BFF'],
  ['Rust', '#dea584'],
  ['Go', '#00ADD8'],
  ['C#', '#178600'],
]

// Repos per language, biggest district first, so the demo has one large district and smaller ones around it.
const districtSizes = [14, 10, 7, 6, 5, 4, 3, 3]

// Small deterministic PRNG (mulberry32) so the demo looks identical on every visit.
const random = (() => {
  let seed = 20261008
  return (): number => {
    seed = (seed + 0x6d2b79f5) | 0
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
})()

const millisecondsPerDay = 24 * 60 * 60 * 1000
const builtAt = Date.now()

const repos: Repo[] = languages.flatMap(([language, languageColor], languageIndex) =>
  Array.from({ length: districtSizes[languageIndex] ?? 1 }, (_, index): Repo => {
    const daysSincePush = Math.floor(random() ** 2 * 500)
    return {
      name: `${language.toLowerCase()}-${index + 1}`,
      description: null,
      url: 'https://github.com',
      stars: Math.floor(random() ** 3 * 40),
      language,
      languageColor,
      commits: Math.floor(random() ** 2 * 1500),
      lastPush: new Date(builtAt - daysSincePush * millisecondsPerDay).toISOString(),
      createdAt: new Date(builtAt - (daysSincePush + 60 + Math.floor(random() * 2200)) * millisecondsPerDay).toISOString(),
    }
  }),
)

export const EXAMPLE_CITY: CityResponse = {
  user: {
    login: 'github-city',
    name: 'GitHub City',
    avatarUrl: '/avatar-placeholder.svg',
  },
  repos,
  activity: { totalContributions: 0, last30Days: 0 },
}
