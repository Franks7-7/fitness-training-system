/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/fitness-training-system',
  trailingSlash: true,
  images: { unoptimized: true },
};

module.exports = nextConfig;
