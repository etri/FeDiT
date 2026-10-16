import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        proxy: {
            '/dataeventtrackingservice': {
                target: 'http://localhost:22419',
                changeOrigin: true,
                rewrite: (path) =>
                    path.replace(/^\/dataeventtrackingservice/, ''),
            },
            '/api': {
                target: 'http://localhost:9505',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, '/api'),
            },
            '/grafana': {
                target: 'http://localhost:3000',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/grafana/, '/grafana'),
            },
            '/fedit': {
                target: 'http://{fedtApiIp}:{fedtApiPort}',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/fedit/, '/fedit'),
            },
            '/ndxpro': {
                target: 'http://{ndxproIp}:{ndxproPort}',
                changeOrigin: true,
            },
            '/meta': {
                target: 'http://{metaIp}:{metaPort}',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/meta/, '/meta'),
            },
            '/ngsi-api': {
                target: 'http://localhost:8083',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/ngsi-api/, '/api/v1'),
            },
        },
    },
})
