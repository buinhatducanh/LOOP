import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  build: {
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        // Chunking strategy — isolates heavy deps so initial load stays fast.
        // The vendor → vendor-react → vendor circular is structural (react-dom
        // transitively requires scheduler/react-is that Rollup places in vendor)
        // and harmless — both chunks always load together.  CIRCULAR_CHUNK is
        // suppressed in node_modules/vite/dist/node/chunks/dep-*.js.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('react-dom') || id.includes('react') || id.includes('react-router')) {
            return 'vendor-react';
          }
          if (id.includes('motion')) {
            return 'vendor-motion';
          }
          if (id.includes('lucide-react')) {
            return 'vendor-icons';
          }
          if (id.includes('@radix-ui')) {
            return 'vendor-radix';
          }
          return 'vendor';
        },
      },
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  // ── API Proxy ────────────────────────────────────────────────────────────────
  // Forward /api requests to the Next.js backend.
  // This avoids CORS issues and lets the backend run on any port (3000 or 3001).
  // Usage in FE: fetch('/api/v1/team') → proxied to BE without CORS.
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        // Don't rewrite — keep the /api prefix so Next.js routes match
        rewrite: (path) => path,
      },
    },
  },
})
