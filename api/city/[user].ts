import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  CITY_QUERY,
  errorFromGithub,
  isValidUsername,
  transformGithubResponse,
} from '../../src/lib/github'
import type { ApiErrorCode } from '../../src/lib/types'

const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql'
const MAX_GITHUB_ATTEMPTS = 3
const RETRY_DELAY_MS = 250
const SUCCESS_CACHE_CONTROL = 's-maxage=3600, stale-while-revalidate=86400'

type GithubResponse = {
  response: Response
  body: unknown
}

const isJsonRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const hasGraphQLErrors = (value: unknown): boolean =>
  isJsonRecord(value) && Array.isArray(value.errors) && value.errors.length > 0

const messageFromError = (error: unknown): string =>
  error instanceof Error ? error.message : String(error)

const waitForRetry = async (attempt: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * attempt))

const isRetryableStatus = (status: number): boolean => status >= 500 && status < 600

const requestGithub = async (login: string, token: string): Promise<GithubResponse> => {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= MAX_GITHUB_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(GITHUB_GRAPHQL_URL, {
        method: 'POST',
        headers: {
          Authorization: `bearer ${token}`,
          'Content-Type': 'application/json',
          'User-Agent': 'github-city',
        },
        body: JSON.stringify({ query: CITY_QUERY, variables: { login } }),
      })
      const body: unknown = await response.json()

      if (isRetryableStatus(response.status) && attempt < MAX_GITHUB_ATTEMPTS) {
        console.warn('Retrying GitHub GraphQL request after an upstream server error', {
          login,
          attempt,
          maxAttempts: MAX_GITHUB_ATTEMPTS,
          status: response.status,
          responseBody: body,
        })
        await waitForRetry(attempt)
        continue
      }

      return { response, body }
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (attempt === MAX_GITHUB_ATTEMPTS) {
        throw new Error(
          `GitHub GraphQL request failed for login ${login} at ${GITHUB_GRAPHQL_URL} after ${MAX_GITHUB_ATTEMPTS} attempts: ${lastError.message}`,
          { cause: lastError },
        )
      }

      console.warn('Retrying GitHub GraphQL request after a network failure', {
        login,
        attempt,
        maxAttempts: MAX_GITHUB_ATTEMPTS,
        error: lastError.message,
      })
      await waitForRetry(attempt)
    }
  }

  throw lastError ?? new Error('GitHub GraphQL request exhausted retries without a result')
}

const sendApiError = (response: VercelResponse, code: ApiErrorCode): void => {
  const statusByCode: Record<ApiErrorCode, number> = {
    INVALID_USERNAME: 400,
    USER_NOT_FOUND: 404,
    RATE_LIMITED: 429,
    UPSTREAM_ERROR: 502,
  }
  const cacheControl = code === 'USER_NOT_FOUND' ? 's-maxage=300' : 'no-store'

  response.setHeader('Cache-Control', cacheControl)
  response.status(statusByCode[code]).json({ error: code })
}

const handler = async (request: VercelRequest, response: VercelResponse): Promise<void> => {
  const login = String(request.query.user).trim()
  if (!isValidUsername(login)) {
    sendApiError(response, 'INVALID_USERNAME')
    return
  }

  const token = process.env.GITHUB_TOKEN
  if (!token) {
    console.error('GitHub token is missing from the server environment', {
      login,
      environmentVariable: 'GITHUB_TOKEN',
    })
    sendApiError(response, 'UPSTREAM_ERROR')
    return
  }

  let githubResponse: GithubResponse
  try {
    githubResponse = await requestGithub(login, token)
  } catch (error: unknown) {
    console.error('GitHub GraphQL request failed after retries', {
      login,
      url: GITHUB_GRAPHQL_URL,
      error: messageFromError(error),
    })
    sendApiError(response, 'UPSTREAM_ERROR')
    return
  }

  if (!githubResponse.response.ok || hasGraphQLErrors(githubResponse.body)) {
    const code = errorFromGithub(githubResponse.response.status, githubResponse.body)
    if (code === 'RATE_LIMITED') {
      console.warn('GitHub GraphQL rate limit response', {
        login,
        status: githubResponse.response.status,
        responseBody: githubResponse.body,
      })
    } else if (code === 'UPSTREAM_ERROR') {
      console.error('GitHub GraphQL returned an upstream error', {
        login,
        status: githubResponse.response.status,
        responseBody: githubResponse.body,
      })
    }
    sendApiError(response, code)
    return
  }

  try {
    const city = transformGithubResponse(githubResponse.body, new Date())
    response.setHeader('Cache-Control', SUCCESS_CACHE_CONTROL)
    response.status(200).json(city)
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'USER_NOT_FOUND') {
      sendApiError(response, 'USER_NOT_FOUND')
      return
    }

    console.error('Could not transform GitHub GraphQL response', {
      login,
      status: githubResponse.response.status,
      responseBody: githubResponse.body,
      error: messageFromError(error),
    })
    sendApiError(response, 'UPSTREAM_ERROR')
  }
}

export default handler
