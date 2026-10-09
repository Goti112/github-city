import type { ApiErrorCode, CityResponse, Repo } from './types'

type JsonRecord = Record<string, unknown>

const isJsonRecord = (value: unknown): value is JsonRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isNullableString = (value: unknown): value is string | null =>
  value === null || typeof value === 'string'

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

const isRepo = (value: unknown): value is Repo => {
  if (!isJsonRecord(value)) {
    return false
  }

  return typeof value.name === 'string'
    && isNullableString(value.description)
    && typeof value.url === 'string'
    && isFiniteNumber(value.stars)
    && isNullableString(value.language)
    && isNullableString(value.languageColor)
    && isFiniteNumber(value.commits)
    && typeof value.lastPush === 'string'
}

const isCityResponse = (value: unknown): value is CityResponse => {
  if (!isJsonRecord(value) || !isJsonRecord(value.user) || !isJsonRecord(value.activity)) {
    return false
  }

  return typeof value.user.login === 'string'
    && isNullableString(value.user.name)
    && typeof value.user.avatarUrl === 'string'
    && Array.isArray(value.repos)
    && value.repos.every(isRepo)
    && isFiniteNumber(value.activity.totalContributions)
    && isFiniteNumber(value.activity.last30Days)
}

const isApiErrorCode = (value: unknown): value is ApiErrorCode =>
  value === 'INVALID_USERNAME'
  || value === 'USER_NOT_FOUND'
  || value === 'RATE_LIMITED'
  || value === 'UPSTREAM_ERROR'

const errorCodeFromStatus = (status: number): ApiErrorCode => {
  if (status === 400) {
    return 'INVALID_USERNAME'
  }
  if (status === 404) {
    return 'USER_NOT_FOUND'
  }
  if (status === 429) {
    return 'RATE_LIMITED'
  }
  return 'UPSTREAM_ERROR'
}

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error)

export class CityError extends Error {
  readonly code: ApiErrorCode

  constructor(code: ApiErrorCode, message: string) {
    super(message)
    this.name = 'CityError'
    this.code = code
  }
}

export const fetchCity = async (user: string, fetchImpl: typeof fetch): Promise<CityResponse> => {
  const normalizedUser = user.trim()
  const url = `/api/city/${encodeURIComponent(normalizedUser)}`

  let response: Response
  try {
    response = await fetchImpl(url)
  } catch (error: unknown) {
    throw new CityError('UPSTREAM_ERROR', `Request ${url} failed: ${errorMessage(error)}`)
  }

  let body: unknown
  try {
    body = await response.json() as unknown
  } catch (error: unknown) {
    const code = response.ok ? 'UPSTREAM_ERROR' : errorCodeFromStatus(response.status)
    throw new CityError(
      code,
      `Invalid JSON from ${url} with HTTP ${response.status}: ${errorMessage(error)}`,
    )
  }

  if (!response.ok) {
    const bodyCode = isJsonRecord(body) && isApiErrorCode(body.error) ? body.error : null
    const code = bodyCode ?? errorCodeFromStatus(response.status)
    throw new CityError(
      code,
      `Request ${url} failed with HTTP ${response.status}: ${JSON.stringify(body)}`,
    )
  }

  if (!isCityResponse(body)) {
    throw new CityError(
      'UPSTREAM_ERROR',
      `Invalid city response from ${url} with HTTP ${response.status}`,
    )
  }

  return body
}
