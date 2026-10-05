import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import pkg from './package.json' with { type: 'json' };

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: path.join(root, 'web'),
  plugins: [react()],
  // 版本号给登录页左下角那一行用
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  build: { outDir: path.join(root, 'dist'), emptyOutDir: true },
  server: { fs: { allow: [root] } },
});
