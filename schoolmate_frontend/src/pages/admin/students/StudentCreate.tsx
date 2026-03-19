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
  const [relModal, setRelModal] = useState<{
    parentId: string;
    name: string;
  } | null>(null);
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
    const r = await admin.get("/students/search-parent", {
      params: { keyword: searchKeyword },
    });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await admin.post("/students", {
      ...form,
      classroomId: form.classroomId || null,
      guardians: guardians.map((g) => ({
        parentId: g.parentId,
        relationship: g.relation,
      })),
    });
    navigate(ADMIN_ROUTES.STUDENTS.LIST);
  };

  return (
    <AdminLayout>
      <div className="breadcrumb d-flex align-items-center gap-3 mb-24">
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            background: "none",
            border: "1px solid var(--border-color)",
            borderRadius: 6,
            padding: "4px 10px",
            cursor: "pointer",
            color: "var(--text-secondary-light)",
          }}
        >
          <i className="bi bi-arrow-left" />
        </button>
        <div>
          <h6 className="fw-semibold mb-0">신규 학생 등록</h6>
          <p className="text-neutral-600 mt-4 mb-0">
            새 학생 계정을 등록합니다.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card">
        <div className="card-body p-4">
          <h5 className="mb-4 text-primary fw-bold">
            <i className="bi bi-person-circle me-2" />
            기본 인적 사항
          </h5>
          <div className="row g-3 mb-5">
            <div className="col-md-6">
              <label className="form-label fw-bold">
                이름 <span className="text-danger">*</span>
              </label>
              <input
                className="form-control"
                required
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="성함 입력"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-bold">학번</label>
              <input
                className="form-control"
                required
                value={form.code}
                onChange={(e) =>
                  setForm((f) => ({ ...f, code: e.target.value }))
                }
                placeholder="예: 202610001"
              />
            </div>
            <div className="col-md-12">
              <label className="form-label fw-bold">
                이메일 (ID) <span className="text-danger">*</span>
              </label>
              <input
                type="email"
                className="form-control"
                required
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                placeholder="example@school.com"
              />
            </div>
            <div className="col-md-12">
              <label className="form-label fw-bold">
                초기 비밀번호 <span className="text-danger">*</span>
              </label>
              <input
                type="password"
                className="form-control"
                required
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
              />
            </div>
          </div>

          <h5 className="mb-4 text-primary fw-bold">
            <i className="bi bi-journal-check me-2" />
            최초 학급 배정 (선택)
          </h5>
          <div className="row g-3 mb-5">
            <div className="col-md-12">
              <label className="form-label fw-bold">학급 선택</label>
              <select
                className="form-select"
                value={form.classroomId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, classroomId: e.target.value }))
                }
              >
                <option value="">배정 안함 (미배정)</option>
                {classrooms.map((c: any) => (
                  <option key={c.cid} value={c.cid}>
                    {c.year}학년도 {c.grade}학년 {c.classNum}반
                  </option>
                ))}
              </select>
              <div className="form-text">
                현재 학년도에 개설된 학급 목록입니다.
              </div>
            </div>
          </div>

          <h5 className="mb-4 text-primary fw-bold">
            <i className="bi bi-people me-2" />
            보호자 연동 (선택)
          </h5>
          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <label className="form-label fw-bold mb-0">보호자 목록</label>
              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={() => setShowModal(true)}
              >
                <i className="bi bi-search" /> 보호자 검색
              </button>
            </div>
            <div
              className="border rounded p-2 bg-neutral-100"
              style={{ minHeight: 50 }}
            >
              {guardians.length === 0 ? (
                <p className="text-muted small text-center mb-0 py-2">
                  연동할 보호자를 검색하여 추가하세요.
                </p>
              ) : (
                guardians.map((g) => (
                  <span key={g.parentId} className="badge bg-primary me-2 mb-1">
                    {g.name} ({RELATION_LABEL[g.relation] ?? g.relation})
                    <button
                      type="button"
                      className="btn-close btn-close-white ms-1"
                      style={{ fontSize: "0.5rem" }}
                      onClick={() =>
                        setGuardians((prev) =>
                          prev.filter((x) => x.parentId !== g.parentId),
                        )
                      }
                    />
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
        <div className="d-flex justify-content-end gap-2 px-24 py-16 border-top border-neutral-200">
          <button
            type="button"
            className="btn btn-secondary px-4 me-2"
            onClick={() => navigate(-1)}
          >
            취소
          </button>
          <button type="submit" className="btn btn-primary-600 radius-8 px-5">
            등록 완료
          </button>
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
              background: "var(--white)",
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
                borderBottom: "1px solid var(--border-color)",
              }}
            >
              <h6 style={{ margin: 0, fontWeight: 600, fontSize: 16 }}>
                보호자 검색
              </h6>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 18,
                  cursor: "pointer",
                  color: "var(--text-secondary-light)",
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: "20px" }}>
              <div className="input-group mb-3">
                <input
                  className="form-control"
                  placeholder="보호자 이름 입력"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyUp={(e) => e.key === "Enter" && searchParents()}
                />
                <button
                  className="btn btn-primary-600 radius-8"
                  type="button"
                  onClick={searchParents}
                >
                  검색
                </button>
              </div>
              <div
                className="list-group"
                style={{ maxHeight: 300, overflowY: "auto" }}
              >
                {searchResult.map((p: any) => (
                  <button
                    key={p.id ?? p.uid}
                    type="button"
                    className="list-group-item list-group-item-action"
                    onClick={() => addGuardian(p)}
                  >
                    {p.name} ({p.email})
                  </button>
                ))}
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
              background: "var(--white)",
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
                borderBottom: "1px solid var(--border-color)",
              }}
            >
              <h6 style={{ margin: 0, fontWeight: 600, fontSize: 16 }}>
                관계 설정
              </h6>
              <button
                onClick={() => setRelModal(null)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 18,
                  cursor: "pointer",
                  color: "var(--text-secondary-light)",
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: "20px" }}>
              <p className="mb-2 text-center fw-bold">{relModal.name}</p>
              <label className="form-label small text-muted">관계 선택</label>
              <select
                className="form-select"
                value={relation}
                onChange={(e) => setRelation(e.target.value)}
              >
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
                className="btn btn-primary-600 radius-8 w-100"
                onClick={confirmRelation}
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
