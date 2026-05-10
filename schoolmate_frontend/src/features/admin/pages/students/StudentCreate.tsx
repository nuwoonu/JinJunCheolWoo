import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/shared/components/layout/admin/AdminLayout";
import admin from "@/shared/api/adminApi";
import { ADMIN_ROUTES } from "@/shared/constants/routes";

// [joon] 학생 등록
const RELATION_LABEL: Record<string, string> = {
  FATHER: "부",
  MOTHER: "모",
  GRANDFATHER: "조부",
  GRANDMOTHER: "조모",
  OTHER: "기타",
};

const sectionTitle: React.CSSProperties = {
  fontWeight: 700,
  color: "#25A194",
  fontSize: 16,
  marginBottom: 16,
  marginTop: 4,
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontWeight: 600,
  fontSize: 13,
  marginBottom: 6,
  color: "#1a1a2e",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  padding: "8px 12px",
  fontSize: 14,
  color: "#374151",
  outline: "none",
  boxSizing: "border-box",
  background: "#fff",
};

const fieldWrap: React.CSSProperties = { marginBottom: 20 };

export default function StudentCreate() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    classroomId: "",
  });
  // [soojin] any[] 대신 구체적 타입 정의
  const [classrooms, setClassrooms] = useState<{ id: number; name: string; cid: number; year: number; grade: number; classNum: number }[]>([]);
  const [guardians, setGuardians] = useState<{ parentId: string; name: string; relation: string }[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResult, setSearchResult] = useState<{ id?: number; uid?: number; name: string; email?: string }[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [relModal, setRelModal] = useState<{ parentId: string; name: string } | null>(null);
  const [relation, setRelation] = useState("FATHER");

  useEffect(() => {
    admin
      .get("/students/classrooms")
      .then((r) => setClassrooms(r.data))
      .catch(() => {});
  }, []);

  // [woo] 모달 열릴 때 배경 스크롤 방지
  useEffect(() => {
    const open = showModal || !!relModal;
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [showModal, relModal]);

  const searchParents = async () => {
    const r = await admin.get("/students/search-parent", { params: { keyword: searchKeyword } });
    setSearchResult(Array.isArray(r.data) ? r.data : (r.data?.content ?? []));
  };

  const addGuardian = (p: { id?: number; uid?: number; name: string; email?: string }) => {
    setShowModal(false);
    setSearchKeyword("");
    setSearchResult([]);
    setRelModal({ parentId: String(p.id ?? p.uid ?? ""), name: p.name });
    setRelation("FATHER");
  };

  const confirmRelation = () => {
    if (!relModal) return;
    if (!guardians.find((g) => g.parentId === relModal.parentId)) {
      setGuardians((prev) => [...prev, { ...relModal, relation }]);
    }
    setRelModal(null);
  };

  // [woo 03/25] 이메일 중복 등 에러 시 alert 표시
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await admin.post("/students", {
        ...form,
        classroomId: form.classroomId || null,
        guardians: guardians.map((g) => ({ parentId: g.parentId, relationship: g.relation })),
      });
      navigate(ADMIN_ROUTES.STUDENTS.LIST);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: string } })?.response?.data || "학생 등록에 실패했습니다.";
      alert(msg);
    }
  };

  return (
    <AdminLayout>
      <div style={{ marginBottom: 24 }}>
        <h6 style={{ fontWeight: 700, color: "#111827", marginBottom: 4 }}>신규 학생 등록</h6>
        <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>새 학생 계정을 등록합니다.</p>
        <button
          type="button"
          onClick={() => navigate(ADMIN_ROUTES.STUDENTS.LIST)}
          style={{
            marginTop: 8,
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 6,
            padding: "4px 10px",
            cursor: "pointer",
            color: "#6b7280",
            fontSize: 13,
          }}
        >
          ← 목록으로
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
          <h6 style={sectionTitle}>기본 인적 사항</h6>

          <div style={fieldWrap}>
            <label style={labelStyle}>
              이름 <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input
              type="text"
              style={inputStyle}
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="성함 입력"
            />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>
              이메일 (ID) <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input
              type="email"
              style={inputStyle}
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="example@school.com"
            />
          </div>
          <div style={{ marginBottom: 32 }}>
            <label style={labelStyle}>
              초기 비밀번호 <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input
              type="password"
              style={inputStyle}
              required
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            />
          </div>

          <h6 style={sectionTitle}>최초 학급 배정 (선택)</h6>
          <div style={{ marginBottom: 32 }}>
            <label style={labelStyle}>학급 선택</label>
            <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 6px" }}>현재 학년도에 개설된 학급 목록입니다.</p>

            <select
              style={inputStyle}
              value={form.classroomId}
              onChange={(e) => setForm((f) => ({ ...f, classroomId: e.target.value }))}
            >
              <option value="">배정 안함 (미배정)</option>
              {classrooms.map((c) => (
                <option key={c.cid} value={c.cid}>
                  {c.year}학년도 {c.grade}학년 {c.classNum}반
                </option>
              ))}
            </select>
          </div>

          <h6 style={sectionTitle}>보호자 연동 (선택)</h6>
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <label style={{ ...labelStyle, margin: 0 }}>보호자 목록</label>
              <button
                type="button"
                onClick={() => setShowModal(true)}
                style={{
                  padding: "5px 12px",
                  background: "#fff",
                  border: "1px solid #25A194",
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#25A194",
                  cursor: "pointer",
                }}
              >
                <i className="ri-search-line me-1" /> 보호자 검색
              </button>
            </div>
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                padding: 10,
                minHeight: 50,
                background: "#f9fafb",
              }}
            >
              {guardians.length === 0 ? (
                <p style={{ color: "#9ca3af", fontSize: 13, textAlign: "center", margin: "6px 0" }}>
                  연동할 보호자를 검색하여 추가하세요.
                </p>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {guardians.map((g) => (
                    <span
                      key={g.parentId}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        background: "#eff6ff",
                        color: "#1d4ed8",
                        border: "1px solid #93c5fd",
                        borderRadius: 6,
                        padding: "3px 10px",
                        fontSize: 13,
                        fontWeight: 500,
                      }}
                    >
                      {g.name} ({RELATION_LABEL[g.relation] ?? g.relation})
                      <button
                        type="button"
                        onClick={() => setGuardians((prev) => prev.filter((x) => x.parentId !== g.parentId))}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#1d4ed8",
                          fontSize: 14,
                          padding: 0,
                          lineHeight: 1,
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              marginTop: 24,
              paddingTop: 16,
              borderTop: "1px solid #e5e7eb",
            }}
          >
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={{
                background: "#fff",
                color: "#374151",
                border: "1px solid #d1d5db",
                borderRadius: 8,
                padding: "5px 12px",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              취소
            </button>
            <button
              type="submit"
              style={{
                background: "#25A194",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "5px 12px",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              등록 완료
            </button>
          </div>
        </div>
      </form>

      {/* 보호자 검색 모달 */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              width: "100%",
              maxWidth: 480,
              margin: "0 16px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <h6 style={{ margin: 0, fontWeight: 600, fontSize: 16 }}>보호자 검색</h6>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#6b7280" }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <input
                  style={inputStyle}
                  placeholder="보호자 이름 입력"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyUp={(e) => e.key === "Enter" && searchParents()}
                />
                <button
                  type="button"
                  onClick={searchParents}
                  style={{
                    padding: "5px 12px",
                    background: "#25A194",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#fff",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  검색
                </button>
              </div>
              <div style={{ maxHeight: 300, overflowY: "auto", border: "1px solid #e5e7eb", borderRadius: 8 }}>
                {searchResult.map((p) => (
                  <button
                    key={p.id ?? p.uid}
                    type="button"
                    onClick={() => addGuardian(p)}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "10px 14px",
                      background: "none",
                      border: "none",
                      borderBottom: "1px solid #f3f4f6",
                      textAlign: "left",
                      fontSize: 14,
                      color: "#374151",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                  >
                    {p.name} ({p.email})
                  </button>
                ))}
                {searchResult.length === 0 && (
                  <p style={{ textAlign: "center", color: "#9ca3af", fontSize: 13, padding: "16px 0", margin: 0 }}>
                    검색 결과가 없습니다.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 관계 선택 모달 */}
      {relModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              width: "100%",
              maxWidth: 360,
              margin: "0 16px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <h6 style={{ margin: 0, fontWeight: 600, fontSize: 16 }}>관계 설정</h6>
              <button
                onClick={() => setRelModal(null)}
                style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#6b7280" }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: 20 }}>
              <p style={{ textAlign: "center", fontWeight: 600, marginBottom: 12 }}>{relModal.name}</p>
              <label style={{ display: "block", fontSize: 13, color: "#6b7280", marginBottom: 6 }}>관계 선택</label>
              <select style={inputStyle} value={relation} onChange={(e) => setRelation(e.target.value)}>
                <option value="FATHER">부</option>
                <option value="MOTHER">모</option>
                <option value="GRANDFATHER">조부</option>
                <option value="GRANDMOTHER">조모</option>
                <option value="OTHER">기타</option>
              </select>
            </div>
            <div style={{ padding: "0 20px 20px" }}>
              <button
                type="button"
                onClick={confirmRelation}
                style={{
                  width: "100%",
                  padding: "5px 12px",
                  background: "#25A194",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
