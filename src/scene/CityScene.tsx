import { Suspense, type ReactElement } from 'react'
import { OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import type { Building } from '../lib/types'
import type { PointerPosition } from '../ui/Tooltip'
import Buildings from './Buildings'
import Ground from './Ground'

type CitySceneProps = {
  buildings: Building[]
  avatarUrl: string
  hovered: number | null
  onHover: (index: number | null, position: PointerPosition | null) => void
  onSelect: (index: number) => void
}

const cameraMaxDistance = (buildings: Building[]): number => {
  const cityRadius = buildings.reduce((radius, building) =>
    Math.max(radius, Math.hypot(building.x, building.z) + Math.max(building.width, building.depth)),
  0)
  return Math.max(80, cityRadius * 2.5)
}

const CityScene = ({
  buildings,
  avatarUrl,
  hovered,
  onHover,
  onSelect,
}: CitySceneProps): ReactElement => {
  const maxDistance = cameraMaxDistance(buildings)

  return (
    <div className="city-scene" role="region" aria-label="Escena 3D de repositorios">
      <Canvas
        shadows
        gl={{ preserveDrawingBuffer: true }}
        camera={{ position: [40, 40, 40], fov: 45 }}
      >
        <color attach="background" args={['#101820']} />
        <fog attach="fog" args={['#101820', maxDistance * 0.38, maxDistance * 1.25]} />
        <ambientLight intensity={1.05} />
        <directionalLight
          castShadow
          position={[35, 55, 24]}
          intensity={1.8}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <Suspense fallback={null}>
          <Ground avatarUrl={avatarUrl} />
        </Suspense>
        <Buildings
          buildings={buildings}
          hovered={hovered}
          onHover={onHover}
          onSelect={onSelect}
        />
        <OrbitControls
          target={[0, 0, 0]}
          maxPolarAngle={Math.PI / 2.2}
          minDistance={10}
          maxDistance={maxDistance}
          enableDamping
          dampingFactor={0.08}
        />
      </Canvas>
    </div>
  )
}

export default CityScene
