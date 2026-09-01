import { defineConfig } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  define: {
    'process.env.GOOGLE_CLIENT_ID': JSON.stringify(process.env.GOOGLE_CLIENT_ID || ''),
    'process.env.GOOGLE_CLIENT_SECRET': JSON.stringify(process.env.GOOGLE_CLIENT_SECRET || ''),
    'process.env.SMTP_HOST': JSON.stringify(process.env.SMTP_HOST || 'smtp.gmail.com'),
    'process.env.SMTP_PORT': JSON.stringify(process.env.SMTP_PORT || '587'),
    'process.env.SMTP_USER': JSON.stringify(process.env.SMTP_USER || ''),
    'process.env.SMTP_PASS': JSON.stringify(process.env.SMTP_PASS || ''),
    'process.env.PG_HOST': JSON.stringify(process.env.PG_HOST || '127.0.0.1'),
    'process.env.PG_PORT': JSON.stringify(process.env.PG_PORT || '5432'),
    'process.env.PG_DATABASE': JSON.stringify(process.env.PG_DATABASE || 'gestor_orcamento'),
    'process.env.PG_USER': JSON.stringify(process.env.PG_USER || 'postgres'),
    'process.env.PG_PASSWORD': JSON.stringify(process.env.PG_PASSWORD || 'admin123'),
  },
  build: {
    target: 'node18',
    rollupOptions: {
      external: ['electron', 'pg-native'],
      output: {
        format: 'cjs',
        externalLiveBindings: false,
        entryFileNames: '[name].js',
      },
    },
    commonjsOptions: {
      ignoreDynamicRequires: true,
      transformMixedEsModules: true,
      requireReturnsDefault: 'auto',
    },
  },
});
