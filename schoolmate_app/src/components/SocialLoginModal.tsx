// [woo] 소셜 로그인 WebView 모달 (Google / Kakao OAuth2)
// 흐름: WebView → /oauth2/authorization/{provider} → Spring Boot → /oauth2/callback?accessToken=...
import React, { useRef, useState } from "react";
import {
  Modal,
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  SafeAreaView,
} from "react-native";
import { WebView, WebViewNavigation } from "react-native-webview";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "@/api/client";
import { useTheme, ThemeColors } from "@/hooks/useTheme"; // [woo] 다크모드

// BASE_URL = "http://{IP}:8080/api" → server root = "http://{IP}:8080"
const SERVER_ROOT = BASE_URL.replace(/\/api$/, "");

// Spring Boot OAuth2LoginSuccessHandler가 리다이렉트하는 프론트엔드 주소
// 이 URL로 오면 토큰을 꺼내고 WebView를 닫음
const CALLBACK_PATH = "/oauth2/callback";

interface Props {
  provider: "google" | "kakao";
  visible: boolean;
  onSuccess: (role: string) => void;
  onClose: () => void;
}

export default function SocialLoginModal({ provider, visible, onClose, onSuccess }: Props) {
  const { colors } = useTheme(); // [woo] 다크모드 색상
  const styles = makeStyles(colors); // [woo]
  const [loading, setLoading] = useState(true);
  const handledRef = useRef(false);

  const oauthUrl = `${SERVER_ROOT}/oauth2/authorization/${provider}`;

  const handleTokenUrl = async (url: string) => {
    if (handledRef.current) return;
    if (!url.includes(CALLBACK_PATH)) return;

    handledRef.current = true;
    try {
      const urlObj = new URL(url);
      const accessToken = urlObj.searchParams.get("accessToken");
      const refreshToken = urlObj.searchParams.get("refreshToken");

      if (accessToken && refreshToken) {
        await AsyncStorage.setItem("accessToken", accessToken);
        await AsyncStorage.setItem("refreshToken", refreshToken);
        const role = urlObj.searchParams.get("role") ?? "";
        onSuccess(role);
      } else {
        onClose();
      }
    } catch {
      onClose();
    }
  };

  const onNavigationStateChange = (navState: WebViewNavigation) => {
    handleTokenUrl(navState.url);
  };

  const onShouldStartLoadWithRequest = (request: { url: string }) => {
    if (request.url.includes(CALLBACK_PATH)) {
      handleTokenUrl(request.url);
      return false; // WebView가 해당 URL 로드하지 않도록 차단
    }
    return true;
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {provider === "google" ? "Google" : "카카오"} 로그인
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}

        <WebView
          source={{ uri: oauthUrl }}
          style={styles.webview}
          onLoadEnd={() => setLoading(false)}
          onNavigationStateChange={onNavigationStateChange}
          onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
          javaScriptEnabled
          domStorageEnabled
          thirdPartyCookiesEnabled
          userAgent="Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/91.0.4472.120 Mobile Safari/537.36"
        />
      </SafeAreaView>
    </Modal>
  );
}

// [woo] makeStyles: 다크/라이트 모드 색상 반영
const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  closeBtn: {
    padding: 4,
  },
  closeText: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
    zIndex: 10,
  },
});
