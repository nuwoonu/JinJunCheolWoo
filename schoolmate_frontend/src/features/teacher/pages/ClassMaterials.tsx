import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/api/auth";
import DashboardLayout from "@/components/layout/DashboardLayout";

// [soojin] /teacher/class-materials - 수업 자료 관리 페이지
// 교사가 등록한 수업 자료 목록 조회 및 관리

interface Material {
  id: number;
  title: string;
  subjectName?: string;
  className?: string;
  fileCount?: number;
  createDate: string;
  description?: string;
}

// [soojin] th/td 공통 스타일 - TeacherList 동일 패턴
const thSt: React.CSSProperties = {
  padding: "10px 16px",
  fontSize: 13,
  fontWeight: 600,
  color: "#6b7280",
  background: "#f9fafb",
  borderBottom: "1px solid #e5e7eb",
  whiteSpace: "nowrap",
  textAlign: "left",
};
const tdSt: React.CSSProperties = {
  padding: "12px 16px",
  fontSize: 13,
  color: "#374151",
  borderBottom: "1px solid #f3f4f6",
  verticalAlign: "middle",
  whiteSpace: "nowrap",
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "-";
  return dateStr.slice(0, 10).replace(/-/g, ".");
};

export default function ClassMaterials() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/teacher/materials")
      .then((res) => setMaterials(res.data ?? []))
      .catch(() => setMaterials([]))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = (id: number) => {
    if (!window.confirm("이 수업 자료를 삭제하시겠습니까?")) return;
    api
      .delete(`/teacher/materials/${id}`)
      .then(() => setMaterials((prev) => prev.filter((m) => m.id !== id)))
      .catch(() => alert("삭제에 실패했습니다."));
  };

  return (
    <DashboardLayout>
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h6 className="fw-semibold mb-0">수업 자료</h6>
          <p className="text-neutral-600 mt-4 mb-0">수업에 사용하는 자료를 관리합니다</p>
        </div>
        <Link
          to="/teacher/class-materials/create"
          className="btn btn-primary-600 d-flex align-items-center gap-2"
          style={{ fontSize: 13, padding: "8px 16px" }}
        >
          <i className="ri-add-line" /> 자료 등록
        </Link>
      </div>

      <div className="card" style={{ borderRadius: 12, border: "1px solid #e5e7eb", boxShadow: "none" }}>
        {loading ? (
          <div className="d-flex justify-content-center align-items-center py-60">
            <div className="spinner-border text-primary" role="status" />
          </div>
        ) : materials.length === 0 ? (
          <div className="d-flex flex-column align-items-center justify-content-center py-60 text-neutral-400">
            <i className="ri-book-open-line" style={{ fontSize: 40, marginBottom: 12 }} />
            <p style={{ fontSize: 14 }}>등록된 수업 자료가 없습니다.</p>
            <Link
              to="/teacher/class-materials/create"
              className="btn btn-outline-primary mt-8"
              style={{ fontSize: 13 }}
            >
              자료 등록하기
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thSt}>제목</th>
                  <th style={thSt}>과목</th>
                  <th style={thSt}>학급</th>
                  <th style={thSt}>첨부파일</th>
                  <th style={thSt}>등록일</th>
                  <th style={{ ...thSt, textAlign: "right" }}>관리</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((m) => (
                  <tr
                    key={m.id}
                    style={{ transition: "background 0.15s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                  >
                    <td style={{ ...tdSt, fontWeight: 500 }}>
                      <Link
                        to={`/teacher/class-materials/${m.id}`}
                        style={{ color: "#374151", textDecoration: "none" }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#25A194")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "#374151")}
                      >
                        {m.title}
                      </Link>
                    </td>
                    <td style={tdSt}>{m.subjectName ?? "-"}</td>
                    <td style={tdSt}>{m.className ?? "-"}</td>
                    <td style={tdSt}>
                      {m.fileCount ? (
                        <span style={{ color: "#25A194", fontWeight: 500 }}>
                          <i className="ri-attachment-2" style={{ marginRight: 4 }} />
                          {m.fileCount}개
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td style={tdSt}>{formatDate(m.createDate)}</td>
                    <td style={{ ...tdSt, textAlign: "right" }}>
                      <div className="d-flex align-items-center justify-content-end gap-8">
                        <Link
                          to={`/teacher/class-materials/${m.id}/edit`}
                          className="btn btn-sm"
                          style={{
                            fontSize: 12,
                            padding: "4px 10px",
                            border: "1px solid #e5e7eb",
                            borderRadius: 6,
                            color: "#374151",
                            background: "#fff",
                          }}
                        >
                          수정
                        </Link>
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={() => handleDelete(m.id)}
                          style={{
                            fontSize: 12,
                            padding: "4px 10px",
                            border: "1px solid #fee2e2",
                            borderRadius: 6,
                            color: "#dc2626",
                            background: "#fff",
                          }}
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
