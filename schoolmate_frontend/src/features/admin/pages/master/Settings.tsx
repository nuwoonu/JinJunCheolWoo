import { useEffect, useState } from "react";
import AdminLayout from '@/shared/components/layout/admin/AdminLayout';
import admin from '@/shared/api/adminApi';

interface AcademicTerm {
  id: number;
  schoolYear: number;
  semester: number;
  startDate?: string;
  endDate?: string;
  status: 'ACTIVE' | 'CLOSED';
}

function TermStatusBadge({ status }: { status: string }) {
  const isActive = status === 'ACTIVE';
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
      background: isActive ? 'rgba(22,163,74,0.1)' : '#f3f4f6',
      color: isActive ? '#16a34a' : '#6b7280',
    }}>
      {isActive ? '진행 중' : '종료'}
    </span>
  );
}

export default function AcademicTermManagement() {
  const [currentTerm, setCurrentTerm] = useState<AcademicTerm | null>(null);
  const [history, setHistory] = useState<AcademicTerm[]>([]);
  const [form, setForm] = useState({ year: new Date().getFullYear(), semester: '1', startDate: '', endDate: '' });
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = () => {
    Promise.all([
      admin.get('/settings').catch(() => ({ data: null })),
      admin.get('/settings/history').catch(() => ({ data: [] })),
    ]).then(([cur, hist]) => {
      setCurrentTerm(cur.data);
      setHistory(hist.data ?? []);
      if (cur.data) {
        setForm(f => ({ ...f, year: cur.data.schoolYear, semester: String(cur.data.semester) }));
      }
      setLoaded(true);
    });
  };

  useEffect(() => { load(); }, []);

  const handleOpen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm(`${form.year}학년도 ${form.semester}학기를 새로 개설합니까?\n현재 진행 중인 학기는 자동으로 종료됩니다.`)) return;
    setSaving(true);
    try {
      await admin.post('/settings', null, {
        params: {
          year: form.year,
          semester: form.semester,
          ...(form.startDate && { startDate: form.startDate }),
          ...(form.endDate && { endDate: form.endDate }),
        },
      });
      alert('학기가 개설되었습니다.');
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleClose = async (id: number, label: string) => {
    if (!confirm(`${label}을 종료 처리합니까?`)) return;
    await admin.post(`/settings/${id}/close`);
    load();
  };

  if (!loaded)
    return (
      <AdminLayout>
        <div style={{ textAlign: 'center', padding: '40px 0' }}><div className="spinner-border" /></div>
      </AdminLayout>
    );

  return (
    <AdminLayout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h5 style={{ fontWeight: 700, color: '#111827', marginBottom: 4 }}>학기 관리</h5>
          <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>학사 기준 학기를 개설하고 이력을 관리합니다.</p>
        </div>
      </div>

      {/* 현재 학기 */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', marginBottom: 24 }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e5e7eb' }}>
          <h6 style={{ fontWeight: 600, margin: 0, fontSize: 15 }}>현재 진행 중인 학기</h6>
        </div>
        <div style={{ padding: 24 }}>
          {currentTerm ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 6 }}>
                  {currentTerm.schoolYear}학년도 {currentTerm.semester}학기
                </div>
                {(currentTerm.startDate || currentTerm.endDate) && (
                  <div style={{ fontSize: 13, color: '#6b7280' }}>
                    {currentTerm.startDate ?? '-'} ~ {currentTerm.endDate ?? '-'}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <TermStatusBadge status={currentTerm.status} />
                {currentTerm.status === 'ACTIVE' && (
                  <button
                    onClick={() => handleClose(currentTerm.id, `${currentTerm.schoolYear}학년도 ${currentTerm.semester}학기`)}
                    style={{ padding: '6px 14px', background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#dc2626', cursor: 'pointer' }}
                  >
                    학기 종료
                  </button>
                )}
              </div>
            </div>
          ) : (
            <p style={{ color: '#9ca3af', margin: 0, fontSize: 14 }}>진행 중인 학기가 없습니다. 아래에서 새 학기를 개설해주세요.</p>
          )}
        </div>
      </div>

      {/* 새 학기 개설 */}
      <form onSubmit={handleOpen}>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', marginBottom: 24 }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #e5e7eb' }}>
            <h6 style={{ fontWeight: 600, margin: 0, fontSize: 15 }}>새 학기 개설</h6>
          </div>
          <div style={{ padding: 24 }}>
            <div className="row g-3">
              <div className="col-md-3">
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#374151' }}>학년도</label>
                <input
                  type="number" className="form-control"
                  value={form.year} min={2000} max={2100}
                  onChange={e => setForm(f => ({ ...f, year: Number(e.target.value) }))}
                />
              </div>
              <div className="col-md-3">
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#374151' }}>학기</label>
                <select className="form-select" value={form.semester} onChange={e => setForm(f => ({ ...f, semester: e.target.value }))}>
                  <option value="1">1학기</option>
                  <option value="2">2학기</option>
                </select>
              </div>
              <div className="col-md-3">
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#374151' }}>시작일 (선택)</label>
                <input type="date" className="form-control" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
              </div>
              <div className="col-md-3">
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#374151' }}>종료일 (선택)</label>
                <input type="date" className="form-control" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
              </div>
            </div>
            <div style={{ marginTop: 8 }}>
              <small style={{ color: '#9ca3af' }}>* 개설 시 현재 진행 중인 학기는 자동으로 종료됩니다.</small>
            </div>
          </div>
          <div style={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb', textAlign: 'right' }}>
            <button
              type="submit" disabled={saving}
              style={{ padding: '10px 28px', background: 'linear-gradient(135deg, #25A194, #1a7a6e)', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#fff', cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1 }}
            >
              {saving ? <><span className="spinner-border spinner-border-sm me-2" />개설 중...</> : '학기 개설'}
            </button>
          </div>
        </div>
      </form>

      {/* 학기 이력 */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e5e7eb' }}>
          <h6 style={{ fontWeight: 600, margin: 0, fontSize: 15 }}>학기 이력</h6>
        </div>
        {history.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#9ca3af' }}>이력이 없습니다.</div>
        ) : (
          <table className="table table-hover mb-0" style={{ fontSize: 14 }}>
            <thead style={{ background: '#f9fafb' }}>
              <tr>
                <th style={{ padding: '12px 24px', fontWeight: 600, color: '#374151' }}>학기</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#374151' }}>시작일</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#374151' }}>종료일</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#374151' }}>상태</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#374151' }}></th>
              </tr>
            </thead>
            <tbody>
              {history.map(t => (
                <tr key={t.id}>
                  <td style={{ padding: '12px 24px', fontWeight: 600 }}>{t.schoolYear}학년도 {t.semester}학기</td>
                  <td style={{ padding: '12px 16px', color: '#6b7280' }}>{t.startDate ?? '-'}</td>
                  <td style={{ padding: '12px 16px', color: '#6b7280' }}>{t.endDate ?? '-'}</td>
                  <td style={{ padding: '12px 16px' }}><TermStatusBadge status={t.status} /></td>
                  <td style={{ padding: '12px 16px' }}>
                    {t.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleClose(t.id, `${t.schoolYear}학년도 ${t.semester}학기`)}
                        style={{ padding: '3px 10px', background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, color: '#dc2626', cursor: 'pointer' }}
                      >
                        종료
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 학생 진급 처리 (기존 유지) */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', marginTop: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #e5e7eb', background: '#fffbeb', borderRadius: '12px 12px 0 0' }}>
          <h6 style={{ fontWeight: 600, margin: 0, fontSize: 15, color: '#d97706' }}>
            <i className="bi bi-exclamation-triangle-fill me-2" />학생 진급 처리
          </h6>
        </div>
        <div style={{ padding: 24 }}>
          <p style={{ color: '#6b7280', marginBottom: 16, fontSize: 14 }}>
            현재 학년도 종료 시 전체 학생의 학년을 일괄 진급 처리합니다. 이 작업은 되돌릴 수 없으니 신중하게 실행하세요.
          </p>
          <button
            type="button"
            onClick={() => alert('현재 준비 중인 기능입니다.\n(학생 Info 엔티티 연동 필요)')}
            style={{ padding: '9px 20px', background: '#f59e0b', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#fff', cursor: 'pointer' }}
          >
            <i className="bi bi-arrow-up-circle-fill me-2" />전체 학생 진급 처리
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
