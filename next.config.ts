import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Transpile Three.js ecosystem packages for compatibility
  transpilePackages: [
    "three",
    "@react-three/fiber",
    "@react-three/drei",
  ],

  // Turbopack config (Next.js 16+ default bundler)
  turbopack: {},
};

export default nextConfig;
