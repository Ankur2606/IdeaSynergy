import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        server: path.resolve(__dirname, 'src/server/index.ts')
      },
      output: {
        entryFileNames: (chunkInfo) => {
          return chunkInfo.name === 'server' 
            ? 'server/[name].js'
            : 'assets/[name]-[hash].js';
        },
      },
      external: [
        'node:util', 'node:stream', 'node:buffer', 'node:http', 'node:https', 
        'node:zlib', 'node:net', 'node:fs', 'node:path', 'node:url', 
        'node:crypto', 'node:os', 'node:process', 'node:stream/web',
        'http', 'https', 'path', 'fs', 'util', 'url', 'stream', 'zlib', 
        'querystring', 'crypto', 'os', 'events', 'net', 'buffer', 'async_hooks', 
        'worker_threads', 'string_decoder', 'ws'
      ]
    }
  },
}));
