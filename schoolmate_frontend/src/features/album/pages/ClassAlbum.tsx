// [woo] /class/album — 학급 앨범 전체 페이지
// 게시글 형태: 첫 번째 사진 썸네일 + 스크롤로 나머지 사진 확인
// 교사: 업로드(여러 장 묶음) + 삭제 / 학생·학부모: 조회만

import { useEffect, useRef, useState } from "react";
import api from "@/shared/api/authApi";
import { useAuth } from "@/shared/contexts/AuthContext";
import DashboardLayout from "@/shared/components/layout/DashboardLayout";
import ParentBackButton from "@/shared/components/ParentBackButton";

interface PhotoItem {
  id: number;
  imageUrl: string;
  caption: string;
}

interface PhotoGroup {
  groupId: string;
  photos: PhotoItem[];
  uploaderName: string;
  createDate: string;
}

export default function ClassAlbum() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<PhotoGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<{ group: PhotoGroup; index: number } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<{ file: File; previewUrl: string; caption: string }[]>([]);
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  // [woo] 캡션 수정 모드 (groupId → 각 photo의 caption 편집)
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editCaptions, setEditCaptions] = useState<Record<number, string>>({});
  // [woo] 검색어 + 검색 타입 (입력값과 확정값 분리)
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"all" | "title" | "author">("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isTeacher = user?.role === "TEACHER";
  const isAdmin = user?.role === "ADMIN";
  const isParent = user?.role === "PARENT";
  const canUpload = isTeacher || isAdmin;

  const fetchPhotos = () => {
    setLoading(true);
    // [woo] 교사/관리자: 담임반 조회, 학부모: 선택된 자녀 반, 학생: 본인 반
    let url = "/class/photos/my";
    if (isParent) {
      const studentInfoId = sessionStorage.getItem("selectedStudentInfoId");
      if (studentInfoId) url = `/class/photos/by-student/${studentInfoId}`;
      else {
        setLoading(false);
        return;
      }
    } else if (user?.role === "STUDENT") {
      // [woo] 학생은 classroomId로 조회
      const classroomId = sessionStorage.getItem("myClassroomId");
      if (classroomId) url = `/class/photos/${classroomId}`;
    }
    api
      .get(url)
      .then((res) => setGroups(Array.isArray(res.data) ? res.data : []))
      .catch(() => setGroups([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    const newItems = files.map((file) => ({ file, previewUrl: URL.createObjectURL(file), caption: "" }));
    setUploadQueue((prev) => [...prev, ...newItems]);
    setShowUploadPanel(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFromQueue = (idx: number) => {
    setUploadQueue((prev) => {
      URL.revokeObjectURL(prev[idx].previewUrl);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleUpload = async () => {
    if (uploadQueue.length === 0) return;
    setUploading(true);
    // [woo] 같은 묶음은 동일 groupId
    const groupId = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    let failCount = 0;
    for (const item of uploadQueue) {
      try {
        const form = new FormData();
        form.append("file", item.file);
        form.append("caption", item.caption);
        form.append("groupId", groupId);
        await api.post("/class/photos", form, { headers: { "Content-Type": "multipart/form-data" } });
      } catch {
        failCount++;
      }
    }
    uploadQueue.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setUploadQueue([]);
    setShowUploadPanel(false);
    fetchPhotos();
    if (failCount > 0) alert(`${failCount}장 업로드에 실패했습니다.`);
    setUploading(false);
  };

  const handleDeleteGroup = async (group: PhotoGroup) => {
    if (!confirm(`사진 ${group.photos.length}장을 모두 삭제하시겠습니까?`)) return;
    try {
      await Promise.all(group.photos.map((p) => api.delete(`/class/photos/${p.id}`)));
      setGroups((prev) => prev.filter((g) => g.groupId !== group.groupId));
      if (lightbox?.group.groupId === group.groupId) setLightbox(null);
    } catch {
      alert("삭제에 실패했습니다.");
    }
  };

  // [woo] 수정 모드 시작
  const startEdit = (group: PhotoGroup) => {
    const captions: Record<number, string> = {};
    group.photos.forEach((p) => {
      captions[p.id] = p.caption;
    });
    setEditCaptions(captions);
    setEditingGroupId(group.groupId);
  };

  // [woo] 수정 저장
  const saveEdit = async (group: PhotoGroup) => {
    try {
      await Promise.all(
        group.photos.map((p) => api.patch(`/class/photos/${p.id}/caption`, { caption: editCaptions[p.id] ?? "" })),
      );
      setGroups((prev) =>
        prev.map((g) =>
          g.groupId === group.groupId
            ? { ...g, photos: g.photos.map((p) => ({ ...p, caption: editCaptions[p.id] ?? p.caption })) }
            : g,
        ),
      );
      setEditingGroupId(null);
      setEditCaptions({});
    } catch (err: any) {
      console.error("[woo] 캡션 수정 실패:", err.response?.status, err.response?.data);
      alert(`수정에 실패했습니다. (${err.response?.status ?? "네트워크 오류"})`);
    }
  };

  // [woo] 수정 취소
  const cancelEdit = () => {
    setEditingGroupId(null);
    setEditCaptions({});
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  };

  // [woo] 검색 필터링 (검색 타입에 따라 제목/작성자/전체)
  const filteredGroups = searchQuery.trim()
    ? groups.filter((g) => {
        const q = searchQuery.trim();
        const matchTitle = g.photos.some((p) => p.caption.includes(q));
        const matchAuthor = g.uploaderName.includes(q);
        if (searchType === "title") return matchTitle;
        if (searchType === "author") return matchAuthor;
        return matchTitle || matchAuthor;
      })
    : groups;

  const openLightbox = (group: PhotoGroup, index: number) => setLightbox({ group, index });
  const prevPhoto = () => setLightbox((prev) => (prev && prev.index > 0 ? { ...prev, index: prev.index - 1 } : prev));
  const nextPhoto = () =>
    setLightbox((prev) =>
      prev && prev.index < prev.group.photos.length - 1 ? { ...prev, index: prev.index + 1 } : prev,
    );

  return (
    <DashboardLayout>
      {/* 제목 */}
      <div style={{ marginBottom: 16, flexShrink: 0, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
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
            학급 앨범
            <span style={{ fontSize: 13, fontWeight: 400, color: "#6b7280" }}>전체 {groups.length}건</span>
          </h5>
          <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>우리 반의 소중한 순간들을 모아보세요.</p>
        </div>
        <ParentBackButton />
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      {/* [woo] 업로드 패널 — 여러 장 큐 */}
      {showUploadPanel && uploadQueue.length > 0 && (
        <div className="card radius-12 mb-24">
          <div className="card-body p-20">
            <div className="d-flex align-items-center justify-content-between mb-16">
              <h6 className="fw-bold mb-0 text-sm">사진 업로드 ({uploadQueue.length}장)</h6>
              <div className="d-flex gap-8">
                <button
                  type="button"
                  style={{
                    padding: "5px 12px",
                    background: "#25A194",
                    border: "none",
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#fff",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    whiteSpace: "nowrap",
                  }}
                  onClick={handleUpload}
                  disabled={uploading}
                >
                  <i className={uploading ? "ri-loader-4-line" : "ri-check-line"} />
                  {uploading ? "업로드 중..." : `${uploadQueue.length}장 등록`}
                </button>
                <button
                  type="button"
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
                  onClick={() => {
                    uploadQueue.forEach((item) => URL.revokeObjectURL(item.previewUrl));
                    setUploadQueue([]);
                    setShowUploadPanel(false);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  disabled={uploading}
                >
                  취소
                </button>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {uploadQueue.map((item, idx) => (
                <div
                  key={idx}
                  className="d-flex gap-12 align-items-center"
                  style={{ background: "var(--bg-color, #f9fafb)", borderRadius: 10, padding: 10 }}
                >
                  <img
                    src={item.previewUrl}
                    alt="미리보기"
                    style={{
                      width: 80,
                      height: 80,
                      objectFit: "cover",
                      borderRadius: 8,
                      flexShrink: 0,
                      border: "1px solid var(--border-color, #e5e7eb)",
                    }}
                  />
                  <input
                    type="text"
                    className="form-control"
                    placeholder="사진 설명 (선택)"
                    value={item.caption}
                    onChange={(e) => {
                      const val = e.target.value;
                      setUploadQueue((prev) => prev.map((it, i) => (i === idx ? { ...it, caption: val } : it)));
                    }}
                    maxLength={200}
                    disabled={uploading}
                    style={{ flexGrow: 1 }}
                  />
                  <button
                    type="button"
                    onClick={() => removeFromQueue(idx)}
                    disabled={uploading}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#dc2626",
                      fontSize: 18,
                      flexShrink: 0,
                      padding: "0 4px",
                    }}
                  >
                    <i className="ri-close-line" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* [woo] 컨트롤 바: 검색(좌) + 사진 추가(우) */}
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
          style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}
          onSubmit={(e) => {
            e.preventDefault();
            setSearchQuery(searchInput);
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
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as "all" | "title" | "author")}
            >
              <option value="all">전체</option>
              <option value="title">제목</option>
              <option value="author">작성자</option>
            </select>
            <i
              className="ri-arrow-down-s-line"
              style={{ position: "absolute", right: 4, pointerEvents: "none", fontSize: 16, color: "#6b7280" }}
            />
          </div>
          <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
            <i
              className="ri-search-line"
              style={{ position: "absolute", left: 8, color: "#9ca3af", fontSize: 13, pointerEvents: "none" }}
            />
            <input
              type="text"
              style={{
                padding: "5px 8px 5px 28px",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                fontSize: 13,
                minWidth: 180,
                background: "#fff",
              }}
              placeholder={
                searchType === "title"
                  ? "제목으로 검색"
                  : searchType === "author"
                    ? "작성자로 검색"
                    : "제목 또는 작성자로 검색"
              }
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <button
            type="submit"
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
          >
            검색
          </button>
          <button
            type="button"
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
            onClick={() => {
              setSearchInput("");
              setSearchQuery("");
              setSearchType("all");
            }}
          >
            초기화
          </button>
          {searchQuery && (
            <span style={{ fontSize: 13, color: "#6b7280", whiteSpace: "nowrap" }}>
              <span style={{ fontWeight: 600, color: "#111827" }}>{filteredGroups.length}건</span> / 전체{" "}
              {groups.length}건
            </span>
          )}
        </form>
        {canUpload && (
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
            onClick={() => fileInputRef.current?.click()}
          >
            <i className="ri-upload-line" />
            사진 추가
          </button>
        )}
      </div>

      {/* [woo] 게시글 목록 — 그리드 카드 형태 (사진 + 제목 + 날짜) */}
      {loading ? (
        <div className="text-center py-48 text-secondary-light">불러오는 중...</div>
      ) : groups.length === 0 ? (
        <div className="card radius-12 text-center" style={{ padding: "80px 20px" }}>
          <i className="ri-image-2-line d-block mb-16" style={{ fontSize: 56, color: "#d1d5db" }} />
          <h5 className="fw-bold mb-8">아직 사진이 없어요</h5>
          <p className="text-secondary-light text-sm mb-0">
            {canUpload ? "사진 추가 버튼으로 첫 사진을 올려보세요." : "담임선생님이 사진을 올리면 여기에 표시됩니다."}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {filteredGroups.map((group) => {
            const caption = group.photos.find((p) => p.caption)?.caption || `${group.uploaderName}의 사진`;
            return (
              <div key={group.groupId}>
                <div
                  className="card radius-12"
                  style={{ overflow: "hidden", cursor: "pointer", transition: "box-shadow 0.2s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.12)")}
                  onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "")}
                >
                  {/* [woo] 썸네일 */}
                  <div
                    onClick={() => openLightbox(group, 0)}
                    style={{ position: "relative", aspectRatio: "4/3", overflow: "hidden", background: "#f3f4f6" }}
                  >
                    <img
                      src={group.photos[0].imageUrl}
                      alt={caption}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                        transition: "transform 0.2s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                    />
                    {group.photos.length > 1 && (
                      <div
                        style={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          background: "rgba(0,0,0,0.55)",
                          color: "#fff",
                          fontSize: 11,
                          borderRadius: 12,
                          padding: "2px 8px",
                        }}
                      >
                        +{group.photos.length - 1}
                      </div>
                    )}
                  </div>

                  {/* [woo] 제목 + 날짜 */}
                  <div className="px-12 py-10" onClick={() => openLightbox(group, 0)}>
                  {editingGroupId === group.groupId ? (
                    <div onClick={(e) => e.stopPropagation()}>
                      {group.photos.map((p, i) => (
                        <div key={p.id} className="d-flex align-items-center gap-6 mb-4">
                          <span className="text-secondary-light" style={{ fontSize: 11, flexShrink: 0 }}>
                            {i + 1}
                          </span>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="사진 설명"
                            value={editCaptions[p.id] ?? ""}
                            onChange={(e) => setEditCaptions((prev) => ({ ...prev, [p.id]: e.target.value }))}
                            maxLength={200}
                            style={{ fontSize: 12 }}
                          />
                        </div>
                      ))}
                      <div className="d-flex gap-6 mt-6">
                        <button
                          type="button"
                          onClick={() => saveEdit(group)}
                          style={{
                            padding: "3px 10px",
                            background: "#25A194",
                            border: "none",
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 600,
                            color: "#fff",
                            cursor: "pointer",
                          }}
                        >
                          저장
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          style={{
                            padding: "3px 10px",
                            background: "#fff",
                            border: "1px solid #d1d5db",
                            borderRadius: 6,
                            fontSize: 11,
                            cursor: "pointer",
                            color: "#374151",
                          }}
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p
                        className="text-sm fw-semibold mb-2"
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {caption}
                      </p>
                      <p className="text-xs text-secondary-light mb-0">{formatDate(group.createDate)}</p>
                    </>
                  )}
                  </div>
                </div>
                {canUpload && editingGroupId !== group.groupId && (
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginTop: 6 }}>
                    <button
                      type="button"
                      onClick={() => startEdit(group)}
                      style={{
                        padding: "4px 10px",
                        background: "#fff",
                        border: "1px solid #d1d5db",
                        borderRadius: 6,
                        fontSize: 12,
                        cursor: "pointer",
                        color: "#374151",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <i className="ri-edit-line" /> 수정
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteGroup(group)}
                      style={{
                        padding: "4px 10px",
                        background: "#fff",
                        border: "1px solid #fca5a5",
                        borderRadius: 6,
                        fontSize: 12,
                        cursor: "pointer",
                        color: "#dc2626",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <i className="ri-delete-bin-line" /> 삭제
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* [woo] 라이트박스 — 그룹 내 좌우 이동 */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 800, width: "100%", textAlign: "center", position: "relative" }}
          >
            <img
              src={lightbox.group.photos[lightbox.index].imageUrl}
              alt={lightbox.group.photos[lightbox.index].caption}
              style={{ maxWidth: "100%", maxHeight: "75vh", borderRadius: 12, objectFit: "contain" }}
            />
            {lightbox.group.photos[lightbox.index].caption && (
              <p style={{ color: "#fff", marginTop: 14, fontSize: 15, fontWeight: 500 }}>
                {lightbox.group.photos[lightbox.index].caption}
              </p>
            )}
            <p style={{ color: "#9ca3af", fontSize: 12, marginTop: 4 }}>
              {lightbox.group.uploaderName} · {formatDate(lightbox.group.createDate)}
              {lightbox.group.photos.length > 1 && ` · ${lightbox.index + 1} / ${lightbox.group.photos.length}`}
            </p>
          </div>

          {/* 이전 */}
          {lightbox.index > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevPhoto();
              }}
              style={{
                position: "absolute",
                left: 20,
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(255,255,255,0.15)",
                border: "none",
                color: "#fff",
                fontSize: 22,
                cursor: "pointer",
                borderRadius: "50%",
                width: 44,
                height: 44,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <i className="ri-arrow-left-s-line" />
            </button>
          )}

          {/* 다음 */}
          {lightbox.index < lightbox.group.photos.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                nextPhoto();
              }}
              style={{
                position: "absolute",
                right: 70,
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(255,255,255,0.15)",
                border: "none",
                color: "#fff",
                fontSize: 22,
                cursor: "pointer",
                borderRadius: "50%",
                width: 44,
                height: 44,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <i className="ri-arrow-right-s-line" />
            </button>
          )}

          {/* 닫기 */}
          <button
            onClick={() => setLightbox(null)}
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              background: "rgba(255,255,255,0.15)",
              border: "none",
              color: "#fff",
              fontSize: 22,
              cursor: "pointer",
              borderRadius: "50%",
              width: 40,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>
      )}
    </DashboardLayout>
  );
}
