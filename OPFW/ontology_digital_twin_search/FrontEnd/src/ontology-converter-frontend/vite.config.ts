import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        proxy: {
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
            '/meta': {
                target: 'http://{metaIp}:{metaPort}',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/meta/, '/meta'),
            },
            '/ngsi-api': {
                target: 'http://localhost:8888',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/ngsi-api/, '/api/v1'),
            },
        },
    },
})
