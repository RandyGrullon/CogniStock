/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 14.1: `serverExternalPackages` aún no existe; usar experimental.
  experimental: {
    serverComponentsExternalPackages: ["ws"],
  },
};

export default nextConfig;
