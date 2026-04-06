/** @type {import('tailwindcss').Config} */
// [cheol] important: true → 모든 Tailwind utility에 !important 적용
// CSS Cascade Lv5: @layer 안의 !important > unlayered !important (Bootstrap)
// Bootstrap이 index.html <link>로 전역 로드되어도 Tailwind가 .library-root 내에서 우선함
export default {
  content: [],
  important: true,
};
