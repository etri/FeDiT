import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

function envPort(
  env: Record<string, string | undefined>,
  name: string,
  fallback: number,
) {
  const port = Number(env[name] ?? fallback);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error(`${name} must be an integer between 1 and 65535.`);
  return port;
}

export default defineConfig(({ mode }) => {
  // 실행 환경과 서비스 설정을 루트 설정보다 우선 적용
  const env = {
    ...loadEnv(mode, fileURLToPath(new URL("../../", import.meta.url)), ""),
    ...loadEnv(mode, fileURLToPath(new URL(".", import.meta.url)), ""),
    ...process.env,
  };
  const host = env.FLOWCAST_VIEWER_DEV_HOST || "127.0.0.1";
  const port = envPort(env, "FLOWCAST_VIEWER_DEV_PORT", 5173);
  const managementPort = envPort(env, "FLOWCAST_MANAGEMENT_PORT", 8082);
  const viewerPort = envPort(env, "FLOWCAST_VIEWER_PORT", 8090);

  return {
    plugins: [react(), tailwindcss()],
    build: {
      assetsDir: "app-assets",
      chunkSizeWarningLimit: 1800,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ["react", "react-dom", "react-router-dom"],
            three: ["three", "@react-three/fiber", "@react-three/drei"],
            uploads: ["@uppy/core", "@uppy/tus"],
          },
        },
      },
    },
    server: {
      host,
      port,
      strictPort: true,
      watch: {
        ignored: [
          "**/playwright-report/**",
          "**/test-results/**",
          "**/dist/**",
        ],
      },
      proxy: Object.fromEntries(
        ["/app-api", "/legacy", "/sessions", "/assets", "/health"].map(
          (path) => [
            path,
            {
              target:
                path === "/app-api"
                  ? (env.FLOWCAST_DEV_API_URL ??
                    `http://127.0.0.1:${managementPort}`)
                  : (env.FLOWCAST_DEV_LEGACY_URL ??
                    `http://127.0.0.1:${viewerPort}`),
              changeOrigin: false,
              ws: true,
            },
          ],
        ),
      ),
    },
    preview: { host },
    test: {
      environment: "jsdom",
      setupFiles: "./src/lib/test-setup.ts",
      include: ["src/**/*.test.{ts,tsx}"],
      restoreMocks: true,
    },
  };
});
