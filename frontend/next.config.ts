import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
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
