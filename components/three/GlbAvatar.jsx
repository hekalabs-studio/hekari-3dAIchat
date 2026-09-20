"use client";

// ──────────────────────────────────────────────
// GLB Avatar - Humanoid Posing, Emotion Blendshapes, & Lip-sync
// ──────────────────────────────────────────────

import { useEffect, useRef, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";

/**
 * Known blendshape/morph target names for lip-sync.
 */
const VISEME_MAP = {
  aa: ["viseme_aa", "viseme_A", "mouthOpen", "jawOpen", "A", "a", "Fcl_MTH_A", "Face_Blendshape.Fcl_MTH_A"],
  ee: ["viseme_E", "viseme_ee", "mouthSmile", "E", "e", "Fcl_MTH_E", "Face_Blendshape.Fcl_MTH_E"],
  ih: ["viseme_I", "viseme_ih", "I", "i", "Fcl_MTH_I", "Face_Blendshape.Fcl_MTH_I"],
  oh: ["viseme_O", "viseme_oh", "mouthFunnel", "O", "o", "Fcl_MTH_O", "Face_Blendshape.Fcl_MTH_O"],
  ou: ["viseme_U", "viseme_ou", "mouthPucker", "U", "u", "Fcl_MTH_U", "Face_Blendshape.Fcl_MTH_U"],
};

const BLINK_NAMES = [
  "eyeBlinkLeft",
  "eyeBlink_L",
  "blink_L",
  "eyesClosed",
  "blink",
  "Fcl_EYE_Close_L",
  "Fcl_EYE_Close",
  "Face_Blendshape.Fcl_EYE_Close_L",
  "Face_Blendshape.Fcl_EYE_Close",
];

const BLINK_R_NAMES = [
  "eyeBlinkRight",
  "eyeBlink_R",
  "blink_R",
  "Fcl_EYE_Close_R",
  "Face_Blendshape.Fcl_EYE_Close_R",
];

/**
 * Facial expression morph targets mapped to our standard emotions.
 */
const EMOTION_MORPH_MAP = {
  joy: [
    "Face_Blendshape.Fcl_ALL_Joy", "Fcl_ALL_Joy", "mouthSmile", "Joy", "happy"
  ],
  blush: [
    "Face_Blendshape.Fcl_ALL_Fun", "Fcl_ALL_Fun"
  ],
  angry: [
    "Face_Blendshape.Fcl_ALL_Angry", "Fcl_ALL_Angry", "Angry"
  ],
  sorrow: [
    "Face_Blendshape.Fcl_ALL_Sorrow", "Fcl_ALL_Sorrow", "Sad"
  ],
  surprised: [
    "Face_Blendshape.Fcl_ALL_Surprised", "Fcl_ALL_Surprised", "Surprised"
  ],
};

/**
 * GlbAvatar component
 *
 * Poses humanoid skeletons naturally out of T-pose, morphs facial expressions
 * in response to AI emotions, drives lip-sync visemes, and plays robot clips.
 */
export default function GlbAvatar({
  url = "/models/avatar.glb",
  onModelLoaded,
  isSpeaking = false,
  currentEmotion = "neutral",
}) {
  const { scene, animations } = useGLTF(url);

  const groupRef = useRef(null);
  const sceneContainerRef = useRef(null);
  const mixerRef = useRef(null);
  const actionsMapRef = useRef({});
  const currentActionRef = useRef(null);

  // Skeletal bone refs for procedural humanoid posture
  const bonesRef = useRef({
    leftUpperArm: null,
    rightUpperArm: null,
    leftLowerArm: null,
    rightLowerArm: null,
    leftHand: null,
    rightHand: null,
    spine: null,
    neck: null,
    head: null,
    isHumanoid: false,
    baseRotations: {},
  });

  // Blendshapes & emotion refs
  const morphMeshesRef = useRef([]);
  const visemeWeightsRef = useRef({ aa: 0, ih: 0, ou: 0, ee: 0, oh: 0 });
  const emotionWeightsRef = useRef({ joy: 0, blush: 0, angry: 0, sorrow: 0, surprised: 0 });
  const targetEmotionWeightsRef = useRef({ joy: 0, blush: 0, angry: 0, sorrow: 0, surprised: 0 });

  // Procedural timers & phases
  const breathPhaseRef = useRef(0);
  const swayPhaseRef = useRef(0);
  const speakingPhaseRef = useRef(0);
  const blinkTimerRef = useRef(0);
  const isBlinkingRef = useRef(false);
  const nextBlinkRef = useRef(3.0);
  const blinkDurationRef = useRef(0.14);

  // Update target emotion weights when currentEmotion prop changes
  useEffect(() => {
    const targets = { joy: 0, blush: 0, angry: 0, sorrow: 0, surprised: 0 };
    if (currentEmotion && currentEmotion in targets) {
      targets[currentEmotion] = 0.45; // Gentle, pleasing smile / expression
    }
    targetEmotionWeightsRef.current = targets;

    // Smoothly decay back to natural neutral expression after 3.8s
    const decayTimer = setTimeout(() => {
      targetEmotionWeightsRef.current = { joy: 0, blush: 0, angry: 0, sorrow: 0, surprised: 0 };
    }, 3800);

    // Handle robot animations if model has animation clips (e.g. robot.glb)
    if (animations && animations.length > 0 && mixerRef.current) {
      const actions = actionsMapRef.current;
      let targetClipName = "idle";

      if (currentEmotion === "joy") {
        targetClipName = actions["wave"] ? "wave" : actions["thumbsup"] ? "thumbsup" : "idle";
      } else if (currentEmotion === "surprised") {
        targetClipName = actions["jump"] ? "jump" : "idle";
      } else if (currentEmotion === "angry") {
        targetClipName = actions["no"] ? "no" : "idle";
      } else if (currentEmotion === "blush") {
        targetClipName = actions["thumbsup"] ? "thumbsup" : "idle";
      }

      const nextAction = actions[targetClipName] || actions["idle"] || actions["standing"] || Object.values(actions)[0];
      if (nextAction && currentActionRef.current !== nextAction) {
        if (currentActionRef.current) {
          currentActionRef.current.fadeOut(0.4);
        }
        nextAction.reset().fadeIn(0.4).play();
        currentActionRef.current = nextAction;

        if (targetClipName !== "idle") {
          setTimeout(() => {
            const idleAction = actions["idle"] || actions["standing"] || Object.values(actions)[0];
            if (idleAction && currentActionRef.current !== idleAction) {
              currentActionRef.current?.fadeOut(0.4);
              idleAction.reset().fadeIn(0.4).play();
              currentActionRef.current = idleAction;
            }
          }, 3500);
        }
      }
    }

    return () => clearTimeout(decayTimer);
  }, [currentEmotion, animations]);

  // Public method to update viseme weights from TTS engine
  const setVisemeWeights = useCallback((weights) => {
    visemeWeightsRef.current = weights;
  }, []);

  /**
   * Imperatively clone, auto-scale, center, fix materials, and attach the scene
   */
  useEffect(() => {
    if (!scene) return;

    // Use SkeletonUtils.clone ONLY for built-in VRoid models that require procedural un-T-pose arm manipulation.
    // For all other models (custom uploads, robot, mitsuri, static or animated models), scene.clone(true) is safe,
    // robust, and preserves clean dimensions without bone inversion distortion.
    let cloned;
    try {
      const isBuiltinVroid = url.includes("avatar.glb") || url.includes("avatar2.glb");
      if (isBuiltinVroid) {
        cloned = SkeletonUtils.clone(scene);
      } else {
        cloned = scene.clone(true);
      }
    } catch (cloneErr) {
      console.warn("[GlbAvatar] SkeletonUtils clone failed, falling back to scene.clone", cloneErr);
      cloned = scene.clone(true);
    }
    const morphMeshes = [];

    // Reset bones reference
    const foundBones = {
      leftUpperArm: null,
      rightUpperArm: null,
      aimLeftTopsUpperArm: null,
      aimRightTopsUpperArm: null,
      leftLowerArm: null,
      rightLowerArm: null,
      leftHand: null,
      rightHand: null,
      spine: null,
      neck: null,
      head: null,
      isHumanoid: false,
      baseRotations: {},
    };

    cloned.traverse((object) => {
      // ── Detect Humanoid Bones & Tops Aim Bones ──
      if (object.isBone) {
        const name = object.name;
        const nameLower = name.toLowerCase();

        if (name === "J_Aim_L_TopsUpperArm" || name.includes("Aim_L_TopsUpperArm")) {
          foundBones.aimLeftTopsUpperArm = object;
        } else if (name === "J_Aim_R_TopsUpperArm" || name.includes("Aim_R_TopsUpperArm")) {
          foundBones.aimRightTopsUpperArm = object;
        }

        if (name.includes("J_Bip_L_UpperArm") || (nameLower.includes("upperarm") && (nameLower.includes(".l") || nameLower.includes("_l") || nameLower.includes("left")))) {
          foundBones.leftUpperArm = object;
          foundBones.isHumanoid = true;
          foundBones.baseRotations.leftUpperArm = object.rotation.clone();
        } else if (name.includes("J_Bip_R_UpperArm") || (nameLower.includes("upperarm") && (nameLower.includes(".r") || nameLower.includes("_r") || nameLower.includes("right")))) {
          foundBones.rightUpperArm = object;
          foundBones.isHumanoid = true;
          foundBones.baseRotations.rightUpperArm = object.rotation.clone();
        } else if (name.includes("J_Bip_L_LowerArm") || (nameLower.includes("lowerarm") && (nameLower.includes(".l") || nameLower.includes("_l") || nameLower.includes("left")))) {
          foundBones.leftLowerArm = object;
          foundBones.baseRotations.leftLowerArm = object.rotation.clone();
        } else if (name.includes("J_Bip_R_LowerArm") || (nameLower.includes("lowerarm") && (nameLower.includes(".r") || nameLower.includes("_r") || nameLower.includes("right")))) {
          foundBones.rightLowerArm = object;
          foundBones.baseRotations.rightLowerArm = object.rotation.clone();
        } else if (name.includes("J_Bip_C_Spine") || nameLower.includes("spine")) {
          foundBones.spine = object;
          foundBones.baseRotations.spine = object.rotation.clone();
        } else if (name.includes("J_Bip_C_Neck") || nameLower.includes("neck")) {
          foundBones.neck = object;
          foundBones.baseRotations.neck = object.rotation.clone();
        } else if (name.includes("J_Bip_C_Head") || nameLower.includes("head")) {
          foundBones.head = object;
          foundBones.baseRotations.head = object.rotation.clone();
        }
      }

      // ── Find meshes with morph targets (blendshapes) ──
      if (
        object.isMesh &&
        object.morphTargetDictionary &&
        object.morphTargetInfluences
      ) {
        const visemeLookup = {};
        for (const [visemeKey, possibleNames] of Object.entries(VISEME_MAP)) {
          for (const name of possibleNames) {
            if (name in object.morphTargetDictionary) {
              visemeLookup[visemeKey] = object.morphTargetDictionary[name];
              break;
            }
          }
        }

        const emotionLookup = {};
        for (const [emotionKey, possibleNames] of Object.entries(EMOTION_MORPH_MAP)) {
          for (const name of possibleNames) {
            if (name in object.morphTargetDictionary) {
              emotionLookup[emotionKey] = object.morphTargetDictionary[name];
              break; // Pick the best compound morph for this emotion
            }
          }
        }

        let blinkLIndex = null;
        let blinkRIndex = null;
        for (const name of BLINK_NAMES) {
          if (name in object.morphTargetDictionary) {
            blinkLIndex = object.morphTargetDictionary[name];
            break;
          }
        }
        for (const name of BLINK_R_NAMES) {
          if (name in object.morphTargetDictionary) {
            blinkRIndex = object.morphTargetDictionary[name];
            break;
          }
        }

        morphMeshes.push({
          mesh: object,
          visemeLookup,
          emotionLookup,
          blinkLIndex,
          blinkRIndex,
        });
      }

      // ── Fix materials for clean anime cel-shaded rendering ──
      if (object.isMesh && object.material) {
        const mats = Array.isArray(object.material)
          ? object.material
          : [object.material];

        mats.forEach((mat) => {
          mat.depthWrite = true;
          if (mat.transparent || mat.alphaMode === "BLEND") {
            mat.transparent = true;
            mat.alphaTest = 0.1;
            mat.depthWrite = true;
            mat.needsUpdate = true;
          }
        });
      }
    });

    bonesRef.current = foundBones;
    morphMeshesRef.current = morphMeshes;

    // ── Auto-scale and Center the Model ──
    const box = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    // Target height: ~1.4 meters for robot, ~1.6 meters for humanoid avatars
    const isRobot = url.includes("robot");
    const targetHeight = isRobot ? 1.4 : 1.6;
    const currentHeight = size.y;
    let scaleFactor = 1;

    if (currentHeight > 0.001 && Number.isFinite(currentHeight) && Math.abs(currentHeight - targetHeight) > 0.01) {
      scaleFactor = targetHeight / currentHeight;
      // Clamp scaleFactor to reasonable range to avoid microscopic or astronomical sizes
      if (scaleFactor > 0.0001 && scaleFactor < 500) {
        cloned.scale.set(scaleFactor, scaleFactor, scaleFactor);
      }
    }

    const scaledBox = new THREE.Box3().setFromObject(cloned);
    const scaledCenter = new THREE.Vector3();
    scaledBox.getCenter(scaledCenter);
    const bottomY = scaledBox.min.y;
    const yOffset = isRobot ? 0.32 : 0;

    cloned.position.set(-scaledCenter.x, -bottomY + yOffset, -scaledCenter.z);

    // Expose TTS lip-sync interface
    cloned.userData.setVisemeWeights = setVisemeWeights;

    // ── Set up animation mixer if model contains animations (e.g. robot.glb) ──
    if (animations && animations.length > 0) {
      const mixer = new THREE.AnimationMixer(cloned);
      const actionsMap = {};

      animations.forEach((clip) => {
        const action = mixer.clipAction(clip);
        actionsMap[clip.name.toLowerCase()] = action;
      });

      actionsMapRef.current = actionsMap;

      const idleAction = actionsMap["idle"] || actionsMap["standing"] || Object.values(actionsMap)[0];
      if (idleAction) {
        idleAction.play();
        currentActionRef.current = idleAction;
      }

      mixerRef.current = mixer;
    }

    // Attach to scene container
    const container = sceneContainerRef.current;
    if (container) {
      container.clear();
      container.add(cloned);
    }

    onModelLoaded?.(cloned);

    return () => {
      mixerRef.current?.stopAllAction();
      mixerRef.current = null;
      actionsMapRef.current = {};
      currentActionRef.current = null;
      if (container) {
        container.clear();
      }
    };
  }, [scene, url, animations, onModelLoaded, setVisemeWeights]);

  // ── Per-frame update loop ──
  useFrame((_, delta) => {
    const clampedDelta = Math.min(delta, 0.1);
    mixerRef.current?.update(clampedDelta);
    const group = groupRef.current;
    if (!group) return;

    // 1. Procedural breathing float & subtle sway
    breathPhaseRef.current += clampedDelta * 1.5;
    const breathY = Math.sin(breathPhaseRef.current) * 0.007;
    const breathScale = 1 + Math.sin(breathPhaseRef.current * 0.8) * 0.002;

    swayPhaseRef.current += clampedDelta * 0.5;
    const swayRotY = Math.sin(swayPhaseRef.current * 0.5) * 0.02;
    const swayRotZ = Math.sin(swayPhaseRef.current * 0.7) * 0.006;

    // 2. Dynamic speaking motion
    let speakingY = 0;
    let speakingRotX = 0;
    if (isSpeaking) {
      speakingPhaseRef.current += clampedDelta * 7.5;
      speakingY = Math.sin(speakingPhaseRef.current) * 0.005;
      speakingRotX = Math.sin(speakingPhaseRef.current * 0.5) * 0.012;
    }

    group.position.y = breathY + speakingY;
    group.scale.set(breathScale, breathScale, breathScale);
    group.rotation.y = swayRotY;
    group.rotation.z = swayRotZ;
    group.rotation.x = speakingRotX;

    // 3. Humanoid Bone Posing (fixes T-Pose into relaxed standing posture)
    const bones = bonesRef.current;
    if (bones.isHumanoid && bones.baseRotations) {
      const { leftUpperArm, rightUpperArm, leftLowerArm, rightLowerArm, spine, head, baseRotations } = bones;
      const bBreath = Math.sin(breathPhaseRef.current);
      const bSway = Math.sin(swayPhaseRef.current * 0.6);

      // Speaking gestures
      const armGesture = isSpeaking ? Math.sin(speakingPhaseRef.current * 0.4) * 0.04 : 0;
      const headNod = isSpeaking ? Math.sin(speakingPhaseRef.current * 0.7) * 0.035 : 0;

      // Emotion head angles
      let emoHeadTiltX = 0;
      let emoHeadTiltY = 0;
      let emoHeadTiltZ = 0;
      if (currentEmotion === "joy") {
        emoHeadTiltZ = 0.05; // Cheerful tilt
        emoHeadTiltX = -0.02;
      } else if (currentEmotion === "blush") {
        emoHeadTiltX = 0.06; // Shy downward look
        emoHeadTiltZ = -0.04;
      } else if (currentEmotion === "angry") {
        emoHeadTiltY = 0.07; // Pouty turn away
        emoHeadTiltX = -0.02;
      } else if (currentEmotion === "surprised") {
        emoHeadTiltX = -0.06; // Alert upwards look
      } else if (currentEmotion === "sorrow") {
        emoHeadTiltX = 0.07; // Downcast sad look
      }

      // --- Left Arm (rotate down from T-pose to natural relaxed A-pose only for built-in VRoid models) ---
      const isBuiltinVroid = url.includes("avatar.glb") || url.includes("avatar2.glb");
      if (isBuiltinVroid && leftUpperArm && baseRotations.leftUpperArm) {
        leftUpperArm.rotation.z = baseRotations.leftUpperArm.z - 0.52 + (bSway * 0.012) + armGesture;
        leftUpperArm.rotation.y = baseRotations.leftUpperArm.y + 0.10;
        leftUpperArm.rotation.x = baseRotations.leftUpperArm.x + 0.04;
        if (bones.aimLeftTopsUpperArm) {
          bones.aimLeftTopsUpperArm.rotation.copy(leftUpperArm.rotation);
        }
      }

      // --- Right Arm (rotate down from T-pose to natural relaxed A-pose only for built-in VRoid models) ---
      if (isBuiltinVroid && rightUpperArm && baseRotations.rightUpperArm) {
        rightUpperArm.rotation.z = baseRotations.rightUpperArm.z + 0.52 - (bSway * 0.012) - armGesture;
        rightUpperArm.rotation.y = baseRotations.rightUpperArm.y - 0.10;
        rightUpperArm.rotation.x = baseRotations.rightUpperArm.x + 0.04;
        if (bones.aimRightTopsUpperArm) {
          bones.aimRightTopsUpperArm.rotation.copy(rightUpperArm.rotation);
        }
      }

      // --- Forearms / Elbows (slight natural forward bend) ---
      if (isBuiltinVroid && leftLowerArm && baseRotations.leftLowerArm) {
        leftLowerArm.rotation.x = baseRotations.leftLowerArm.x + 0.15;
      }
      if (isBuiltinVroid && rightLowerArm && baseRotations.rightLowerArm) {
        rightLowerArm.rotation.x = baseRotations.rightLowerArm.x + 0.15;
      }

      // --- Spine (breathing expansion and gentle posture) ---
      if (spine && baseRotations.spine) {
        spine.rotation.x = baseRotations.spine.x + (bBreath * 0.012);
        spine.rotation.y = baseRotations.spine.y + (bSway * 0.015);
      }

      // --- Head (natural tracking, breathing, nodding, emotion tilts) ---
      if (head && baseRotations.head) {
        head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, baseRotations.head.x + headNod + emoHeadTiltX, clampedDelta * 4.0);
        head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, baseRotations.head.y + (bSway * 0.02) + emoHeadTiltY, clampedDelta * 4.0);
        head.rotation.z = THREE.MathUtils.lerp(head.rotation.z, baseRotations.head.z + emoHeadTiltZ, clampedDelta * 4.0);
      }
    }

    // 4. Blendshape animations (emotions, lip-sync, procedural blinking)
    const morphMeshes = morphMeshesRef.current;
    if (morphMeshes.length > 0) {
      // Smoothly interpolate emotion weights towards targets
      const currentE = emotionWeightsRef.current;
      const targetE = targetEmotionWeightsRef.current;
      for (const key of Object.keys(currentE)) {
        currentE[key] = THREE.MathUtils.lerp(currentE[key], targetE[key] || 0, clampedDelta * 4.0);
      }

      // Procedural blink calculation
      blinkTimerRef.current += clampedDelta;
      let blinkWeight = 0;
      if (!isBlinkingRef.current) {
        if (blinkTimerRef.current >= nextBlinkRef.current) {
          isBlinkingRef.current = true;
          blinkTimerRef.current = 0;
          blinkDurationRef.current = 0.14;
        }
      } else {
        const progress = blinkTimerRef.current / blinkDurationRef.current;
        if (progress < 0.5) {
          blinkWeight = progress * 2;
        } else if (progress < 1.0) {
          blinkWeight = (1.0 - progress) * 2;
        } else {
          isBlinkingRef.current = false;
          blinkTimerRef.current = 0;
          nextBlinkRef.current = 2.5 + Math.sin(breathPhaseRef.current) * 1.5;
        }
      }

      // Apply morph influences to all meshes
      const visemes = visemeWeightsRef.current;
      for (let i = 0; i < morphMeshes.length; i++) {
        const { mesh, visemeLookup, emotionLookup, blinkLIndex, blinkRIndex } = morphMeshes[i];

        // 1. Emotion morphs
        if (emotionLookup) {
          for (const [emoKey, morphIdx] of Object.entries(emotionLookup)) {
            const weight = currentE[emoKey] || 0;
            if (morphIdx !== undefined && morphIdx !== null) {
              mesh.morphTargetInfluences[morphIdx] = weight;
            }
          }
        }

        // 2. Blinking (layered cleanly on top of eyes)
        if (blinkLIndex !== null) {
          mesh.morphTargetInfluences[blinkLIndex] = Math.max(mesh.morphTargetInfluences[blinkLIndex] || 0, blinkWeight);
        }
        if (blinkRIndex !== null) {
          mesh.morphTargetInfluences[blinkRIndex] = Math.max(mesh.morphTargetInfluences[blinkRIndex] || 0, blinkWeight);
        }

        // 3. Lip-sync Visemes (layered on top of mouth)
        if (visemeLookup) {
          for (const [visemeKey, morphIndex] of Object.entries(visemeLookup)) {
            mesh.morphTargetInfluences[morphIndex] = Math.max(mesh.morphTargetInfluences[morphIndex] || 0, visemes[visemeKey] || 0);
          }
        }
      }
    }
  });

  return (
    <group ref={groupRef}>
      <group ref={sceneContainerRef} />
    </group>
  );
}

// Preload the model for faster initial render
GlbAvatar.preload = (url = "/models/avatar2.glb") => {
  useGLTF.preload(url);
};
