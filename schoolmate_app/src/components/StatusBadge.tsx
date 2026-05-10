// [woo] 출결/상태 배지 공통 컴포넌트
// STATUS_CONFIG의 색상을 그대로 사용하므로 별도 테마 처리 불필요
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { STATUS_CONFIG, StatusKey } from "@/constants/colors";

interface Props {
  status: StatusKey;
  size?: "sm" | "md";
}

export default function StatusBadge({ status, size = "md" }: Props) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.NONE;
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg, borderColor: cfg.color }, size === "sm" && styles.sm]}>
      <Text style={[styles.label, { color: cfg.color }, size === "sm" && styles.labelSm]}>
        {cfg.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1.5,
    alignSelf: "flex-start",
  },
  sm: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
  },
  labelSm: {
    fontSize: 10,
  },
});
