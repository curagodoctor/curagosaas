/** @type {import('next').NextConfig} */
const nextConfig = {
  // CV parsers use Node internals — keep them external, not bundled.
  serverExternalPackages: ['pdf-parse', 'mammoth'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'at0ft5wckjrp4nda.public.blob.vercel-storage.com',
        pathname: '/**',
      },
    ],
  },
  // Serve the Practice-OS app under the product name so the URL reads
  // /dominate-organic-search instead of /app/zero-to-practice-builder.
  async rewrites() {
    return [
      { source: '/dominate-organic-search', destination: '/app/zero-to-practice-builder' },
      { source: '/dominate-organic-search/:path*', destination: '/app/zero-to-practice-builder/:path*' },
    ];
  },
};

export default nextConfig;
