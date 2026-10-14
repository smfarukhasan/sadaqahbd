import createNextIntlPlugin from 'next-intl/plugin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read main root .env file so apps/web uses the main .env as single source of truth
const rootEnvPath = path.resolve(__dirname, '../../.env');
const rootEnv = {};
if (fs.existsSync(rootEnvPath)) {
  if (typeof process.loadEnvFile === 'function') {
    try {
      process.loadEnvFile(rootEnvPath);
    } catch {
      // ignore
    }
  }
  try {
    const content = fs.readFileSync(rootEnvPath, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"](.*)['"]$/, '$1');
        if (key !== 'NODE_ENV' && key !== 'PORT' && !key.startsWith('__NEXT_')) {
          rootEnv[key] = val;
          process.env[key] = val;
        }
      }
    }
  } catch {
    // ignore
  }
}

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
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
