import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from '@/components/layout/admin/AdminLayout';
import admin from '@/api/adminApi';
import { ADMIN_ROUTES } from '@/constants/routes';

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

export default function StudentCreate() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    code: "",
    email: "",
    password: "",
    classroomId: "",
  });
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [guardians, setGuardians] = useState<any[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResult, setSearchResult] = useState<any[]>([]);
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
    const open = showModal || !!relModal
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [showModal, relModal]);

  const searchParents = async () => {
    const r = await admin.get("/students/search-parent", { params: { keyword: searchKeyword } });
    setSearchResult(Array.isArray(r.data) ? r.data : (r.data?.content ?? []));
  };

  const addGuardian = (p: any) => {
    setShowModal(false);
    setSearchKeyword("");
    setSearchResult([]);
    setRelModal({ parentId: p.id ?? p.uid, name: p.name });
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
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: 6, padding: "4px 10px", cursor: "pointer", color: "#6b7280" }}
        >
          <i className="bi bi-arrow-left" />
        </button>
        <div>
          <h5 style={{ fontWeight: 700, color: "#111827", marginBottom: 4 }}>신규 학생 등록</h5>
          <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>새 학생 계정을 등록합니다.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
          <div style={{ padding: 24 }}>
            <h6 style={sectionTitle}>
              <i className="bi bi-person-circle me-2" />기본 인적 사항
            </h6>
            <div className="row g-3" style={{ marginBottom: 32 }}>
              <div className="col-md-6">
                <label className="form-label fw-semibold">이름 <span style={{ color: "#dc2626" }}>*</span></label>
                <input className="form-control" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="성함 입력" />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">학번</label>
                <input className="form-control" required value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="예: 202610001" />
              </div>
              <div className="col-md-12">
                <label className="form-label fw-semibold">이메일 (ID) <span style={{ color: "#dc2626" }}>*</span></label>
                <input type="email" className="form-control" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="example@school.com" />
              </div>
              <div className="col-md-12">
                <label className="form-label fw-semibold">초기 비밀번호 <span style={{ color: "#dc2626" }}>*</span></label>
                <input type="password" className="form-control" required value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
              </div>
            </div>

            <h6 style={sectionTitle}>
              <i className="bi bi-journal-check me-2" />최초 학급 배정 (선택)
            </h6>
            <div className="row g-3" style={{ marginBottom: 32 }}>
              <div className="col-md-12">
                <label className="form-label fw-semibold">학급 선택</label>
                <select className="form-select" value={form.classroomId} onChange={(e) => setForm((f) => ({ ...f, classroomId: e.target.value }))}>
                  <option value="">배정 안함 (미배정)</option>
                  {classrooms.map((c: any) => (
                    <option key={c.cid} value={c.cid}>{c.year}학년도 {c.grade}학년 {c.classNum}반</option>
                  ))}
                </select>
                <div className="form-text">현재 학년도에 개설된 학급 목록입니다.</div>
              </div>
            </div>

            <h6 style={sectionTitle}>
              <i className="bi bi-people me-2" />보호자 연동 (선택)
            </h6>
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <label className="form-label fw-semibold" style={{ margin: 0 }}>보호자 목록</label>
                <button
                  type="button"
                  onClick={() => setShowModal(true)}
                  style={{ padding: "5px 12px", background: "#fff", border: "1px solid #25A194", borderRadius: 6, fontSize: 13, fontWeight: 500, color: "#25A194", cursor: "pointer" }}
                >
                  <i className="bi bi-search me-1" /> 보호자 검색
                </button>
              </div>
              <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 10, minHeight: 50, background: "#f9fafb" }}>
                {guardians.length === 0 ? (
                  <p style={{ color: "#9ca3af", fontSize: 13, textAlign: "center", margin: "6px 0" }}>연동할 보호자를 검색하여 추가하세요.</p>
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {guardians.map((g) => (
                      <span key={g.parentId} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#eff6ff", color: "#1d4ed8", border: "1px solid #93c5fd", borderRadius: 6, padding: "3px 10px", fontSize: 13, fontWeight: 500 }}>
                        {g.name} ({RELATION_LABEL[g.relation] ?? g.relation})
                        <button
                          type="button"
                          onClick={() => setGuardians((prev) => prev.filter((x) => x.parentId !== g.parentId))}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#1d4ed8", fontSize: 14, padding: 0, lineHeight: 1 }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "16px 24px", borderTop: "1px solid #e5e7eb", background: "#f9fafb" }}>
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={{ padding: "9px 20px", background: "#fff", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, color: "#374151", cursor: "pointer" }}
            >
              취소
            </button>
            <button
              type="submit"
              style={{ padding: "9px 20px", background: "linear-gradient(135deg, #25A194, #1a7a6e)", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer" }}
            >
              등록 완료
            </button>
          </div>
        </div>
      </form>

      {/* 보호자 검색 모달 */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 480, margin: "0 16px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #e5e7eb" }}>
              <h6 style={{ margin: 0, fontWeight: 600, fontSize: 16 }}>보호자 검색</h6>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#6b7280" }}>✕</button>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <input
                  className="form-control"
                  placeholder="보호자 이름 입력"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyUp={(e) => e.key === "Enter" && searchParents()}
                />
                <button
                  type="button"
                  onClick={searchParents}
                  style={{ padding: "9px 16px", background: "linear-gradient(135deg, #25A194, #1a7a6e)", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer", whiteSpace: "nowrap" }}
                >
                  검색
                </button>
              </div>
              <div style={{ maxHeight: 300, overflowY: "auto", border: "1px solid #e5e7eb", borderRadius: 8 }}>
                {searchResult.map((p: any) => (
                  <button
                    key={p.id ?? p.uid}
                    type="button"
                    onClick={() => addGuardian(p)}
                    style={{ display: "block", width: "100%", padding: "10px 14px", background: "none", border: "none", borderBottom: "1px solid #f3f4f6", textAlign: "left", fontSize: 14, color: "#374151", cursor: "pointer" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                  >
                    {p.name} ({p.email})
                  </button>
                ))}
                {searchResult.length === 0 && (
                  <p style={{ textAlign: "center", color: "#9ca3af", fontSize: 13, padding: "16px 0", margin: 0 }}>검색 결과가 없습니다.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 관계 선택 모달 */}
      {relModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 360, margin: "0 16px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #e5e7eb" }}>
              <h6 style={{ margin: 0, fontWeight: 600, fontSize: 16 }}>관계 설정</h6>
              <button onClick={() => setRelModal(null)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#6b7280" }}>✕</button>
            </div>
            <div style={{ padding: 20 }}>
              <p style={{ textAlign: "center", fontWeight: 600, marginBottom: 12 }}>{relModal.name}</p>
              <label style={{ display: "block", fontSize: 13, color: "#6b7280", marginBottom: 6 }}>관계 선택</label>
              <select className="form-select" value={relation} onChange={(e) => setRelation(e.target.value)}>
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
                style={{ width: "100%", padding: "10px", background: "linear-gradient(135deg, #25A194, #1a7a6e)", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer" }}
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
