/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Keep uploaded-image request bodies workable — grading photos are base64-encoded
  // in the JSON body, so bump the default limit a bit above Next's default.
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

module.exports = nextConfig;
