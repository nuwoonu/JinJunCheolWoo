// [woo] iconify-icon 웹 컴포넌트 JSX 타입 선언 (React 18 신규 JSX 변환 대응)
declare namespace React {
  namespace JSX {
    interface IntrinsicElements {
      'iconify-icon': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { icon?: string; className?: string }, HTMLElement>
    }
  }
}
