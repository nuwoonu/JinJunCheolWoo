// [woo] 헤더 알림 벨 아이콘 + 미읽음 뱃지
// → 각 역할별 Navigator 홈 탭 headerRight에 사용
import React, { useEffect, useState, useCallback } from "react";
import { TouchableOpacity, Text, View, StyleSheet } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import api from "@/api/client";
import { useTheme, ThemeColors } from "@/hooks/useTheme"; // [woo] 다크모드

export default function NotificationBell() {
  const { colors } = useTheme(); // [woo] 다크모드 색상
  const styles = makeStyles(colors); // [woo]
  const navigation = useNavigation<any>();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnread = async () => {
    try {
      const res = await api.get("/notifications/unread-count");
      setUnreadCount(res.data?.count ?? 0);
    } catch {
      setUnreadCount(0);
    }
  };

  // [woo] 탭 포커스될 때마다 미읽음 수 갱신
  useFocusEffect(
    useCallback(() => {
      fetchUnread();
    }, [])
  );

  // [woo] FCM 알림 수신 시 즉시 갱신 (포그라운드)
  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener(() => {
      fetchUnread();
    });
    return () => sub.remove();
  }, []);

  // [woo] 5초마다 폴링 (백그라운드/포그라운드 모두 대응)
  useEffect(() => {
    const interval = setInterval(fetchUnread, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => navigation.navigate("Notifications")}
    >
      <Text style={styles.bell}>🔔</Text>
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// [woo] makeStyles: 다크/라이트 모드 색상 반영
const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    marginRight: 12,
    position: "relative",
  },
  bell: {
    fontSize: 22,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -8,
    backgroundColor: colors.danger,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: colors.textInverse,
    fontSize: 10,
    fontWeight: "bold",
  },
});
