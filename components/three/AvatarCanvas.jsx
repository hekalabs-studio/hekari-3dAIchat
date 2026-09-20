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

  componentDidCatch(error, errorInfo) {
    console.error("[AvatarCanvas] ModelErrorBoundary caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const isCustom =
        this.props.modelUrl?.startsWith("blob:") ||
        this.props.modelUrl?.startsWith("data:") ||
        this.props.isCustom;

      return (
        <Html center>
          <div className="bg-black/90 backdrop-blur-xl border border-red-500/40 p-6 rounded-3xl flex flex-col items-center text-center max-w-[340px] shadow-2xl shadow-black/80 z-30 pointer-events-auto">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center mb-3.5 border border-red-500/30 text-red-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-white font-bold text-sm mb-1.5">
              {isCustom ? "Model Kustom Tidak Dapat Dimuat" : "Model Tidak Ditemukan"}
            </h3>
            <p className="text-white/70 text-xs mb-4 leading-relaxed">
              {isCustom
                ? "File model 3D kustom tidak valid atau format tidak kompatibel. Pastikan Anda menggunakan file .glb mandiri yang lengkap."
                : "Gagal memuat model 3D avatar. Silakan pulihkan pengaturan ke default."}
            </p>
            {this.props.onReset && (
              <button
                type="button"
                onClick={this.props.onReset}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#00bcd4] to-indigo-600 hover:from-[#00bcd4]/90 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-[#00bcd4]/25 transition-all cursor-pointer active:scale-95"
              >
                Kembali ke Model Akari
              </button>
            )}
          </div>
        </Html>
      );
    }
    return this.props.children;
  }
}

/**
 * Loading fallback shown while the GLB model loads.
 * Renders a subtle glowing indicator with helper text.
 */
function LoadingFallback() {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-2.5 bg-black/60 backdrop-blur-md px-5 py-3.5 rounded-2xl border border-white/10 shadow-2xl text-center pointer-events-none">
        <div className="w-6 h-6 border-2 border-[#00bcd4] border-t-transparent rounded-full animate-spin" />
        <span className="text-white/80 text-xs font-medium tracking-wide">
          Memuat model 3D...
        </span>
      </div>
    </Html>
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
 * @param {() => void} [props.onFallbackToDefault] - Called to revert model on error
 * @param {boolean} [props.isSpeaking] - Whether avatar is currently speaking
 * @param {string} [props.currentEmotion] - Current facial emotion
 * @param {string} [props.className] - CSS class for the container
 */
export default function AvatarCanvas({
  modelUrl = "/models/avatar.glb",
  onModelLoaded,
  onFallbackToDefault,
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
        <ModelErrorBoundary
          key={modelUrl}
          modelUrl={modelUrl}
          onReset={onFallbackToDefault}
        >
          <Suspense fallback={<LoadingFallback />}>
            {/* Lighting Rig */}
            <AvatarLighting />

            {/* GLB Avatar */}
            <GlbAvatar
              key={modelUrl}
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
