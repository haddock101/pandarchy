import * as THREE from 'three';
import { RigidBody } from "@react-three/rapier";
import type { Vector3 } from '@react-three/fiber';
import type { RefObject } from '@react-three/fiber/dist/declarations/react-reconciler';

export function Halfpipe({ radius, length, rotation, ref }: { radius: number; length: number; rotation: Vector3, ref: RefObject }) {

  return (
    <RigidBody type="fixed" colliders="trimesh">
      <mesh
        ref={ref}
        castShadow
        receiveShadow
        /* @ts-expect-error: Later */
        rotation={rotation} position={[0, radius-0.07, 0]}>
      <cylinderGeometry
        args={[radius, radius, length, 32, 1, true, 0, Math.PI]}
      />
      <meshStandardMaterial
        color="hotpink"
        side={THREE.DoubleSide}
      />
      </mesh>
    </RigidBody>
  )
}

export function Pipe90({ rotation, position, ref }: { rotation: Vector3, position: Vector3; ref: RefObject; }) {
  return (
    <RigidBody ref={ref} type="fixed" colliders="trimesh">
      {/* @ts-expect-error: Later */}
      <mesh castShadow receiveShadow rotation={rotation} position={position}>
      {/* radius, tube, radialSegments, tubularSegments, arc */}
      <torusGeometry args={[3, 1, 32, 100, (Math.PI/180) * 90, Math.PI,Math.PI ]} />
      <meshStandardMaterial color="hotpink" side={THREE.DoubleSide} />
      </mesh>
    </RigidBody>
  )
}
export function Pipe90Medium({ rotation, position, ref }: { rotation: Vector3, position: Vector3; ref: RefObject; }) {
  return (
    <RigidBody type="fixed" colliders="trimesh">
      {/* @ts-expect-error: Later */}
      <mesh ref={ref} castShadow receiveShadow rotation={rotation} position={position}>
      {/* radius, tube, radialSegments, tubularSegments, arc */}
      <torusGeometry args={[2, 1, 32, 100, (Math.PI/180) * 90, Math.PI,Math.PI ]} />
      <meshStandardMaterial color="hotpink" side={THREE.DoubleSide} />
      </mesh>
    </RigidBody>
  )
}

export function Pipe90Tight({ rotation, position, ref }: { rotation: Vector3, position: Vector3, ref: RefObject; }) {
  return (
    <RigidBody type="fixed" colliders="trimesh">
      {/* @ts-expect-error: Later */}
      <mesh ref={ref} castShadow receiveShadow rotation={rotation} position={position}>
      {/* radius, tube, radialSegments, tubularSegments, arc */}
      <torusGeometry args={[1, 1, 32, 100, (Math.PI/180) * 90, Math.PI]} />
      <meshStandardMaterial color="hotpink" side={THREE.DoubleSide} />
      </mesh>
    </RigidBody>
  )
}

export function HalfFunnel({ radius, length }: { radius: number; length: number; }) {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry
        args={[radius, 15, length, 32, 1, true, 0, Math.PI]}
      />
      <meshStandardMaterial
        color="hotpink"
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

export function Funnel({ radius, position }: { radius: number; position: Vector3 }) {
  return (
    <RigidBody type="fixed" colliders="trimesh"  position={position} >
    <mesh castShadow receiveShadow rotation={[Math.PI / 2, (Math.PI/180) * 90, (Math.PI/180) * 90 ]}>
      <cylinderGeometry
        args={[radius, 2, 1, 32, 1, true, 0]}
      />
      <meshStandardMaterial
        color="hotpink"
        side={THREE.DoubleSide}
      />
      </mesh>
    </RigidBody>
  )
}
