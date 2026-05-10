// [woo] 학생 게시판 — 공지사항 / 알림장 / 학급게시판 탭
import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList, RefreshControl, StyleSheet,
  Text, TouchableOpacity, View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { getSchoolNotices, getClassDiary, getClassBoard } from "@/api/student";
import { useTheme, ThemeColors } from "@/hooks/useTheme"; // [woo] 다크모드
import EmptyState from "@/components/EmptyState";

type Tab = "공지사항" | "알림장" | "학급게시판";
const TABS: Tab[] = ["공지사항", "알림장", "학급게시판"];
// [woo] 탭별 EmptyState 아이콘
const ICONS: Record<Tab, string> = { "공지사항": "📢", "알림장": "📝", "학급게시판": "📋" };

function timeAgo(dateStr: string): string {
  if (!dateStr) return "";
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "방금 전";
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

// [woo] PostList가 colors를 prop으로 받아 makeStyles 사용
function PostList({ tab, colors }: { tab: Tab; colors: ThemeColors }) {
  const styles = makeStyles(colors); // [woo]
  const navigation = useNavigation<any>();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      let res: any;
      if (tab === "공지사항") res = await getSchoolNotices(0);
      else if (tab === "알림장") res = await getClassDiary(0);
      else res = await getClassBoard(0);
      setPosts(res?.content ?? []);
    } catch { setPosts([]); }
    finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { fetch(); }, [fetch]);

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => String(item.id)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await fetch(); setRefreshing(false); }} tintColor={colors.primary} />}
      contentContainerStyle={posts.length === 0 ? { flex: 1 } : { paddingBottom: 16 }}
      ListEmptyComponent={loading ? null : <EmptyState icon={ICONS[tab]} title={`${tab}이 없습니다`} />}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.item}
          onPress={() => navigation.navigate("BoardDetail", { id: item.id })}
          activeOpacity={0.7}
        >
          <View style={styles.itemHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.writerName?.charAt(0)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.author}>{item.writerName}</Text>
              <Text style={styles.date}>{timeAgo(item.createDate)}</Text>
            </View>
            <Text style={styles.views}>👁 {item.viewCount}</Text>
          </View>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        </TouchableOpacity>
      )}
    />
  );
}

export default function StudentBoardScreen() {
  const { colors } = useTheme(); // [woo] 다크모드 색상
  const styles = makeStyles(colors); // [woo]
  const [active, setActive] = useState<Tab>("공지사항");

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {TABS.map((t) => (
          <TouchableOpacity key={t} onPress={() => setActive(t)} style={[styles.tab, active === t && styles.tabActive]}>
            <Text style={[styles.tabText, active === t && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <PostList tab={active} colors={colors} />
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
  item: { backgroundColor: colors.card, marginHorizontal: 14, marginTop: 10, borderRadius: 14, padding: 16, shadowColor: colors.shadowColor, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  itemHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.primaryLight, justifyContent: "center", alignItems: "center" },
  avatarText: { color: colors.primary, fontWeight: "bold", fontSize: 14 },
  author: { fontSize: 13, fontWeight: "600", color: colors.text },
  date: { fontSize: 11, color: colors.textLight, marginTop: 1 },
  views: { fontSize: 11, color: colors.textLight },
  title: { fontSize: 15, fontWeight: "600", color: colors.text, lineHeight: 22 },
});
