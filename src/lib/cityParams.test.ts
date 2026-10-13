import { describe, expect, it } from 'vitest'
import { readCityParams, writeCityParams } from './cityParams'

const repos = [{ name: 'react-proxy' }, { name: 'portfolio' }]
const range = { first: 2014, last: 2026 }

describe('readCityParams', () => {
  it('restores a shared building and year', () => {
    expect(readCityParams(new URLSearchParams('repo=react-proxy&year=2016'), repos, range))
      .toEqual({ repo: 'react-proxy', year: 2016 })
  })

  it('ignores repositories that are not in this city', () => {
    expect(readCityParams(new URLSearchParams('repo=nope'), repos, range).repo).toBeNull()
  })

  it('ignores years outside the city history or that are not whole numbers', () => {
    for (const year of ['1999', '2026', '2030', 'abc', '2016.5', '']) {
      expect(readCityParams(new URLSearchParams({ year }), repos, range).year).toBeNull()
    }
  })

  it('accepts the empty plot just before the first repository', () => {
    expect(readCityParams(new URLSearchParams('year=2013'), repos, range).year).toBe(2013)
  })

  it('has no year without a history range', () => {
    expect(readCityParams(new URLSearchParams('year=2016'), repos, null).year).toBeNull()
  })
})

describe('writeCityParams', () => {
  it('only writes what is set', () => {
    expect(writeCityParams({ repo: null, year: null }).toString()).toBe('')
    expect(writeCityParams({ repo: 'react-proxy', year: 2016 }).toString()).toBe('repo=react-proxy&year=2016')
  })
})
