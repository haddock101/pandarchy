import { RigidBody } from "@react-three/rapier";
import { SCENE } from "../config";
import { num, surfaceHover } from "../hoverInfo.ts";

const SIZE: [number, number, number] = [105, 2, 31];
const FRICTION = 0.55;
const [sx, sy, sz] = SCENE.floorScale;
// App draws this scaled by SCENE.floorScale, so the size is scaled back to the world for the hover info
const hover = surfaceHover("ground", "Ground", [
  ["size", `${num(SIZE[0] * sx, 2)} × ${num(SIZE[1] * sy, 2)} × ${num(SIZE[2] * sz, 2)}`],
  ["friction", num(FRICTION, 2)],
]);

// The green ground under everything. The checkered floors and their colliders live with the walls (Wall.tsx).
function Floor() {
  return (
    <>
      <RigidBody type="fixed" friction={FRICTION}>
        <mesh position={[0, -1.6, 0]} {...hover}>
          {/* <cylinderGeometry args={[5, 5, 2, 32]} /> */}
          <boxGeometry args={SIZE} />
          <meshStandardMaterial color="chartreuse" />
        </mesh>
      </RigidBody>
    </>
  );
}
export default Floor;
