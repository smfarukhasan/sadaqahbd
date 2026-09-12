import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/:locale/auth/login',
        destination: '/:locale/login',
        permanent: false,
      },
      {
        source: '/:locale/auth/set-password',
        destination: '/:locale/set-password',
        permanent: false,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
