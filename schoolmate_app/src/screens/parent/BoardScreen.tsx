// [woo] 학부모 게시판 — 가정통신문/알림장 자녀별 필터 + 학부모게시판 탭
import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList, RefreshControl, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { getParentNotices, getClassDiary, getParentBoard } from "@/api/parent";
import api from "@/api/client";
import { useSelectedChild } from "@/context/SelectedChildContext"; // [woo] 전역 자녀 선택
import { useTheme, ThemeColors } from "@/hooks/useTheme"; // [woo] 다크모드
import EmptyState from "@/components/EmptyState";

type BoardTab = "가정통신문" | "알림장" | "학부모게시판";

interface Post {
  id: number;
  title: string;
  writerName: string;
  createDate: string;
  viewCount: number;
  pinned?: boolean;
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return "";
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "방금 전";
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

// [woo] 탭 → 백엔드 BoardType 매핑 (read-ids API 파라미터)
const BOARD_TYPE: Record<BoardTab, string> = {
  "가정통신문": "PARENT_NOTICE",
  "알림장": "CLASS_DIARY",
  "학부모게시판": "PARENT_BOARD",
};

function isRecentlyNew(dateStr: string): boolean {
  return Date.now() - new Date(dateStr).getTime() < 7 * 24 * 60 * 60 * 1000;
}


function PostList({ tab, studentUid, colors }: { tab: BoardTab; studentUid: number | null; colors: ThemeColors }) {
  const styles = makeStyles(colors); // [woo]
  const navigation = useNavigation<any>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // [woo] 백엔드 읽음 ID 목록 — NEW 뱃지 판단 기준
  const [readIds, setReadIds] = useState<Set<number>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [postsRes, ids] = await Promise.all([
        tab === "가정통신문" ? getParentNotices(0, studentUid ?? undefined)
          : tab === "알림장" ? getClassDiary(0, studentUid ?? undefined)
          : getParentBoard(0),
        api.get<number[]>(`/board/read-ids?type=${BOARD_TYPE[tab]}`).then(r => r.data).catch(() => [] as number[]),
      ]);
      setPosts(postsRes?.content ?? []);
      setReadIds(new Set(ids));
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [tab, studentUid]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handlePress = (item: Post) => {
    // [woo] 즉시 읽음 처리 (낙관적 업데이트 → NEW 뱃지 바로 제거)
    setReadIds(prev => new Set([...prev, item.id]));
    navigation.navigate("BoardDetail", { id: item.id });
  };

  const renderItem = ({ item }: { item: Post }) => {
    const showNew = !readIds.has(item.id) && isRecentlyNew(item.createDate);
    return (
      <TouchableOpacity
        style={styles.postItem}
        onPress={() => handlePress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.postHeader}>
          <View style={styles.authorAvatar}>
            <Text style={styles.authorInitial}>{item.writerName?.charAt(0)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.authorRow}>
              <Text style={styles.authorName}>{item.writerName}</Text>
              {item.pinned && (
                <View style={styles.pinnedBadge}><Text style={styles.pinnedText}>고정</Text></View>
              )}
              {showNew && (
                <View style={styles.newBadge}><Text style={styles.newBadgeText}>N</Text></View>
              )}
            </View>
            <Text style={styles.dateText}>{timeAgo(item.createDate)}</Text>
          </View>
          <Text style={styles.views}>👁 {item.viewCount}</Text>
        </View>
        <Text style={styles.postTitle} numberOfLines={2}>{item.title}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => String(item.id)}
      renderItem={renderItem}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      contentContainerStyle={posts.length === 0 ? { flex: 1 } : { paddingBottom: 16 }}
      ListEmptyComponent={
        loading ? null : (
          <EmptyState
            icon={tab === "가정통신문" ? "📄" : tab === "알림장" ? "📝" : "💬"}
            title={`${tab}이 없습니다`}
          />
        )
      }
    />
  );
}

export default function ParentBoardScreen() {
  const { colors } = useTheme(); // [woo] 다크모드 색상
  const styles = makeStyles(colors); // [woo]
  const { selectedChild } = useSelectedChild(); // [woo] 전역 선택된 자녀
  const [activeTab, setActiveTab] = useState<BoardTab>("가정통신문");

  const TABS: BoardTab[] = ["가정통신문", "알림장", "학부모게시판"];

  // [woo] 학부모게시판은 자녀 필터 없음
  const studentUid = activeTab !== "학부모게시판" ? (selectedChild?.id ?? null) : null;

  return (
    <View style={styles.container}>
      {/* 탭 바 */}
      <View style={styles.tabBar}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setActiveTab(t)}
            style={[styles.tab, activeTab === t && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ flex: 1 }}>
        <PostList tab={activeTab} studentUid={studentUid} colors={colors} />
      </View>
    </View>
  );
}

// [woo] makeStyles: 다크/라이트 모드 색상 반영
const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  tabBar: { flexDirection: "row", backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  tab: { flex: 1, alignItems: "center", paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabActive: { borderBottomColor: colors.primary },
  tabText: { fontSize: 12, fontWeight: "600", color: colors.textSecondary },
  tabTextActive: { color: colors.primary, fontWeight: "700" },
  chipRow: { backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  chipText: { fontSize: 12, fontWeight: "600", color: colors.textSecondary },
  chipTextActive: { color: colors.primary },
  postItem: { backgroundColor: colors.card, marginHorizontal: 14, marginTop: 10, borderRadius: 14, padding: 16, shadowColor: colors.shadowColor, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  postHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  authorAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.primaryLight, justifyContent: "center", alignItems: "center", flexShrink: 0 },
  authorInitial: { color: colors.primary, fontWeight: "bold", fontSize: 14 },
  authorRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  authorName: { fontSize: 13, fontWeight: "600", color: colors.text },
  pinnedBadge: { backgroundColor: colors.warning + "33", paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3 },
  pinnedText: { color: colors.warning, fontSize: 9, fontWeight: "800" },
  newBadge: { backgroundColor: colors.danger, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3 },
  newBadgeText: { color: colors.textInverse, fontSize: 9, fontWeight: "800" },
  dateText: { fontSize: 11, color: colors.textLight, marginTop: 1 },
  views: { fontSize: 11, color: colors.textLight },
  postTitle: { fontSize: 15, fontWeight: "600", color: colors.text, lineHeight: 22 },
});
