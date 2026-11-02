import { useGLTF } from '@react-three/drei';
import { MeshCollider, RigidBody } from '@react-three/rapier';
import { useMemo } from 'react';

export default function FlipperModel() {
  const { scene } = useGLTF('./gltf/flipperv2.gltf');
  // useGLTF caches the scene, so each flipper gets its own copy instead of sharing (and rescaling) the original
  const flipperCloneL = useMemo(() => {
    const copy = scene.clone();
    copy.traverse((o) => (o.castShadow = true));
    return copy;
  }, [scene]);
  const flipperCloneR = useMemo(() => {
    const copy = scene.clone();
    copy.traverse((o) => (o.castShadow = true));
    return copy;
  }, [scene]);
  return (
    <>
      <RigidBody type="fixed">
        <MeshCollider type="hull">
          <primitive object={flipperCloneL} position={[0.2, 0, 0]} scale={[1, 1, 1]} />
        </MeshCollider>
      </RigidBody>
      <RigidBody type="fixed">
        <MeshCollider type="hull">
          <primitive object={flipperCloneR} position={[0, 0, 0]} scale={[1, 1, 1]} />
        </MeshCollider>
      </RigidBody>
    </>  
  );
}