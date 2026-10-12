import type { ApiErrorCode, CityResponse, Repo } from './types.js'

type JsonRecord = Record<string, unknown>

const isJsonRecord = (value: unknown): value is JsonRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const requireRecord = (value: unknown, field: string): JsonRecord => {
  if (!isJsonRecord(value)) {
    throw new Error(`UPSTREAM_ERROR: expected object at ${field}`)
  }
  return value
}

const requireString = (value: unknown, field: string): string => {
  if (typeof value !== 'string') {
    throw new Error(`UPSTREAM_ERROR: expected string at ${field}`)
  }
  return value
}

const requireNumber = (value: unknown, field: string): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`UPSTREAM_ERROR: expected number at ${field}`)
  }
  return value
}

const nullableString = (value: unknown, field: string): string | null => {
  if (value === null) {
    return null
  }
  return requireString(value, field)
}

const readCommits = (defaultBranchRef: unknown): number => {
  if (defaultBranchRef === null) {
    return 0
  }

  const branch = requireRecord(defaultBranchRef, 'defaultBranchRef')
  const target = requireRecord(branch.target, 'defaultBranchRef.target')
  const history = requireRecord(target.history, 'defaultBranchRef.target.history')
  return requireNumber(history.totalCount, 'defaultBranchRef.target.history.totalCount')
}

const readRepo = (value: unknown): Repo => {
  const repo = requireRecord(value, 'repositories.nodes[]')
  const primaryLanguage = repo.primaryLanguage === null
    ? null
    : requireRecord(repo.primaryLanguage, 'repositories.nodes[].primaryLanguage')

  return {
    name: requireString(repo.name, 'repositories.nodes[].name'),
    description: nullableString(repo.description, 'repositories.nodes[].description'),
    url: requireString(repo.url, 'repositories.nodes[].url'),
    stars: requireNumber(repo.stargazerCount, 'repositories.nodes[].stargazerCount'),
    language: primaryLanguage === null
      ? null
      : requireString(primaryLanguage.name, 'repositories.nodes[].primaryLanguage.name'),
    languageColor: primaryLanguage === null
      ? null
      : nullableString(primaryLanguage.color, 'repositories.nodes[].primaryLanguage.color'),
    commits: readCommits(repo.defaultBranchRef),
    lastPush: requireString(repo.pushedAt, 'repositories.nodes[].pushedAt'),
  }
}

const readContributionDays = (value: unknown): Array<{ date: string; count: number }> => {
  if (!Array.isArray(value)) {
    throw new Error('UPSTREAM_ERROR: expected contribution days array')
  }

  return value.map((day: unknown) => {
    const contributionDay = requireRecord(day, 'contributionDays[]')
    return {
      date: requireString(contributionDay.date, 'contributionDays[].date'),
      count: requireNumber(contributionDay.contributionCount, 'contributionDays[].contributionCount'),
    }
  })
}

const lastThirtyDays = (weeks: unknown, now: Date): number => {
  if (!Array.isArray(weeks)) {
    throw new Error('UPSTREAM_ERROR: expected contribution weeks array')
  }

  const cutoff = now.getTime() - 30 * 24 * 60 * 60 * 1000
  return weeks.reduce((total: number, week: unknown) => {
    const weekRecord = requireRecord(week, 'contributionCalendar.weeks[]')
    const days = readContributionDays(weekRecord.contributionDays)
    return total + days.reduce((weekTotal: number, day: { date: string; count: number }) => {
      const date = Date.parse(day.date)
      if (!Number.isFinite(date)) {
        throw new Error(`UPSTREAM_ERROR: invalid contribution date ${day.date}`)
      }
      return date > cutoff ? weekTotal + day.count : weekTotal
    }, 0)
  }, 0)
}

export const CITY_QUERY = `
  query City($login: String!) {
    user(login: $login) {
      login
      name
      avatarUrl
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
            }
          }
        }
      }
      repositories(
        first: 100
        ownerAffiliations: OWNER
        isFork: false
        privacy: PUBLIC
        orderBy: { field: PUSHED_AT, direction: DESC }
      ) {
        nodes {
          name
          description
          url
          stargazerCount
          pushedAt
          primaryLanguage {
            name
            color
          }
          defaultBranchRef {
            target {
              ... on Commit {
                history {
                  totalCount
                }
              }
            }
          }
        }
      }
    }
  }
`

export const isValidUsername = (username: string): boolean => /^[a-zA-Z0-9-]{1,39}$/.test(username)

export const transformGithubResponse = (json: unknown, now: Date): CityResponse => {
  const root = requireRecord(json, 'root')
  const data = requireRecord(root.data, 'data')

  if (data.user === null) {
    throw new Error('USER_NOT_FOUND')
  }

  const user = requireRecord(data.user, 'data.user')
  const contributionsCollection = requireRecord(user.contributionsCollection, 'data.user.contributionsCollection')
  const contributionCalendar = requireRecord(
    contributionsCollection.contributionCalendar,
    'data.user.contributionsCollection.contributionCalendar',
  )
  const repositories = requireRecord(user.repositories, 'data.user.repositories')
  if (!Array.isArray(repositories.nodes)) {
    throw new Error('UPSTREAM_ERROR: expected repository nodes array')
  }

  const weeks = contributionCalendar.weeks
  const repos = repositories.nodes.map((repo: unknown) => readRepo(repo))

  return {
    user: {
      login: requireString(user.login, 'data.user.login'),
      name: nullableString(user.name, 'data.user.name'),
      avatarUrl: requireString(user.avatarUrl, 'data.user.avatarUrl'),
    },
    repos,
    activity: {
      totalContributions: requireNumber(
        contributionCalendar.totalContributions,
        'data.user.contributionsCollection.contributionCalendar.totalContributions',
      ),
      last30Days: lastThirtyDays(weeks, now),
    },
  }
}

const hasGraphQLErrorType = (json: unknown, type: string): boolean => {
  if (!isJsonRecord(json) || !Array.isArray(json.errors)) {
    return false
  }

  return json.errors.some((error: unknown) => isJsonRecord(error) && error.type === type)
}

export const errorFromGithub = (status: number, json: unknown): ApiErrorCode => {
  // GraphQL reports an exhausted primary rate limit as HTTP 200 with a RATE_LIMITED error.
  if (status === 403 || status === 429 || hasGraphQLErrorType(json, 'RATE_LIMITED')) {
    return 'RATE_LIMITED'
  }
  if (status === 200 && hasGraphQLErrorType(json, 'NOT_FOUND')) {
    return 'USER_NOT_FOUND'
  }
  return 'UPSTREAM_ERROR'
}
