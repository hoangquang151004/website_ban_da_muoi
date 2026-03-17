import type { NextConfig } from "next";

const backendApiBase =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://localhost:8000/api/v1";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendApiBase}/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      // Development
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/static/uploads/**",
      },
      // Production - thay yourdomain.com bằng domain thật khi deploy
      {
        protocol: "https",
        hostname: "yourdomain.com",
        pathname: "/static/uploads/**",
      },
      // Hoặc cho phép tất cả subdomain
      {
        protocol: "https",
        hostname: "*.yourdomain.com",
        pathname: "/static/uploads/**",
      },
    ],
  },
};

export default nextConfig;
