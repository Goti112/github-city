import { describe, expect, it } from 'vitest'
import type { CityResponse } from './types'
import { CityError, fetchCity } from './api'

const city: CityResponse = {
  user: {
    login: 'octocat',
    name: 'Mona Lisa',
    avatarUrl: 'https://avatars.githubusercontent.com/u/583231?v=4',
  },
  repos: [
    {
      name: 'hello-world',
      description: 'A test repository',
      url: 'https://github.com/octocat/hello-world',
      stars: 5,
      language: 'TypeScript',
      languageColor: '#3178c6',
      commits: 12,
      lastPush: '2026-10-08T00:00:00.000Z',
      createdAt: '2020-01-01T00:00:00.000Z',
    },
  ],
  activity: {
    totalContributions: 20,
    last30Days: 7,
  },
}

const jsonResponse = (body: unknown, status: number): Response => {
  const serializedBody = JSON.stringify(body)
  if (serializedBody === undefined) {
    throw new Error('The response body could not be serialized as JSON')
  }

  return new Response(serializedBody, {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const expectCityError = async (operation: Promise<CityResponse>): Promise<CityError> => {
  try {
    await operation
  } catch (error: unknown) {
    if (error instanceof CityError) {
      return error
    }
    throw new Error('Expected a CityError', { cause: error })
  }

  throw new Error('Expected the request to fail with a CityError')
}

describe('fetchCity', () => {
  it('returns a valid city response', async () => {
    const fetchImpl: typeof fetch = async () => jsonResponse(city, 200)

    await expect(fetchCity('octocat', fetchImpl)).resolves.toEqual(city)
  })

  it('maps a 404 USER_NOT_FOUND response to CityError', async () => {
    const fetchImpl: typeof fetch = async () => jsonResponse({ error: 'USER_NOT_FOUND' }, 404)

    const error = await expectCityError(fetchCity('missing-user', fetchImpl))

    expect(error).toBeInstanceOf(CityError)
    expect(error.code).toBe('USER_NOT_FOUND')
  })

  it('maps a rejected fetch to UPSTREAM_ERROR', async () => {
    const fetchImpl: typeof fetch = async () => {
      throw new Error('network down')
    }

    const error = await expectCityError(fetchCity('octocat', fetchImpl))

    expect(error.code).toBe('UPSTREAM_ERROR')
    expect(error.message).toContain('network down')
  })

  it('trims the username and URL-encodes the API path segment', async () => {
    const requestedUrls: Array<string> = []
    const fetchImpl: typeof fetch = async (input: RequestInfo | URL) => {
      requestedUrls.push(String(input))
      return jsonResponse(city, 200)
    }

    await fetchCity(' torvalds/dev repo ', fetchImpl)

    expect(requestedUrls).toEqual(['/api/city/torvalds%2Fdev%20repo?v=2'])
  })
})
