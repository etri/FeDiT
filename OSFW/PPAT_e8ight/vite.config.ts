import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import * as os from 'os'

// 네트워크 IP 자동 감지
function getNetworkAddress(): string {
  const interfaces = os.networkInterfaces()
  for (const name of Object.keys(interfaces)) {
    const iface = interfaces[name]
    if (!iface) continue

    for (const addr of iface) {
      if (addr.family === 'IPv4' && !addr.internal) {
        return addr.address
      }
    }
  }
  return 'localhost'
}

// URL에서 origin 추출 함수
function getOriginFromUrl(url: string): string | undefined {
  try {
    const urlObj = new URL(url)
    return `${urlObj.protocol}//${urlObj.host}`
  } catch {
    return undefined
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 환경 변수 로드
  const env = loadEnv(mode, process.cwd(), '')
  const apiUrl = env.VITE_API_URL || `http://${getNetworkAddress()}:13000/api`
  const proxyTarget = getOriginFromUrl(apiUrl)

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0', // 네트워크 IP로 접속 가능
      port: 5174,
      open: `http://${getNetworkAddress()}:5174`, // 실제 네트워크 IP로 브라우저 자동 실행
      // 개발 환경에서만 프록시 설정
      ...(proxyTarget && {
        proxy: {
          '/api': {
            target: proxyTarget,
            changeOrigin: true,
            secure: false,
            // 필요시 헤더 설정
            configure: (proxy, _options) => {
              proxy.on('error', (err, _req, _res) => {
                console.log('proxy error', err);
              });
              proxy.on('proxyReq', (_proxyReq, req, _res) => {
                console.log('Sending Request to the Target:', req.method, req.url);
              });
              proxy.on('proxyRes', (proxyRes, req, _res) => {
                console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
              });
            },
          }
        }
      })
    },
    build: {
      sourcemap: true,
      chunkSizeWarningLimit: 2000, // 청크 크기 경고 한계를 2MB로 상향
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // node_modules만 vendor 청크로 분리 (나머지는 Vite가 자동 처리)
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          }
        }
      }
    }
  }
})
