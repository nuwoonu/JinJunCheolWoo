// [woo] 교사 게시판 — 알림장 / 가정통신문 / 교직원게시판 + 작성 기능
import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList, KeyboardAvoidingView, Modal, Platform,
  RefreshControl, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { getClassDiary, getParentNotices, getTeacherBoard, createBoardPost } from "@/api/teacher";
import { useTheme, ThemeColors } from "@/hooks/useTheme"; // [woo] 다크모드
import EmptyState from "@/components/EmptyState";

type Tab = "알림장" | "가정통신문" | "교직원게시판";

// [woo] 탭별 boardType 매핑
const BOARD_TYPE: Partial<Record<Tab, string>> = {
  "알림장": "CLASS_DIARY",
  "가정통신문": "PARENT_NOTICE",
};

interface Post {
  id: number;
  title: string;
  writerName: string;
  createDate: string;
  viewCount: number;
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

function PostFeed({ tab, onRefreshTrigger, colors }: { tab: Tab; onRefreshTrigger: number; colors: ThemeColors }) {
  const styles = makeStyles(colors); // [woo]
  const navigation = useNavigation<any>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let res: any;
      if (tab === "알림장") res = await getClassDiary(0);
      else if (tab === "가정통신문") res = await getParentNotices(0);
      else res = await getTeacherBoard(0);
      setPosts(res?.content ?? []);
    } catch { setPosts([]); }
    finally { setLoading(false); }
  }, [tab, onRefreshTrigger]);

  useEffect(() => { load(); }, [load]);

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => String(item.id)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={colors.primary} />}
      contentContainerStyle={posts.length === 0 ? { flex: 1 } : { paddingBottom: 16 }}
      ListEmptyComponent={loading ? null : <EmptyState icon="📋" title={`${tab}이 없습니다`} />}
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
              <Text style={styles.authorName}>{item.writerName}</Text>
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

// [woo] 게시글 작성 모달 (알림장 / 가정통신문)
function WriteModal({ tab, visible, onClose, onSuccess, colors }: {
  tab: Tab;
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  colors: ThemeColors;
}) {
  const modal = makeModalStyles(colors); // [woo]
  const [writeTitle, setWriteTitle] = useState("");
  const [writeContent, setWriteContent] = useState("");
  const [saving, setSaving] = useState(false);

  const LABEL: Record<string, string> = {
    "알림장": "알림장",
    "가정통신문": "가정통신문",
  };

  const handleSubmit = async () => {
    if (!writeTitle.trim() || !writeContent.trim()) return;
    const boardType = BOARD_TYPE[tab];
    if (!boardType) return;
    setSaving(true);
    try {
      await createBoardPost({ title: writeTitle.trim(), content: writeContent.trim(), boardType });
      setWriteTitle("");
      setWriteContent("");
      onSuccess();
    } catch {}
    finally { setSaving(false); }
  };

  const handleClose = () => {
    setWriteTitle("");
    setWriteContent("");
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={modal.container}>
          {/* 헤더 */}
          <View style={modal.header}>
            <TouchableOpacity onPress={handleClose} style={modal.headerBtn}>
              <Text style={modal.cancelText}>취소</Text>
            </TouchableOpacity>
            <Text style={modal.headerTitle}>{LABEL[tab] ?? tab} 작성</Text>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={saving || !writeTitle.trim() || !writeContent.trim()}
              style={modal.headerBtn}
            >
              <Text style={[modal.submitText, (saving || !writeTitle.trim() || !writeContent.trim()) && modal.submitDisabled]}>
                {saving ? "저장 중" : "등록"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 안내 배너 (가정통신문) */}
          {tab === "가정통신문" && (
            <View style={modal.infoBanner}>
              <Text style={modal.infoText}>📢 담임 학급 학부모에게 자동 전달됩니다.</Text>
            </View>
          )}
          {tab === "알림장" && (
            <View style={modal.infoBanner}>
              <Text style={modal.infoText}>📝 담임 학급 학생·학부모에게 전달됩니다.</Text>
            </View>
          )}

          <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
            <View style={modal.body}>
              <Text style={modal.label}>제목</Text>
              <TextInput
                style={modal.titleInput}
                placeholder="제목을 입력하세요"
                placeholderTextColor={colors.placeholder}
                value={writeTitle}
                onChangeText={setWriteTitle}
                maxLength={100}
              />
              <Text style={modal.label}>내용</Text>
              <TextInput
                style={modal.contentInput}
                placeholder="내용을 입력하세요"
                placeholderTextColor={colors.placeholder}
                value={writeContent}
                onChangeText={setWriteContent}
                multiline
                textAlignVertical="top"
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const TABS: Tab[] = ["알림장", "가정통신문", "교직원게시판"];

export default function TeacherBoardScreen() {
  const { colors } = useTheme(); // [woo] 다크모드 색상
  const styles = makeStyles(colors); // [woo]
  const [active, setActive] = useState<Tab>("알림장");
  const [showWrite, setShowWrite] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const canWrite = active === "알림장" || active === "가정통신문";

  return (
    <View style={styles.container}>
      {/* 탭 바 */}
      <View style={styles.tabBar}>
        {TABS.map((t) => (
          <TouchableOpacity key={t} onPress={() => setActive(t)} style={[styles.tab, active === t && styles.tabActive]}>
            <Text style={[styles.tabText, active === t && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* [woo] 작성 버튼 (알림장/가정통신문만) */}
      {canWrite && (
        <View style={styles.writeRow}>
          <Text style={styles.writeHint}>
            {active === "가정통신문" ? "담임 학급 학부모에게 전달" : "담임 학급 알림장"}
          </Text>
          <TouchableOpacity onPress={() => setShowWrite(true)} style={styles.writeBtn}>
            <Text style={styles.writeBtnText}>✏️ 작성</Text>
          </TouchableOpacity>
        </View>
      )}

      <PostFeed tab={active} onRefreshTrigger={refreshTrigger} colors={colors} />

      <WriteModal
        tab={active}
        visible={showWrite}
        onClose={() => setShowWrite(false)}
        onSuccess={() => {
          setShowWrite(false);
          setRefreshTrigger((n) => n + 1);
        }}
        colors={colors}
      />
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
  writeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 10, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  writeHint: { fontSize: 12, color: colors.textSecondary },
  writeBtn: { backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  writeBtnText: { fontSize: 13, fontWeight: "700", color: colors.textInverse },
  item: { backgroundColor: colors.card, marginHorizontal: 14, marginTop: 10, borderRadius: 14, padding: 16, shadowColor: colors.shadowColor, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  itemHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.primaryLight, justifyContent: "center", alignItems: "center" },
  avatarText: { color: colors.primary, fontWeight: "bold", fontSize: 14 },
  authorName: { fontSize: 13, fontWeight: "600", color: colors.text },
  date: { fontSize: 11, color: colors.textLight, marginTop: 1 },
  views: { fontSize: 11, color: colors.textLight },
  title: { fontSize: 15, fontWeight: "600", color: colors.text, lineHeight: 22 },
});

const makeModalStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  headerBtn: { minWidth: 48 },
  headerTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  cancelText: { fontSize: 15, color: colors.textSecondary },
  submitText: { fontSize: 15, fontWeight: "700", color: colors.primary, textAlign: "right" },
  submitDisabled: { color: colors.textLight },
  infoBanner: { marginHorizontal: 16, marginTop: 14, backgroundColor: colors.primaryLight, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14 },
  infoText: { fontSize: 13, color: colors.primary, fontWeight: "600" },
  body: { padding: 20, gap: 8 },
  label: { fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 6, marginTop: 8 },
  titleInput: { backgroundColor: colors.inputBg, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.text, borderWidth: 1, borderColor: colors.inputBorder },
  contentInput: { backgroundColor: colors.inputBg, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: colors.text, borderWidth: 1, borderColor: colors.inputBorder, minHeight: 200 },
});
