"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sparkles } from "@react-three/drei";
import { Color, Group, MathUtils, Mesh, MeshStandardMaterial } from "three";
import { RealisticSignerModel } from "@/components/avatar/RealisticSignerModel";

export type HologramPose =
  | "neutral"
  | "wave"
  | "thank-you"
  | "yes"
  | "no"
  | "please"
  | "help"
  | "question";

interface HologramSigner3DProps {
  pose: HologramPose;
}

const poseAngles: Record<
  HologramPose,
  {
    headX: number;
    headY: number;
    leftShoulderZ: number;
    rightShoulderZ: number;
    leftElbowZ: number;
    rightElbowZ: number;
  }
> = {
  neutral: {
    headX: 0,
    headY: 0,
    leftShoulderZ: 0.35,
    rightShoulderZ: -0.35,
    leftElbowZ: 0.2,
    rightElbowZ: -0.2,
  },
  wave: {
    headX: 0.04,
    headY: -0.08,
    leftShoulderZ: 0.4,
    rightShoulderZ: -1.05,
    leftElbowZ: 0.22,
    rightElbowZ: -0.8,
  },
  "thank-you": {
    headX: -0.05,
    headY: 0.05,
    leftShoulderZ: 0.38,
    rightShoulderZ: -0.65,
    leftElbowZ: 0.25,
    rightElbowZ: -1.0,
  },
  yes: {
    headX: 0.12,
    headY: 0,
    leftShoulderZ: 0.4,
    rightShoulderZ: -0.4,
    leftElbowZ: 0.15,
    rightElbowZ: -0.15,
  },
  no: {
    headX: 0.02,
    headY: 0.3,
    leftShoulderZ: 0.35,
    rightShoulderZ: -0.35,
    leftElbowZ: 0.18,
    rightElbowZ: -0.18,
  },
  please: {
    headX: 0.02,
    headY: 0.04,
    leftShoulderZ: 0.48,
    rightShoulderZ: -0.55,
    leftElbowZ: 0.7,
    rightElbowZ: -0.9,
  },
  help: {
    headX: 0.04,
    headY: 0.02,
    leftShoulderZ: 0.95,
    rightShoulderZ: -0.95,
    leftElbowZ: 0.7,
    rightElbowZ: -0.7,
  },
  question: {
    headX: 0.07,
    headY: 0.1,
    leftShoulderZ: 0.62,
    rightShoulderZ: -0.72,
    leftElbowZ: 0.5,
    rightElbowZ: -0.82,
  },
};

function SignerRobot({ pose }: { pose: HologramPose }) {
  const rootRef = useRef<Group>(null);
  const headRef = useRef<Group>(null);
  const leftShoulderRef = useRef<Group>(null);
  const rightShoulderRef = useRef<Group>(null);
  const leftElbowRef = useRef<Group>(null);
  const rightElbowRef = useRef<Group>(null);
  const ringRef = useRef<Mesh>(null);
  const bodyMat = useRef<MeshStandardMaterial>(null);

  const emissive = useMemo(() => new Color("#57e3ff"), []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const target = poseAngles[pose];

    if (rootRef.current) {
      rootRef.current.position.y = Math.sin(t * 1.4) * 0.03;
      rootRef.current.rotation.y = Math.sin(t * 0.5) * 0.08;
    }
    if (headRef.current) {
      const nod = pose === "yes" ? Math.sin(t * 7) * 0.15 : 0;
      const shake = pose === "no" ? Math.sin(t * 7) * 0.22 : 0;
      headRef.current.rotation.x = MathUtils.damp(
        headRef.current.rotation.x,
        target.headX + nod,
        10,
        delta
      );
      headRef.current.rotation.y = MathUtils.damp(
        headRef.current.rotation.y,
        target.headY + shake,
        10,
        delta
      );
    }
    if (leftShoulderRef.current) {
      leftShoulderRef.current.rotation.z = MathUtils.damp(
        leftShoulderRef.current.rotation.z,
        target.leftShoulderZ,
        10,
        delta
      );
    }
    if (rightShoulderRef.current) {
      const waveExtra = pose === "wave" ? Math.sin(t * 8) * 0.25 : 0;
      rightShoulderRef.current.rotation.z = MathUtils.damp(
        rightShoulderRef.current.rotation.z,
        target.rightShoulderZ + waveExtra,
        10,
        delta
      );
    }
    if (leftElbowRef.current) {
      leftElbowRef.current.rotation.z = MathUtils.damp(
        leftElbowRef.current.rotation.z,
        target.leftElbowZ,
        12,
        delta
      );
    }
    if (rightElbowRef.current) {
      rightElbowRef.current.rotation.z = MathUtils.damp(
        rightElbowRef.current.rotation.z,
        target.rightElbowZ,
        12,
        delta
      );
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.55;
    }
    if (bodyMat.current) {
      bodyMat.current.emissiveIntensity = 0.6 + Math.sin(t * 2.1) * 0.2;
    }
  });

  return (
    <Float speed={1.2} rotationIntensity={0.08} floatIntensity={0.15}>
      <group ref={rootRef} position={[0, -0.36, 0]} scale={0.54}>
        <mesh ref={ringRef} position={[0, -1.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.95, 0.025, 20, 100]} />
          <meshStandardMaterial emissive="#56d6ff" emissiveIntensity={1.4} color="#041018" />
        </mesh>

        <mesh position={[0, 0.1, -0.02]}>
          <capsuleGeometry args={[0.44, 0.95, 8, 16]} />
          <meshStandardMaterial
            ref={bodyMat}
            color="#062131"
            emissive={emissive}
            emissiveIntensity={0.7}
            metalness={0.85}
            roughness={0.25}
          />
        </mesh>

        <mesh position={[0, -0.36, 0]}>
          <cylinderGeometry args={[0.25, 0.28, 0.26, 20]} />
          <meshStandardMaterial color="#0a2e43" emissive={emissive} emissiveIntensity={0.45} metalness={0.85} roughness={0.26} />
        </mesh>

        <group ref={headRef} position={[0, 1.1, 0]}>
          <mesh>
            <sphereGeometry args={[0.3, 32, 32]} />
            <meshStandardMaterial
              color="#0a2f45"
              emissive={emissive}
              emissiveIntensity={0.75}
              metalness={0.9}
              roughness={0.22}
            />
          </mesh>
          <mesh position={[0, -0.05, 0.3]}>
            <planeGeometry args={[0.26, 0.1]} />
            <meshBasicMaterial color="#8ef5ff" transparent opacity={0.9} />
          </mesh>
          <mesh position={[-0.09, 0.03, 0.33]}>
            <sphereGeometry args={[0.03, 12, 12]} />
            <meshBasicMaterial color="#bbf7ff" />
          </mesh>
          <mesh position={[0.09, 0.03, 0.33]}>
            <sphereGeometry args={[0.03, 12, 12]} />
            <meshBasicMaterial color="#bbf7ff" />
          </mesh>
        </group>

        <group ref={leftShoulderRef} position={[-0.42, 0.5, 0.32]} rotation={[0, 0, 0.35]}>
          <mesh position={[0, -0.19, 0]}>
            <capsuleGeometry args={[0.085, 0.34, 8, 12]} />
            <meshStandardMaterial color="#0b334c" emissive={emissive} emissiveIntensity={0.62} metalness={0.9} roughness={0.24} />
          </mesh>
          <group ref={leftElbowRef} position={[0, -0.36, 0.06]}>
            <mesh position={[0, -0.16, 0]}>
              <capsuleGeometry args={[0.075, 0.3, 8, 12]} />
              <meshStandardMaterial color="#0f3e5d" emissive={emissive} emissiveIntensity={0.75} metalness={0.92} roughness={0.2} />
            </mesh>
            <mesh position={[0, -0.39, 0.04]}>
              <sphereGeometry args={[0.1, 16, 16]} />
              <meshStandardMaterial color="#a5f3fc" emissive="#a5f3fc" emissiveIntensity={1.2} />
            </mesh>
          </group>
        </group>

        <group ref={rightShoulderRef} position={[0.42, 0.5, 0.32]} rotation={[0, 0, -0.35]}>
          <mesh position={[0, -0.19, 0]}>
            <capsuleGeometry args={[0.085, 0.34, 8, 12]} />
            <meshStandardMaterial color="#0b334c" emissive={emissive} emissiveIntensity={0.62} metalness={0.9} roughness={0.24} />
          </mesh>
          <group ref={rightElbowRef} position={[0, -0.36, 0.06]}>
            <mesh position={[0, -0.16, 0]}>
              <capsuleGeometry args={[0.075, 0.3, 8, 12]} />
              <meshStandardMaterial color="#0f3e5d" emissive={emissive} emissiveIntensity={0.75} metalness={0.92} roughness={0.2} />
            </mesh>
            <mesh position={[0, -0.39, 0.04]}>
              <sphereGeometry args={[0.1, 16, 16]} />
              <meshStandardMaterial color="#a5f3fc" emissive="#a5f3fc" emissiveIntensity={1.2} />
            </mesh>
          </group>
        </group>
      </group>
    </Float>
  );
}

export function HologramSigner3D({ pose }: HologramSigner3DProps) {
  const [hasRealModel, setHasRealModel] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch("/models/signer.glb", { method: "HEAD" });
        if (!cancelled) setHasRealModel(res.ok);
      } catch {
        if (!cancelled) setHasRealModel(false);
      }
    };
    check();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Canvas camera={{ position: [0, 0.5, 4.6], fov: 28 }} dpr={[1, 2]}>
      <color attach="background" args={["#030b16"]} />
      <fog attach="fog" args={["#030b16", 3.8, 9]} />
      <ambientLight intensity={0.44} />
      <directionalLight position={[2, 3, 3]} intensity={1.45} color="#c7f6ff" />
      <pointLight position={[-2, 1, 2]} intensity={0.95} color="#33d0ff" />
      <pointLight position={[0, -1.2, 1.2]} intensity={0.6} color="#22d3ee" />

      <Sparkles count={70} speed={0.45} size={2.4} scale={[3, 3, 3]} color="#67e8f9" />
      {hasRealModel ? (
        <Suspense fallback={<SignerRobot pose={pose} />}>
          <RealisticSignerModel pose={pose} />
        </Suspense>
      ) : (
        <SignerRobot pose={pose} />
      )}
    </Canvas>
  );
}
