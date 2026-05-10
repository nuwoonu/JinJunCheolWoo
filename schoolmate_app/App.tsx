// [woo] 앱 진입점: AuthProvider + ToastProvider + Navigation + 푸시 알림 핸들러
import React, { useEffect, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import { AuthProvider } from "./src/context/AuthContext";
import { SelectedChildProvider } from "./src/context/SelectedChildContext";
import { ToastProvider } from "./src/components/Toast";
import AppNavigator, { navigationRef } from "./src/navigation/AppNavigator"; // [woo] 딥링크용 ref
import { handleNotificationDeepLink } from "./src/utils/gradeNotification"; // [woo] 알림 딥링크 핸들러

// [woo] 포그라운드 알림 표시 설정 — 앱이 열려있어도 상단바 알림 표시
import "./src/utils/notifications";

export default function App() {
  const notificationListener = useRef<Notifications.EventSubscription>();
  const responseListener = useRef<Notifications.EventSubscription>();

  useEffect(() => {
    // [woo] 알림 수신 리스너 (포그라운드)
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log("[woo] 푸시 수신:", notification.request.content.title);
    });

    // [woo] 알림 탭 리스너 — 앱 실행 중(포그라운드/백그라운드) 알림 탭
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      console.log("[woo] 알림 탭:", data);
      handleNotificationDeepLink(data, navigationRef);
    });

    // [woo] Cold start — 앱 종료 상태에서 알림 탭해서 진입한 경우
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        const data = response.notification.request.content.data;
        console.log("[woo] Cold start 알림 탭:", data);
        // [woo] 네비게이션 준비 후 이동 (500ms 대기)
        setTimeout(() => handleNotificationDeepLink(data, navigationRef), 500);
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  return (
    <AuthProvider>
      <SelectedChildProvider>
        <ToastProvider>
          <AppNavigator />
          <StatusBar style="auto" />
        </ToastProvider>
      </SelectedChildProvider>
    </AuthProvider>
  );
}
