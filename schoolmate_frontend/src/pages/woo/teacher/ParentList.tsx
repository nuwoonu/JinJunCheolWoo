import { useEffect, useRef, useState } from "react";
import api from "@/api/auth";
import DashboardLayout from "@/components/layout/DashboardLayout";

// [woo] /teacher/parent/list - 학부모 목록 페이지

interface Parent {
  id: number;
  name: string;
  code?: string;
  phone?: string;
  email?: string;
  status?: string;
  statusName?: string;
  linked: boolean;
  childrenStrings?: string[];
}

// [woo] 담임 반 학생 정보 (간편등록 모달용)
interface ClassStudent {
  studentId: number;
  name: string;
  studentNumber?: number;
}

// [woo] 관계 옵션
const RELATIONSHIP_OPTIONS = [
  { value: "FATHER", label: "부" },
  { value: "MOTHER", label: "모" },
  { value: "GRANDFATHER", label: "조부" },
  { value: "GRANDMOTHER", label: "조모" },
  { value: "OTHER", label: "기타" },
];

export default function ParentList() {
  // [soojin] 플랜 패턴 적용: 화면 꽉 채우기 + 필터 카드 밖 + 페이지네이션 카드 밖
  const [page, setPage] = useState<any>(null);
  const [totalAll, setTotalAll] = useState<number | null>(null);
  const isInitialLoad = useRef(true);
  const [type, setType] = useState("");
  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);

  // [woo] 간편등록 모달 상태
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [students, setStudents] = useState<ClassStudent[]>([]);
  const [registerForm, setRegisterForm] = useState({
    studentInfoId: 0,
    parentName: "",
    phoneNumber: "",
    relationship: "MOTHER",
  });
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerResult, setRegisterResult] = useState<{
    parentName: string;
    loginEmail: string;
    childName: string;
    relationship: string;
  } | null>(null);

  const load = (p = 0, kw = keyword, tp = type) => {
    const params = new URLSearchParams({ page: String(p), size: "15" });
    if (kw) params.set("keyword", kw);
    if (tp) params.set("type", tp);

    api
      .get(`/teacher/parents?${params}`)
      .then((res) => {
        setPage(res.data);
        setCurrentPage(p);
        // [soojin] 최초 로드 시에만 전체 수 세팅
        if (isInitialLoad.current) {
          setTotalAll(res.data.totalElements);
          isInitialLoad.current = false;
        }
      })
      .catch(() => {});
  };

  // [woo] 담임 반 학생 목록 조회
  const fetchMyClassStudents = () => {
    api
      .get("/teacher/myclass")
      .then((res) => {
        if (res.data.students) setStudents(res.data.students);
      })
      .catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  // [woo] 모달 열릴 때 배경 스크롤 방지
  useEffect(() => {
    const open = showRegisterModal || !!selectedParent;
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [showRegisterModal, selectedParent]);

  // [woo] 간편등록 모달 열기
  const openRegisterModal = () => {
    fetchMyClassStudents();
    setRegisterForm({ studentInfoId: 0, parentName: "", phoneNumber: "", relationship: "MOTHER" });
    setRegisterResult(null);
    setShowRegisterModal(true);
  };

  // [woo] 간편등록 제출
  const handleRegister = () => {
    if (!registerForm.studentInfoId) {
      alert("학생을 선택해주세요.");
      return;
    }
    if (!registerForm.parentName.trim()) {
      alert("학부모 이름을 입력해주세요.");
      return;
    }
    if (!registerForm.phoneNumber.trim() || registerForm.phoneNumber.replace(/[^0-9]/g, "").length < 10) {
      alert("올바른 전화번호를 입력해주세요.");
      return;
    }
    setRegisterLoading(true);
    api
      .post("/teacher/parents/quick-register", registerForm)
      .then((res) => {
        setRegisterResult(res.data);
        load(); // [woo] 목록 갱신
      })
      .catch((err) => {
        const msg = err.response?.data?.error || "등록에 실패했습니다.";
        alert(msg);
      })
      .finally(() => setRegisterLoading(false));
  };

  const list: Parent[] = page?.content ?? [];

  return (
    <DashboardLayout>
      {/* [soojin] 화면 꽉 채우는 flex column 컨테이너 */}
      <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 4.5rem - 48px)" }}>
        {/* [soojin] 제목 + 전체 인원 수 인라인 */}
        <div style={{ marginBottom: 16, flexShrink: 0 }}>
          <h5
            style={{
              fontWeight: 700,
              color: "#111827",
              marginBottom: 4,
              display: "flex",
              alignItems: "baseline",
              gap: 8,
            }}
          >
            학부모 목록
            <span style={{ fontSize: 13, fontWeight: 400, color: "#6b7280" }}>전체 {totalAll ?? 0}명</span>
          </h5>
          <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>담임 학급 학부모 목록을 조회합니다.</p>
        </div>

        {/* [soojin] 컨트롤 바: 검색(좌) + 간편등록(우) */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
            gap: 12,
            flexWrap: "wrap",
            flexShrink: 0,
          }}
        >
          <form
            style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}
            onSubmit={(e) => {
              e.preventDefault();
              load(0);
            }}
          >
            <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
              <select
                style={{
                  padding: "5px 24px 5px 8px",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  fontSize: 13,
                  background: "#fff",
                  appearance: "none",
                  WebkitAppearance: "none",
                  cursor: "pointer",
                }}
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="">전체</option>
                <option value="name">이름</option>
                <option value="email">이메일</option>
              </select>
              <i
                className="ri-arrow-down-s-line"
                style={{ position: "absolute", right: 4, pointerEvents: "none", fontSize: 16, color: "#6b7280" }}
              />
            </div>
            <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
              <i
                className="bi bi-search"
                style={{ position: "absolute", left: 8, color: "#9ca3af", fontSize: 13, pointerEvents: "none" }}
              />
              <input
                style={{
                  padding: "5px 8px 5px 28px",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  fontSize: 13,
                  minWidth: 160,
                  background: "#fff",
                }}
                placeholder="이름 또는 이메일"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            <button
              style={{
                padding: "5px 12px",
                background: "#25A194",
                border: "none",
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                color: "#fff",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
              type="submit"
            >
              검색
            </button>
            <button
              style={{
                padding: "5px 10px",
                background: "#fff",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                fontSize: 13,
                cursor: "pointer",
                color: "#374151",
                whiteSpace: "nowrap",
              }}
              type="button"
              onClick={() => {
                setType("");
                setKeyword("");
                load(0, "", "");
              }}
            >
              초기화
            </button>
            {/* [soojin] 검색 중일 때만 필터 결과 건수 표시 */}
            {(keyword || type) && page && (
              <span style={{ fontSize: 13, color: "#6b7280", whiteSpace: "nowrap" }}>
                <span style={{ fontWeight: 600, color: "#111827" }}>{page.totalElements}명</span> / 전체 {totalAll ?? 0}
                명
              </span>
            )}
          </form>
          {/* [woo] 간편등록 버튼 */}
          <button
            type="button"
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
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
            onClick={openRegisterModal}
          >
            <iconify-icon icon="mdi:account-plus" />
            학부모 간편등록
          </button>
        </div>

        {/* [soojin] 카드: flex:1 화면 꽉 채움 */}
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            overflow: "hidden",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          {/* [soojin] 스크롤 div: flex:1 overflowY:auto */}
          {/* [soojin] overflowX 래퍼 제거, tableLayout auto로 변경해 브라우저가 컬럼 너비 자동 분배 */}
          <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "auto" }}>
              <thead>
                <tr>
                  {["학생", "학부모 성함", "이메일", "연락처", "연동", "상태", "상세"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "12px 16px",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#6b7280",
                        background: "#f9fafb",
                        borderBottom: "1px solid #e5e7eb",
                        textAlign: "left",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      style={{ padding: "48px 16px", textAlign: "center", color: "#9ca3af", fontSize: 14 }}
                    >
                      등록된 학부모가 없습니다.
                    </td>
                  </tr>
                ) : (
                  list.map((p) => (
                    <tr key={p.id}>
                      <td
                        style={{
                          padding: "14px 16px",
                          fontSize: 13,
                          color: "#374151",
                          borderBottom: "1px solid #f3f4f6",
                          verticalAlign: "middle",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {p.childrenStrings && p.childrenStrings.length > 0 ? (
                          p.childrenStrings.join(", ")
                        ) : (
                          <span style={{ color: "#9ca3af" }}>-</span>
                        )}
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          fontSize: 13,
                          borderBottom: "1px solid #f3f4f6",
                          verticalAlign: "middle",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontWeight: 500, color: "#374151" }}>{p.name}</span>
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          fontSize: 13,
                          color: "#6b7280",
                          borderBottom: "1px solid #f3f4f6",
                          verticalAlign: "middle",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {p.email ?? "-"}
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          fontSize: 13,
                          color: "#6b7280",
                          borderBottom: "1px solid #f3f4f6",
                          verticalAlign: "middle",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {p.phone ?? "-"}
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          fontSize: 13,
                          borderBottom: "1px solid #f3f4f6",
                          verticalAlign: "middle",
                        }}
                      >
                        {p.linked ? (
                          <span
                            style={{
                              padding: "3px 8px",
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 600,
                              background: "rgba(22,163,74,0.1)",
                              color: "#16a34a",
                            }}
                          >
                            연동됨
                          </span>
                        ) : (
                          <span
                            style={{
                              padding: "3px 8px",
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 600,
                              background: "#f3f4f6",
                              color: "#6b7280",
                            }}
                          >
                            미연동
                          </span>
                        )}
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          fontSize: 13,
                          borderBottom: "1px solid #f3f4f6",
                          verticalAlign: "middle",
                        }}
                      >
                        {p.statusName === "ACTIVE" ? (
                          <span
                            style={{
                              padding: "3px 8px",
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 600,
                              background: "rgba(22,163,74,0.1)",
                              color: "#16a34a",
                            }}
                          >
                            {p.statusName}
                          </span>
                        ) : (
                          <span
                            style={{
                              padding: "3px 8px",
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 600,
                              background: "#f3f4f6",
                              color: "#6b7280",
                            }}
                          >
                            {p.statusName ?? "-"}
                          </span>
                        )}
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          fontSize: 13,
                          borderBottom: "1px solid #f3f4f6",
                          verticalAlign: "middle",
                          textAlign: "center",
                        }}
                      >
                        <button
                          type="button"
                          style={{
                            padding: "4px 10px",
                            background: "#fff",
                            border: "1px solid #d1d5db",
                            borderRadius: 6,
                            fontSize: 12,
                            color: "#374151",
                            cursor: "pointer",
                          }}
                          onClick={() => setSelectedParent(p)}
                        >
                          <iconify-icon icon="mdi:eye-outline" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* [soojin] 페이지네이션: 카드 밖, 우측 정렬, 28×28 정사각형 버튼 */}
        {page && page.totalPages >= 1 && (
          <div style={{ display: "flex", justifyContent: "flex-end", padding: "10px 0", gap: 4, flexShrink: 0 }}>
            <button
              onClick={() => load(currentPage - 1)}
              disabled={currentPage === 0}
              style={{
                width: 28,
                height: 28,
                padding: 0,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid #e5e7eb",
                borderRadius: 6,
                background: "#fff",
                cursor: currentPage === 0 ? "not-allowed" : "pointer",
                color: currentPage === 0 ? "#d1d5db" : "#374151",
                fontSize: 12,
              }}
            >
              ‹
            </button>
            {Array.from({ length: page.totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => load(i)}
                style={{
                  width: 28,
                  height: 28,
                  padding: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `1px solid ${i === currentPage ? "#25A194" : "#e5e7eb"}`,
                  borderRadius: 6,
                  background: i === currentPage ? "#25A194" : "#fff",
                  color: i === currentPage ? "#fff" : "#374151",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: i === currentPage ? 600 : 400,
                }}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => load(currentPage + 1)}
              disabled={currentPage >= page.totalPages - 1}
              style={{
                width: 28,
                height: 28,
                padding: 0,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid #e5e7eb",
                borderRadius: 6,
                background: "#fff",
                cursor: currentPage >= page.totalPages - 1 ? "not-allowed" : "pointer",
                color: currentPage >= page.totalPages - 1 ? "#d1d5db" : "#374151",
                fontSize: 12,
              }}
            >
              ›
            </button>
          </div>
        )}
      </div>

      {/* [woo] 학부모 상세 모달 */}
      {selectedParent && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content radius-12">
              <div className="modal-header border-bottom py-16 px-24">
                <h6 className="modal-title">학부모 정보</h6>
                <button type="button" className="btn-close" onClick={() => setSelectedParent(null)} />
              </div>
              <div className="modal-body p-24">
                <div className="text-center mb-24">
                  <div className="w-80-px h-80-px bg-success-100 rounded-circle d-flex justify-content-center align-items-center mx-auto mb-16">
                    <iconify-icon icon="mdi:account-heart" className="text-success-600 text-4xl" />
                  </div>
                  <h5 className="mb-4">{selectedParent.name}</h5>
                  <span
                    className={`badge px-10 py-4 radius-4 text-xs fw-medium ${selectedParent.linked ? "bg-success-100 text-success-600" : "bg-neutral-100 text-secondary-light"}`}
                  >
                    {selectedParent.linked ? "연동됨" : "미연동"}
                  </span>
                </div>
                <div className="d-flex flex-column gap-12">
                  {[
                    { label: "이메일", value: selectedParent.email },
                    { label: "연락처", value: selectedParent.phone },
                    { label: "학부모코드", value: selectedParent.code },
                    { label: "상태", value: selectedParent.statusName },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="d-flex justify-content-between align-items-center py-10 border-bottom"
                    >
                      <span className="text-secondary-light text-sm">{row.label}</span>
                      <span className="fw-medium text-sm">{row.value ?? "-"}</span>
                    </div>
                  ))}
                  {selectedParent.childrenStrings && selectedParent.childrenStrings.length > 0 && (
                    <div className="py-10">
                      <p className="text-secondary-light text-sm mb-8">자녀 목록</p>
                      {selectedParent.childrenStrings.map((c, i) => (
                        <span key={i} className="badge bg-primary-100 text-primary-600 me-6 mb-4 px-10 py-4 radius-4">
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer border-top py-16 px-24">
                <button
                  type="button"
                  className="btn btn-outline-neutral-300 radius-8"
                  onClick={() => setSelectedParent(null)}
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* [woo] 학부모 간편등록 모달 */}
      {showRegisterModal && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content radius-12">
              <div className="modal-header border-bottom py-16 px-24">
                <h6 className="modal-title d-flex align-items-center gap-8">
                  <iconify-icon icon="mdi:account-plus" className="text-success-600" />
                  학부모 간편등록
                </h6>
                <button type="button" className="btn-close" onClick={() => setShowRegisterModal(false)} />
              </div>
              <div className="modal-body p-24">
                {registerResult ? (
                  <div className="text-center">
                    <div className="w-80-px h-80-px bg-success-100 rounded-circle d-flex justify-content-center align-items-center mx-auto mb-16">
                      <iconify-icon icon="mdi:check-circle" className="text-success-600 text-4xl" />
                    </div>
                    <h6 className="mb-16">등록 완료!</h6>
                    <div className="bg-neutral-50 radius-8 p-16 text-start">
                      {[
                        { label: "학부모", value: registerResult.parentName },
                        { label: "자녀", value: registerResult.childName },
                        { label: "관계", value: registerResult.relationship },
                        { label: "로그인 ID", value: registerResult.loginEmail, highlight: true },
                        { label: "초기 비밀번호", value: "전화번호 뒷 4자리", warn: true },
                      ].map((row, i, arr) => (
                        <div
                          key={row.label}
                          className={`d-flex justify-content-between py-8 ${i < arr.length - 1 ? "border-bottom" : ""}`}
                        >
                          <span className="text-secondary-light text-sm">{row.label}</span>
                          <span
                            className={`fw-semibold text-sm ${row.highlight ? "text-primary-600" : row.warn ? "text-warning-600" : ""}`}
                          >
                            {row.value}
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="text-secondary-light text-xs mt-12">
                      학부모에게 로그인 ID와 초기 비밀번호를 안내해주세요.
                    </p>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-16">
                    <p className="text-secondary-light text-sm mb-0">
                      학생의 학부모를 간편하게 등록합니다.
                      <br />
                      전화번호가 로그인 ID, 뒷 4자리가 초기 비밀번호가 됩니다.
                    </p>
                    <div>
                      <label className="form-label fw-medium text-sm mb-6">
                        학생 선택 <span className="text-danger-600">*</span>
                      </label>
                      <select
                        className="form-select radius-8"
                        value={registerForm.studentInfoId}
                        onChange={(e) => setRegisterForm((f) => ({ ...f, studentInfoId: Number(e.target.value) }))}
                      >
                        <option value={0}>-- 학생을 선택하세요 --</option>
                        {students.map((s) => (
                          <option key={s.studentId} value={s.studentId}>
                            {s.studentNumber ? `${s.studentNumber}번 ` : ""}
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="form-label fw-medium text-sm mb-6">
                        학부모 이름 <span className="text-danger-600">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control radius-8"
                        placeholder="학부모 이름 입력"
                        value={registerForm.parentName}
                        onChange={(e) => setRegisterForm((f) => ({ ...f, parentName: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="form-label fw-medium text-sm mb-6">
                        전화번호 <span className="text-danger-600">*</span>
                      </label>
                      <input
                        type="tel"
                        className="form-control radius-8"
                        placeholder="01012345678"
                        value={registerForm.phoneNumber}
                        onChange={(e) => setRegisterForm((f) => ({ ...f, phoneNumber: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="form-label fw-medium text-sm mb-6">관계</label>
                      <select
                        className="form-select radius-8"
                        value={registerForm.relationship}
                        onChange={(e) => setRegisterForm((f) => ({ ...f, relationship: e.target.value }))}
                      >
                        {RELATIONSHIP_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer border-top py-16 px-24 gap-8">
                {registerResult ? (
                  <button
                    type="button"
                    className="btn btn-primary-600 radius-8"
                    onClick={() => {
                      setRegisterResult(null);
                      setRegisterForm({ studentInfoId: 0, parentName: "", phoneNumber: "", relationship: "MOTHER" });
                    }}
                  >
                    추가 등록
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-success-600 radius-8 d-flex align-items-center gap-6"
                    onClick={handleRegister}
                    disabled={registerLoading}
                  >
                    {registerLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm" />
                        등록 중...
                      </>
                    ) : (
                      <>
                        <iconify-icon icon="mdi:check" />
                        등록하기
                      </>
                    )}
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-outline-neutral-300 radius-8"
                  onClick={() => setShowRegisterModal(false)}
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
