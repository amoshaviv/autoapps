/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["sequelize"],
  // next.config.js
  experimental: {
    staleTimes: {
      dynamic: 0, // Disable router cache for dynamic pages
      static: 180, // Keep static pages cached for 180 seconds
    },
  },
};

export default nextConfig;
