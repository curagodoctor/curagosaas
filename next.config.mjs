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
  // Serve the app under the product name so the URL reads
  // /dominate-organic-search instead of /app/control-center.
  async rewrites() {
    return [
      { source: '/dominate-organic-search', destination: '/app/control-center' },
      { source: '/dominate-organic-search/:path*', destination: '/app/control-center/:path*' },
    ];
  },
  // The app route was renamed /app/zero-to-practice-builder → /app/control-center.
  // 301-redirect the old URLs so existing links / bookmarks keep working.
  async redirects() {
    return [
      { source: '/app/zero-to-practice-builder', destination: '/app/control-center', permanent: true },
      { source: '/app/zero-to-practice-builder/:path*', destination: '/app/control-center/:path*', permanent: true },
    ];
  },
};

export default nextConfig;
