// [woo] FCM 푸시 알림 — Expo Push Token → 서버 등록 → 서버가 Expo Push API 호출 → FCM → 기기 상단바
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Platform } from "react-native";

const BASE_URL_KEY = "savedBaseUrl";
const EXPO_PUSH_TOKEN_KEY = "expoPushToken";

// [woo] 포그라운드에서도 상단바에 알림 표시 (기본은 포그라운드 무시)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function saveBaseUrl(url: string): Promise<void> {
  await AsyncStorage.setItem(BASE_URL_KEY, url);
}

// [woo] 로그인 시 호출 — 알림 권한 + 채널 + Expo Push Token 발급/서버 등록
export async function registerLocalNotifications(): Promise<void> {
  // 1) 알림 권한 요청
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    console.warn("[woo] 알림 권한 거부됨");
    return;
  }
  console.log("[woo] 알림 권한 granted");

  // 2) Android 알림 채널 (필수)
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "SchoolMate 알림",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
    console.log("[woo] Android 알림 채널 생성 완료");
  }

  // 3) Expo Push Token 발급
  try {
    const projectId =
      Constants.easConfig?.projectId ??
      (Constants.expoConfig as any)?.extra?.eas?.projectId;

    if (!projectId) {
      console.error("[woo] EAS projectId 없음 — app.json extra.eas.projectId 확인 필요");
      return;
    }
    console.log("[woo] projectId:", projectId);

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const expoPushToken = tokenData.data; // "ExponentPushToken[xxx]"
    console.log("[woo] Expo Push Token 발급:", expoPushToken);

    // 4) 서버에 토큰 등록
    const baseUrl = await AsyncStorage.getItem(BASE_URL_KEY);
    const accessToken = await AsyncStorage.getItem("accessToken");

    if (!baseUrl || !accessToken) {
      console.error("[woo] baseUrl 또는 accessToken 없음", { baseUrl: !!baseUrl, accessToken: !!accessToken });
      return;
    }

    // [woo] 매 로그인마다 재등록 (개발 중 토큰 DB 불일치 방지)
    const res = await axios.post(
      `${baseUrl}/push/register`,
      { token: expoPushToken, platform: Platform.OS },
      { headers: { Authorization: `Bearer ${accessToken}` }, timeout: 10000 },
    );
    await AsyncStorage.setItem(EXPO_PUSH_TOKEN_KEY, expoPushToken);
    console.log("[woo] 서버 토큰 등록 완료:", res.status);
  } catch (e: any) {
    console.error("[woo] FCM 토큰 등록 실패:", e?.message ?? e);
  }
}

// [woo] 로그아웃 시 토큰 해제
export async function unregisterLocalNotifications(): Promise<void> {
  try {
    const expoPushToken = await AsyncStorage.getItem(EXPO_PUSH_TOKEN_KEY);
    if (expoPushToken) {
      const baseUrl = await AsyncStorage.getItem(BASE_URL_KEY);
      const accessToken = await AsyncStorage.getItem("accessToken");
      if (baseUrl) {
        await axios
          .delete(`${baseUrl}/push/unregister`, {
            data: { token: expoPushToken },
            headers: { Authorization: `Bearer ${accessToken}` },
            timeout: 5000,
          })
          .catch(() => {});
      }
      await AsyncStorage.removeItem(EXPO_PUSH_TOKEN_KEY);
    }
  } catch {}
}
