import { defineConfig } from 'vite';
import path from 'node:path';

// https://vitejs.dev/config
export default defineConfig({
  server: {
    watch: {
      ignored: [
        path.resolve('out/**'),
        path.resolve('.vite/**'),
      ],
    },
  },
});
