"use client";

// ──────────────────────────────────────────────
// Avatar Canvas - R3F Canvas wrapper with Suspense
// ──────────────────────────────────────────────

import { Suspense, useCallback, useRef, Component } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import GlbAvatar from "./GlbAvatar";
import AvatarLighting from "./AvatarLighting";

/**
 * Simple Error Boundary to catch missing model errors (e.g. 404 for avatar.glb)
 */
class ModelErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Html center>
          <div className="bg-black/80 backdrop-blur-md border border-red-500/30 p-6 rounded-2xl flex flex-col items-center text-center min-w-[300px]">
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-4 border border-red-500/30">
              <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-white font-semibold mb-2">Model Not Found</h3>
            <p className="text-white/60 text-sm mb-4 leading-relaxed">
              Could not load the 3D model.<br/>
              Please ensure you have placed a valid<br/>
              <code className="text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded">avatar.glb</code> file in the<br/>
              <code className="text-white/80 bg-white/10 px-1.5 py-0.5 rounded">public/models/</code> folder.
            </p>
          </div>
        </Html>
      );
    }
    return this.props.children;
  }
}

/**
 * Loading fallback shown while the GLB model loads.
 * Renders a floating, pulsing sphere.
 */
function LoadingFallback() {
  return (
    <mesh>
      <sphereGeometry args={[0.3, 32, 32]} />
      <meshStandardMaterial
        color="#6366f1"
        emissive="#6366f1"
        emissiveIntensity={0.5}
        transparent
        opacity={0.6}
      />
    </mesh>
  );
}

/**
 * AvatarCanvas
 *
 * The main 3D viewport wrapper. Contains:
 * - R3F Canvas with camera preset
 * - Suspense boundary with loading indicator
 * - Constrained OrbitControls for a portrait feel
 * - GLB Avatar with lighting rig
 *
 * @param {Object} props
 * @param {string} [props.modelUrl] - GLB model path or URL
 * @param {(scene: any) => void} [props.onModelLoaded] - Called when GLB loads
 * @param {boolean} [props.isSpeaking] - Whether avatar is currently speaking
 * @param {string} [props.currentEmotion] - Current facial emotion
 * @param {string} [props.className] - CSS class for the container
 */
export default function AvatarCanvas({
  modelUrl = "/models/avatar.glb",
  onModelLoaded,
  isSpeaking = false,
  currentEmotion = "neutral",
  className = "",
}) {
  const controlsRef = useRef(null);

  const handleModelLoaded = useCallback(
    (scene) => {
      onModelLoaded?.(scene);
    },
    [onModelLoaded]
  );

  return (
    <div className={`relative w-full h-full ${className}`} style={{ background: "transparent" }}>
      <Canvas
        camera={{
          position: [0, 1.35, 1.85],
          fov: 35,
          near: 0.1,
          far: 100,
        }}
        shadows
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
        }}
        style={{ background: "transparent" }}
      >
        <ModelErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            {/* Lighting Rig */}
            <AvatarLighting />

            {/* GLB Avatar */}
            <GlbAvatar
              url={modelUrl}
              onModelLoaded={handleModelLoaded}
              isSpeaking={isSpeaking}
              currentEmotion={currentEmotion}
            />
          </Suspense>
        </ModelErrorBoundary>

        {/* Constrained orbit controls - portrait-style interaction */}
        <OrbitControls
          ref={controlsRef}
          target={[0, 1.15, 0]}
          enablePan={false}
          enableZoom={true}
          minDistance={1.0}
          maxDistance={4.0}
          minPolarAngle={Math.PI / 4}      // Don't look from too high
          maxPolarAngle={Math.PI / 1.8}    // Don't look from too low
          minAzimuthAngle={-Math.PI / 4}   // Limit left rotation
          maxAzimuthAngle={Math.PI / 4}    // Limit right rotation
          dampingFactor={0.05}
          enableDamping={true}
        />
      </Canvas>
    </div>
  );
}
