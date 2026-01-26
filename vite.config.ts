import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';
  const csp = `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://www.googletagmanager.com; worker-src 'self' blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self' ${isDev ? 'http://localhost:* ws://localhost:*' : ''} https://generativelanguage.googleapis.com https://*.amazonaws.com https://*.r2.cloudflarestorage.com https://www.google-analytics.com https://*.ingest.sentry.io;`;

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
        manifest: {
          name: 'Personal Finance Tracker',
          short_name: 'Finance Tracker',
          description: 'AI-First Personal Finance Tracker PWA',
          theme_color: '#2563eb',
          background_color: '#f8fafc',
          display: 'standalone',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            }
          ]
        }
      }),
      {
        name: 'html-inject-csp',
        transformIndexHtml(html) {
          return html.replace('<!--%CSP%-->', `<meta http-equiv="Content-Security-Policy" content="${csp}">`);
        }
      }
    ],
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:8788',
          changeOrigin: true,
        },
      },
    },
  };
})
