import { Suspense, useLayoutEffect, useMemo, useRef, useState, type ReactElement } from 'react'
import { OrbitControls, Stars } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import type { Building } from '../lib/types'
import type { PointerPosition } from '../ui/Tooltip'
import Beacons from './Beacons'
import Buildings from './Buildings'
import { CAMERA_FOV, cameraFraming, cityRadius } from './cameraFraming'
import { introStartPosition, pickLandmark } from './cityExtras'
import Ground from './Ground'
import Landmark from './Landmark'
import Sky from './Sky'
import { KEYFRAMES } from './timeOfDay'
import Traffic from './Traffic'
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
  /** Opening fly-in shot; skipped automatically when the viewer prefers reduced motion. */
  intro?: boolean
  showLandmark?: boolean
}

type CityRigProps = {
  buildings: Building[]
  timeOfDay: number
  windowGlow: WindowGlowUniform
  autoRotateSpeed: number
  intro: boolean
}

const introDuration = 3.6

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const easeInOutCubic = (progress: number): number =>
  progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2

// Camera, lighting and controls all depend on the framing, which needs the canvas aspect ratio,
// so they live inside the Canvas where useThree can read it.
const CityRig = ({ buildings, timeOfDay, windowGlow, autoRotateSpeed, intro }: CityRigProps): ReactElement => {
  const camera = useThree((state) => state.camera)
  const aspect = useThree((state) => state.size.width / Math.max(state.size.height, 1))
  const framing = useMemo(() => cameraFraming(buildings, aspect), [buildings, aspect])
  const [flying, setFlying] = useState(false)
  const flight = useRef<{ elapsed: number; start: [number, number, number] } | null>(null)
  const playedFor = useRef<Building[] | null>(null)

  // R3F only reads the Canvas camera prop on mount, so re-frame when the city or screen changes.
  useLayoutEffect(() => {
    const shouldFly = intro && playedFor.current !== buildings && buildings.length > 0 && !prefersReducedMotion()
    if (shouldFly) {
      playedFor.current = buildings
      const start = introStartPosition(framing.position, framing.target)
      flight.current = { elapsed: 0, start }
      camera.position.set(...start)
      setFlying(true)
    } else if (flight.current === null) {
      camera.position.set(...framing.position)
    }
    camera.lookAt(...framing.target)
  }, [buildings, camera, framing, intro])

  useFrame((_, delta) => {
    const current = flight.current
    if (current === null) {
      return
    }
    // Clamp the step: after a hidden tab comes back the first delta spans the whole pause,
    // which would otherwise skip the shot entirely.
    current.elapsed = Math.min(current.elapsed + Math.min(delta, 0.05), introDuration)
    const progress = easeInOutCubic(current.elapsed / introDuration)
    const [startX, startY, startZ] = current.start
    const [endX, endY, endZ] = framing.position
    camera.position.set(
      startX + (endX - startX) * progress,
      startY + (endY - startY) * progress,
      startZ + (endZ - startZ) * progress,
    )
    camera.lookAt(...framing.target)
    if (current.elapsed >= introDuration) {
      flight.current = null
      setFlying(false)
    }
  })

  return (
    <>
      <Sky
        timeOfDay={timeOfDay}
        fogNear={framing.fogNear}
        fogFar={framing.fogFar}
        windowGlow={windowGlow}
      />
      {timeOfDay >= 0.75 && <Stars radius={framing.fogFar * 1.2} depth={40} count={2500} factor={4} fade speed={0.6} />}
      <OrbitControls
        enabled={!flying}
        target={framing.target}
        maxPolarAngle={Math.PI / 2.2}
        minDistance={10}
        maxDistance={framing.maxDistance}
        autoRotate={autoRotateSpeed > 0 && !flying}
        autoRotateSpeed={autoRotateSpeed}
        enableDamping
        dampingFactor={0.08}
      />
    </>
  )
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
  intro = false,
  showLandmark = true,
}: CitySceneProps): ReactElement => {
  const windowGlow = useMemo<WindowGlowUniform>(
    () => ({ value: KEYFRAMES.sunset.windowGlow }),
    [],
  )
  const radius = useMemo(() => cityRadius(buildings), [buildings])
  const landmarkIndex = useMemo(() => (showLandmark ? pickLandmark(buildings) : null), [buildings, showLandmark])
  const landmark = landmarkIndex === null ? undefined : buildings[landmarkIndex]

  return (
    <div className="city-scene" role="region" aria-label="Escena 3D de repositorios">
      <Canvas
        dpr={[1, 2]}
        shadows
        gl={{ preserveDrawingBuffer: true }}
        camera={{ fov: CAMERA_FOV, far: 4000 }}
        onCreated={({ gl }) => onCanvasReady?.(gl.domElement)}
      >
        <CityRig
          buildings={buildings}
          timeOfDay={timeOfDay}
          windowGlow={windowGlow}
          autoRotateSpeed={autoRotateSpeed}
          intro={intro}
        />
        <Suspense fallback={null}>
          <Ground avatarUrl={avatarUrl} radius={radius} windowGlow={windowGlow} />
        </Suspense>
        <Buildings
          buildings={buildings}
          windowGlow={windowGlow}
          hovered={hovered}
          onHover={onHover}
          onSelect={onSelect}
        />
        <Traffic radius={radius} windowGlow={windowGlow} />
        <Beacons buildings={buildings} windowGlow={windowGlow} />
        {landmark !== undefined && <Landmark building={landmark} windowGlow={windowGlow} />}
      </Canvas>
    </div>
  )
}

export default CityScene
