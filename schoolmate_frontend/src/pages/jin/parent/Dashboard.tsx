import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/api/auth";
import Header from "@/components/layout/Header";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { useAuth } from "@/contexts/AuthContext";
import Footer from "@/components/layout/Footer";

// [soojin] 학부모 대시보드 - 사이드바 없는 2컬럼 레이아웃

interface Child {
  id: number;
  name: string;
  grade: number | null;
  classNum: number | null;
  schoolName: string | null;
  profileImageUrl: string | null;
}

interface ParentProfile {
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
}

interface ParentDashboardData {
  children: Child[];
  parentProfile: ParentProfile | null;
}

export default function ParentDashboard() {
  const [data, setData] = useState<ParentDashboardData>({ children: [], parentProfile: null });
  const [loading, setLoading] = useState(true);
  const { signOut } = useAuth();

  useEffect(() => {
    api
      .get("/dashboard/parent")
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getInitial = (name: string) => name.charAt(0);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <span style={{ color: "#888" }}>불러오는 중...</span>
      </div>
    );
  }

  const { parentProfile, children } = data;

  return (
    <SidebarProvider>
      <div style={{ minHeight: "100vh", backgroundColor: "#f4f6f8", display: "flex", flexDirection: "column" }}>
        <Header showLogo />
        <div style={{ padding: "40px 20px", flex: 1 }}>
          {/* 2컬럼 레이아웃 */}
          <div style={{ display: "flex", gap: "24px", width: "1270px", margin: "0 auto", alignItems: "stretch" }}>
            {/* 왼쪽: 프로필 카드 */}
            <div
              style={{
                width: "300px",
                flexShrink: 0,
                backgroundColor: "#fff",
                borderRadius: "16px",
                overflow: "hidden",
                boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
              }}
            >
              <div
                style={{
                  padding: "32px 35px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "20px",
                  justifyContent: "space-between",
                }}
              >
                {/* 아바타 */}
                <div
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #4ecdc4, #2bb5ab)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "28px",
                    fontWeight: 700,
                    color: "#fff",
                  }}
                >
                  {parentProfile ? getInitial(parentProfile.name) : "?"}
                </div>

                <div style={{ textAlign: "center" }}>
                  <div style={{ fontWeight: 700, fontSize: "18px", color: "#222" }}>{parentProfile?.name ?? "-"}</div>
                  <div style={{ fontSize: "13px", color: "#888", marginTop: "2px" }}>학부모</div>
                </div>

                {/* 연락처 정보 */}
                <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#555" }}>
                    <i className="ri-mail-line" style={{ fontSize: "16px", color: "#2bb5ab", flexShrink: 0 }} />
                    <span style={{ wordBreak: "break-all" }}>{parentProfile?.email ?? "-"}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#555" }}>
                    <i className="ri-phone-line" style={{ fontSize: "16px", color: "#2bb5ab", flexShrink: 0 }} />
                    <span>{parentProfile?.phone ?? "-"}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#555" }}>
                    <i className="ri-map-pin-line" style={{ fontSize: "16px", color: "#2bb5ab", flexShrink: 0 }} />
                    <span>{parentProfile?.address ?? "-"}</span>
                  </div>
                </div>

                {/* 통계 - 자녀 수, 미확인 알림 */}
                <div style={{ display: "flex", gap: "10px", width: "100%" }}>
                  <div
                    style={{
                      flex: 1,
                      textAlign: "center",
                      backgroundColor: "#e0f4f0",
                      borderRadius: "12px",
                      padding: "12px 8px",
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: "20px", color: "#2bb5ab" }}>{children.length}</div>
                    <div style={{ fontSize: "12px", color: "#555" }}>자녀</div>
                  </div>
                  <div
                    style={{
                      flex: 1,
                      textAlign: "center",
                      backgroundColor: "#e0f4f0",
                      borderRadius: "12px",
                      padding: "12px 8px",
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: "20px", color: "#2bb5ab" }}>0</div>
                    <div style={{ fontSize: "12px", color: "#555" }}>미확인 알림</div>
                  </div>
                </div>

                {/* [woo] 로그아웃 버튼 - 기존 handleLogout은 쿠키 삭제 시 path=/ 누락으로 토큰이 남아 대시보드로 재진입되는 버그 존재, AuthContext signOut으로 교체 */}
                <button
                  onClick={signOut}
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #e0e0e0",
                    borderRadius: "8px",
                    backgroundColor: "#fff",
                    color: "#555",
                    fontSize: "13px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  <i className="ri-logout-box-r-line" style={{ fontSize: "15px" }} />
                  로그아웃
                </button>
              </div>
            </div>

            {/* 오른쪽: 나의 자녀 */}
            <div
              style={{
                width: "946px",
                flexShrink: 0,
                backgroundColor: "#fff",
                borderRadius: "16px",
                padding: "28px",
                boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
              }}
            >
              {/* 헤더 */}
              <div
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontWeight: 700, fontSize: "18px", color: "#222" }}>자녀 목록</span>
                  <span style={{ fontSize: "14px", color: "#888" }}>총 {children.length}명</span>
                </div>
              </div>
              <hr style={{ margin: "0 0 24px", borderColor: "#6c757d" }} />

              {/* 자녀 카드 목록 */}
              {children.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "#aaa" }}>등록된 자녀가 없습니다.</div>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "25px" }}>
                  {children.map((child) => (
                    <Link
                      key={child.id}
                      to="/parent/children/status"
                      state={{ childId: child.id }}
                      onClick={() => sessionStorage.setItem("selectedChildId", String(child.id))}
                      style={{
                        width: "280px",
                        borderRadius: "16px",
                        overflow: "hidden",
                        backgroundColor: "#e0f4f0",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                        textDecoration: "none",
                        display: "block",
                        cursor: "pointer",
                      }}
                    >
                      {/* 카드 상단: 아바타 + 이름 + 학교 */}
                      <div
                        style={{
                          padding: "28px 20px 20px",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "20px",
                        }}
                      >
                        <figure className="w-120-px h-120-px rounded-circle overflow-hidden mb-0 border border-width-4-px border-white flex-shrink-0">
                          <img
                            src={child.profileImageUrl ?? "/images/thumbs/student-details-img.png"}
                            alt="Student Image"
                            className="w-100 h-100 object-fit-cover"
                          />
                        </figure>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontWeight: 700, fontSize: "17px", color: "#1a5c57" }}>{child.name}</div>
                          <div style={{ fontSize: "13px", color: "#555", marginTop: "4px" }}>
                            {child.schoolName ?? "-"}
                          </div>
                        </div>
                      </div>

                      {/* 카드 하단: 학년/반 */}
                      <div
                        style={{
                          margin: "0 16px 16px",
                          backgroundColor: "rgba(255,255,255,0.5)",
                          borderRadius: "12px",
                          padding: "10px 8px",
                          display: "flex",
                          justifyContent: "space-around",
                          alignItems: "center",
                        }}
                      >
                        <div
                          style={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <div style={{ fontSize: "11px", color: "#555" }}>학년</div>
                          <div style={{ fontWeight: 700, fontSize: "18px", color: "#1a5c57" }}>
                            {child.grade ?? "-"}학년
                          </div>
                        </div>
                        <div
                          style={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <div style={{ fontSize: "11px", color: "#555" }}>반</div>
                          <div style={{ fontWeight: 700, fontSize: "18px", color: "#1a5c57" }}>
                            {child.classNum ?? "-"}반
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </SidebarProvider>
  );
}
