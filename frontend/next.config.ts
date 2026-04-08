import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // CI/sandbox friendly: we run `tsc --noEmit` separately.
  // This avoids Next's internal typecheck step hanging in restricted environments.
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
