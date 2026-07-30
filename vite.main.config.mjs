import { defineConfig } from 'vite';
import dotenv from 'dotenv';

// Carrega as variáveis do .env durante o processo de build/compilação
dotenv.config();

// https://vitejs.dev/config
export default defineConfig({
  define: {
    'process.env.TURSO_DATABASE_URL': JSON.stringify(process.env.TURSO_DATABASE_URL || ''),
    'process.env.TURSO_AUTH_TOKEN': JSON.stringify(process.env.TURSO_AUTH_TOKEN || ''),
  },
  build: {
    rollupOptions: {
      external: ['electron', 'bufferutil', 'utf-8-validate'],
    },
  },
});
