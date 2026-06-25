import type { NextConfig } from "next";

const rawBackendApiBase =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://localhost:8000/api/v1";

const backendApiBase = /\/api\/v1$/i.test(rawBackendApiBase)
  ? rawBackendApiBase
  : `${rawBackendApiBase}/api/v1`;

// Proxy target for Next rewrites (Docker: FastAPI on localhost:8000)
const internalApi =
  process.env.INTERNAL_API_URL ??
  (rawBackendApiBase.startsWith("http") ? backendApiBase : "http://127.0.0.1:8000/api/v1");

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${internalApi}/:path*`,
      },
      {
        source: "/static/:path*",
        destination: "http://127.0.0.1:8000/static/:path*",
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/static/uploads/**",
      },
      {
        protocol: "https",
        hostname: "*.up.railway.app",
        pathname: "/static/uploads/**",
      },
      {
        protocol: "http",
        hostname: "*.up.railway.app",
        pathname: "/static/uploads/**",
      },
    ],
  },
};

export default nextConfig;
