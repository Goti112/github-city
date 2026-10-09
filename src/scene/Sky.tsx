import {
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type ReactElement,
} from 'react'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { useFrame } from '@react-three/fiber'
import type { AmbientLight, Color, DirectionalLight, Fog } from 'three'
import type { WindowGlowUniform } from './windowsMaterial'
import { lightingAt } from './timeOfDay'

type SkyProps = {
  timeOfDay: number
  maxDistance: number
  windowGlow: WindowGlowUniform
}

type LightingTransition = {
  start: number
  target: number
  elapsed: number
}

type BloomHandle = {
  intensity: number
}

const transitionDuration = 1.5

const Sky = ({ timeOfDay, maxDistance, windowGlow }: SkyProps): ReactElement => {
  const backgroundRef = useRef<Color | null>(null)
  const fogRef = useRef<Fog | null>(null)
  const ambientLightRef = useRef<AmbientLight | null>(null)
  const sunRef = useRef<DirectionalLight | null>(null)
  const bloomRef = useRef<BloomHandle | null>(null)
  const bloomComponentRef = bloomRef as unknown as NonNullable<ComponentPropsWithRef<typeof Bloom>['ref']>
  const windowGlowRef = useRef(windowGlow)
  const currentTime = useRef(timeOfDay)
  const transition = useRef<LightingTransition>({
    start: timeOfDay,
    target: timeOfDay,
    elapsed: transitionDuration,
  })
  const [initialLighting] = useState(() => lightingAt(timeOfDay))

  useEffect(() => {
    const start = currentTime.current
    transition.current = {
      start,
      target: timeOfDay,
      elapsed: start === timeOfDay ? transitionDuration : 0,
    }

    if (start === timeOfDay) {
      windowGlowRef.current.value = initialLighting.windowGlow
    }
  }, [initialLighting, timeOfDay, windowGlow])

  useFrame((_, delta): void => {
    const activeTransition = transition.current
    if (activeTransition.elapsed >= transitionDuration) {
      return
    }

    activeTransition.elapsed = Math.min(activeTransition.elapsed + delta, transitionDuration)
    const rawProgress = activeTransition.elapsed / transitionDuration
    const easedProgress = 1 - (1 - rawProgress) ** 3
    const nextTime = activeTransition.start
      + (activeTransition.target - activeTransition.start) * easedProgress
    const lighting = lightingAt(nextTime)

    currentTime.current = nextTime
    windowGlowRef.current.value = lighting.windowGlow

    if (
      backgroundRef.current === null
      || fogRef.current === null
      || ambientLightRef.current === null
      || sunRef.current === null
      || bloomRef.current === null
    ) {
      throw new Error('La escena de iluminación no está completamente montada')
    }

    backgroundRef.current.set(lighting.sky)
    fogRef.current.color.set(lighting.sky)
    ambientLightRef.current.intensity = lighting.ambient
    sunRef.current.intensity = lighting.sun
    bloomRef.current.intensity = lighting.bloom

    if (activeTransition.elapsed === transitionDuration) {
      currentTime.current = activeTransition.target
    }
  })

  return (
    <>
      <color ref={backgroundRef} attach="background" args={[initialLighting.sky]} />
      <fog
        ref={fogRef}
        attach="fog"
        args={[initialLighting.sky, maxDistance * 0.38, maxDistance * 1.25]}
      />
      <ambientLight ref={ambientLightRef} intensity={initialLighting.ambient} />
      <directionalLight
        ref={sunRef}
        castShadow
        position={[35, 55, 24]}
        intensity={initialLighting.sun}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <EffectComposer multisampling={0}>
        <Bloom
          ref={bloomComponentRef}
          intensity={initialLighting.bloom}
          luminanceThreshold={0.8}
          luminanceSmoothing={0.15}
          mipmapBlur
        />
      </EffectComposer>
    </>
  )
}

export default Sky
