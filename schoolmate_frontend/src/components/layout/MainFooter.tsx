export default function MainFooter() {
  return (
    <footer style={{ background: "#fafafa", color: "rgba(0,0,0,0.55)", padding: "36px 0 24px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 24, marginBottom: 20 }}>
          <a
            href="/privacy"
            style={{ color: "rgba(0,0,0,0.6)", textDecoration: "none", fontSize: "0.85rem", transition: "color 0.2s" }}
          >
            개인정보처리방침
          </a>
          <div style={{ width: 1, background: "rgba(0,0,0,0.15)" }} />
          <a
            href="/terms"
            style={{ color: "rgba(0,0,0,0.6)", textDecoration: "none", fontSize: "0.85rem", transition: "color 0.2s" }}
          >
            이용약관
          </a>
          <div style={{ width: 1, background: "rgba(0,0,0,0.15)" }} />
          <a
            href="/contact"
            style={{ color: "rgba(0,0,0,0.6)", textDecoration: "none", fontSize: "0.85rem", transition: "color 0.2s" }}
          >
            문의하기
          </a>
        </div>
        <div style={{ textAlign: "center", fontSize: "0.8rem", lineHeight: 1.9, marginBottom: 20 }}>
          <span>(주)스쿨메이트 &nbsp;|&nbsp; 대표: 진준철우</span>
          <br />
          <span>주소: 서울특별시 종로구 종로12길 15 코아빌딩 2층</span>
          <br />
          <span>이메일: contact@schoolmate.kr &nbsp;|&nbsp; 전화: 0507-1430-7001</span>
        </div>
        <div
          style={{
            fontSize: "0.75rem",
            textAlign: "center",
            borderTop: "1px solid rgba(0,0,0,0.08)",
            paddingTop: 16,
            color: "rgba(0,0,0,0.35)",
          }}
        >
          Copyright 2026 SchoolMate. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
}
