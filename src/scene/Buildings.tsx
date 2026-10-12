import { useCallback, useLayoutEffect, useMemo, useRef, type ReactElement } from 'react'
import { useFrame } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import {
  BoxGeometry,
  Color,
  InstancedBufferAttribute,
  InstancedMesh,
  Object3D,
} from 'three'
import type { Building } from '../lib/types'
import type { PointerPosition } from '../ui/Tooltip'
import { isClickGesture } from './isClickGesture'
import { createWindowsMaterial, type WindowGlowUniform } from './windowsMaterial'

type BuildingsProps = {
  buildings: Building[]
  windowGlow: WindowGlowUniform
  hovered: number | null
  selected?: number | null
  /** Only buildings created up to this year are standing; null shows the whole city. */
  visibleYear?: number | null
  onHover?: (index: number | null, position: PointerPosition | null) => void
  onSelect?: (index: number) => void
}

const entranceDuration = 1.2
const maxEntranceDelay = 0.7

const Buildings = ({
  buildings,
  windowGlow,
  hovered,
  selected = null,
  visibleYear = null,
  onHover,
  onSelect,
}: BuildingsProps): ReactElement | null => {
  const meshRef = useRef<InstancedMesh | null>(null)
  const geometry = useMemo(() => new BoxGeometry(1, 1, 1), [])
  const transform = useMemo(() => new Object3D(), [])
  // Per-building growth (0 = flat, 1 = full height), where it is heading, and how long to wait first.
  const growth = useRef({ level: new Float32Array(0), goal: new Float32Array(0), wait: new Float32Array(0), settled: true })
  const maximumRadius = useMemo(
    () => buildings.reduce((radius, building) => Math.max(radius, Math.hypot(building.x, building.z)), 1),
    [buildings],
  )
  const material = useMemo(() => createWindowsMaterial(windowGlow), [windowGlow])
  const isVisible = useCallback(
    (building: Building): boolean => visibleYear === null || building.createdYear <= visibleYear,
    [visibleYear],
  )

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (mesh === null) {
      return
    }

    const litRatios = new Float32Array(buildings.map(({ litRatio }) => litRatio))
    const seeds = new Float32Array(buildings.map((_, index) => index))
    geometry.setAttribute('aLit', new InstancedBufferAttribute(litRatios, 1))
    geometry.setAttribute('aSeed', new InstancedBufferAttribute(seeds, 1))

    buildings.forEach((building, index) => {
      transform.position.set(building.x, 0, building.z)
      transform.scale.set(building.width, 0, building.depth)
      transform.updateMatrix()
      mesh.setMatrixAt(index, transform.matrix)
    })

    // Opening rise: everything grows from the centre outwards.
    growth.current = {
      level: new Float32Array(buildings.length),
      goal: new Float32Array(buildings.map((building) => (isVisible(building) ? 1 : 0))),
      wait: new Float32Array(buildings.map((building) => (Math.hypot(building.x, building.z) / maximumRadius) * maxEntranceDelay)),
      settled: false,
    }
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
    // isVisible is applied by the effect below when only the year changes.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [buildings, geometry, maximumRadius, transform])

  // History slider: buildings created after the chosen year sink, the rest rise.
  useLayoutEffect(() => {
    const state = growth.current
    buildings.forEach((building, index) => {
      const goal = isVisible(building) ? 1 : 0
      if (state.goal[index] !== goal) {
        state.goal[index] = goal
        state.wait[index] = Math.min(state.wait[index] ?? 0, 0.25)
        state.settled = false
      }
    })
  }, [buildings, isVisible])

  useFrame((_, delta): void => {
    const mesh = meshRef.current
    const state = growth.current
    if (mesh === null || state.settled) {
      return
    }

    const step = Math.min(delta, 0.05) / entranceDuration
    let moving = false
    buildings.forEach((building, index) => {
      const wait = state.wait[index] ?? 0
      const goal = state.goal[index] ?? 1
      let level = state.level[index] ?? 0
      if (wait > 0) {
        state.wait[index] = wait - Math.min(delta, 0.05)
        moving = true
      } else if (level !== goal) {
        level = goal > level ? Math.min(level + step, goal) : Math.max(level - step * 1.6, goal)
        state.level[index] = level
        moving = true
      }

      const eased = 1 - (1 - level) ** 3
      transform.position.set(building.x, (building.height * eased) / 2, building.z)
      // Keep a sliver of height so a sunk building never becomes a degenerate (zero-scale) matrix.
      transform.scale.set(building.width, Math.max(building.height * eased, 0.0001), building.depth)
      transform.updateMatrix()
      mesh.setMatrixAt(index, transform.matrix)
    })

    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
    state.settled = !moving
  })

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (mesh === null) {
      return
    }

    const baseColor = new Color()
    const highlightColor = new Color('#ffffff')
    buildings.forEach((building, index) => {
      const color = baseColor.set(building.color)
      // The selected building stays lit up while its panel is open; hover is a lighter touch.
      if (index === selected) {
        color.lerp(highlightColor, 0.55)
      } else if (index === hovered) {
        color.lerp(highlightColor, 0.35)
      }
      mesh.setColorAt(index, color)
    })

    if (mesh.instanceColor !== null) {
      mesh.instanceColor.needsUpdate = true
    }
  }, [buildings, hovered, selected])

  const handlePointerMove = useCallback((event: ThreeEvent<PointerEvent>): void => {
    if (onHover === undefined || event.instanceId === undefined) {
      return
    }

    event.stopPropagation()
    onHover(event.instanceId, { x: event.clientX, y: event.clientY })
  }, [onHover])

  const handlePointerOut = useCallback((): void => {
    onHover?.(null, null)
  }, [onHover])

  const handleClick = useCallback((event: ThreeEvent<MouseEvent>): void => {
    if (onSelect === undefined || event.instanceId === undefined || !isClickGesture(event.delta)) {
      return
    }

    event.stopPropagation()
    onSelect(event.instanceId)
  }, [onSelect])

  if (buildings.length === 0) {
    return null
  }

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, buildings.length]}
      castShadow
      receiveShadow
      onPointerMove={onHover === undefined ? undefined : handlePointerMove}
      onPointerOut={onHover === undefined ? undefined : handlePointerOut}
      onClick={onSelect === undefined ? undefined : handleClick}
    />
  )
}

export default Buildings
