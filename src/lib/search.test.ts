import { describe, expect, it } from 'vitest'

describe('normalizeUsername', () => {
  it('trims whitespace and rejects invalid GitHub usernames', async () => {
    const { normalizeUsername } = await import('./search')

    expect(normalizeUsername(' torvalds ')).toBe('torvalds')
    expect(normalizeUsername('a b')).toBeNull()
  })
})