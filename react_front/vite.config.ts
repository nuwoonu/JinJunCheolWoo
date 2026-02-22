import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// [woo] Vite 설정 - Thymeleaf Shell + React Island 패턴
// - dev:   npm run dev   → localhost:5173 (프록시로 Spring Boot :8080 연결)
// - build: npm run build → IIFE 번들을 static/js/react/{role}/ 에 출력
//
// 역할별 entry 추가 방법:
//   entry: {
//     'teacher/schedule': resolve(__dirname, 'src/teacher/schedule.tsx'),
//     'student/grade':    resolve(__dirname, 'src/student/grade.tsx'),   // 추가 예시
//     'parent/dashboard': resolve(__dirname, 'src/parent/dashboard.tsx'), // 추가 예시
//   }
export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    proxy: {
      // Spring Boot API 프록시 (dev 전용)
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/teacher/schedule': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },

  build: {
    // Spring Boot static 폴더로 직접 출력
    outDir: resolve(__dirname, '../src/main/resources/static/js/react'),
    emptyOutDir: false,
    rollupOptions: {
      input: {
        // [woo] 역할별 entry - 파일 추가 시 여기에만 한 줄 추가
        'teacher/schedule':  resolve(__dirname, 'src/teacher/schedule.tsx'),
        'teacher/dashboard': resolve(__dirname, 'src/teacher/dashboard.tsx'),
        // 'student/grade':    resolve(__dirname, 'src/student/grade.tsx'),
        // 'parent/dashboard': resolve(__dirname, 'src/parent/dashboard.tsx'),
      },
      output: {
        // 파일명 고정 (해시 없이) → Thymeleaf에서 /js/react/teacher/schedule.js 로 참조
        entryFileNames: '[name].js',
        chunkFileNames: 'shared/[name]-[hash].js',
        assetFileNames: '[name][extname]',
        // [woo] ES 모듈 형식 사용 (다중 엔트리 지원, Thymeleaf에서 type="module" 로 로드)
        format: 'es',
      },
    },
  },
})
