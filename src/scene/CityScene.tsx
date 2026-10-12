import { Suspense, useCallback, useLayoutEffect, useMemo, useRef, useState, type ReactElement } from 'react'
import { OrbitControls, PerformanceMonitor, Stars } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import type { Building } from '../lib/types'
import type { PointerPosition } from '../ui/Tooltip'
import Beacons from './Beacons'
import Buildings from './Buildings'
import { CAMERA_FOV, cameraFraming, cityRadius } from './cameraFraming'
import { focusPose, introStartPosition, pickLandmark, type CameraPose } from './cityExtras'
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
  /** Index of the building the camera should fly to, or null for the overview. */
  focusIndex?: number | null
  /** History slider: only repositories created up to this year are standing. */
  visibleYear?: number | null
}

type CityRigProps = {
  buildings: Building[]
  timeOfDay: number
  windowGlow: WindowGlowUniform
  autoRotateSpeed: number
  intro: boolean
  focus: Building | null
}

type Vector3 = [number, number, number]

const introDuration = 3.6

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const easeInOutCubic = (progress: number): number =>
  progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2

type Tween = {
  elapsed: number
  duration: number
  from: CameraPose
  to: CameraPose
}

const focusDuration = 1.4

const lerp3 = (from: Vector3, to: Vector3, progress: number): Vector3 => [
  from[0] + (to[0] - from[0]) * progress,
  from[1] + (to[1] - from[1]) * progress,
  from[2] + (to[2] - from[2]) * progress,
]

// Camera, lighting and controls all depend on the framing, which needs the canvas aspect ratio,
// so they live inside the Canvas where useThree can read it. Every camera move (opening shot,
// flying to a building, flying back) is one tween of position + orbit target.
const CityRig = ({ buildings, timeOfDay, windowGlow, autoRotateSpeed, intro, focus }: CityRigProps): ReactElement => {
  const camera = useThree((state) => state.camera)
  const aspect = useThree((state) => state.size.width / Math.max(state.size.height, 1))
  const framing = useMemo(() => cameraFraming(buildings, aspect), [buildings, aspect])
  const controlsRef = useRef<OrbitControlsImpl | null>(null)
  const [moving, setMoving] = useState(false)
  const tween = useRef<Tween | null>(null)
  const playedFor = useRef<Building[] | null>(null)
  const hadFocus = useRef(false)
  const overview = useMemo<CameraPose>(() => ({ position: framing.position, target: framing.target }), [framing])

  const currentPose = useCallback((): CameraPose => {
    const controls = controlsRef.current
    return {
      position: [camera.position.x, camera.position.y, camera.position.z],
      target: controls === null ? overview.target : [controls.target.x, controls.target.y, controls.target.z],
    }
  }, [camera, overview])

  const startTween = useCallback((to: CameraPose, duration: number, from?: CameraPose): void => {
    tween.current = { elapsed: 0, duration, from: from ?? currentPose(), to }
    setMoving(true)
  }, [currentPose])

  const applyPose = useCallback((pose: CameraPose): void => {
    camera.position.set(...pose.position)
    controlsRef.current?.target.set(...pose.target)
    camera.lookAt(...pose.target)
  }, [camera])

  // R3F only reads the Canvas camera prop on mount, so re-frame when the city or screen changes.
  useLayoutEffect(() => {
    const shouldFly = intro && playedFor.current !== buildings && buildings.length > 0 && !prefersReducedMotion()
    if (shouldFly) {
      playedFor.current = buildings
      const start: CameraPose = { position: introStartPosition(overview.position, overview.target), target: overview.target }
      applyPose(start)
      startTween(overview, introDuration, start)
    } else if (tween.current === null && !hadFocus.current) {
      applyPose(overview)
    }
  }, [applyPose, buildings, intro, overview, startTween])

  // Fly to the selected building, and back to the overview when the selection is cleared.
  useLayoutEffect(() => {
    let destination: CameraPose | null = null
    if (focus !== null) {
      hadFocus.current = true
      const { position, target } = currentPose()
      destination = focusPose(focus, position, target)
    } else if (hadFocus.current) {
      hadFocus.current = false
      destination = overview
    }
    if (destination === null) {
      return
    }
    if (prefersReducedMotion()) {
      applyPose(destination)
    } else {
      startTween(destination, focusDuration)
    }
    // overview is read through currentPose/destination only when focus changes; a resize must not re-fly.
  }, [focus]) // oxlint-disable-line react-hooks/exhaustive-deps

  useFrame((_, delta) => {
    const current = tween.current
    if (current === null) {
      return
    }
    // Clamp the step: after a hidden tab comes back the first delta spans the whole pause,
    // which would otherwise skip the shot entirely.
    current.elapsed = Math.min(current.elapsed + Math.min(delta, 0.05), current.duration)
    const progress = easeInOutCubic(current.elapsed / current.duration)
    applyPose({
      position: lerp3(current.from.position, current.to.position, progress),
      target: lerp3(current.from.target, current.to.target, progress),
    })
    if (current.elapsed >= current.duration) {
      tween.current = null
      setMoving(false)
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
        ref={controlsRef}
        enabled={!moving}
        maxPolarAngle={Math.PI / 2.2}
        minDistance={6}
        maxDistance={framing.maxDistance}
        autoRotate={autoRotateSpeed > 0 && !moving}
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
  focusIndex = null,
  visibleYear = null,
}: CitySceneProps): ReactElement => {
  const windowGlow = useMemo<WindowGlowUniform>(
    () => ({ value: KEYFRAMES.sunset.windowGlow }),
    [],
  )
  // Adaptive quality: drop the render resolution on devices that cannot hold a smooth frame rate.
  const [dpr, setDpr] = useState<number>(() => Math.min(window.devicePixelRatio, 2))
  const radius = useMemo(() => cityRadius(buildings), [buildings])
  const landmarkIndex = useMemo(() => (showLandmark ? pickLandmark(buildings) : null), [buildings, showLandmark])
  const landmark = landmarkIndex === null ? undefined : buildings[landmarkIndex]
  const standing = useMemo(
    () => (visibleYear === null ? buildings : buildings.filter((building) => building.createdYear <= visibleYear)),
    [buildings, visibleYear],
  )

  return (
    <div className="city-scene" role="region" aria-label="Escena 3D de repositorios">
      <Canvas
        dpr={dpr}
        shadows
        gl={{ preserveDrawingBuffer: true }}
        camera={{ fov: CAMERA_FOV, far: 4000 }}
        onCreated={({ gl }) => onCanvasReady?.(gl.domElement)}
      >
        <PerformanceMonitor onDecline={() => setDpr((current) => Math.max(1, current * 0.75))} />
        <CityRig
          buildings={buildings}
          timeOfDay={timeOfDay}
          windowGlow={windowGlow}
          autoRotateSpeed={autoRotateSpeed}
          intro={intro}
          focus={focusIndex === null ? null : buildings[focusIndex] ?? null}
        />
        <Suspense fallback={null}>
          <Ground avatarUrl={avatarUrl} radius={radius} windowGlow={windowGlow} />
        </Suspense>
        <Buildings
          buildings={buildings}
          windowGlow={windowGlow}
          hovered={hovered}
          selected={focusIndex}
          visibleYear={visibleYear}
          onHover={onHover}
          onSelect={onSelect}
        />
        <Traffic radius={radius} windowGlow={windowGlow} />
        <Beacons buildings={standing} windowGlow={windowGlow} />
        {landmark !== undefined && (visibleYear === null || landmark.createdYear <= visibleYear) && (
          <Landmark building={landmark} windowGlow={windowGlow} />
        )}
      </Canvas>
    </div>
  )
}

export default CityScene
