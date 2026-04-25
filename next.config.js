/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['cdninstagram.com', 'scontent.cdninstagram.com', 'graph.instagram.com'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_NAME: 'InstaClient AI',
  },
};

module.exports = nextConfig;
