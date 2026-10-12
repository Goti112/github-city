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
  onHover,
  onSelect,
}: BuildingsProps): ReactElement | null => {
  const meshRef = useRef<InstancedMesh | null>(null)
  const geometry = useMemo(() => new BoxGeometry(1, 1, 1), [])
  const transform = useMemo(() => new Object3D(), [])
  const entranceElapsed = useRef(0)
  const maximumRadius = useMemo(
    () => buildings.reduce((radius, building) => Math.max(radius, Math.hypot(building.x, building.z)), 1),
    [buildings],
  )
  const material = useMemo(() => createWindowsMaterial(windowGlow), [windowGlow])

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

    entranceElapsed.current = 0
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [buildings, geometry, transform])

  useFrame((_, delta): void => {
    const totalDuration = entranceDuration + maxEntranceDelay
    if (entranceElapsed.current >= totalDuration) {
      return
    }

    const mesh = meshRef.current
    if (mesh === null) {
      return
    }

    entranceElapsed.current = Math.min(entranceElapsed.current + delta, totalDuration)
    let isAnimating = false

    buildings.forEach((building, index) => {
      const distanceRatio = Math.hypot(building.x, building.z) / maximumRadius
      const delay = distanceRatio * maxEntranceDelay
      const rawProgress = Math.max(
        0,
        Math.min((entranceElapsed.current - delay) / entranceDuration, 1),
      )
      const easedProgress = 1 - (1 - rawProgress) ** 3
      isAnimating ||= rawProgress < 1

      transform.position.set(building.x, building.height * easedProgress / 2, building.z)
      transform.scale.set(building.width, building.height * easedProgress, building.depth)
      transform.updateMatrix()
      mesh.setMatrixAt(index, transform.matrix)
    })

    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
    if (!isAnimating) {
      entranceElapsed.current = totalDuration
    }
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
