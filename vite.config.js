import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      {
        find: /^redux\/(.+)$/,
        replacement: `${fileURLToPath(new URL('./src/redux', import.meta.url))}/$1`
      },
      {
        find: /^utils\/(.+)$/,
        replacement: `${fileURLToPath(new URL('./src/utils', import.meta.url))}/$1`
      },
      {
        find: /^assets\/(.+)$/,
        replacement: `${fileURLToPath(new URL('./src/assets', import.meta.url))}/$1`
      },
      {
        find: 'config',
        replacement: fileURLToPath(new URL('./src/config.js', import.meta.url))
      }
    ]
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'https://interiilink.com'
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('react-router-dom')) return 'vendor-react';
          if (id.includes('three') || id.includes('@react-three')) return 'vendor-3d';
          if (id.includes('@livekit') || id.includes('livekit-client')) return 'vendor-livekit';
          if (id.includes('@tensorflow')) return 'vendor-tensorflow';
          if (id.includes('recharts')) return 'vendor-charts';
          if (id.includes('pdf') || id.includes('canvas')) return 'vendor-doc-preview';
          if (id.includes('lucide-react') || id.includes('@fortawesome')) return 'vendor-icons';
          return undefined;
        }
      }
    }
  }
});
