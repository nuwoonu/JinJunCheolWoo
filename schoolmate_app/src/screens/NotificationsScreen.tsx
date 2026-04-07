// [woo] 알림 목록 화면
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import api from "@/api/client";
import { useTheme, ThemeColors } from "@/hooks/useTheme"; // [woo] 다크모드
import { navigateByActionUrl } from "@/utils/notificationNavigation"; // [woo] 알림 탭 → 화면 이동
import { Ionicons } from "@expo/vector-icons";

// [woo] 백엔드 NotificationDTO.NotificationHistory 형식에 맞춤
interface Notification {
  id: number;
  title: string;
  content: string;
  senderName: string;
  sentDate: string; // "yyyy-MM-dd HH:mm"
  read: boolean;
  actionUrl?: string; // [woo] 탭 시 이동할 경로
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "방금 전";
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`;
  return new Date(dateStr).toLocaleDateString("ko-KR");
}

export default function NotificationsScreen() {
  const { colors } = useTheme(); // [woo] 다크모드 색상
  const styles = makeStyles(colors); // [woo]
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data ?? []);
    } catch {
      // [woo] API 미구현 시 빈 배열
      setNotifications([]);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  // [woo] 백엔드는 POST /api/notifications/{id}/read
  const markAsRead = async (id: number) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch {}
  };

  // [woo] 알림 탭 → 읽음 처리 + actionUrl 있으면 해당 화면으로 이동
  const handlePress = async (item: Notification) => {
    if (!item.read) await markAsRead(item.id);
    if (item.actionUrl) navigateByActionUrl(item.actionUrl);
  };

  const renderItem = ({ item }: { item: Notification }) => {
    return (
      <TouchableOpacity
        style={[styles.item, !item.read && styles.unread]}
        onPress={() => handlePress(item)}
        activeOpacity={0.75}
      >
        <View style={styles.itemHeader}>
          <Text style={styles.sender}>{item.senderName || "시스템"}</Text>
          <Text style={styles.time}>{timeAgo(item.sentDate)}</Text>
        </View>
        <Text style={[styles.title, !item.read && styles.titleUnread]}>
          {item.title}
        </Text>
        <Text style={styles.message} numberOfLines={2}>
          {item.content}
        </Text>
        {/* [woo] 바로가기 칩 제거 */}
        {!item.read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        contentContainerStyle={
          notifications.length === 0 ? styles.emptyContainer : styles.list
        }
        ListEmptyComponent={
          <View style={styles.emptyView}>
            <Text style={styles.emptyTitle}>알림이 없습니다</Text>
            <Text style={styles.emptySubtitle}>
              새로운 알림이 오면 여기에 표시됩니다.
            </Text>
          </View>
        }
      />
    </View>
  );
}

// [woo] makeStyles: 다크/라이트 모드 색상 반영
const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  list: {
    padding: 16,
  },
  item: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    position: "relative",
  },
  unread: {
    backgroundColor: colors.primaryLight,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sender: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
  time: {
    fontSize: 12,
    color: colors.textLight,
  },
  title: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  titleUnread: {
    fontWeight: "bold",
    color: colors.text,
  },
  message: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  unreadDot: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyView: {
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textLight,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textLight,
  },
});
