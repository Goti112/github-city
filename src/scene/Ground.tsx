import { useMemo, type ReactElement } from 'react'
import { useTexture } from '@react-three/drei'
import { MeshStandardMaterial } from 'three'
import { CELL, PLAZA_RADIUS } from '../lib/cityLayout'
import type { WindowGlowUniform } from './windowsMaterial'

type GroundProps = {
  avatarUrl: string
  radius: number
  windowGlow: WindowGlowUniform
}

const AvatarSign = ({ avatarUrl }: { avatarUrl: string }): ReactElement => {
  const avatarTexture = useTexture(avatarUrl)

  return (
    <group>
      <mesh position={[0, 2.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[4, 5.2, 1]} />
        <meshStandardMaterial color="#263844" roughness={0.72} />
      </mesh>
      <mesh position={[0, 2.7, 0.51]}>
        <planeGeometry args={[3.4, 3.4]} />
        <meshBasicMaterial map={avatarTexture} toneMapped={false} />
      </mesh>
    </group>
  )
}

// Asphalt with glowing street lines halfway between plots, fading out past the edge of the city.
const createStreetMaterial = (radius: number, windowGlow: WindowGlowUniform): MeshStandardMaterial => {
  const material = new MeshStandardMaterial({ color: '#0e161d', roughness: 0.92 })
  material.onBeforeCompile = (shader): void => {
    shader.uniforms.uGlow = windowGlow
    shader.uniforms.uCityRadius = { value: radius }
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vCityPos;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvCityPos = (modelMatrix * vec4(transformed, 1.0)).xyz;')
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', [
        '#include <common>',
        'varying vec3 vCityPos;',
        'uniform float uGlow;',
        'uniform float uCityRadius;',
      ].join('\n'))
      .replace('#include <emissivemap_fragment>', [
        '#include <emissivemap_fragment>',
        `vec2 streetCell = abs(fract(vCityPos.xz / ${CELL.toFixed(1)} + 0.5) - 0.5) * ${CELL.toFixed(1)};`,
        // Distance to the nearest plot centre is 1.5 (half a CELL) on a street, on either axis.
        `float street = 1.0 - smoothstep(0.03, 0.09, ${(CELL / 2).toFixed(1)} - max(streetCell.x, streetCell.y));`,
        'float fromCentre = length(vCityPos.xz);',
        `float inCity = smoothstep(${PLAZA_RADIUS.toFixed(1)}, ${(PLAZA_RADIUS + 1).toFixed(1)}, fromCentre)`,
        '  * (1.0 - smoothstep(uCityRadius, uCityRadius + 6.0, fromCentre));',
        'totalEmissiveRadiance += vec3(0.25, 0.75, 0.95) * street * inCity * (0.03 + uGlow * 0.14);',
      ].join('\n'))
  }
  material.customProgramCacheKey = (): string => `github-city-streets-${radius.toFixed(1)}`
  return material
}

const Ground = ({ avatarUrl, radius, windowGlow }: GroundProps): ReactElement => {
  const streetMaterial = useMemo(() => createStreetMaterial(radius, windowGlow), [radius, windowGlow])

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, 0]} receiveShadow material={streetMaterial}>
        <planeGeometry args={[2000, 2000]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]} receiveShadow>
        <circleGeometry args={[PLAZA_RADIUS, 64]} />
        <meshStandardMaterial color="#27333b" roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <ringGeometry args={[PLAZA_RADIUS - 0.18, PLAZA_RADIUS, 96]} />
        <meshBasicMaterial color="#73e0c0" toneMapped={false} transparent opacity={0.55} />
      </mesh>
      <AvatarSign avatarUrl={avatarUrl} />
    </group>
  )
}

export default Ground
