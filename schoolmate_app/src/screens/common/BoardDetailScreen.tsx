// [woo] 게시글 상세 — 진입 시 읽음 처리 + PDF/Office 인라인 뷰어
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator, Dimensions, Modal, Platform, SafeAreaView,
  ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert,
} from "react-native";
import Pdf from "react-native-pdf";
import { WebView } from "react-native-webview";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as IntentLauncher from "expo-intent-launcher";
import api, { BASE_URL } from "@/api/client";
import { useTheme, ThemeColors } from "@/hooks/useTheme"; // [woo] 다크모드

const SCREEN_HEIGHT = Dimensions.get("window").height;

function stripHtml(html: string): string {
  return html?.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim() ?? "";
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

function getFileInfo(url: string): { icon: string; label: string; ext: string } {
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf")                return { icon: "📄", label: "PDF",   ext };
  if (ext === "docx" || ext === "doc")   return { icon: "📝", label: "Word",  ext };
  if (ext === "hwp" || ext === "hwpx")   return { icon: "📋", label: "HWP",   ext };
  if (ext === "pptx" || ext === "ppt")   return { icon: "📊", label: "PPT",   ext };
  if (ext === "xlsx" || ext === "xls")   return { icon: "📊", label: "Excel", ext };
  return { icon: "📎", label: "첨부파일", ext };
}

// [woo] 절대 URL 변환 (상대 경로 /api/... → http://서버/...)
function toFullUrl(url: string): string {
  if (url.startsWith("http")) return url;
  const serverBase = BASE_URL.replace(/\/api$/, "");
  return `${serverBase}${url}`;
}

// [woo] 범용 WebView 모달 — iOS PDF 인라인, Office/DOCX Google Docs 뷰어
// pdfStyles는 의도적으로 어두운 배경(뷰어 UI) 유지
function WebViewModal({ url, title, visible, onClose }: { url: string; title: string; visible: boolean; onClose: () => void }) {
  const { colors } = useTheme(); // [woo]
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
        <View style={pdfStyles.header}>
          <Text style={pdfStyles.headerTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={pdfStyles.closeBtn}>
            <Text style={pdfStyles.closeTxt}>✕ 닫기</Text>
          </TouchableOpacity>
        </View>
        <WebView
          source={{ uri: url }}
          style={{ flex: 1 }}
          startInLoadingState
          renderLoading={() => (
            <View style={pdfStyles.center}>
              <ActivityIndicator color={colors.primary} size="large" />
              <Text style={pdfStyles.loadingTxt}>불러오는 중...</Text>
            </View>
          )}
        />
      </SafeAreaView>
    </Modal>
  );
}

// [woo] PDF 인라인 뷰어
function InlinePdfViewer({ url }: { url: string }) {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <View style={{ height: SCREEN_HEIGHT * 0.65, borderRadius: 12, overflow: "hidden", marginBottom: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.cardSecondary }}>
      {loading && !error && (
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "center", alignItems: "center", zIndex: 1, backgroundColor: colors.cardSecondary }}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={{ color: colors.textSecondary, marginTop: 8, fontSize: 12 }}>PDF 불러오는 중...</Text>
        </View>
      )}
      {error ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>PDF를 불러올 수 없습니다.</Text>
        </View>
      ) : (
        <Pdf
          source={{ uri: url, cache: true }}
          style={{ flex: 1, backgroundColor: colors.cardSecondary }}
          onLoadComplete={() => setLoading(false)}
          onError={() => { setLoading(false); setError(true); }}
          trustAllCerts={false}
        />
      )}
    </View>
  );
}

// [woo] 첨부파일 버튼
function AttachmentButton({ url, fileName }: { url: string; fileName?: string }) {
  const { colors } = useTheme(); // [woo]
  const styles = makeStyles(colors); // [woo]
  const [busy, setBusy] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState("");
  const [viewerTitle, setViewerTitle] = useState("");
  const { icon, label, ext } = getFileInfo(url);
  const name = fileName ?? `attachment.${ext || "file"}`;
  const fullUrl = toFullUrl(url);

  const handlePress = async () => {
    if (ext === "pdf") {
      if (Platform.OS === "android") {
        // [woo] Android: 다운로드 후 IntentLauncher로 네이티브 PDF 앱 바로 열기
        setBusy(true);
        try {
          const dest = FileSystem.cacheDirectory + "preview.pdf";
          const { uri } = await FileSystem.downloadAsync(fullUrl, dest);
          const contentUri = await FileSystem.getContentUriAsync(uri);
          await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
            data: contentUri,
            flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
            type: "application/pdf",
          });
        } catch {
          Alert.alert("오류", "PDF를 열 수 없습니다. PDF 뷰어 앱을 설치해주세요.");
        } finally {
          setBusy(false);
        }
      } else {
        // [woo] iOS: WebView 인라인 렌더링
        setViewerUrl(fullUrl);
        setViewerTitle("PDF 뷰어");
        setViewerOpen(true);
      }
      return;
    }

    if (["docx", "doc", "pptx", "ppt", "xlsx", "xls", "hwp", "hwpx"].includes(ext)) {
      // [woo] Office/HWP: 로컬 다운로드 후 IntentLauncher(Android) 또는 공유시트(iOS)
      setBusy(true);
      try {
        const dest = FileSystem.cacheDirectory + name;
        const { uri } = await FileSystem.downloadAsync(fullUrl, dest);
        if (Platform.OS === "android") {
          try {
            const contentUri = await FileSystem.getContentUriAsync(uri);
            const mimeMap: Record<string, string> = {
              docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
              doc:  "application/msword",
              pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
              ppt:  "application/vnd.ms-powerpoint",
              xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
              xls:  "application/vnd.ms-excel",
              hwp:  "application/x-hwp",
              hwpx: "application/x-hwpx",
            };
            await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
              data: contentUri,
              flags: 1,
              type: mimeMap[ext] ?? "*/*",
            });
          } catch {
            // [woo] 뷰어 앱 없으면 공유시트로 fallback
            await Sharing.shareAsync(uri, { dialogTitle: "파일 열기" });
          }
        } else {
          await Sharing.shareAsync(uri, { dialogTitle: "파일 열기" });
        }
      } catch {
        Alert.alert("오류", "파일을 열 수 없습니다.");
      } finally {
        setBusy(false);
      }
      return;
    }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.attachBtn}
        onPress={handlePress}
        disabled={busy}
        activeOpacity={0.7}
      >
        <Text style={styles.attachIcon}>{icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.attachLabel}>{label} 첨부파일</Text>
          <Text style={styles.attachSub} numberOfLines={1}>{name}</Text>
        </View>
        {busy
          ? <ActivityIndicator size="small" color={colors.primary} />
          : <Text style={styles.attachOpen}>{ext === "pdf" ? "보기 →" : "열기 →"}</Text>
        }
      </TouchableOpacity>

      <WebViewModal
        url={viewerUrl}
        title={viewerTitle}
        visible={viewerOpen}
        onClose={() => setViewerOpen(false)}
      />
    </>
  );
}

export default function BoardDetailScreen({ route }: any) {
  const { colors } = useTheme(); // [woo] 다크모드 색상
  const styles = makeStyles(colors); // [woo]
  const { id } = route.params as { id: number };
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/board/${id}`)
      .then((r) => setPost(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));

    // [woo] 진입 즉시 읽음 처리 → NEW 뱃지 제거 + 알림 카운트 제외
    api.post(`/board/${id}/read`).catch(() => {});
  }, [id]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;
  }
  if (!post) {
    return <View style={styles.center}><Text style={styles.empty}>게시글을 불러올 수 없습니다.</Text></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{post.title}</Text>

      <View style={styles.meta}>
        <View style={styles.authorRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{post.writerName?.charAt(0)}</Text>
          </View>
          <View>
            <Text style={styles.authorName}>{post.writerName}</Text>
            <Text style={styles.date}>{timeAgo(post.createDate)}</Text>
          </View>
        </View>
        <Text style={styles.stat}>👁 {post.viewCount ?? 0}</Text>
      </View>

      <View style={styles.divider} />

      <Text style={styles.body}>{stripHtml(post.content ?? "")}</Text>

      {!!post.attachmentUrl && (
        <View style={styles.attachSection}>
          {/* [woo] PDF면 인라인 미리보기 먼저, 그 아래에 열기 버튼 */}
          {getFileInfo(post.attachmentUrl).ext === "pdf" && (
            <InlinePdfViewer url={toFullUrl(post.attachmentUrl)} />
          )}
          <AttachmentButton url={post.attachmentUrl} fileName={post.attachmentName} />
        </View>
      )}
    </ScrollView>
  );
}

// [woo] makeStyles: 다크/라이트 모드 색상 반영
const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { color: colors.textLight, fontSize: 15 },
  title: { fontSize: 20, fontWeight: "bold", color: colors.text, lineHeight: 28, marginBottom: 16 },
  meta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  authorRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primaryLight, justifyContent: "center", alignItems: "center" },
  avatarText: { color: colors.primary, fontWeight: "bold", fontSize: 15 },
  authorName: { fontSize: 14, fontWeight: "600", color: colors.text },
  date: { fontSize: 12, color: colors.textLight, marginTop: 2 },
  stat: { fontSize: 12, color: colors.textLight },
  divider: { height: 1, backgroundColor: colors.borderLight, marginBottom: 20 },
  body: { fontSize: 15, color: colors.text, lineHeight: 24 },
  attachSection: { marginTop: 24 },
  attachBtn: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: colors.primaryLight, borderRadius: 14, padding: 16,
    borderWidth: 1.5, borderColor: colors.primary + "44",
  },
  attachIcon: { fontSize: 28 },
  attachLabel: { fontSize: 14, fontWeight: "700", color: colors.text },
  attachSub: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  attachOpen: { fontSize: 13, fontWeight: "700", color: colors.primary },
});

// [woo] PDF/뷰어 헤더는 의도적으로 어두운 배경 유지 (뷰어 UI 컨벤션)
const pdfStyles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#1a1a1a", paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { color: "#fff", fontSize: 16, fontWeight: "700" },
  closeBtn: { padding: 6 },
  closeTxt: { color: "#aaa", fontSize: 14 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#1a1a1a", gap: 12 },
  loadingTxt: { color: "#aaa", fontSize: 13 },
});
