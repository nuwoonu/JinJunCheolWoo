import AdminLayout from "@/shared/components/layout/admin/AdminLayout";
import admin from "@/shared/api/adminApi";
import api from "@/shared/api/authApi";
import { useSchoolSearch, type SchoolSummary } from "@/shared/hooks/useSchoolSearch";
import { useSchool } from "@/shared/contexts/SchoolContext";
import { useState } from "react";

// ── 상수 ────────────────────────────────────────────────────────────────────

const SCHOOL_KINDS = ["", "초등학교", "중학교", "고등학교", "특수학교", "각종학교"];

const ROLE_OPTIONS = [
  { value: "STUDENT", label: "학생" },
  { value: "TEACHER", label: "교사" },
  { value: "STAFF",   label: "교직원" },
];

const STATUS_LABEL: Record<string, string> = {
  ENROLLED: "재학", LEAVE_OF_ABSENCE: "휴학", DROPOUT: "자퇴",
  EXPELLED: "제적", GRADUATED: "졸업", TRANSFERRED: "전학/전출",
  EMPLOYED: "재직", LEAVE: "휴직", RETIRED: "퇴직",
  DISPATCHED: "파견", SUSPENDED: "정직",
};

// ── 타입 ────────────────────────────────────────────────────────────────────

interface MemberSummary {
  infoId: number;
  uid: number;
  name: string;
  email: string;
  code: string;
  role: string;
  status: string;
  schoolName: string;
  schoolId: number;
}

interface TransferResult {
  name: string;
  fromSchoolName: string;
  toSchoolName: string;
  role: string;
}

// ── 공통 스타일 ──────────────────────────────────────────────────────────────

const primary = "#25A194";
const border = "#e5e7eb";
const textSub = "#6b7280";

const sectionStyle: React.CSSProperties = {
  background: "#fff",
  border: `1px solid ${border}`,
  borderRadius: 12,
  padding: "24px",
  marginBottom: 16,
};

const inputStyle: React.CSSProperties = {
  padding: "9px 12px",
  border: `1px solid ${border}`,
  borderRadius: 8,
  fontSize: 14,
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

const btnPrimary = (disabled?: boolean): React.CSSProperties => ({
  padding: "9px 20px",
  border: "none",
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  background: disabled ? "#d1d5db" : primary,
  color: "#fff",
  cursor: disabled ? "not-allowed" : "pointer",
  whiteSpace: "nowrap",
  flexShrink: 0,
});

// ── 상태 배지 ────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const isActive = status === "ENROLLED" || status === "EMPLOYED";
  return (
    <span style={{
      padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap",
      background: isActive ? "rgba(22,163,74,0.1)" : "rgba(107,114,128,0.1)",
      color: isActive ? "#16a34a" : "#6b7280",
    }}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

// ── 학교 검색 패널 ────────────────────────────────────────────────────────────

interface SchoolSearchPanelProps {
  title: string;
  selected: SchoolSummary | null;
  onSelect: (s: SchoolSummary) => void;
  onClear: () => void;
  excludeId?: number | null;
}

function SchoolSearchPanel({ title, selected, onSelect, onClear, excludeId }: SchoolSearchPanelProps) {
  const {
    name, setName,
    schoolKind, setSchoolKind,
    schools, totalPages, totalElements, page,
    loading, searched,
    fetchSchools, handleSearch,
  } = useSchoolSearch((params) => api.get("/schools", { params }));

  if (selected) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          flex: 1,
          background: "rgba(37,161,148,0.06)",
          border: "1px solid rgba(37,161,148,0.3)",
          borderRadius: 8,
          padding: "10px 14px",
        }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{selected.name}</div>
          <div style={{ fontSize: 12, color: textSub }}>
            {selected.schoolKind}
            {selected.officeOfEducation ? ` · ${selected.officeOfEducation}` : ""}
          </div>
        </div>
        <button onClick={onClear} style={{ ...btnPrimary(), background: "#f3f4f6", color: "#374151" }}>
          변경
        </button>
      </div>
    );
  }

  return (
    <>
      {/* 검색 폼 */}
      <form onSubmit={handleSearch}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            style={{ ...inputStyle, flex: 1, minWidth: 160 }}
            placeholder={`${title} 이름 (예) 서울중학교`}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <select
            value={schoolKind}
            onChange={(e) => setSchoolKind(e.target.value)}
            style={{ ...inputStyle, width: "auto", flexShrink: 0 }}
          >
            {SCHOOL_KINDS.map((k) => (
              <option key={k} value={k}>{k || "전체 학교 종류"}</option>
            ))}
          </select>
          <button
            type="submit"
            style={btnPrimary(loading)}
            disabled={loading}
          >
            {loading ? "검색 중..." : "검색"}
          </button>
        </div>
      </form>

      {/* 검색 결과 */}
      {searched && (
        <div style={{ marginTop: 12, border: `1px solid ${border}`, borderRadius: 8, overflow: "hidden" }}>
          <div style={{
            padding: "10px 16px",
            borderBottom: `1px solid ${border}`,
            background: "#f9fafb",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>검색 결과</span>
            <span style={{ fontSize: 12, color: textSub }}>총 {totalElements.toLocaleString()}개</span>
          </div>

          {schools.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", color: textSub, fontSize: 14 }}>
              검색 결과가 없습니다.
            </div>
          ) : (
            // [soojin] overflowX 래퍼 제거 → 브라우저 자동 컬럼 분배
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f9fafb" }}>
                    {["학교명", "종류", "관할 교육청", "주소", ""].map((h) => (
                      <th key={h} style={{
                        padding: "10px 14px",
                        fontWeight: 600,
                        color: "#374151",
                        textAlign: "left",
                        borderBottom: `1px solid ${border}`,
                        whiteSpace: "nowrap",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {schools.filter((s) => s.id !== excludeId).map((s) => (
                    <tr key={s.id} style={{ borderBottom: `1px solid ${border}` }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}>
                      <td style={{ padding: "10px 14px", fontWeight: 500 }}>{s.name}</td>
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{
                          background: "#f3f4f6", color: "#374151",
                          borderRadius: 6, padding: "2px 8px", fontSize: 12, fontWeight: 500,
                        }}>
                          {s.schoolKind ?? "-"}
                        </span>
                      </td>
                      <td style={{ padding: "10px 14px", color: textSub }}>{s.officeOfEducation ?? "-"}</td>
                      <td style={{
                        padding: "10px 14px", color: textSub,
                        maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {s.address ?? "-"}
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "right" }}>
                        <button
                          onClick={() => onSelect(s)}
                          style={{
                            background: primary,
                            color: "#fff", border: "none", borderRadius: 8,
                            padding: "5px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                        >
                          선택
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          )}

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div style={{ padding: "12px 16px", borderTop: `1px solid ${border}`, display: "flex", justifyContent: "center", gap: 4 }}>
              <button
                onClick={() => fetchSchools(page - 1)}
                disabled={page === 0}
                style={{ padding: "4px 10px", border: `1px solid ${border}`, borderRadius: 6, background: "#fff",
                  cursor: page === 0 ? "default" : "pointer", opacity: page === 0 ? 0.4 : 1, fontSize: 13 }}
              >‹</button>
              {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                const start = Math.max(0, Math.min(page - 4, totalPages - 10));
                const p = start + i;
                return (
                  <button key={p} onClick={() => fetchSchools(p)} style={{
                    padding: "4px 10px", border: `1px solid ${p === page ? primary : border}`, borderRadius: 6,
                    background: p === page ? primary : "#fff", color: p === page ? "#fff" : "#374151",
                    cursor: "pointer", fontSize: 13,
                  }}>{p + 1}</button>
                );
              })}
              <button
                onClick={() => fetchSchools(page + 1)}
                disabled={page >= totalPages - 1}
                style={{ padding: "4px 10px", border: `1px solid ${border}`, borderRadius: 6, background: "#fff",
                  cursor: page >= totalPages - 1 ? "default" : "pointer", opacity: page >= totalPages - 1 ? 0.4 : 1, fontSize: 13 }}
              >›</button>
            </div>
          )}
        </div>
      )}

      {!searched && (
        <p style={{ marginTop: 10, fontSize: 13, color: textSub }}>
          검색 버튼을 누르면 전체 목록이 표시됩니다. 학교명이나 종류로 필터할 수 있습니다.
        </p>
      )}
    </>
  );
}

// ── 메인 페이지 ──────────────────────────────────────────────────────────────

export default function Transfer() {
  const { selectedSchool } = useSchool();

  const [fromSchool, setFromSchool] = useState<SchoolSummary | null>(null);

  const [role, setRole]               = useState("STUDENT");
  const [memberKw, setMemberKw]       = useState("");
  const [members, setMembers]         = useState<MemberSummary[]>([]);
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberSearched, setMemberSearched] = useState(false);
  const [selected, setSelected]       = useState<MemberSummary | null>(null);

  const [transferring, setTransferring] = useState(false);
  const [result, setResult]           = useState<TransferResult | null>(null);
  const [error, setError]             = useState("");

  // 구성원 검색
  async function searchMembers() {
    if (!fromSchool) return;
    setMemberLoading(true);
    setMemberSearched(false);
    setSelected(null);
    try {
      const res = await admin.get<MemberSummary[]>("/transfer/search", {
        params: { schoolId: fromSchool.id, role, keyword: memberKw || undefined },
      });
      setMembers(res.data);
    } catch {
      setMembers([]);
    } finally {
      setMemberLoading(false);
      setMemberSearched(true);
    }
  }

  // 전입 실행
  async function doTransfer() {
    if (!selected || !selectedSchool) return;
    setTransferring(true);
    setError("");
    try {
      const res = await admin.post<TransferResult>("/transfer", {
        sourceInfoId: selected.infoId,
        role: selected.role,
        targetSchoolId: selectedSchool.id,
      });
      setResult(res.data);
    } catch (e: unknown) {
      const err = e as { response?: { data?: string } };
      setError(err.response?.data ?? "전입 처리 중 오류가 발생했습니다.");
    } finally {
      setTransferring(false);
    }
  }

  function resetAll() {
    setFromSchool(null);
    setRole("STUDENT");
    setMemberKw("");
    setMembers([]);
    setMemberSearched(false);
    setSelected(null);
    setResult(null);
    setError("");
  }

  // ── 완료 화면 ──
  if (result) {
    return (
      <AdminLayout>
        <div style={{ maxWidth: 560, margin: "80px auto", textAlign: "center" }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "rgba(37,161,148,0.12)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px",
          }}>
            <i className="ri-check-line" style={{ fontSize: 36, color: primary }} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>전입 처리 완료</h2>
          <p style={{ color: textSub, marginBottom: 32, lineHeight: 1.9, fontSize: 15 }}>
            <strong>{result.name}</strong>님이<br />
            <strong>{result.fromSchoolName}</strong>에서<br />
            <strong>{result.toSchoolName}</strong>(으)로<br />
            {result.role === "STUDENT" ? "전학" : "전출"} 처리되었습니다.
          </p>
          <button onClick={resetAll} style={btnPrimary()}>새 전입 처리</button>
        </div>
      </AdminLayout>
    );
  }

  // ── 전입 처리 폼 ──
  return (
    <AdminLayout>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 0 64px" }}>
        <h4 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>전입 처리</h4>
        <p style={{ fontSize: 14, color: textSub, marginBottom: 28 }}>
          다른 학교의 학생·교사·교직원을 전입시킵니다. 전출 학교에서는 전출 상태로 변경됩니다.
        </p>

        {/* ── STEP 1: 전출 학교 ── */}
        <div style={sectionStyle}>
          <StepLabel step={1} label="전출 학교 선택" />
          <SchoolSearchPanel
            title="전출 학교"
            selected={fromSchool}
            onSelect={(s) => {
              setFromSchool(s);
              setMembers([]);
              setMemberSearched(false);
              setSelected(null);
            }}
            onClear={() => {
              setFromSchool(null);
              setMembers([]);
              setMemberSearched(false);
              setSelected(null);
            }}
            excludeId={selectedSchool?.id}
          />
        </div>

        {/* ── STEP 2: 전출 대상 ── */}
        {fromSchool && (
          <div style={sectionStyle}>
            <StepLabel step={2} label="전출 대상 선택" />

            {/* 역할 + 검색어 */}
            <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
              <select
                value={role}
                onChange={(e) => {
                  setRole(e.target.value);
                  setMembers([]);
                  setMemberSearched(false);
                  setSelected(null);
                }}
                style={{ ...inputStyle, width: "auto", flexShrink: 0 }}
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              <input
                style={{ ...inputStyle, flex: 1, minWidth: 160 }}
                placeholder="이름 또는 코드 검색 (비워두면 전체)"
                value={memberKw}
                onChange={(e) => setMemberKw(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchMembers()}
              />
              <button style={btnPrimary(memberLoading)} disabled={memberLoading} onClick={searchMembers}>
                {memberLoading ? "검색 중..." : "검색"}
              </button>
            </div>

            {/* 구성원 목록 */}
            {memberSearched && members.length === 0 && (
              <div style={{ padding: "32px", textAlign: "center", color: textSub, fontSize: 14 }}>
                검색 결과가 없습니다.
              </div>
            )}

            {!memberSearched && (
              <p style={{ fontSize: 13, color: textSub }}>역할과 검색어를 입력하고 검색하세요.</p>
            )}

            {members.length > 0 && (
              <div style={{ border: `1px solid ${border}`, borderRadius: 8, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#f9fafb", borderBottom: `1px solid ${border}` }}>
                      {["이름", "코드", "이메일", "상태", ""].map((h) => (
                        <th key={h} style={{ padding: "10px 12px", fontWeight: 600, color: "#374151", textAlign: "left" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m) => {
                      const isSel = selected?.infoId === m.infoId;
                      return (
                        <tr
                          key={m.infoId}
                          style={{ borderBottom: `1px solid ${border}`, background: isSel ? "rgba(37,161,148,0.06)" : "#fff" }}
                          onMouseEnter={(e) => { if (!isSel) e.currentTarget.style.background = "#f9fafb"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = isSel ? "rgba(37,161,148,0.06)" : "#fff"; }}
                        >
                          <td style={{ padding: "10px 12px", fontWeight: 600 }}>{m.name}</td>
                          <td style={{ padding: "10px 12px", color: textSub }}>{m.code}</td>
                          <td style={{ padding: "10px 12px", color: textSub }}>{m.email}</td>
                          <td style={{ padding: "10px 12px" }}><StatusBadge status={m.status} /></td>
                          <td style={{ padding: "10px 12px", textAlign: "right" }}>
                            <button
                              onClick={() => setSelected(isSel ? null : m)}
                              style={{
                                padding: "5px 14px",
                                border: `1px solid ${isSel ? primary : border}`,
                                borderRadius: 6, fontSize: 12, fontWeight: 600,
                                background: isSel ? primary : "#fff",
                                color: isSel ? "#fff" : "#374151",
                                cursor: "pointer",
                              }}
                            >
                              {isSel ? "선택됨 ✓" : "선택"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 3: 전입 실행 ── */}
        {selected && (
          <div style={sectionStyle}>
            <StepLabel step={3} label="전입 처리" />

            {/* 선택 대상 요약 */}
            <div style={{
              background: "#f9fafb", border: `1px solid ${border}`, borderRadius: 8,
              padding: "12px 20px", marginBottom: 20,
              display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center",
            }}>
              <SummaryItem label="대상" value={selected.name} bold />
              <SummaryItem label="코드" value={selected.code} />
              <SummaryItem label="전출 학교" value={selected.schoolName} />
              <SummaryItem label="전입 학교" value={selectedSchool?.name ?? "-"} bold />
              <SummaryItem label="역할" value={ROLE_OPTIONS.find((r) => r.value === selected.role)?.label ?? selected.role} />
            </div>

            {error && (
              <div style={{
                padding: "10px 14px",
                background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: 8, color: "#dc2626", fontSize: 13, marginBottom: 12,
              }}>
                {error}
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                style={btnPrimary(transferring)}
                disabled={transferring}
                onClick={doTransfer}
              >
                {transferring ? "처리 중..." : `${selected.name}님 전입 처리`}
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

// ── 보조 컴포넌트 ────────────────────────────────────────────────────────────

function StepLabel({ step, label }: { step: number; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <div style={{
        width: 24, height: 24, borderRadius: "50%",
        background: primary, color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 700, flexShrink: 0,
      }}>
        {step}
      </div>
      <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{label}</span>
    </div>
  );
}

function SummaryItem({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: textSub, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: bold ? 700 : 500 }}>{value}</div>
    </div>
  );
}
