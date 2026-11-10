import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    // On Cloudflare, Next's image resizer can only read static files, not photos served by Payload
    // from R2 (/api/media/file/...), so those came back 404. Photos are already resized to 1600 px
    // WebP by scripts/prepare_photos.py; resizing per screen size moves to Cloudflare Images in stage 6.
    unoptimized: true,
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
      // Bad Boy logos for the authorized-dealer mark.
      { pathname: '/brand/**' },
    ],
  },
  // Packages with Cloudflare Workers (workerd) specific code
  // Read more: https://opennext.js.org/cloudflare/howtos/workerd
  serverExternalPackages: ['jose', 'pg-cloudflare'],

  // Lets the dev server work behind GitHub Codespaces port forwarding.
  allowedDevOrigins: ['*.app.github.dev'],

  // Payload's own first-account screen is replaced by the setup wizard (it's only reachable on a
  // site with no accounts, and the wizard checks the setup code).
  async redirects() {
    return [{ source: '/admin/create-first-user', destination: '/setup', permanent: false }]
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },

  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
