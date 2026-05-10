// [woo] 알림 목록 화면에서 알림 탭 시 화면 이동 — gradeNotification.ts에 위임
import { navigationRef } from "@/navigation/AppNavigator";
import { handleNotificationDeepLink } from "@/utils/gradeNotification";

export function navigateByActionUrl(actionUrl: string | null | undefined) {
  if (!actionUrl) return;
  handleNotificationDeepLink({ actionUrl }, navigationRef);
}
