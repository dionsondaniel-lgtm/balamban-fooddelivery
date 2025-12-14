import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/** @type {import('vite').UserConfig} */
export default defineConfig({
  plugins: [react()],
  base: '/', // ensure root path for Vercel
  build: {
    outDir: 'dist', // default folder; optional
  },
});
