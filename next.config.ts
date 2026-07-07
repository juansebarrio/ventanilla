import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El route handler /styleguide/referencia lee los HTML del export en runtime;
  // hay que incluirlos en el bundle serverless para que los iframes rindan.
  outputFileTracingIncludes: {
    "/styleguide/referencia/[archivo]": ["./design-reference/**"],
  },
};

export default nextConfig;
