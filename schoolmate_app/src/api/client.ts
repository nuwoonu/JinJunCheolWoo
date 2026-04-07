// [woo] axios 인스턴스 + JWT 인터셉터 (AsyncStorage 기반)
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { NativeModules } from "react-native";

// [woo] 개발 모드: Metro 번들러 URL에서 Mac IP 자동 추출 (IP 하드코딩 없음)
// 우선순위: scriptURL → hostUri → debuggerHost → 에러
// expo run:ios bare workflow에서 scriptURL이 가장 확실, 핫스팟·공유기 IP 변경 자동 대응
function getDevIp(): string {
  // 1순위: React Native 내부 scriptURL (예: "http://192.168.0.5:8081/index.bundle")
  // expo run:ios bare workflow에서 가장 안정적
  const scriptUrl = NativeModules.SourceCode?.scriptURL as string | undefined;
  if (scriptUrl) {
    const match = scriptUrl.match(/http:\/\/([\d.]+):/);
    if (match) {
      console.log("[API] scriptURL →", match[1]);
      return match[1];
    }
  }

  // 2순위: Expo 매니페스트 hostUri (예: "192.168.0.5:8081")
  const hostUri = (Constants.expoConfig as any)?.hostUri as string | undefined;
  if (hostUri) {
    const ip = hostUri.split(":")[0];
    console.log("[API] hostUri →", ip);
    return ip;
  }

  // 3순위: debuggerHost (일부 Expo 버전에서 제공)
  const debuggerHost = (Constants as any).debuggerHost as string | undefined;
  if (debuggerHost) {
    const ip = debuggerHost.split(":")[0];
    console.log("[API] debuggerHost →", ip);
    return ip;
  }

  // [woo] 감지 실패 시 localhost fallback (iOS 시뮬레이터에서는 동작, 실기기에서는 app.json extra.serverUrl 설정 필요)
  console.warn("[API] Metro 번들러 IP 자동 감지 실패 → localhost fallback");
  return "localhost";
}

function getBaseUrl(): string {
  // [woo] app.json extra.serverUrl 우선 (개발/프로덕션 공통)
  const serverUrl = (Constants.expoConfig as any)?.extra?.serverUrl as string | undefined;
  if (serverUrl) {
    console.log("[API] BASE_URL (serverUrl):", serverUrl);
    return serverUrl;
  }
  if (__DEV__) {
    const ip = getDevIp();
    const url = `http://${ip}:8080/api`;
    console.log("[API] BASE_URL:", url);
    return url;
  }
  console.warn("[API] app.json extra.serverUrl 미설정 → localhost:8080 fallback");
  return "http://localhost:8080/api";
}

export const BASE_URL = getBaseUrl();

// [woo] 백그라운드 태스크는 앱 컨텍스트 밖에서 실행되므로 URL을 AsyncStorage에 저장
AsyncStorage.setItem("savedBaseUrl", BASE_URL).catch(() => {});

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// [woo] 요청 인터셉터: AsyncStorage에서 accessToken 읽어 헤더에 추가
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// [woo] 응답 인터셉터: 401 시 refreshToken으로 자동 갱신 후 재시도
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem("refreshToken");
        if (!refreshToken) throw new Error("No refresh token");

        const res = await axios.post(`${BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = res.data;
        await AsyncStorage.setItem("accessToken", accessToken);
        await AsyncStorage.setItem("refreshToken", newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch {
        await AsyncStorage.multiRemove(["accessToken", "refreshToken"]);
        throw error;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
