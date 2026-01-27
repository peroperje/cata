import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import manifest from './src/manifest'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
    root: __dirname,
    plugins: [
        react(),
        {
            name: 'fix-server-watch',
            enforce: 'pre',
            configResolved(config) {
                if (config.server && (config.server.watch as any) === false) {
                    config.server.watch = {};
                }
            },
        },
        crx({ manifest }),
    ],
    resolve: {
        alias: {
            '@': '/apps/extension/src',
        },
    },
    server: {
        port: 5173,
        strictPort: true,
        hmr: {
            port: 5173,
        },
    },
    build: {
        outDir: '../../dist/apps/extension',
        emptyOutDir: true,
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('pdfjs-dist')) {
                        return 'pdfjs';
                    }
                    if (id.includes('@google/generative-ai')) {
                        return 'gemini';
                    }
                    if (id.includes('node_modules')) {
                        return 'vendor';
                    }
                },
            },
        },
    },
})
