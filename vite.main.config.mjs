import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'node18',
    rollupOptions: {
      external: ['electron', 'pg-native'],
      output: {
        format: 'cjs',
        externalLiveBindings: false,
        generatedCode: {
          constBindings: true,
        },
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
