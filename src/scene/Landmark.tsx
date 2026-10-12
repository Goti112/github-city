import { useMemo, useRef, type ReactElement } from 'react'
import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, type MeshBasicMaterial } from 'three'
import type { Building } from '../lib/types'
import type { WindowGlowUniform } from './windowsMaterial'

type LandmarkProps = {
  building: Building
  windowGlow: WindowGlowUniform
}

const beamHeight = 70

// The showpiece repo gets a searchlight beam and a floating name tag.
const Landmark = ({ building, windowGlow }: LandmarkProps): ReactElement => {
  const beamRef = useRef<MeshBasicMaterial | null>(null)
  const radius = useMemo(() => Math.max(building.width, building.depth) * 0.32, [building])

  useFrame(({ clock }) => {
    if (beamRef.current !== null) {
      // Invisible by day, a soft pulsing column at night.
      beamRef.current.opacity = windowGlow.value * (0.1 + Math.sin(clock.elapsedTime * 1.4) * 0.025)
    }
  })

  return (
    <group position={[building.x, 0, building.z]}>
      <mesh position={[0, building.height + beamHeight / 2, 0]} raycast={() => null}>
        <cylinderGeometry args={[radius * 0.6, radius, beamHeight, 24, 1, true]} />
        <meshBasicMaterial
          ref={beamRef}
          color="#9fe8ff"
          transparent
          opacity={0}
          depthWrite={false}
          blending={AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
      <Html position={[0, building.height + 2.2, 0]} center zIndexRange={[1, 0]} className="landmark-tag">
        <span aria-hidden="true">{building.stars > 0 ? '★' : '▲'}</span> {building.repoName}
      </Html>
    </group>
  )
}

export default Landmark
