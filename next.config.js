/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'phace-product-images.s3.us-west-2.amazonaws.com',
        pathname: '/**',
      }
    ],
  },
}

module.exports = nextConfig
