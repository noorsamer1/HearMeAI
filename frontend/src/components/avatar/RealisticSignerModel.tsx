"use client";

import { useEffect, useMemo } from "react";
import { useAnimations, useGLTF } from "@react-three/drei";
import type { Group } from "three";
import { Box3, MeshStandardMaterial, Vector3 } from "three";
import type { HologramPose } from "@/components/avatar/HologramSigner3D";

interface RealisticSignerModelProps {
  pose: HologramPose;
}

const POSE_TO_CLIP_KEYWORDS: Record<HologramPose, string[]> = {
  neutral: ["idle", "rest", "neutral", "stand"],
  wave: ["wave", "hello", "greet"],
  "thank-you": ["thank", "thanks"],
  yes: ["yes", "agree", "nod"],
  no: ["no", "deny", "shake"],
  please: ["please", "beg"],
  help: ["help", "assist"],
  question: ["question", "how", "ask"],
};

export function RealisticSignerModel({ pose }: RealisticSignerModelProps) {
  const gltf = useGLTF("/models/signer.glb");
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  const { actions, names } = useAnimations(gltf.animations, scene as Group);
  const fit = useMemo(() => {
    // Auto-fit arbitrary humanoid models (different origins/scales) into signer viewport.
    const box = new Box3().setFromObject(scene);
    const size = box.getSize(new Vector3());
    const center = box.getCenter(new Vector3());

    const targetHeight = 2.2;
    const scale = size.y > 0 ? targetHeight / size.y : 1;

    const x = -center.x * scale;
    const y = -box.min.y * scale - 1.1;
    const z = -center.z * scale;

    return {
      scale,
      position: [x, y, z] as [number, number, number],
    };
  }, [scene]);

  useEffect(() => {
    scene.traverse((obj) => {
      const mesh = obj as { material?: unknown; isMesh?: boolean };
      if (!mesh.isMesh || !mesh.material) return;
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((m) => {
          if (m instanceof MeshStandardMaterial) {
            m.emissive.set("#44d8ff");
            m.emissiveIntensity = 0.18;
            m.metalness = Math.max(m.metalness ?? 0, 0.35);
            m.roughness = Math.min(m.roughness ?? 1, 0.75);
          }
        });
      } else if (mesh.material instanceof MeshStandardMaterial) {
        mesh.material.emissive.set("#44d8ff");
        mesh.material.emissiveIntensity = 0.18;
        mesh.material.metalness = Math.max(mesh.material.metalness, 0.35);
        mesh.material.roughness = Math.min(mesh.material.roughness, 0.75);
      }
    });
  }, [scene]);

  useEffect(() => {
    if (!names.length) return;
    Object.values(actions).forEach((action) => action?.stop());

    const keywords = POSE_TO_CLIP_KEYWORDS[pose];
    const targetName =
      names.find((name) =>
        keywords.some((k) => name.toLowerCase().includes(k.toLowerCase()))
      ) ??
      names.find((name) =>
        POSE_TO_CLIP_KEYWORDS.neutral.some((k) =>
          name.toLowerCase().includes(k.toLowerCase())
        )
      ) ??
      names[0];

    const target = actions[targetName];
    if (!target) return;
    target.reset().fadeIn(0.25).play();

    return () => {
      target.fadeOut(0.2);
    };
  }, [actions, names, pose]);

  return (
    <group position={fit.position} scale={fit.scale}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload("/models/signer.glb");
