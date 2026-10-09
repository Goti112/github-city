import { useLayoutEffect, useMemo, useRef, type ReactElement } from 'react'
import { BoxGeometry, Color, InstancedMesh, MeshStandardMaterial, Object3D } from 'three'
import type { Building } from '../lib/types'

type BuildingsProps = {
  buildings: Building[]
}

const Buildings = ({ buildings }: BuildingsProps): ReactElement | null => {
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
    const instanceColor = new Color()
    buildings.forEach((building, index) => {
      transform.position.set(building.x, building.height / 2, building.z)
      transform.scale.set(building.width, building.height, building.depth)
      transform.updateMatrix()
      mesh.setMatrixAt(index, transform.matrix)
      mesh.setColorAt(index, instanceColor.set(building.color))
    })

    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor !== null) {
      mesh.instanceColor.needsUpdate = true
    }
    mesh.computeBoundingSphere()
  }, [buildings])

  if (buildings.length === 0) {
    return null
  }

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, buildings.length]}
      castShadow
      receiveShadow
    />
  )
}

export default Buildings
