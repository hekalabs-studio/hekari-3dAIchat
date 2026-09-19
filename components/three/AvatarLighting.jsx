"use client";

// ──────────────────────────────────────────────
// Avatar Lighting - 100% Offline Cel-Shading Rig
// ──────────────────────────────────────────────
// Uses pure Three.js light primitives (Key, Fill, Rim, Ambient, Bounce)
// without external HDRI network dependencies (no GitHub/drei downloads).

export default function AvatarLighting() {
  return (
    <>
      {/* Ambient fill - soft baseline illumination */}
      <ambientLight intensity={0.7} color="#ffffff" />

      {/* Key light - warm, from front-right */}
      <directionalLight
        position={[2, 3, 4]}
        intensity={1.5}
        color="#fff8f0"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      {/* Fill light - cooler, from the left to soften shadows */}
      <directionalLight
        position={[-3, 2, 2]}
        intensity={0.8}
        color="#e0ecff"
      />

      {/* Rim / Back light - creates crisp anime edge silhouette */}
      <directionalLight
        position={[0, 2.5, -3.5]}
        intensity={1.0}
        color="#ffd4e8"
      />

      {/* Ground bounce fill - gives warm natural under-lighting */}
      <directionalLight
        position={[0, -2, 2]}
        intensity={0.4}
        color="#c0d8ff"
      />
    </>
  );
}
