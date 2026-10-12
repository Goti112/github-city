import { describe, expect, it } from 'vitest'
import { compareCities, type ComparableCity } from './compare'

const city = (overrides: Partial<ComparableCity>): ComparableCity => ({
  buildings: 10,
  population: 500,
  stars: 20,
  districts: 3,
  litBuildings: 2,
  contributions: 300,
  ...overrides,
})

describe('compareCities', () => {
  it('declares a winner per category and overall', () => {
    const result = compareCities(
      city({ buildings: 40, population: 9000, stars: 5 }),
      city({ buildings: 12, population: 400, stars: 300 }),
    )

    expect(result.rows.find((row) => row.key === 'buildings')?.winner).toBe('left')
    expect(result.rows.find((row) => row.key === 'stars')?.winner).toBe('right')
    expect(result.score).toEqual({ left: 2, right: 1 })
    expect(result.overall).toBe('left')
  })

  it('treats equal values as a tie that scores for nobody', () => {
    const result = compareCities(city({}), city({}))

    expect(result.rows.every((row) => row.winner === 'tie')).toBe(true)
    expect(result.score).toEqual({ left: 0, right: 0 })
    expect(result.overall).toBe('tie')
  })

  it('keeps the categories in a stable order with labels', () => {
    const result = compareCities(city({}), city({}))
    expect(result.rows.map((row) => row.label)).toEqual([
      'Edificios',
      'Habitantes',
      'Estrellas',
      'Distritos',
      'Encendidos',
      'Aportes / año',
    ])
  })
})
