import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from '@/components/layout/admin/AdminLayout';
import admin from '@/api/adminApi';
import { ADMIN_ROUTES } from '@/constants/routes';

export default function ClassList() {
  const [page, setPage] = useState<any>(null);
  // [soojin] 전체 학급 수 저장 (초기 로드 시 1회만 세팅) - TeacherList 패턴 통일
  const [totalAll, setTotalAll] = useState<number | null>(null);
  const isInitialLoad = useRef(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [grade, setGrade] = useState("");
  const [status, setStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const csvRef = useRef<HTMLInputElement>(null);

  const load = (p = 0) =>
    admin
      .get("/classes", {
        params: {
          year,
          grade: grade || undefined,
          status: status || undefined,
          page: p,
          size: 10,
        },
      })
      .then((r) => {
        setPage(r.data);
        setCurrentPage(p);
        // [soojin] 최초 로드 시에만 전체 학급 수 저장
        if (isInitialLoad.current) {
          setTotalAll(r.data.totalElements);
          isInitialLoad.current = false;
        }
      });

  useEffect(() => {
    load();
  }, []);

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    load(0);
  };
  const list = page?.content ?? [];
  const toggleAll = (checked: boolean) =>
    setSelected(checked ? list.map((c: any) => c.cid) : []);
  const toggleOne = (cid: number) =>
    setSelected((prev) =>
      prev.includes(cid) ? prev.filter((x) => x !== cid) : [...prev, cid],
    );

  const bulkStatus = async (s: string, label: string) => {
    if (!selected.length) return alert("학급을 선택하세요.");
    if (!confirm(`선택한 ${selected.length}개 학급을 "${label}" 상태로 변경하시겠습니까?`)) return;
    await admin.post("/classes/bulk-status", null, {
      params: { cids: selected, status: s },
    });
    setSelected([]);
    load(currentPage);
  };

  const uploadCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      await admin.post("/classes/import-csv", fd);
    } finally {
      setLoading(false);
      load(0);
    }
    e.target.value = "";
  };

  return (
    <AdminLayout>
      {loading && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="spinner-border text-light" style={{ width: '3rem', height: '3rem' }} />
            <h5 style={{ color: '#fff', marginTop: 16 }}>학급 데이터를 등록 중입니다...</h5>
          </div>
        </div>
      )}

      {/* [soojin] 테이블이 화면 높이를 꽉 채우도록 flex column 컨테이너, Bootstrap 클래스 제거 */}
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 4.5rem - 48px)' }}>
        {/* [soojin] 제목 + 전체 학급 수 인라인 표시 */}
        <div style={{ marginBottom: 16, flexShrink: 0 }}>
          <h6 style={{ fontWeight: 700, color: '#111827', marginBottom: 4, display: 'flex', alignItems: 'baseline', gap: 8 }}>
            학급 목록
            <span style={{ fontSize: 15, fontWeight: 400, color: '#6b7280' }}>전체 {totalAll ?? 0}개</span>
          </h6>
          <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>학급 편성 및 담임 배정 정보를 관리합니다.</p>
        </div>

        {/* [soojin] 컨트롤 바: 검색/필터(좌) + 버튼들(우), Bootstrap → 인라인 스타일 전환 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap', flexShrink: 0 }}>
          <form style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }} onSubmit={search}>
            <input
              type="number"
              style={{ padding: '5px 8px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, width: 90, background: '#fff' }}
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              placeholder="학년도"
            />
            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
              <select
                style={{ padding: '5px 24px 5px 8px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, background: '#fff', appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer' }}
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
              >
                <option value="">전체 학년</option>
                <option value="1">1학년</option>
                <option value="2">2학년</option>
                <option value="3">3학년</option>
              </select>
              <i className="ri-arrow-down-s-line" style={{ position: 'absolute', right: '4px', pointerEvents: 'none', fontSize: '16px', color: '#6b7280' }} />
            </div>
            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
              <select
                style={{ padding: '5px 24px 5px 8px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, background: '#fff', appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer' }}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">전체 상태</option>
                <option value="ACTIVE">활성</option>
                <option value="FINISHED">종료</option>
              </select>
              <i className="ri-arrow-down-s-line" style={{ position: 'absolute', right: '4px', pointerEvents: 'none', fontSize: '16px', color: '#6b7280' }} />
            </div>
            <button
              style={{ padding: '5px 12px', background: '#25A194', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap' }}
              type="submit"
            >
              검색
            </button>
            <button
              style={{ padding: '5px 10px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, cursor: 'pointer', color: '#374151', whiteSpace: 'nowrap' }}
              type="button"
              onClick={() => { setYear(new Date().getFullYear()); setGrade(""); setStatus(""); load(0); }}
            >
              초기화
            </button>
            {/* [soojin] 학년/상태 필터 중일 때만 결과 건수 표시 (year는 항상 있으므로 제외) */}
            {(grade || status) && page && (
              <span style={{ fontSize: 13, color: '#6b7280', whiteSpace: 'nowrap' }}>
                <span style={{ fontWeight: 600, color: '#111827' }}>{page.totalElements}개</span> / 전체 {totalAll ?? 0}개
              </span>
            )}
          </form>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input type="file" ref={csvRef} accept=".csv" style={{ display: 'none' }} onChange={uploadCsv} />
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                style={{ padding: '5px 10px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, cursor: 'pointer', color: '#374151', whiteSpace: 'nowrap' }}
                onClick={() => setShowDropdown((v) => !v)}
              >
                선택 상태 변경 <i className="ri-arrow-down-s-line" style={{ fontSize: '14px', verticalAlign: 'middle' }} />
              </button>
              {showDropdown && (
                <div style={{ position: 'absolute', top: '100%', right: 0, zIndex: 100, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', width: '100%', marginTop: 4, overflow: 'hidden' }}>
                  <button style={{ display: 'block', width: '100%', padding: '8px 0', background: 'none', border: 'none', textAlign: 'center', fontSize: 13, color: '#374151', cursor: 'pointer' }} onClick={() => { bulkStatus("ACTIVE", "활성"); setShowDropdown(false); }}>활성</button>
                  <button style={{ display: 'block', width: '100%', padding: '8px 0', background: 'none', border: 'none', textAlign: 'center', fontSize: 13, color: '#ef4444', cursor: 'pointer' }} onClick={() => { bulkStatus("FINISHED", "종료"); setShowDropdown(false); }}>종료</button>
                </div>
              )}
            </div>
            <button
              style={{ padding: '5px 10px', background: '#fff', border: '1px solid #25A194', borderRadius: 8, fontSize: 13, cursor: 'pointer', color: '#25A194', whiteSpace: 'nowrap' }}
              onClick={() => csvRef.current?.click()}
            >
              <i className="ri-file-excel-2-line" style={{ marginRight: 4, fontSize: '14px' }} />
              CSV 등록
            </button>
            <Link
              to={ADMIN_ROUTES.CLASSES.CREATE}
              style={{ padding: '5px 12px', background: '#25A194', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
            >
              + 학급 생성
            </Link>
          </div>
        </div>

        {/* [soojin] 카드: flex:1로 남은 공간 꽉 채움, Bootstrap card 클래스 제거 */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {/* [soojin] overflowX 래퍼 제거, tableLayout auto, colgroup 제거 → 브라우저 자동 컬럼 분배 */}
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>
              <thead>
                <tr>
                  <th style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#6b7280', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      className="form-check-input"
                      style={{ borderColor: '#6b7280' }}
                      onChange={(e) => toggleAll(e.target.checked)}
                    />
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#6b7280', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap', textAlign: 'left' }}>학년도</th>
                  <th style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#6b7280', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap', textAlign: 'left' }}>학년</th>
                  <th style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#6b7280', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap', textAlign: 'left' }}>반</th>
                  <th style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#6b7280', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap', textAlign: 'left' }}>담임교사</th>
                  <th style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#6b7280', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap', textAlign: 'left' }}>학생 수</th>
                  <th style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#6b7280', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap', textAlign: 'left' }}>상태</th>
                  <th style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#6b7280', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap', textAlign: 'left' }}>관리</th>
                </tr>
              </thead>
              <tbody>
                {list.map((c: any) => (
                  <tr key={c.cid}>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#374151', borderBottom: '1px solid #f3f4f6', textAlign: 'center', verticalAlign: 'middle' }}>
                      <input
                        type="checkbox"
                        className="form-check-input"
                        style={{ borderColor: '#6b7280' }}
                        checked={selected.includes(c.cid)}
                        onChange={() => toggleOne(c.cid)}
                      />
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#374151', borderBottom: '1px solid #f3f4f6', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{c.year}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#374151', borderBottom: '1px solid #f3f4f6', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{c.grade}학년</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#374151', borderBottom: '1px solid #f3f4f6', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{c.classNum}반</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#374151', borderBottom: '1px solid #f3f4f6', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                      {c.teacherName ?? <span style={{ color: '#9ca3af' }}>미배정</span>}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#374151', borderBottom: '1px solid #f3f4f6', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                      <span style={{ background: '#f3f4f6', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: 6, padding: '2px 10px', fontSize: 12 }}>
                        {c.studentCount ?? 0}명
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#374151', borderBottom: '1px solid #f3f4f6', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                      <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', ...(c.status === 'ACTIVE' ? { background: 'rgba(22,163,74,0.1)', color: '#16a34a' } : { background: '#f3f4f6', color: '#6b7280' }) }}>
                        {c.status === 'ACTIVE' ? '활성' : '종료'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#374151', borderBottom: '1px solid #f3f4f6', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                      <Link
                        to={ADMIN_ROUTES.CLASSES.DETAIL(c.cid)}
                        style={{ padding: '5px 12px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, color: '#374151', textDecoration: 'none', display: 'inline-block' }}
                      >
                        상세보기
                      </Link>
                    </td>
                  </tr>
                ))}
                {list.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ padding: '48px 16px', textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
                      검색 결과가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* [soojin] 페이지네이션 카드 밖, 우측 정렬, 28×28 정사각형 버튼, Bootstrap pagination 제거 */}
        {page && page.totalPages >= 1 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px 0', gap: 4, flexShrink: 0 }}>
            <button
              onClick={() => load(currentPage - 1)}
              disabled={page.first}
              style={{ width: 28, height: 28, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff', cursor: page.first ? 'not-allowed' : 'pointer', color: page.first ? '#d1d5db' : '#374151', fontSize: 12 }}
            >
              ‹
            </button>
            {Array.from({ length: page.totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => load(i)}
                style={{ width: 28, height: 28, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${i === currentPage ? '#25A194' : '#e5e7eb'}`, borderRadius: 6, background: i === currentPage ? '#25A194' : '#fff', color: i === currentPage ? '#fff' : '#374151', cursor: 'pointer', fontSize: 12, fontWeight: i === currentPage ? 600 : 400 }}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => load(currentPage + 1)}
              disabled={page.last}
              style={{ width: 28, height: 28, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff', cursor: page.last ? 'not-allowed' : 'pointer', color: page.last ? '#d1d5db' : '#374151', fontSize: 12 }}
            >
              ›
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
