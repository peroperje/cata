/**
 * @type {import('next').NextConfig}
 **/
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@cata/shared-types', '@cata/shared-ui'],
  async rewrites() {
    // In Docker, we need to proxy to the 'api' service. 
    // Locally, we proxy to 'localhost'.
    const apiDest = process.env.API_URL 
      ? process.env.API_URL.replace('/api/v1', '') 
      : 'http://localhost:8000';

    return [
      {
        source: '/api/:path*',
        destination: `${apiDest}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
