import { useEffect, useRef, useState } from "react";
import AdminLayout from '@/shared/components/layout/admin/AdminLayout';
import admin from '@/shared/api/adminApi';

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
  const [currentTab, setCurrentTab] = useState<"assets" | "models">("assets");
  // [soojin] any → 구체적 타입 정의
  const [page, setPage] = useState<{ content: Record<string, unknown>[]; totalElements: number; totalPages: number; number: number; first: boolean; last: boolean } | null>(null);
  const [models, setModels] = useState<Record<string, unknown>[]>([]);
  const [summaries, setSummaries] = useState<Record<string, unknown>[]>([]);
  // [soojin] 전체 건수 표시용 - 초기 로드 시 한 번만 세팅
  const [totalAll, setTotalAll] = useState<number | null>(null);
  const isInitialLoad = useRef(true);
  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  // [soojin] 모델 탭 검색 - 클라이언트 사이드 필터링
  const [modelInput, setModelInput] = useState("");
  const [modelKeyword, setModelKeyword] = useState("");

  // 모달 렌더링 상태
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showModelModal, setShowModelModal] = useState(false);

  // 폼 상태
  // [soojin] any → EMPTY_FORM 타입 그대로 사용
  const [assetForm, setAssetForm] = useState<typeof EMPTY_ASSET_FORM>({ ...EMPTY_ASSET_FORM });
  const [modelForm, setModelForm] = useState<typeof EMPTY_MODEL_FORM>({ ...EMPTY_MODEL_FORM });

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
        // [soojin] 초기 로드 시에만 totalAll 세팅
        if (isInitialLoad.current) {
          setTotalAll(r.data.assets?.totalElements ?? 0);
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

  // --- 자산(Asset) 관련 핸들러 ---
  const openAssetCreate = () => {
    setAssetForm({ ...EMPTY_ASSET_FORM });
    setShowAssetModal(true);
  };
  const openAssetEdit = (a: Record<string, unknown>) => {
    setAssetForm({
      id: (a.id as number) ?? null,
      modelId: (a.modelId as string | number) ?? "",
      name: (a.name as string) ?? "",
      category: (a.category as string) ?? "",
      manufacturer: (a.manufacturer as string) ?? "",
      description: "",
      assetCode: (a.assetCode as string) ?? "",
      serialNumber: (a.serialNumber as string) ?? "",
      location: (a.location as string) ?? "",
      status: (a.status as string) ?? "AVAILABLE",
      purchaseDate: (a.purchaseDate as string) ?? "",
    });
    setShowAssetModal(true);
  };

  const handleAssetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
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

  // --- 모델(Model) 관련 핸들러 ---
  const openModelCreate = () => {
    setModelForm({ ...EMPTY_MODEL_FORM });
    setShowModelModal(true);
  };
  const openModelEdit = (m: Record<string, unknown>) => {
    setModelForm({
      id: (m.id as number) ?? null,
      name: (m.name as string) ?? "",
      category: (m.category as string) ?? "",
      manufacturer: (m.manufacturer as string) ?? "",
      description: (m.description as string) ?? "",
      imageFile: null,
    });
    setShowModelModal(true);
  };

  const handleModelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    if (!window.confirm("이 모델을 정말 삭제하시겠습니까? 연결된 자산이 있을 수 있습니다.")) return;
    await admin.delete(`/resources/assets/models/${id}`);
    load(currentPage);
  };

  // --- 유틸 함수 ---
  const statusInfo = (s: string) =>
    STATUS_OPTIONS.find((o) => o.value === s) ?? { label: s, value: s };

  const statusStyle = (s: string): React.CSSProperties => {
    if (s === "AVAILABLE") return { background: "#ecfdf5", color: "#065f46", border: "1px solid #6ee7b7", borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 500 };
    if (s === "IN_USE") return { background: "#eff6ff", color: "#1e40af", border: "1px solid #93c5fd", borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 500 };
    if (s === "BROKEN") return { background: "#fffbeb", color: "#92400e", border: "1px solid #fcd34d", borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 500 };
    return { background: "#f3f4f6", color: "#374151", borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 500 };
  };

  const assetList = page?.content ?? [];

  // [soojin] 모델 탭 검색 - 모델명/제조사/분류 기준 클라이언트 사이드 필터링
  const filteredModels = modelKeyword
    ? models.filter((m) =>
        m.name?.toLowerCase().includes(modelKeyword.toLowerCase()) ||
        m.manufacturer?.toLowerCase().includes(modelKeyword.toLowerCase()) ||
        m.category?.toLowerCase().includes(modelKeyword.toLowerCase())
      )
    : models;

  const btnSecondary: React.CSSProperties = {
    padding: "8px 16px",
    background: "#fff",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    fontSize: 14,
    color: "#374151",
    cursor: "pointer",
  };
  const btnPrimaryModal: React.CSSProperties = {
    padding: "8px 16px",
    background: "linear-gradient(135deg, #25A194, #1a7a6e)",
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    color: "#fff",
    cursor: "pointer",
  };

  const thStyle: React.CSSProperties = {
    padding: "12px 16px",
    background: "#f9fafb",
    borderBottom: "1px solid #e5e7eb",
    fontSize: 13,
    fontWeight: 600,
    color: "#6b7280",
    whiteSpace: "nowrap",
    textAlign: "left",
  };
  const tdStyle: React.CSSProperties = {
    padding: "12px 16px",
    borderBottom: "1px solid #f3f4f6",
    fontSize: 13,
    color: "#374151",
    verticalAlign: "middle",
  };

  return (
    <AdminLayout>
      {/* 1. 자산 등록/수정 모달 */}
      {showAssetModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "var(--white)", borderRadius: 12, width: "100%", maxWidth: 600, margin: "0 16px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--border-color)", position: "sticky", top: 0, background: "var(--white)", zIndex: 1 }}>
              <h6 style={{ margin: 0, fontWeight: 600, fontSize: 16 }}>
                {assetForm.id !== null ? "기자재 수정" : "기자재 등록"}
              </h6>
              <button onClick={() => setShowAssetModal(false)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "var(--text-secondary-light)" }}>✕</button>
            </div>
            <form onSubmit={handleAssetSubmit}>
              <div style={{ padding: "20px" }}>
                <h6 style={{ fontWeight: 700, color: "#25A194", marginBottom: 12 }}>모델 정보</h6>
                <div className="row g-3 mb-3">
                  <div className="col-md-12">
                    <label className="form-label fw-bold">
                      기존 모델 선택{" "}
                      <span className="text-muted fw-normal">(선택 시 아래 정보 자동 적용)</span>
                    </label>
                    <select
                      className="form-select"
                      required
                      value={assetForm.modelId}
                      onChange={(e) => {
                        const mid = e.target.value;
                        const m = models.find((m) => String(m.id) === mid);
                        setAssetForm((f) => ({
                          ...f,
                          modelId: mid,
                          name: m?.name ?? "",
                          category: m?.category ?? "",
                          manufacturer: m?.manufacturer ?? "",
                          description: m?.description ?? "",
                        }));
                      }}
                    >
                      <option value="" disabled>모델을 선택하세요</option>
                      {models.map((m) => (
                        <option key={m.id} value={m.id}>
                          [{m.category}] {m.name} ({m.manufacturer})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold">자산명(모델명)</label>
                    <input className="form-control bg-light" readOnly value={assetForm.name} placeholder="모델 선택 시 자동 입력" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold">분류</label>
                    <input className="form-control bg-light" readOnly value={assetForm.category} placeholder="모델 선택 시 자동 입력" />
                  </div>
                </div>
                <hr />
                <h6 style={{ fontWeight: 700, color: "#25A194", marginBottom: 12 }}>자산 상세 정보</h6>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-bold">관리 번호</label>
                    <input className="form-control" value={assetForm.assetCode} onChange={(e) => setAssetForm((f) => ({ ...f, assetCode: e.target.value }))} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold">시리얼 번호</label>
                    <input className="form-control" value={assetForm.serialNumber} onChange={(e) => setAssetForm((f) => ({ ...f, serialNumber: e.target.value }))} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold">상태</label>
                    <select className="form-select" value={assetForm.status} onChange={(e) => setAssetForm((f) => ({ ...f, status: e.target.value }))}>
                      {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold">보관 위치</label>
                    <input className="form-control" value={assetForm.location} onChange={(e) => setAssetForm((f) => ({ ...f, location: e.target.value }))} />
                  </div>
                  <div className="col-md-12">
                    <label className="form-label fw-bold">구매일</label>
                    <input type="date" className="form-control" value={assetForm.purchaseDate} onChange={(e) => setAssetForm((f) => ({ ...f, purchaseDate: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "12px 20px", borderTop: "1px solid var(--border-color)", position: "sticky", bottom: 0, background: "var(--white)" }}>
                <button type="button" style={btnSecondary} onClick={() => setShowAssetModal(false)}>취소</button>
                <button type="submit" style={btnPrimaryModal}>{assetForm.id !== null ? "수정" : "등록"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. 모델 등록/수정 모달 */}
      {showModelModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "var(--white)", borderRadius: 12, width: "100%", maxWidth: 480, margin: "0 16px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--border-color)", position: "sticky", top: 0, background: "var(--white)", zIndex: 1 }}>
              <h6 style={{ margin: 0, fontWeight: 600, fontSize: 16 }}>{modelForm.id !== null ? "모델 수정" : "모델 등록"}</h6>
              <button onClick={() => setShowModelModal(false)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "var(--text-secondary-light)" }}>✕</button>
            </div>
            <form onSubmit={handleModelSubmit}>
              <div style={{ padding: "20px" }}>
                <div className="mb-3">
                  <label className="form-label fw-bold">모델명</label>
                  <input className="form-control" required placeholder="예: 갤럭시북4 Pro" value={modelForm.name} onChange={(e) => setModelForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="form-label fw-bold">분류</label>
                    <input className="form-control" list="categoryOptions" required placeholder="예: 노트북" value={modelForm.category} onChange={(e) => setModelForm((f) => ({ ...f, category: e.target.value }))} />
                    <datalist id="categoryOptions">
                      <option value="노트북" />
                      <option value="태블릿" />
                      <option value="카메라" />
                    </datalist>
                  </div>
                  <div className="col-6">
                    <label className="form-label fw-bold">제조사</label>
                    <input className="form-control" placeholder="예: 삼성전자" value={modelForm.manufacturer} onChange={(e) => setModelForm((f) => ({ ...f, manufacturer: e.target.value }))} />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold">대표 이미지</label>
                  <input type="file" className="form-control" accept="image/*" onChange={(e) => setModelForm((f) => ({ ...f, imageFile: e.target.files?.[0] || null }))} />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold">상세 설명 (스펙)</label>
                  <textarea className="form-control" rows={3} value={modelForm.description} onChange={(e) => setModelForm((f) => ({ ...f, description: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "12px 20px", borderTop: "1px solid var(--border-color)", position: "sticky", bottom: 0, background: "var(--white)" }}>
                <button type="button" style={btnSecondary} onClick={() => setShowModelModal(false)}>취소</button>
                <button type="submit" style={btnPrimaryModal}>{modelForm.id !== null ? "수정" : "등록"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* [soojin] 테이블이 화면 높이를 꽉 채우도록 flex column 컨테이너 */}
      <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 4.5rem - 48px)" }}>
        {/* [soojin] 제목 + 전체 건수 인라인 표시 (탭별로 다른 건수) */}
        <div style={{ marginBottom: 16, flexShrink: 0 }}>
          <h6 style={{ fontWeight: 700, color: "#111827", marginBottom: 4, display: "flex", alignItems: "baseline", gap: 8 }}>
            기자재 관리
            {currentTab === "assets"
              ? <span style={{ fontSize: 13, fontWeight: 400, color: "#6b7280" }}>전체 {totalAll ?? 0}개</span>
              : <span style={{ fontSize: 13, fontWeight: 400, color: "#6b7280" }}>모델 {models.length}개</span>
            }
          </h6>
          <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>학교 기자재 및 자산을 관리합니다.</p>
        </div>

        {/* [soojin] 컨트롤 바: 검색(좌, 기자재 탭만) + 버튼(우) */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 12, flexWrap: "wrap", flexShrink: 0 }}>
          {currentTab === "assets" ? (
            <form style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }} onSubmit={search}>
              <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
                <i className="bi bi-search" style={{ position: "absolute", left: "8px", color: "#9ca3af", fontSize: "13px", pointerEvents: "none" }} />
                <input
                  style={{ padding: "5px 8px 5px 28px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, minWidth: 200, background: "#fff" }}
                  placeholder="기자재명 또는 관리번호 검색"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
              </div>
              <button
                type="submit"
                style={{ padding: "5px 12px", background: "#25A194", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer", whiteSpace: "nowrap" }}
              >
                검색
              </button>
              <button
                type="button"
                onClick={() => { setKeyword(""); load(0, ""); }}
                style={{ padding: "5px 10px", background: "#fff", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, cursor: "pointer", color: "#374151", whiteSpace: "nowrap" }}
              >
                초기화
              </button>
              {/* [soojin] 검색 중일 때만 결과 건수 표시 */}
              {keyword && page && (
                <span style={{ fontSize: 13, color: "#6b7280", whiteSpace: "nowrap" }}>
                  <span style={{ fontWeight: 600, color: "#111827" }}>{page.totalElements}개</span> / 전체 {totalAll ?? 0}개
                </span>
              )}
            </form>
          ) : (
            // [soojin] 모델 탭 검색 폼
            <form style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }} onSubmit={(e) => { e.preventDefault(); setModelKeyword(modelInput); }}>
              <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
                <i className="bi bi-search" style={{ position: "absolute", left: "8px", color: "#9ca3af", fontSize: "13px", pointerEvents: "none" }} />
                <input
                  style={{ padding: "5px 8px 5px 28px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, minWidth: 200, background: "#fff" }}
                  placeholder="모델명, 제조사, 분류 검색"
                  value={modelInput}
                  onChange={(e) => setModelInput(e.target.value)}
                />
              </div>
              <button
                type="submit"
                style={{ padding: "5px 12px", background: "#25A194", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer", whiteSpace: "nowrap" }}
              >
                검색
              </button>
              <button
                type="button"
                onClick={() => { setModelInput(""); setModelKeyword(""); }}
                style={{ padding: "5px 10px", background: "#fff", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, cursor: "pointer", color: "#374151", whiteSpace: "nowrap" }}
              >
                초기화
              </button>
              {modelKeyword && (
                <span style={{ fontSize: 13, color: "#6b7280", whiteSpace: "nowrap" }}>
                  <span style={{ fontWeight: 600, color: "#111827" }}>{filteredModels.length}개</span> / 전체 {models.length}개
                </span>
              )}
            </form>
          )}
          {currentTab === "assets" ? (
            <button
              style={{ padding: "5px 12px", background: "#25A194", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer", whiteSpace: "nowrap" }}
              onClick={openAssetCreate}
            >
              + 기자재 등록
            </button>
          ) : (
            <button
              style={{ padding: "5px 12px", background: "#25A194", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer", whiteSpace: "nowrap" }}
              onClick={openModelCreate}
            >
              + 신규 모델 등록
            </button>
          )}
        </div>

        {/* 탭 네비게이션 */}
        <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb", marginBottom: 16, flexShrink: 0 }}>
          {([ ["assets", "기자재 목록"], ["models", "모델 관리"] ] as [string, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setCurrentTab(key as "assets" | "models")}
              style={{
                padding: "12px 20px",
                border: "none",
                background: "none",
                borderBottom: `2px solid ${currentTab === key ? "#25A194" : "transparent"}`,
                color: currentTab === key ? "#25A194" : "var(--text-secondary-light)",
                fontWeight: currentTab === key ? 600 : 400,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ==================== 기자재 목록 탭 ==================== */}
        {currentTab === "assets" && (
          // [soojin] 탭 콘텐츠도 flex column으로 나머지 공간 채우기
          <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
            {/* 재고 요약 카드 */}
            {summaries.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16, flexShrink: 0 }}>
                {summaries.map((s) => (
                  <div key={s.category} style={{ flex: "1 1 200px", minWidth: 180 }}>
                    <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", borderLeft: "4px solid #25A194", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", padding: "16px 20px" }}>
                      <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>{s.category || "미분류"}</div>
                      <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 4 }}>{s.totalCount}개</div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                        <span style={{ color: "#16a34a" }}>사용 {s.availableCount}</span>
                        <span style={{ color: "#2563eb" }}>대여 {s.inUseCount}</span>
                        <span style={{ color: "#dc2626" }}>파손 {s.brokenCount}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* [soojin] 카드: flex:1로 남은 공간 채우기 */}
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden", flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
              {/* [soojin] 스크롤 div: 내부에서만 스크롤 */}
              {/* [soojin] overflowX 래퍼 제거, tableLayout auto, colgroup 제거 → 브라우저 자동 컬럼 분배 */}
              <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "auto" }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>관리 번호</th>
                      <th style={thStyle}>자산명</th>
                      <th style={thStyle}>분류</th>
                      <th style={thStyle}>시리얼 번호</th>
                      <th style={{ ...thStyle, textAlign: "center" }}>상태</th>
                      <th style={thStyle}>위치</th>
                      <th style={thStyle}>구매일</th>
                      <th style={{ ...thStyle, textAlign: "center" }}>관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assetList.map((a) => (
                      <tr key={a.id}>
                        <td style={{ ...tdStyle, color: "#6b7280" }}>{a.assetCode}</td>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>{a.name}</td>
                        <td style={tdStyle}>{a.category}</td>
                        <td style={{ ...tdStyle, color: "#6b7280" }}>{a.serialNumber || "-"}</td>
                        <td style={{ ...tdStyle, textAlign: "center" }}>
                          <span style={statusStyle(a.status)}>{statusInfo(a.status).label}</span>
                        </td>
                        <td style={tdStyle}>{a.location || "-"}</td>
                        <td style={{ ...tdStyle, color: "#6b7280" }}>{a.purchaseDate || "-"}</td>
                        <td style={{ ...tdStyle, textAlign: "center" }}>
                          <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                            <button onClick={() => openAssetEdit(a)} style={{ padding: "4px 10px", background: "#fff", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 12, cursor: "pointer", color: "#374151" }}>수정</button>
                            <button onClick={() => handleAssetDelete(a.id)} style={{ padding: "4px 10px", background: "#fff", border: "1px solid #fca5a5", borderRadius: 6, fontSize: 12, cursor: "pointer", color: "#dc2626" }}>삭제</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {assetList.length === 0 && (
                      <tr>
                        <td colSpan={8} style={{ ...tdStyle, textAlign: "center", padding: "48px 16px", color: "#9ca3af" }}>검색 결과가 없습니다.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* [soojin] 페이지네이션 카드 밖, 우측 정렬, 정사각형 버튼 */}
            {page && page.totalPages >= 1 && (
              <div style={{ display: "flex", justifyContent: "flex-end", padding: "10px 0", gap: 4, flexShrink: 0 }}>
                <button
                  disabled={currentPage === 0}
                  onClick={() => load(currentPage - 1)}
                  style={{ width: 28, height: 28, padding: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff", cursor: currentPage === 0 ? "not-allowed" : "pointer", color: currentPage === 0 ? "#d1d5db" : "#374151", fontSize: 12 }}
                >
                  ‹
                </button>
                {Array.from({ length: page.totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => load(i)}
                    style={{ width: 28, height: 28, padding: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", border: `1px solid ${i === currentPage ? "#25A194" : "#e5e7eb"}`, borderRadius: 6, background: i === currentPage ? "#25A194" : "#fff", color: i === currentPage ? "#fff" : "#374151", cursor: "pointer", fontSize: 12, fontWeight: i === currentPage ? 600 : 400 }}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  disabled={currentPage >= page.totalPages - 1}
                  onClick={() => load(currentPage + 1)}
                  style={{ width: 28, height: 28, padding: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff", cursor: currentPage >= page.totalPages - 1 ? "not-allowed" : "pointer", color: currentPage >= page.totalPages - 1 ? "#d1d5db" : "#374151", fontSize: 12 }}
                >
                  ›
                </button>
              </div>
            )}
          </div>
        )}

        {/* ==================== 모델 관리 탭 ==================== */}
        {currentTab === "models" && (
          // [soojin] 모델 탭도 flex:1로 나머지 공간 채우기
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
            {/* [soojin] 카드: flex:1 */}
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden", flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
              {/* [soojin] 스크롤 div */}
              {/* [soojin] overflowX 래퍼 제거, tableLayout auto, colgroup 제거 → 브라우저 자동 컬럼 분배 */}
              <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "auto" }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>모델명</th>
                      <th style={{ ...thStyle, textAlign: "center" }}>사진</th>
                      <th style={thStyle}>제조사</th>
                      <th style={thStyle}>분류</th>
                      <th style={thStyle}>설명</th>
                      <th style={{ ...thStyle, textAlign: "center" }}>관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredModels.map((m) => (
                      <tr key={m.id}>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>{m.name}</td>
                        <td style={{ ...tdStyle, textAlign: "center" }}>
                          {m.imageUrl ? (
                            <img src={m.imageUrl} alt={m.name} style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: 6 }} />
                          ) : (
                            <div style={{ width: 40, height: 40, background: "#f3f4f6", borderRadius: 6, display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>
                              <i className="bi bi-image" />
                            </div>
                          )}
                        </td>
                        <td style={tdStyle}>{m.manufacturer}</td>
                        <td style={tdStyle}>{m.category}</td>
                        <td style={{ ...tdStyle, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#6b7280" }}>{m.description || "-"}</td>
                        <td style={{ ...tdStyle, textAlign: "center" }}>
                          <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                            <button onClick={() => openModelEdit(m)} style={{ padding: "4px 10px", background: "#fff", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 12, cursor: "pointer", color: "#374151" }}>수정</button>
                            <button onClick={() => handleModelDelete(m.id)} style={{ padding: "4px 10px", background: "#fff", border: "1px solid #fca5a5", borderRadius: 6, fontSize: 12, cursor: "pointer", color: "#dc2626" }}>삭제</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredModels.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ ...tdStyle, textAlign: "center", padding: "48px 16px", color: "#9ca3af" }}>
                          {modelKeyword ? "검색 결과가 없습니다." : "등록된 모델이 없습니다."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
