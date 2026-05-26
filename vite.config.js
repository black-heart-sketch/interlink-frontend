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
      '/api': 'http://localhost:5000'
    }
  }
});
