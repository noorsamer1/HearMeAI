"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useAnimations, useGLTF } from "@react-three/drei";
import { Bone, type Group, type Object3D } from "three";
import { SkeletonUtils } from "three-stdlib";
import type { HologramPose } from "@/components/avatar/HologramSigner3D";

interface RealisticSignerModelProps {
  pose: HologramPose;
  onReady?: () => void;
}

// The exported signer model contains one full avatar per phrase group.
// We explicitly toggle those top-level groups so only one avatar is shown.
const POSE_TO_GROUP: Record<HologramPose, string> = {
  neutral: "idle",
  wave: "hello",
  "thank-you": "thank",
  yes: "yes",
  no: "no",
  please: "please",
  help: "help",
  question: "idle",
};

const POSE_TO_CLIP_INDEX: Record<HologramPose, number> = {
  neutral: 0,
  wave: 1,
  "thank-you": 2,
  yes: 3,
  no: 4,
  please: 5,
  help: 6,
  question: 0,
};

const VARIANT_GROUP_NAMES = new Set(["idle", "hello", "thank", "yes", "no", "please", "help"]);

export function RealisticSignerModel({ pose, onReady }: RealisticSignerModelProps) {
  const gltf = useGLTF("/models/signer.glb");
  const scene = useMemo(() => SkeletonUtils.clone(gltf.scene) as Group, [gltf.scene]);
  const { actions, names } = useAnimations(gltf.animations, scene);
  const hipsRefs = useRef<Bone[]>([]);

  useEffect(() => {
    const hips: Bone[] = [];
    scene.traverse((child) => {
      if (child instanceof Bone && child.name.startsWith("mixamorigHips")) {
        hips.push(child);
      }
    });
    hipsRefs.current = hips;
  }, [scene]);

  useFrame(() => {
    // Keep the signer anchored in place, even if source animation clips
    // contain root-motion on the hips bones.
    for (const hips of hipsRefs.current) {
      hips.position.x = 0;
      hips.position.z = 0;
    }
  });

  useEffect(() => {
    onReady?.();
  }, [onReady]);

  useEffect(() => {
    const activeGroup = POSE_TO_GROUP[pose];
    scene.traverse((child: Object3D) => {
      if (!child.name) return;
      if (!VARIANT_GROUP_NAMES.has(child.name)) return;
      child.visible = child.name === activeGroup;
    });
  }, [pose, scene]);

  useEffect(() => {
    if (!names.length) return;
    Object.values(actions).forEach((action) => action?.stop());

    const clipIndex = POSE_TO_CLIP_INDEX[pose];
    const targetName = names[clipIndex] ?? names[0];
    const target = actions[targetName];
    if (!target) return;
    target.reset().fadeIn(0.25).play();

    return () => {
      target.fadeOut(0.2);
    };
  }, [actions, names, pose]);

  return <primitive object={scene} />;
}

useGLTF.preload("/models/signer.glb");
