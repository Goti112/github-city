import { describe, expect, it } from 'vitest'
import fixture from './fixtures/github-response.json'
import { errorFromGithub, isValidUsername, transformGithubResponse } from './github'

const now = new Date('2026-10-08T00:00:00.000Z')

describe('isValidUsername', () => {
  const cases: Array<{ username: string; expected: boolean }> = [
    { username: 'miquel-manzano', expected: true },
    { username: 'a', expected: true },
    { username: 'a'.repeat(39), expected: true },
    { username: '', expected: false },
    { username: 'a'.repeat(40), expected: false },
    { username: 'a b', expected: false },
    { username: 'a_b', expected: false },
    { username: '../x', expected: false },
    { username: ' torvalds ', expected: false },
  ]

  it.each(cases)('returns $expected for "$username"', ({ username, expected }) => {
    expect(isValidUsername(username)).toBe(expected)
  })
})

describe('transformGithubResponse', () => {
  it('maps public repositories and contribution activity from GraphQL', () => {
    expect(transformGithubResponse(fixture, now)).toEqual({
      user: {
        login: 'octocat',
        name: 'Mona Lisa',
        avatarUrl: 'https://avatars.githubusercontent.com/u/583231?v=4',
      },
      repos: [
        {
          name: 'typescript-city',
          description: 'A TypeScript city project',
          url: 'https://github.com/octocat/typescript-city',
          stars: 5,
          language: 'TypeScript',
          languageColor: '#3178c6',
          commits: 120,
          lastPush: '2026-10-07T12:00:00Z',
        },
        {
          name: 'java-garden',
          description: null,
          url: 'https://github.com/octocat/java-garden',
          stars: 0,
          language: 'Java',
          languageColor: '#b07219',
          commits: 0,
          lastPush: '2026-09-20T08:30:00Z',
        },
        {
          name: 'empty-solar',
          description: 'No language or default branch',
          url: 'https://github.com/octocat/empty-solar',
          stars: 12,
          language: null,
          languageColor: null,
          commits: 0,
          lastPush: '2025-12-31T23:59:59Z',
        },
      ],
      activity: {
        totalContributions: 20,
        last30Days: 7,
      },
    })
  })

  it('maps an absent user to USER_NOT_FOUND', () => {
    expect(() => transformGithubResponse({ data: { user: null } }, now)).toThrowError('USER_NOT_FOUND')
  })
})

describe('errorFromGithub', () => {
  it.each([403, 429])('maps HTTP %i to RATE_LIMITED', (status) => {
    expect(errorFromGithub(status, {})).toBe('RATE_LIMITED')
  })

  it('maps upstream server errors to UPSTREAM_ERROR', () => {
    expect(errorFromGithub(500, {})).toBe('UPSTREAM_ERROR')
  })

  it('maps a GraphQL NOT_FOUND error to USER_NOT_FOUND', () => {
    expect(errorFromGithub(200, { errors: [{ type: 'NOT_FOUND' }] })).toBe('USER_NOT_FOUND')
  })

  it('maps other GraphQL errors to UPSTREAM_ERROR', () => {
    expect(errorFromGithub(200, { errors: [{ type: 'VALIDATION' }] })).toBe('UPSTREAM_ERROR')
  })
})
