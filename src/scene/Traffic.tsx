import { useLayoutEffect, useMemo, useRef, type ReactElement } from 'react'
import { useFrame } from '@react-three/fiber'
import { BoxGeometry, Color, InstancedMesh, MeshBasicMaterial, Object3D } from 'three'
import { PLAZA_RADIUS } from '../lib/cityLayout'
import { streetLines } from './cityExtras'
import type { WindowGlowUniform } from './windowsMaterial'

type TrafficProps = {
  radius: number
  windowGlow: WindowGlowUniform
}

type Car = {
  axis: 'x' | 'z'
  offset: number
  extent: number
  position: number
  speed: number // signed, units per second
}

const headlight = new Color('#fff2c6')
const taillight = new Color('#ff3b30')
const carsPerStreet = 0.18 // cars per unit of street length, keeps density similar for any city size
const maxCars = 140

// Deterministic pseudo-random so traffic looks the same on every visit.
const seeded = (seed: number): number => {
  const value = Math.sin(seed * 12.9898) * 43758.5453
  return value - Math.floor(value)
}

const Traffic = ({ radius, windowGlow }: TrafficProps): ReactElement | null => {
  const meshRef = useRef<InstancedMesh | null>(null)
  const geometry = useMemo(() => new BoxGeometry(0.42, 0.12, 0.2), [])
  const material = useMemo(() => new MeshBasicMaterial({ toneMapped: false }), [])
  const transform = useMemo(() => new Object3D(), [])

  const cars = useMemo<Car[]>(() => {
    const result: Car[] = []
    streetLines(radius).forEach((line, lineIndex) => {
      const count = Math.round(line.extent * 2 * carsPerStreet)
      for (let carIndex = 0; carIndex < count && result.length < maxCars; carIndex += 1) {
        const seed = lineIndex * 31 + carIndex * 7
        const direction = seeded(seed) > 0.5 ? 1 : -1
        result.push({
          ...line,
          position: (seeded(seed + 1) * 2 - 1) * line.extent,
          speed: direction * (2.2 + seeded(seed + 2) * 2.5),
        })
      }
    })
    return result
  }, [radius])

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (mesh === null) {
      return
    }
    // Cars coming towards the viewer show headlights, the rest taillights.
    cars.forEach((car, index) => mesh.setColorAt(index, car.speed > 0 ? headlight : taillight))
    if (mesh.instanceColor !== null) {
      mesh.instanceColor.needsUpdate = true
    }
  }, [cars])

  useFrame((_, delta) => {
    const mesh = meshRef.current
    if (mesh === null) {
      return
    }
    // Over-bright at night so the bloom pass turns them into streaks of light; dim during the day.
    material.color.setScalar(0.35 + windowGlow.value * 1.4)

    const step = Math.min(delta, 0.1)
    cars.forEach((car, index) => {
      car.position += car.speed * step
      if (car.position > car.extent) {
        car.position = -car.extent
      } else if (car.position < -car.extent) {
        car.position = car.extent
      }

      const x = car.axis === 'x' ? car.position : car.offset
      const z = car.axis === 'x' ? car.offset : car.position
      // Keep the plaza pedestrian-only.
      const visible = Math.hypot(x, z) > PLAZA_RADIUS + 0.6
      transform.position.set(x, 0.1, z)
      transform.rotation.set(0, car.axis === 'x' ? 0 : Math.PI / 2, 0)
      transform.scale.setScalar(visible ? 1 : 0)
      transform.updateMatrix()
      mesh.setMatrixAt(index, transform.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  })

  if (cars.length === 0) {
    return null
  }

  return <instancedMesh ref={meshRef} args={[geometry, material, cars.length]} raycast={() => null} />
}

export default Traffic
