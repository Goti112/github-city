import { useLayoutEffect, useMemo, useRef, type ReactElement } from 'react'
import { useFrame } from '@react-three/fiber'
import { InstancedMesh, MeshBasicMaterial, Object3D, SphereGeometry } from 'three'
import type { Building } from '../lib/types'
import type { WindowGlowUniform } from './windowsMaterial'

type BeaconsProps = {
  buildings: Building[]
  windowGlow: WindowGlowUniform
}

// Aircraft-warning lights on the roof of every starred repository.
const Beacons = ({ buildings, windowGlow }: BeaconsProps): ReactElement | null => {
  const meshRef = useRef<InstancedMesh | null>(null)
  const starred = useMemo(() => buildings.filter((building) => building.stars > 0), [buildings])
  const geometry = useMemo(() => new SphereGeometry(0.16, 12, 8), [])
  const material = useMemo(() => new MeshBasicMaterial({ color: '#ff2d3d', toneMapped: false }), [])

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (mesh === null) {
      return
    }
    const transform = new Object3D()
    starred.forEach((building, index) => {
      transform.position.set(building.x, building.height + 0.22, building.z)
      transform.updateMatrix()
      mesh.setMatrixAt(index, transform.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [starred])

  useFrame(({ clock }) => {
    // Slow double blink, brighter at night.
    const phase = clock.elapsedTime % 2.4
    const on = phase < 0.12 || (phase > 0.3 && phase < 0.42)
    material.color.setRGB(1, 0.18, 0.24).multiplyScalar(on ? 1.2 + windowGlow.value * 2 : 0.25)
  })

  if (starred.length === 0) {
    return null
  }

  return <instancedMesh ref={meshRef} args={[geometry, material, starred.length]} raycast={() => null} />
}

export default Beacons
