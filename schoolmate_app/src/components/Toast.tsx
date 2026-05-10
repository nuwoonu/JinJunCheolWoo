// [woo] 전역 토스트 알림 컴포넌트 (우하단 슬라이드인)
import React, { createContext, useContext, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useTheme, ThemeColors } from "@/hooks/useTheme"; // [woo] 다크모드

interface ToastItem {
  id: number;
  message: string;
  color: string;
  icon: string;
}

interface ToastContextType {
  showToast: (message: string, type?: "success" | "error" | "info" | "warning") => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme(); // [woo] 다크모드 색상
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  // [woo] TYPE_CONFIG는 colors 의존이므로 컴포넌트 안에서 정의
  const TYPE_CONFIG = {
    success: { color: colors.success, icon: "✓" },
    error:   { color: colors.danger,  icon: "✕" },
    info:    { color: colors.info,    icon: "ℹ" },
    warning: { color: colors.warning, icon: "⚠" },
  };

  const showToast = (message: string, type: "success" | "error" | "info" | "warning" = "success") => {
    const id = ++idRef.current;
    const cfg = TYPE_CONFIG[type];
    setToasts((prev) => [...prev, { id, message, color: cfg.color, icon: cfg.icon }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2500);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <View style={styles.container} pointerEvents="none">
        {toasts.map((t) => (
          <ToastItemView key={t.id} toast={t} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

function ToastItemView({ toast: t }: { toast: ToastItem }) {
  const { colors } = useTheme(); // [woo]
  const styles = makeToastStyles(colors); // [woo]
  const anim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 80,
      friction: 8,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.toast,
        { borderLeftColor: t.color, transform: [{ translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [120, 0] }) }] },
      ]}
    >
      <View style={[styles.iconCircle, { backgroundColor: t.color + "22" }]}>
        <Text style={[styles.icon, { color: t.color }]}>{t.icon}</Text>
      </View>
      <Text style={styles.message} numberOfLines={2}>{t.message}</Text>
    </Animated.View>
  );
}

export const useToast = () => useContext(ToastContext);

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 100,
    right: 16,
    gap: 8,
    zIndex: 9999,
  },
});

// [woo] makeToastStyles: 다크/라이트 모드 색상 반영
const makeToastStyles = (colors: ThemeColors) => StyleSheet.create({
  toast: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 12,
    borderLeftWidth: 4,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 6,
    maxWidth: 280,
    gap: 10,
    marginBottom: 8,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  icon: {
    fontSize: 14,
    fontWeight: "bold",
  },
  message: {
    fontSize: 13,
    color: colors.text,
    fontWeight: "500",
    flex: 1,
  },
});
