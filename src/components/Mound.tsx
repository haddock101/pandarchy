import { RigidBody } from "@react-three/rapier";
import { useTexture } from "@react-three/drei";

function Mound({ color }: { color: string; }) {
  const alphaMap = useTexture("textures/Sphere_alphaMap.jpg");
  const colorMap = useTexture("textures/cb_colorMap.jpg");
  // const displacementMap = useTexture("textures/cb_colorMap.jpg");
  const normalMap = useTexture("textures/cb_colorMap.jpg");
  const roughnessMap = useTexture("textures/cb_colorMap.jpg");

  return (
    <RigidBody type="fixed" colliders="hull" >
      <mesh
        position={[-1.5, -0.48, 0]}
        rotation={[
          (Math.PI / 180) * 0,
          (Math.PI / 180) * 0,
          (Math.PI / 180) * 0,
        ]}
        scale={[0.5, 0.22, 0.5]}
      >
        <sphereGeometry
          args={[
            2, // radius (size of the mound)
            32, // widthSegments (smoothness)
            32, // heightSegments
            0, // phiStart
            Math.PI * 2, // phiLength (full horizontal circle)
            0, // thetaStart (starts at the very top pole)
            Math.PI / 2, // thetaLength (stops exactly at the equator, creating a hemisphere)
          ]}
        />
        <meshStandardMaterial
          map={colorMap}
          bumpMap={normalMap}
          //roughness={1}
          // roughnessMap={roughnessMap}
            aoMap={roughnessMap}
           color={color}
          alphaMap={alphaMap}
          transparent={true}
          opacity={1}
          alphaTest={0.4} // Optional: cuts off semi-transparent pixels sharply
        />
      </mesh>
    </RigidBody>
  );
}
export default Mound;
