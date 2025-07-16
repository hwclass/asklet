import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      asklet: path.resolve(__dirname, '../../src'), // ← this maps asklet to your lib source
    },
  },
});