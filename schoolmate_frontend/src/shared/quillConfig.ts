// [woo 03-27] ReactQuill 공용 설정 — 인라인 px 기반 글자 크기 + 한글 글꼴
import ReactQuill, { Quill } from "react-quill-new";

// [woo 03-27] 글자 크기 — inline style(font-size: px) 방식
const Size = Quill.import("attributors/style/size") as any;
Size.whitelist = ["10px", "12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px"];
Quill.register(Size, true);

// [woo 03-27] 글꼴 — inline style(font-family) 방식
const Font = Quill.import("attributors/style/font") as any;
Font.whitelist = [
  "Nanum Gothic",
  "Nanum Myeongjo",
  "Gothic A1",
  "Malgun Gothic",
  "Batang",
  "Dotum",
  "Gulim",
  "Noto Sans KR",
  "Noto Serif KR",
  "Arial",
  "Georgia",
];
Quill.register(Font, true);

export const QUILL_MODULES = {
  toolbar: [
    [{ font: Font.whitelist }],
    [{ size: Size.whitelist }],
    ["bold", "italic", "underline", "strike"],
    [{ color: [] }, { background: [] }],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ align: [] }],
    ["link", "image"],
    ["clean"],
  ],
};

export const QUILL_FORMATS = [
  "font", "size",
  "bold", "italic", "underline", "strike",
  "color", "background",
  "list",
  "align",
  "link", "image",
];

// [woo] 이미지 없는 텍스트 전용 에디터 설정 (일반 게시판용)
export const QUILL_MODULES_TEXT = {
  toolbar: [
    [{ font: Font.whitelist }],
    [{ size: Size.whitelist }],
    ["bold", "italic", "underline", "strike"],
    [{ color: [] }, { background: [] }],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ align: [] }],
    ["link"],
    ["clean"],
  ],
};

export const QUILL_FORMATS_TEXT = [
  "font", "size",
  "bold", "italic", "underline", "strike",
  "color", "background",
  "list",
  "align",
  "link",
];

// [woo 03-27] 에디터 내용 비어있는지 체크 — 이미지(<img>) 포함 시 내용 있음으로 판단
export function isQuillEmpty(html: string): boolean {
  if (html.includes("<img")) return false;
  return html.replace(/<[^>]*>/g, "").trim().length === 0;
}

// [woo 03-27] 툴바 버튼 한글 툴팁 자동 부여
const TOOLBAR_TOOLTIPS: Record<string, string> = {
  "ql-bold": "굵게",
  "ql-italic": "기울임",
  "ql-underline": "밑줄",
  "ql-strike": "취소선",
  "ql-link": "링크 삽입",
  "ql-image": "이미지 삽입",
  "ql-clean": "서식 제거",
  "ql-list[value='ordered']": "번호 목록",
  "ql-list[value='bullet']": "글머리 기호",
};
const PICKER_TOOLTIPS: Record<string, string> = {
  "ql-font": "글꼴",
  "ql-size": "글자 크기",
  "ql-color": "글자 색상",
  "ql-background": "배경 색상",
  "ql-align": "정렬",
};

function applyTooltips(toolbar: Element) {
  // 버튼
  for (const [cls, tip] of Object.entries(TOOLBAR_TOOLTIPS)) {
    const match = cls.match(/^([\w-]+)\[value='(.+)']$/);
    if (match) {
      toolbar.querySelectorAll(`button.${match[1]}[value="${match[2]}"]`).forEach((el) => el.setAttribute("title", tip));
    } else {
      toolbar.querySelectorAll(`button.${cls}`).forEach((el) => el.setAttribute("title", tip));
    }
  }
  // 드롭다운(picker)
  for (const [cls, tip] of Object.entries(PICKER_TOOLTIPS)) {
    toolbar.querySelectorAll(`.${cls}`).forEach((el) => el.setAttribute("title", tip));
  }
}

// [woo 03-27] DOM에 .ql-toolbar가 나타나면 자동으로 툴팁 적용
if (typeof window !== "undefined") {
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      m.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement) {
          if (node.classList?.contains("ql-toolbar")) applyTooltips(node);
          node.querySelectorAll?.(".ql-toolbar").forEach(applyTooltips);
        }
      });
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

export { ReactQuill };
