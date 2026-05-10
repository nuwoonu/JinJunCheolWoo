// [woo] 알림 딥링크 핸들러 — actionUrl 파싱 → 화면 이동
//
// 백엔드 actionUrl 목록:
//   /parent/grades?child={studentInfoId}  → 학부모: 자녀 성적
//   /parent/attendance                    → 학부모: 자녀 출결
//   /parent/board                         → 학부모: 게시판 탭 (레거시, 현재 미사용)
//   /consultation                         → 학부모/교사: 상담 (확정/취소/완료 공통)
//   /board/{id}                           → 게시판 상세 (알림장·가정통신문·공지 등 모두 이 형식)
//   /board/school                         → 학생/교사: 학교 공지
//   /homework/{id}                        → 학생: 과제
//   /notifications                        → 알림 목록

import { NavigationContainerRef } from "@react-navigation/native";

export interface NotificationData {
  actionUrl?: string;
  [key: string]: any;
}

// [woo] 자녀 성적 알림 처리 (파라미터 파싱 필요해 별도 분리)
export function handleGradeNotification(
  data: NotificationData,
  navigation: NavigationContainerRef<any> | null
): boolean {
  if (!data?.actionUrl || !data.actionUrl.startsWith("/parent/grades")) return false;
  if (!navigation?.isReady()) return false;

  const url = new URL(data.actionUrl, "https://dummy");
  const childParam = url.searchParams.get("child");
  const childStudentInfoId = childParam ? parseInt(childParam, 10) : undefined;

  try {
    // [woo] ChildGrades는 ParentTabs → 홈(HomeStack) 안에 중첩되어 있으므로 명시적 경로 지정
    (navigation as any).navigate("ParentTabs", {
      screen: "홈",
      params: {
        screen: "ChildGrades",
        params: { childStudentInfoId: isNaN(childStudentInfoId ?? NaN) ? undefined : childStudentInfoId },
      },
    });
    console.log("[woo] 딥링크 → ChildGrades, child:", childStudentInfoId);
    return true;
  } catch (e) {
    console.warn("[woo] 성적 딥링크 실패:", e);
    return false;
  }
}

// [woo] 메인 딥링크 라우터 — App.tsx 알림 탭 리스너에서 호출
export function handleNotificationDeepLink(
  data: NotificationData,
  navigation: NavigationContainerRef<any> | null
): void {
  if (!data?.actionUrl || !navigation?.isReady()) return;

  const url = data.actionUrl;
  const nav = navigation as any;

  try {
    // 1. 자녀 성적: /parent/grades?child=123
    if (handleGradeNotification(data, navigation)) return;

    // 2. 자녀 출결: /parent/attendance
    if (url.startsWith("/parent/attendance")) {
      // [woo] ChildAttendance는 HomeStack 안에 중첩 — 명시적 경로
      nav.navigate("ParentTabs", {
        screen: "홈",
        params: { screen: "ChildAttendance" },
      });
      console.log("[woo] 딥링크 → ChildAttendance");
      return;
    }

    // 3. 학부모 게시판/가정통신문: /parent/board
    if (url.startsWith("/parent/board")) {
      nav.navigate("ParentTabs", { screen: "게시판" });
      console.log("[woo] 딥링크 → 게시판 (학부모)");
      return;
    }

    // 4. 상담 (예약 확정/취소/완료): /consultation
    if (url.startsWith("/consultation")) {
      // [woo] 학부모 먼저, 실패 시 교사
      try {
        nav.navigate("ParentTabs", { screen: "상담" });
        console.log("[woo] 딥링크 → 상담 (학부모)");
        return;
      } catch {}
      try {
        nav.navigate("TeacherTabs", { screen: "상담" });
        console.log("[woo] 딥링크 → 상담 (교사)");
        return;
      } catch {}
      return;
    }

    // 5. 게시판 상세: /board/{id} (숫자 id인 경우)
    const boardDetailMatch = url.match(/^\/board\/(\d+)/);
    if (boardDetailMatch) {
      nav.navigate("BoardDetail", { id: parseInt(boardDetailMatch[1], 10) });
      console.log("[woo] 딥링크 → BoardDetail:", boardDetailMatch[1]);
      return;
    }

    // 6. 학교 공지 게시판: /board/school
    if (url.startsWith("/board/school")) {
      try { nav.navigate("StudentTabs", { screen: "게시판" }); return; } catch {}
      try { nav.navigate("TeacherTabs", { screen: "게시판" }); return; } catch {}
      return;
    }

    // 7. 과제: /homework/{id}
    const homeworkMatch = url.match(/^\/homework\/(\d+)/);
    if (homeworkMatch) {
      // [woo] 학생 탭에 과제 화면 추가 시 여기서 연결
      try { nav.navigate("StudentTabs", { screen: "학습" }); return; } catch {}
      return;
    }

    // 8. 하루 요약: /daily-summary/{studentId}
    const dailySummaryMatch = url.match(/^\/daily-summary\/(\d+)/);
    if (dailySummaryMatch) {
      nav.navigate("ParentTabs", {
        screen: "홈",
        params: { screen: "DailySummary" },
      });
      console.log("[woo] 딥링크 → DailySummary, studentId:", dailySummaryMatch[1]);
      return;
    }

    // 9. 알림 목록: /notifications
    if (url.startsWith("/notifications")) {
      nav.navigate("Notifications");
      return;
    }

    console.log("[woo] 미처리 딥링크:", url);
  } catch (e) {
    console.warn("[woo] 딥링크 처리 실패:", e);
  }
}
