import { Suspense, useLayoutEffect, useMemo, type ReactElement } from 'react'
import { OrbitControls } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import type { Building } from '../lib/types'
import type { PointerPosition } from '../ui/Tooltip'
import Buildings from './Buildings'
import { CAMERA_FOV, cameraFraming, type CameraFraming } from './cameraFraming'
import Ground from './Ground'
import Sky from './Sky'
import { KEYFRAMES } from './timeOfDay'
import type { WindowGlowUniform } from './windowsMaterial'

type CitySceneProps = {
  buildings: Building[]
  avatarUrl: string
  timeOfDay: number
  hovered: number | null
  onHover?: (index: number | null, position: PointerPosition | null) => void
  onSelect?: (index: number) => void
  onCanvasReady?: (canvas: HTMLCanvasElement) => void
  autoRotateSpeed: number
}

// R3F only reads the Canvas camera prop on mount, so re-frame when the city changes.
const FrameCamera = ({ framing }: { framing: CameraFraming }): null => {
  const camera = useThree((state) => state.camera)
  useLayoutEffect(() => {
    camera.position.set(...framing.position)
    camera.lookAt(...framing.target)
  }, [camera, framing])
  return null
}

const CityScene = ({
  buildings,
  avatarUrl,
  timeOfDay,
  hovered,
  onHover,
  onSelect,
  onCanvasReady,
  autoRotateSpeed,
}: CitySceneProps): ReactElement => {
  const framing = useMemo(() => cameraFraming(buildings), [buildings])
  const windowGlow = useMemo<WindowGlowUniform>(
    () => ({ value: KEYFRAMES.sunset.windowGlow }),
    [],
  )

  return (
    <div className="city-scene" role="region" aria-label="Escena 3D de repositorios">
      <Canvas
        dpr={[1, 2]}
        shadows
        gl={{ preserveDrawingBuffer: true }}
        camera={{ position: framing.position, fov: CAMERA_FOV }}
        onCreated={({ gl }) => onCanvasReady?.(gl.domElement)}
      >
        <FrameCamera framing={framing} />
        <Sky
          timeOfDay={timeOfDay}
          fogNear={framing.fogNear}
          fogFar={framing.fogFar}
          windowGlow={windowGlow}
        />
        <Suspense fallback={null}>
          <Ground avatarUrl={avatarUrl} />
        </Suspense>
        <Buildings
          buildings={buildings}
          windowGlow={windowGlow}
          hovered={hovered}
          onHover={onHover}
          onSelect={onSelect}
        />
        <OrbitControls
          target={framing.target}
          maxPolarAngle={Math.PI / 2.2}
          minDistance={10}
          maxDistance={framing.maxDistance}
          autoRotate={autoRotateSpeed > 0}
          autoRotateSpeed={autoRotateSpeed}
          enableDamping
          dampingFactor={0.08}
        />
      </Canvas>
    </div>
  )
}

export default CityScene
