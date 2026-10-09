import type { Building, Repo } from './types'

export const CELL = 3
export const OTHER_DISTRICT = 'Otros'
export const NEUTRAL_COLOR = '#8a8f98'

const millisecondsPerDay = 24 * 60 * 60 * 1000
const minimumLight = 0.05

const compareStrings = (left: string, right: string): number => {
  if (left < right) {
    return -1
  }
  if (left > right) {
    return 1
  }
  return 0
}

export const buildingHeight = (commits: number): number => {
  if (!Number.isFinite(commits) || commits < 0) {
    throw new RangeError(`Commit count must be a finite non-negative number: ${commits}`)
  }

  return 1 + Math.log2(commits + 1) * 1.5
}

export const plotSize = (stars: number): number => {
  if (!Number.isFinite(stars) || stars < 0) {
    throw new RangeError(`Star count must be a finite non-negative number: ${stars}`)
  }

  if (stars === 0) {
    return 1
  }
  if (stars < 10) {
    return 1.5
  }
  return 2
}

export const litRatio = (lastPush: string, now: Date): number => {
  const pushTime = Date.parse(lastPush)
  const nowTime = now.getTime()
  if (!Number.isFinite(pushTime)) {
    throw new RangeError(`Invalid repository push date: ${lastPush}`)
  }
  if (!Number.isFinite(nowTime)) {
    throw new RangeError('Current date must be valid')
  }

  const ageInDays = (nowTime - pushTime) / millisecondsPerDay
  if (ageInDays <= 30) {
    return 1
  }
  if (ageInDays >= 365) {
    return minimumLight
  }

  const inactiveFraction = (ageInDays - 30) / (365 - 30)
  return 1 - inactiveFraction * (1 - minimumLight)
}

export const desaturate = (hex: string): string => {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) {
    throw new RangeError(`Expected a six-digit hex color, received ${hex}`)
  }

  const red = Number.parseInt(hex.slice(1, 3), 16)
  const green = Number.parseInt(hex.slice(3, 5), 16)
  const blue = Number.parseInt(hex.slice(5, 7), 16)
  const gray = red * 0.2126 + green * 0.7152 + blue * 0.0722
  const mixWithGray = (channel: number): number => Math.round(channel * 0.65 + gray * 0.35)
  const toHex = (channel: number): string => mixWithGray(channel).toString(16).padStart(2, '0')

  return `#${toHex(red)}${toHex(green)}${toHex(blue)}`
}

export const spiral = (count: number): Array<[number, number]> => {
  if (!Number.isInteger(count) || count < 0) {
    throw new RangeError(`Spiral cell count must be a non-negative integer: ${count}`)
  }

  const coordinates: Array<[number, number]> = []
  if (count === 0) {
    return coordinates
  }

  let x = 0
  let z = 0
  let stepLength = 1
  coordinates.push([x, z])

  const directions: Array<[number, number]> = [[1, 0], [0, 1], [-1, 0], [0, -1]]
  while (coordinates.length < count) {
    for (let directionIndex = 0; directionIndex < directions.length; directionIndex += 1) {
      const direction = directions[directionIndex]
      if (direction === undefined) {
        throw new Error(`Missing spiral direction at index ${directionIndex}`)
      }

      for (let step = 0; step < stepLength && coordinates.length < count; step += 1) {
        x += direction[0]
        z += direction[1]
        coordinates.push([x, z])
      }

      if (directionIndex % 2 === 1) {
        stepLength += 1
      }
      if (coordinates.length >= count) {
        break
      }
    }
  }

  return coordinates
}

const districtCells = (side: number): Array<[number, number]> => {
  const minimum = -Math.floor((side - 1) / 2)
  const maximum = minimum + side - 1
  const centerOffset = (minimum + maximum) / 2
  const candidates = spiral((side + 2) ** 2)

  return candidates
    .filter(([x, z]) => x >= minimum && x <= maximum && z >= minimum && z <= maximum)
    .slice(0, side * side)
    .map(([x, z]): [number, number] => [x - centerOffset, z - centerOffset])
}

const colorForRepo = (repo: Repo): string => {
  if (repo.language === null) {
    return NEUTRAL_COLOR
  }
  if (repo.languageColor === null) {
    throw new RangeError(`Repository ${repo.name} has language ${repo.language} without a color`)
  }
  return desaturate(repo.languageColor)
}

export const cityLayout = (repos: Repo[], now: Date): Building[] => {
  if (repos.length === 0) {
    return []
  }

  const reposByDistrict = new Map<string, Array<Repo>>()
  for (const repo of repos) {
    const district = repo.language ?? OTHER_DISTRICT
    const districtRepos = reposByDistrict.get(district)
    if (districtRepos === undefined) {
      reposByDistrict.set(district, [repo])
    } else {
      districtRepos.push(repo)
    }
  }

  const districts = Array.from(reposByDistrict.entries()).sort(([leftName, leftRepos], [rightName, rightRepos]) =>
    rightRepos.length - leftRepos.length || compareStrings(leftName, rightName),
  )
  const largestSide = Math.max(...districts.map(([, districtRepos]) => Math.ceil(Math.sqrt(districtRepos.length))))
  const slotSize = (largestSide + 1) * CELL
  const districtSlots = spiral(districts.length + 1)

  return districts.flatMap(([district, districtRepos], districtIndex) => {
    const districtSlot = districtSlots[districtIndex + 1]
    if (districtSlot === undefined) {
      throw new Error(`Missing district slot at index ${districtIndex + 1}`)
    }

    const side = Math.ceil(Math.sqrt(districtRepos.length))
    const cells = districtCells(side)
    const sortedRepos = [...districtRepos].sort((left, right) =>
      buildingHeight(right.commits) - buildingHeight(left.commits) || compareStrings(left.name, right.name),
    )

    return sortedRepos.map((repo, repoIndex): Building => {
      const cell = cells[repoIndex]
      if (cell === undefined) {
        throw new Error(`Missing district cell for repository ${repo.name}`)
      }

      const [slotX, slotZ] = districtSlot
      const [cellX, cellZ] = cell
      const size = plotSize(repo.stars)
      return {
        repoName: repo.name,
        x: slotX * slotSize + cellX * CELL,
        z: slotZ * slotSize + cellZ * CELL,
        width: size,
        depth: size,
        height: buildingHeight(repo.commits),
        color: colorForRepo(repo),
        litRatio: litRatio(repo.lastPush, now),
        district,
      }
    })
  })
}
