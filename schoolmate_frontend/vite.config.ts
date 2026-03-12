import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: "/main",
    proxy: {
      // API 요청은 Spring Boot(:8080)로 전달
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      // [woo] OAuth2 소셜 로그인 시작만 Spring으로 전달 (callback은 React 라우터가 처리)
      "/oauth2/authorization": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/login/oauth2": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
});
