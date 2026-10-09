import type { ReactElement } from 'react'
import { useTexture } from '@react-three/drei'

type GroundProps = {
  avatarUrl: string
}

const AvatarSign = ({ avatarUrl }: GroundProps): ReactElement => {
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

const Ground = ({ avatarUrl }: GroundProps): ReactElement => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, 0]} receiveShadow>
      <planeGeometry args={[2000, 2000]} />
      <meshStandardMaterial color="#111a22" roughness={0.96} />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]} receiveShadow>
      <circleGeometry args={[9, 64]} />
      <meshStandardMaterial color="#27333b" roughness={0.9} />
    </mesh>
    <AvatarSign avatarUrl={avatarUrl} />
  </group>
)

export default Ground
