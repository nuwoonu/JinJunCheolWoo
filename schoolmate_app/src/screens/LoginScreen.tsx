// [woo] 로그인 화면 — 카드형 레이아웃, Ionicons outline 아이콘
import React, { useState } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  View,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "@/context/AuthContext";
import { useTheme, ThemeColors } from "@/hooks/useTheme";
import SocialLoginModal from "@/components/SocialLoginModal";

type SocialProvider = "google" | "kakao";

export default function LoginScreen() {
  const { login, refresh } = useAuth();
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialProvider, setSocialProvider] = useState<SocialProvider | null>(null);

  const styles = makeStyles(colors);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("알림", "이메일과 비밀번호를 입력해주세요.");
      return;
    }
    setLoading(true);
    try {
      await login({ email: email.trim(), password });
    } catch (e: any) {
      const status = e.response?.status;
      const msg = e.response?.data?.message;
      const detail = status ? `[${status}] ${msg || "서버 오류"}` : `네트워크 오류: ${e.message}`;
      Alert.alert("로그인 실패", detail);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSuccess = async (role: string) => {
    setSocialProvider(null);
    if (role === "GUEST") {
      navigation.navigate("SocialSelectRole");
    } else {
      await refresh();
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding" enabled={Platform.OS === "ios"}>
      <ScrollView
        contentContainerStyle={styles.inner}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* 로고 */}
        <View style={styles.logoArea}>
          <Image source={require("../../assets/schoolmateLogo.png")} style={styles.logoImage} resizeMode="contain" />
          <Text style={styles.appSlogan}>학교 생활의 동반자</Text>
        </View>

        {/* 폼 카드 */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>로그인</Text>

          {/* 이메일 */}
          <View style={styles.inputWrap}>
            <Ionicons name="mail-outline" size={18} color={colors.placeholder} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="이메일"
              placeholderTextColor={colors.placeholder}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
              returnKeyType="next"
            />
          </View>

          {/* 비밀번호 */}
          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.placeholder} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="비밀번호"
              placeholderTextColor={colors.placeholder}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!loading}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword((v) => !v)}>
              <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color={colors.placeholder} />
            </TouchableOpacity>
          </View>

          {/* 로그인 버튼 */}
          <TouchableOpacity
            style={[styles.loginBtn, loading && { opacity: 0.6 }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={colors.textInverse} />
            ) : (
              <Text style={styles.loginBtnText}>로그인</Text>
            )}
          </TouchableOpacity>

          {/* 구분선 */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>또는</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* 구글 */}
          <TouchableOpacity
            style={styles.socialBtn}
            onPress={() => setSocialProvider("google")}
            disabled={loading}
            activeOpacity={0.8}
          >
            {/* [woo] 구글 공식 로고 */}
            <Image source={require("../../assets/google_logo.png")} style={styles.kakaoLogoImg} />
            <Text style={styles.socialBtnText}>Google로 계속하기</Text>
          </TouchableOpacity>

          {/* 카카오 */}
          <TouchableOpacity
            style={[styles.socialBtn, styles.kakaoBtn]}
            onPress={() => setSocialProvider("kakao")}
            disabled={loading}
            activeOpacity={0.8}
          >
            {/* [woo] 카카오 공식 로고 */}
            <Image source={require("../../assets/kakao_logo.png")} style={styles.kakaoLogoImg} />
            <Text style={[styles.socialBtnText, { color: "#3C1E1E" }]}>카카오로 계속하기</Text>
          </TouchableOpacity>
        </View>

        {/* 회원가입 링크 */}
        <TouchableOpacity style={styles.registerLink} onPress={() => navigation.navigate("RegisterRole")}>
          <Text style={styles.registerLinkText}>
            아직 계정이 없으신가요?{"  "}
            <Text style={styles.registerLinkBold}>회원가입하기</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {socialProvider && (
        <SocialLoginModal
          provider={socialProvider}
          visible={!!socialProvider}
          onSuccess={handleSocialSuccess}
          onClose={() => setSocialProvider(null)}
        />
      )}
    </KeyboardAvoidingView>
  );
}

// [woo] makeStyles: 다크/라이트 모드 색상 반영
const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundSecondary,
    },
    inner: {
      flexGrow: 1,
      justifyContent: "flex-start",
      paddingHorizontal: 20,
      paddingTop: 80,
      paddingBottom: 40,
    },

    logoArea: {
      alignItems: "center",
      marginBottom: 36,
    },
    logoImage: {
      width: 260,
      height: 60,
      marginTop: 50,
      marginBottom: 10,
    },
    appSlogan: { fontSize: 15, fontWeight: "500", color: colors.textSecondary },

    formCard: {
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 24,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
      marginBottom: 20,
    },
    formTitle: { fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 20 },

    inputWrap: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1.5,
      borderColor: colors.inputBorder,
      borderRadius: 10,
      backgroundColor: colors.inputBg,
      paddingHorizontal: 14,
      marginBottom: 12,
    },
    inputIcon: { marginRight: 10 },
    input: {
      flex: 1,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.text,
    },
    passwordInput: { paddingRight: 4 },
    eyeBtn: { padding: 4 },

    loginBtn: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
      marginTop: 4,
    },
    loginBtnText: { color: colors.textInverse, fontSize: 16, fontWeight: "700" },

    dividerRow: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 20,
    },
    dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
    dividerText: { marginHorizontal: 12, fontSize: 12, color: colors.textLight },

    socialBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: 12,
      paddingVertical: 13,
      backgroundColor: colors.card,
      marginBottom: 10,
    },
    kakaoBtn: {
      backgroundColor: "#FEE500",
      borderColor: "#FEE500",
      marginBottom: 0,
    },
    socialBtnText: { fontSize: 14, fontWeight: "600", color: colors.text },

    // [woo] 카카오 로고 이미지
    kakaoLogoImg: { width: 20, height: 20, resizeMode: "contain" },

    registerLink: { alignItems: "center" },
    registerLinkText: { fontSize: 13, color: colors.textSecondary },
    registerLinkBold: { color: colors.primary, fontWeight: "700" },
  });
