export type Repo = {
  name: string
  description: string | null
  url: string
  stars: number
  language: string | null
  languageColor: string | null
  commits: number
  lastPush: string
  createdAt: string
}

export type CityResponse = {
  user: {
    login: string
    name: string | null
    avatarUrl: string
  }
  repos: Array<Repo>
  activity: {
    totalContributions: number
    last30Days: number
  }
}

export type ApiErrorCode = 'INVALID_USERNAME' | 'USER_NOT_FOUND' | 'RATE_LIMITED' | 'UPSTREAM_ERROR'

export type Building = {
  repoName: string
  x: number
  z: number
  width: number
  depth: number
  height: number
  color: string
  litRatio: number
  district: string
  stars: number
  createdYear: number
}
