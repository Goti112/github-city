export type ComparableCity = {
  buildings: number
  population: number
  stars: number
  districts: number
  litBuildings: number
  contributions: number
}

type Side = 'left' | 'right' | 'tie'

export type CompareRow = {
  key: keyof ComparableCity
  label: string
  left: number
  right: number
  winner: Side
}

export type CompareResult = {
  rows: CompareRow[]
  score: { left: number; right: number }
  overall: Side
}

const categories: Array<[keyof ComparableCity, string]> = [
  ['buildings', 'Edificios'],
  ['population', 'Habitantes'],
  ['stars', 'Estrellas'],
  ['districts', 'Distritos'],
  ['litBuildings', 'Encendidos'],
  ['contributions', 'Aportes / año'],
]

const winnerOf = (left: number, right: number): Side => {
  if (left === right) {
    return 'tie'
  }
  return left > right ? 'left' : 'right'
}

// City duel scoreboard: one point per category won.
export const compareCities = (left: ComparableCity, right: ComparableCity): CompareResult => {
  const rows = categories.map(([key, label]): CompareRow => ({
    key,
    label,
    left: left[key],
    right: right[key],
    winner: winnerOf(left[key], right[key]),
  }))
  const score = {
    left: rows.filter((row) => row.winner === 'left').length,
    right: rows.filter((row) => row.winner === 'right').length,
  }
  return { rows, score, overall: winnerOf(score.left, score.right) }
}
