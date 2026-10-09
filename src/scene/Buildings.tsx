import { useCallback, useLayoutEffect, useMemo, useRef, type ReactElement } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import { BoxGeometry, Color, InstancedMesh, MeshStandardMaterial, Object3D } from 'three'
import type { Building } from '../lib/types'
import type { PointerPosition } from '../ui/Tooltip'
import { isClickGesture } from './isClickGesture'

type BuildingsProps = {
  buildings: Building[]
  hovered: number | null
  onHover: (index: number | null, position: PointerPosition | null) => void
  onSelect: (index: number) => void
}

const Buildings = ({ buildings, hovered, onHover, onSelect }: BuildingsProps): ReactElement | null => {
  const meshRef = useRef<InstancedMesh | null>(null)
  const geometry = useMemo(() => new BoxGeometry(1, 1, 1), [])
  const material = useMemo(() => new MeshStandardMaterial({
    color: '#ffffff',
    roughness: 0.7,
    metalness: 0.08,
  }), [])

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (mesh === null) {
      return
    }

    const transform = new Object3D()
    buildings.forEach((building, index) => {
      transform.position.set(building.x, building.height / 2, building.z)
      transform.scale.set(building.width, building.height, building.depth)
      transform.updateMatrix()
      mesh.setMatrixAt(index, transform.matrix)
    })

    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [buildings])

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (mesh === null) {
      return
    }

    const baseColor = new Color()
    const highlightColor = new Color('#ffffff')
    buildings.forEach((building, index) => {
      const color = baseColor.set(building.color)
      if (index === hovered) {
        color.lerp(highlightColor, 0.35)
      }
      mesh.setColorAt(index, color)
    })

    if (mesh.instanceColor !== null) {
      mesh.instanceColor.needsUpdate = true
    }
  }, [buildings, hovered])

  const handlePointerMove = useCallback((event: ThreeEvent<PointerEvent>): void => {
    if (event.instanceId === undefined) {
      return
    }

    event.stopPropagation()
    onHover(event.instanceId, { x: event.clientX, y: event.clientY })
  }, [onHover])

  const handlePointerOut = useCallback((): void => {
    onHover(null, null)
  }, [onHover])

  const handleClick = useCallback((event: ThreeEvent<MouseEvent>): void => {
    if (event.instanceId === undefined || !isClickGesture(event.delta)) {
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
      onPointerMove={handlePointerMove}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    />
  )
}

export default Buildings
