import { useEffect, useState } from "react";
import AdminLayout from "../../../../components/layout/AdminLayout";
import admin from "../../../../api/adminApi";

// AssetStatus 실제 enum 값
const STATUS_OPTIONS = [
  { value: "AVAILABLE", label: "사용 가능" },
  { value: "IN_USE", label: "대여중" },
  { value: "BROKEN", label: "수리중/파손" },
  { value: "LOST", label: "분실/폐기" },
];

const EMPTY_ASSET_FORM = {
  id: null as number | null,
  modelId: "" as string | number,
  name: "",
  category: "",
  manufacturer: "",
  description: "",
  assetCode: "",
  serialNumber: "",
  location: "",
  status: "AVAILABLE",
  purchaseDate: "",
};

const EMPTY_MODEL_FORM = {
  id: null as number | null,
  name: "",
  category: "",
  manufacturer: "",
  description: "",
  imageFile: null as File | null,
};

export default function Assets() {
  // --- 상태 관리 ---
  const [currentTab, setCurrentTab] = useState<"assets" | "models">("assets"); // 탭 상태 추가
  const [page, setPage] = useState<any>(null);
  const [models, setModels] = useState<any[]>([]);
  const [summaries, setSummaries] = useState<any[]>([]);
  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(0);

  // 모달 렌더링 상태
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showModelModal, setShowModelModal] = useState(false);

  // 폼 상태
  const [assetForm, setAssetForm] = useState<any>({ ...EMPTY_ASSET_FORM });
  const [modelForm, setModelForm] = useState<any>({ ...EMPTY_MODEL_FORM });

  // --- 데이터 로드 ---
  const load = (p = 0, kw = keyword) =>
    admin
      .get("/resources/assets", {
        params: { keyword: kw || undefined, page: p, size: 15 },
      })
      .then((r) => {
        setPage(r.data.assets);
        setSummaries(r.data.summaries ?? []);
        setModels(r.data.models ?? []);
        setCurrentPage(p);
      });

  useEffect(() => {
    load();
  }, []);

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    load(0);
  };

  // --- 자산(Asset) 관련 핸들러 ---
  const openAssetCreate = () => {
    setAssetForm({ ...EMPTY_ASSET_FORM });
    setShowAssetModal(true);
  };
  const openAssetEdit = (a: any) => {
    setAssetForm({
      id: a.id,
      modelId: a.modelId ?? "",
      name: a.name ?? "",
      category: a.category ?? "",
      manufacturer: a.manufacturer ?? "",
      description: "",
      assetCode: a.assetCode ?? "",
      serialNumber: a.serialNumber ?? "",
      location: a.location ?? "",
      status: a.status ?? "AVAILABLE",
      purchaseDate: a.purchaseDate ?? "",
    });
    setShowAssetModal(true);
  };

  const handleAssetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      ...assetForm,
      modelId: assetForm.modelId !== "" ? Number(assetForm.modelId) : undefined,
    };
    if (assetForm.id !== null) {
      await admin.put("/resources/assets", payload);
    } else {
      await admin.post("/resources/assets", payload);
    }
    setShowAssetModal(false);
    load(currentPage);
  };

  const handleAssetDelete = async (id: number) => {
    if (!window.confirm("이 자산을 삭제하시겠습니까?")) return;
    await admin.delete(`/resources/assets/${id}`);
    load(currentPage);
  };

  // --- 모델(Model) 관련 핸들러 (추가됨) ---
  const openModelCreate = () => {
    setModelForm({ ...EMPTY_MODEL_FORM });
    setShowModelModal(true);
  };
  const openModelEdit = (m: any) => {
    setModelForm({
      id: m.id,
      name: m.name ?? "",
      category: m.category ?? "",
      manufacturer: m.manufacturer ?? "",
      description: m.description ?? "",
      imageFile: null, // 수정 시 이미지는 새로 업로드할 때만 세팅
    });
    setShowModelModal(true);
  };

  const handleModelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // 이미지 파일 업로드를 위해 FormData 사용
    const formData = new FormData();
    formData.append("name", modelForm.name);
    formData.append("category", modelForm.category);
    formData.append("manufacturer", modelForm.manufacturer);
    formData.append("description", modelForm.description);
    if (modelForm.imageFile) {
      formData.append("imageFile", modelForm.imageFile);
    }

    try {
      if (modelForm.id !== null) {
        await admin.put(`/resources/assets/models/${modelForm.id}`, formData);
      } else {
        await admin.post("/resources/assets/models", formData);
      }
      setShowModelModal(false);
      load(currentPage);
    } catch (error) {
      console.error("모델 저장 실패:", error);
      alert("모델 저장 중 오류가 발생했습니다.");
    }
  };

  const handleModelDelete = async (id: number) => {
    if (
      !window.confirm(
        "이 모델을 정말 삭제하시겠습니까? 연결된 자산이 있을 수 있습니다.",
      )
    )
      return;
    await admin.delete(`/resources/assets/models/${id}`);
    load(currentPage);
  };

  // --- 유틸 함수 ---
  const statusInfo = (s: string) =>
    STATUS_OPTIONS.find((o) => o.value === s) ?? { label: s, value: s };
  const statusBadge = (s: string) => {
    if (s === "AVAILABLE")
      return "bg-success-subtle text-success border border-success-subtle";
    if (s === "IN_USE")
      return "bg-primary-subtle text-primary border border-primary-subtle";
    if (s === "BROKEN")
      return "bg-warning-subtle text-warning border border-warning-subtle";
    return "bg-secondary-subtle text-secondary border border-secondary-subtle";
  };

  const assetList = page?.content ?? [];

  return (
    <AdminLayout>
      {/* 1. 자산 등록/수정 모달 */}
      {showAssetModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'white', borderRadius: 12, width: '100%', maxWidth: 600, margin: '0 16px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
              <h6 style={{ margin: 0, fontWeight: 600, fontSize: 16 }}>
                {assetForm.id !== null ? "기자재 수정" : "기자재 등록"}
              </h6>
              <button onClick={() => setShowAssetModal(false)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#6b7280' }}>✕</button>
            </div>
            <form onSubmit={handleAssetSubmit}>
              <div style={{ padding: '20px' }}>
                  <h6 className="fw-bold text-primary mb-3">모델 정보</h6>
                  <div className="row g-3 mb-3">
                    <div className="col-md-12">
                      <label className="form-label fw-bold">
                        기존 모델 선택{" "}
                        <span className="text-muted fw-normal">
                          (선택 시 아래 정보 자동 적용)
                        </span>
                      </label>
                      <select
                        className="form-select"
                        value={assetForm.modelId}
                        onChange={(e) => {
                          const mid = e.target.value;
                          const m = models.find(
                            (m: any) => String(m.id) === mid,
                          );
                          setAssetForm((f: any) => ({
                            ...f,
                            modelId: mid,
                            name: m?.name ?? f.name,
                            category: m?.category ?? f.category,
                            manufacturer: m?.manufacturer ?? f.manufacturer,
                            description: m?.description ?? f.description,
                          }));
                        }}
                      >
                        <option value="">
                          신규 모델 직접 입력 (권장하지 않음)
                        </option>
                        {models.map((m: any) => (
                          <option key={m.id} value={m.id}>
                            [{m.category}] {m.name} ({m.manufacturer})
                          </option>
                        ))}
                      </select>
                    </div>
                    {/* ... (기존 자산 폼 내용 동일) ... */}
                    <div className="col-md-6">
                      <label className="form-label fw-bold">
                        자산명(모델명)
                      </label>
                      <input
                        className="form-control"
                        required
                        value={assetForm.name}
                        onChange={(e) =>
                          setAssetForm((f: any) => ({
                            ...f,
                            name: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">분류</label>
                      <input
                        className="form-control"
                        value={assetForm.category}
                        onChange={(e) =>
                          setAssetForm((f: any) => ({
                            ...f,
                            category: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <hr />
                  <h6 className="fw-bold text-primary mb-3">자산 상세 정보</h6>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-bold">관리 번호</label>
                      <input
                        className="form-control"
                        value={assetForm.assetCode}
                        onChange={(e) =>
                          setAssetForm((f: any) => ({
                            ...f,
                            assetCode: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">시리얼 번호</label>
                      <input
                        className="form-control"
                        value={assetForm.serialNumber}
                        onChange={(e) =>
                          setAssetForm((f: any) => ({
                            ...f,
                            serialNumber: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">상태</label>
                      <select
                        className="form-select"
                        value={assetForm.status}
                        onChange={(e) =>
                          setAssetForm((f: any) => ({
                            ...f,
                            status: e.target.value,
                          }))
                        }
                      >
                        {STATUS_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">보관 위치</label>
                      <input
                        className="form-control"
                        value={assetForm.location}
                        onChange={(e) =>
                          setAssetForm((f: any) => ({
                            ...f,
                            location: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="col-md-12">
                      <label className="form-label fw-bold">구매일</label>
                      <input
                        type="date"
                        className="form-control"
                        value={assetForm.purchaseDate}
                        onChange={(e) =>
                          setAssetForm((f: any) => ({
                            ...f,
                            purchaseDate: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 20px', borderTop: '1px solid #e5e7eb', position: 'sticky', bottom: 0, background: 'white' }}>
                <button type="button" className="btn btn-outline-secondary radius-8" onClick={() => setShowAssetModal(false)}>취소</button>
                <button type="submit" className="btn btn-primary-600 radius-8">
                  {assetForm.id !== null ? "수정" : "등록"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. 모델 등록/수정 모달 (새로 추가됨) */}
      {showModelModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'white', borderRadius: 12, width: '100%', maxWidth: 480, margin: '0 16px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
              <h6 style={{ margin: 0, fontWeight: 600, fontSize: 16 }}>
                {modelForm.id !== null ? "모델 수정" : "모델 등록"}
              </h6>
              <button onClick={() => setShowModelModal(false)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#6b7280' }}>✕</button>
            </div>
            <form onSubmit={handleModelSubmit}>
              <div style={{ padding: '20px' }}>
                  <div className="mb-3">
                    <label className="form-label fw-bold">모델명</label>
                    <input
                      className="form-control"
                      required
                      placeholder="예: 갤럭시북4 Pro"
                      value={modelForm.name}
                      onChange={(e) =>
                        setModelForm((f: any) => ({
                          ...f,
                          name: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label fw-bold">분류</label>
                      <input
                        className="form-control"
                        list="categoryOptions"
                        required
                        placeholder="예: 노트북"
                        value={modelForm.category}
                        onChange={(e) =>
                          setModelForm((f: any) => ({
                            ...f,
                            category: e.target.value,
                          }))
                        }
                      />
                      <datalist id="categoryOptions">
                        <option value="노트북" />
                        <option value="태블릿" />
                        <option value="카메라" />
                      </datalist>
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-bold">제조사</label>
                      <input
                        className="form-control"
                        placeholder="예: 삼성전자"
                        value={modelForm.manufacturer}
                        onChange={(e) =>
                          setModelForm((f: any) => ({
                            ...f,
                            manufacturer: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">대표 이미지</label>
                    {/* 파일 업로드 처리 */}
                    <input
                      type="file"
                      className="form-control"
                      accept="image/*"
                      onChange={(e) =>
                        setModelForm((f: any) => ({
                          ...f,
                          imageFile: e.target.files?.[0] || null,
                        }))
                      }
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">
                      상세 설명 (스펙)
                    </label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={modelForm.description}
                      onChange={(e) =>
                        setModelForm((f: any) => ({
                          ...f,
                          description: e.target.value,
                        }))
                      }
                    />
                  </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 20px', borderTop: '1px solid #e5e7eb', position: 'sticky', bottom: 0, background: 'white' }}>
                <button type="button" className="btn btn-outline-secondary radius-8" onClick={() => setShowModelModal(false)}>취소</button>
                <button type="submit" className="btn btn-primary-600 radius-8">
                  {modelForm.id !== null ? "수정" : "등록"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 헤더 및 등록 버튼 */}
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h6 className="fw-semibold mb-0">기자재 관리</h6>
          <p className="text-neutral-600 mt-4 mb-0">학교 기자재 및 자산을 관리합니다.</p>
        </div>
        {currentTab === "assets" ? (
          <button className="btn btn-primary-600 radius-8" onClick={openAssetCreate}>
            <i className="bi bi-plus-lg me-1" /> 기자재 등록
          </button>
        ) : (
          <button className="btn btn-primary-600 radius-8" onClick={openModelCreate}>
            <i className="bi bi-plus-lg me-1" /> 신규 모델 등록
          </button>
        )}
      </div>

      {/* 3. 탭 네비게이션 (새로 추가됨) */}
      <div className="d-flex border-bottom border-neutral-200 mb-4">
        {([['assets', '기자재 목록'], ['models', '모델 관리']] as [string, string][]).map(([key, label]) => (
          <button key={key} onClick={() => setCurrentTab(key as 'assets' | 'models')}
            style={{
              padding: '12px 20px', border: 'none', background: 'none',
              borderBottom: `2px solid ${currentTab === key ? '#25A194' : 'transparent'}`,
              color: currentTab === key ? '#25A194' : '#6b7280',
              fontWeight: currentTab === key ? 600 : 400, fontSize: 14, cursor: 'pointer',
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* ==================== 자산 목록 탭 콘텐츠 ==================== */}
      {currentTab === "assets" && (
        <>
          {/* 재고 요약 카드 */}
          {summaries.length > 0 && (
            <div className="row g-3 mb-4">
              {summaries.map((s: any) => (
                <div key={s.category} className="col-md-3">
                  <div className="card border-0 border-start border-primary border-4 shadow-sm h-100">
                    <div className="card-body py-2">
                      <div className="text-muted small fw-bold text-uppercase">
                        {s.category || "미분류"}
                      </div>
                      <div className="fw-bold fs-4 mb-1">{s.totalCount}개</div>
                      <div
                        className="d-flex justify-content-between text-muted"
                        style={{ fontSize: "0.8rem" }}
                      >
                        <span className="text-success">
                          사용 {s.availableCount}
                        </span>
                        <span className="text-primary">
                          대여 {s.inUseCount}
                        </span>
                        <span className="text-danger">
                          파손 {s.brokenCount}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 자산 목록 테이블 */}
          <div className="card">
            <div className="card-header bg-white py-3">
              <div className="row align-items-center">
                <div className="col">
                  <h5 className="mb-0 text-dark fw-bold">자산 목록</h5>
                </div>
                <div className="col-auto">
                  <form
                    className="input-group input-group-sm"
                    onSubmit={search}
                  >
                    <input
                      className="form-control"
                      style={{ width: 250 }}
                      placeholder="기자재명 또는 관리번호 검색"
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                    />
                    <button className="btn btn-outline-secondary" type="submit">
                      <i className="bi bi-search" />
                    </button>
                    {keyword && (
                      <button
                        className="btn btn-outline-danger"
                        type="button"
                        onClick={() => {
                          setKeyword("");
                          load(0, "");
                        }}
                      >
                        <i className="bi bi-x" />
                      </button>
                    )}
                  </form>
                </div>
              </div>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 text-center">
                  <thead className="table-light">
                    <tr>
                      <th className="ps-4 text-start">관리 번호</th>
                      <th>자산명</th>
                      <th>분류</th>
                      <th>시리얼 번호</th>
                      <th>상태</th>
                      <th>위치</th>
                      <th>구매일</th>
                      <th className="text-end pe-4">관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assetList.map((a: any) => (
                      <tr key={a.id}>
                        <td className="ps-4 text-start text-muted small">
                          {a.assetCode}
                        </td>
                        <td className="fw-bold text-start">{a.name}</td>
                        <td>{a.category}</td>
                        <td className="text-muted small">
                          {a.serialNumber || "-"}
                        </td>
                        <td>
                          <span className={`badge ${statusBadge(a.status)}`}>
                            {statusInfo(a.status).label}
                          </span>
                        </td>
                        <td>{a.location || "-"}</td>
                        <td className="text-muted small">
                          {a.purchaseDate || "-"}
                        </td>
                        <td className="text-end pe-4">
                          <button
                            className="btn btn-sm btn-outline-secondary me-1"
                            onClick={() => openAssetEdit(a)}
                          >
                            수정
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleAssetDelete(a.id)}
                          >
                            삭제
                          </button>
                        </td>
                      </tr>
                    ))}
                    {assetList.length === 0 && (
                      <tr>
                        <td colSpan={8} className="text-center py-5 text-muted">
                          검색 결과가 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            {/* 페이지네이션 */}
            {page && page.totalPages > 1 && (
              <div className="card-footer bg-white py-3">
                <nav>
                  <ul className="pagination pagination-sm justify-content-center mb-0">
                    <li
                      className={`page-item${currentPage === 0 ? " disabled" : ""}`}
                    >
                      <button
                        className="page-link"
                        onClick={() => load(currentPage - 1)}
                      >
                        &laquo;
                      </button>
                    </li>
                    {Array.from({ length: page.totalPages }, (_, i) => (
                      <li
                        key={i}
                        className={`page-item${i === currentPage ? " active" : ""}`}
                      >
                        <button className="page-link" onClick={() => load(i)}>
                          {i + 1}
                        </button>
                      </li>
                    ))}
                    <li
                      className={`page-item${currentPage >= page.totalPages - 1 ? " disabled" : ""}`}
                    >
                      <button
                        className="page-link"
                        onClick={() => load(currentPage + 1)}
                      >
                        &raquo;
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            )}
          </div>
        </>
      )}

      {/* ==================== 모델 관리 탭 콘텐츠 (새로 추가됨) ==================== */}
      {currentTab === "models" && (
        <div className="card">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 text-center">
                <thead className="table-light">
                  <tr>
                    <th className="ps-4 text-start">모델명</th>
                    <th>사진</th>
                    <th>제조사</th>
                    <th>분류</th>
                    <th className="text-start">설명</th>
                    <th className="text-end pe-4">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {models.map((m: any) => (
                    <tr key={m.id}>
                      <td className="ps-4 text-start fw-bold">{m.name}</td>
                      <td>
                        {m.imageUrl ? (
                          <img
                            src={m.imageUrl}
                            alt={m.name}
                            className="rounded"
                            style={{
                              width: "40px",
                              height: "40px",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <div
                            className="bg-light rounded d-inline-flex align-items-center justify-content-center text-secondary mx-auto"
                            style={{ width: "40px", height: "40px" }}
                          >
                            <i className="bi bi-image" />
                          </div>
                        )}
                      </td>
                      <td>{m.manufacturer}</td>
                      <td>{m.category}</td>
                      <td
                        className="text-start text-truncate text-muted"
                        style={{ maxWidth: "200px" }}
                      >
                        {m.description || "-"}
                      </td>
                      <td className="text-end pe-4">
                        <button
                          className="btn btn-sm btn-outline-secondary me-1"
                          onClick={() => openModelEdit(m)}
                        >
                          수정
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleModelDelete(m.id)}
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                  {models.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-5 text-muted">
                        등록된 모델이 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
