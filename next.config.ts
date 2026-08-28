import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/weather-range": [
      "./data/weather/feni-bdfe2-hourly-bst-v1.csv",
      "./data/weather/feni-bdfe2-hourly-bst-v1.manifest.json",
    ],
  },
};

export default nextConfig;
