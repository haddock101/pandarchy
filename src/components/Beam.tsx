/*

import React, { useRef, createContext, useContext } from 'react';
import { RigidBody, useRopeJoint, RapierRigidBody } from "@react-three/rapier";
import { DragControls } from "@react-three/drei";

const RopeJointConnection = ({ bodyA, bodyB, anchorA, anchorB, length }) => {
  useRopeJoint(bodyA, bodyB, [anchorA, anchorB, length]);
  return null;
};

export const Line = () => {
  const segmentA = useRef<RapierRigidBody>(null);
  const segmentB = useRef<RapierRigidBody>(null);

  useRopeJoint(segmentA, segmentB, [
    // Position of the joint in bodyA's local space
    [0, -1, 0],
    // Position of the joint in bodyB's local space
    [0, 1, 0],
    // The max distance between the two bodies / length of the rope
    5,
  ]);

  return (
    <group>
      <RigidBody ref={segmentA} position={[0, 6, 0]}>
        <mesh>
          <boxGeometry args={[0.1, 2, 0.1]} />
          <meshStandardMaterial color="chartreuse" />
        </mesh>
      </RigidBody>

      <RigidBody ref={segmentB} position={[0, 4, 0]}>

          <mesh>
            <boxGeometry args={[0.1, 2, 0.1]} />
            <meshStandardMaterial color="chartreuse" />
        </mesh>

      </RigidBody>
    </group>
  );
};

const Beam = () => {
  const totalSegments = 8;
  const segmentRefs = useRef([...Array(totalSegments)].map(() => React.createRef()));

  return (
    <>

      <RigidBody name="anchorbeam" ref={segmentRefs.current[0]} type="fixed" position={[0, 8, 0]}>
        <mesh>
          <boxGeometry args={[2, 2, 2]} />
          <meshStandardMaterial color="chartreuse" />
        </mesh>
      </RigidBody>
 */
{/* Dynamic Rope Segments */ }

/*
{
  [...Array(totalSegments - 1)].map((_, index) => {
        const currentIdx = index + 1;
        // Space segments downward vertically
        const position = [0, 8 - currentIdx * 0.8, 0];

        return (
          <RigidBody
            key={currentIdx}
            ref={segmentRefs.current[currentIdx]}
            position={position}
            linearDamping={0.5}
            angularDamping={0.5}
          >
            <mesh>
              <capsuleGeometry args={[0.1, 0.6, 4, 8]} />
              <meshStandardMaterial color="gray" />
            </mesh>
          </RigidBody>
        );
      })}
 */
{/* Instantiating the Joints between successive segment pairs */ }


/*
{
  [...Array(totalSegments - 1)].map((_, index) => (
        <RopeJointConnection
          key={index}
          bodyA={segmentRefs.current[index]}
          bodyB={segmentRefs.current[index + 1]}
          anchorA={[0, -0.4, 0]} // Bottom anchor of upper segment
          anchorB={[0, 0.4, 0]}  // Top anchor of lower segment
          length={0.2}           // Maximum separating distance allowable
        />
      ))}

      <Line />
    </>
  );
};
export default Beam;
 */
