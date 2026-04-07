// [woo] 회원가입 2단계 — 학교 검색 및 선택 (교사/학생), 무한스크롤
import React, { useState } from "react";
import {
  ActivityIndicator, FlatList, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import api from "@/api/client";
import { useTheme, ThemeColors } from "@/hooks/useTheme"; // [woo] 다크모드

const SCHOOL_KINDS = ["전체", "초등학교", "중학교", "고등학교", "특수학교", "각종학교"];

interface School {
  id: number;
  name: string;
  schoolKind: string;
  officeOfEducation: string;
}

export default function RegisterSchoolScreen() {
  const { colors } = useTheme(); // [woo] 다크모드 색상
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { role } = route.params as { role: string };
  const styles = makeStyles(colors); // [woo]

  const [name, setName] = useState("");
  const [selectedKind, setSelectedKind] = useState("전체");
  const [schools, setSchools] = useState<School[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  const search = async (p = 0) => {
    if (!name.trim() || loading) return;
    setLoading(true);
    try {
      const kind = selectedKind === "전체" ? "" : selectedKind;
      const res = await api.get("/schools", { params: { name: name.trim(), schoolKind: kind, page: p, size: 10 } });
      const data = res.data;
      const content = data.content ?? [];
      setSchools(p === 0 ? content : (prev) => [...prev, ...content]);
      setTotal(data.totalElements ?? 0);
      setHasMore(p + 1 < (data.totalPages ?? 0));
      setPage(p);
      setSearched(true);
    } catch {
      if (p === 0) setSchools([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) search(page + 1);
  };

  const handleSelect = (school: School) => {
    navigation.navigate("RegisterForm", { role, schoolId: school.id, schoolName: school.name });
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹ 이전</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>학교 선택</Text>
        <View style={{ width: 60 }} />
      </View>

      <Text style={styles.desc}>소속될 학교를 검색하여 선택해 주세요</Text>

      {/* 검색 */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="학교명 검색 (예: 서울중학교)"
          placeholderTextColor={colors.placeholder}
          value={name}
          onChangeText={setName}
          onSubmitEditing={() => search(0)}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchBtn} onPress={() => search(0)} disabled={loading}>
          <Text style={styles.searchBtnText}>검색</Text>
        </TouchableOpacity>
      </View>

      {/* 학교 종류 필터 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.kindRow}
        contentContainerStyle={styles.kindRowContent}
      >
        {SCHOOL_KINDS.map((item) => (
          <TouchableOpacity
            key={item}
            onPress={() => setSelectedKind(item)}
            style={[styles.kindChip, selectedKind === item && styles.kindChipActive]}
          >
            <Text style={[styles.kindText, selectedKind === item && styles.kindTextActive]}>{item}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 결과 */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : !searched ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyText}>학교명을 입력하고 검색하세요</Text>
        </View>
      ) : schools.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>검색 결과가 없습니다</Text>
        </View>
      ) : (
        <>
          <Text style={styles.resultCount}>총 {total.toLocaleString()}개 결과</Text>
          <FlatList
            data={schools}
            keyExtractor={(s) => String(s.id)}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.schoolItem} onPress={() => handleSelect(item)} activeOpacity={0.7}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.schoolName}>{item.name}</Text>
                  <Text style={styles.schoolSub}>{item.schoolKind} · {item.officeOfEducation}</Text>
                </View>
                <View style={styles.selectBtn}>
                  <Text style={styles.selectBtnText}>선택</Text>
                </View>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            style={styles.list}
            onEndReached={loadMore}
            onEndReachedThreshold={0.3}
            ListFooterComponent={
              hasMore ? <ActivityIndicator color={colors.primary} style={{ paddingVertical: 16 }} /> : null
            }
          />
        </>
      )}
    </View>
  );
}

// [woo] makeStyles: 다크/라이트 모드 색상 반영
const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 60, paddingBottom: 12 },
  backBtn: { width: 60 },
  backBtnText: { fontSize: 16, color: colors.primary, fontWeight: "600" },
  topTitle: { fontSize: 17, fontWeight: "700", color: colors.text },
  desc: { textAlign: "center", fontSize: 13, color: colors.textSecondary, marginBottom: 16 },
  searchRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, marginBottom: 4 },
  searchInput: { flex: 1, borderWidth: 1.5, borderColor: colors.inputBorder, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: colors.text, backgroundColor: colors.inputBg },
  searchBtn: { backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 16, justifyContent: "center" },
  searchBtnText: { color: colors.textInverse, fontWeight: "700", fontSize: 14 },
  kindRow: { flexGrow: 0, flexShrink: 0, maxHeight: 44, marginBottom: 4 },
  kindRowContent: { paddingHorizontal: 16, gap: 8, alignItems: "center" },
  kindChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card },
  kindChipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  kindText: { fontSize: 12, fontWeight: "600", color: colors.textSecondary },
  kindTextActive: { color: colors.primary },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 8 },
  emptyIcon: { fontSize: 36 },
  emptyText: { fontSize: 14, color: colors.textLight },
  resultCount: { fontSize: 12, color: colors.textLight, paddingHorizontal: 16, marginBottom: 4 },
  list: { flex: 1, paddingHorizontal: 16 },
  schoolItem: { flexDirection: "row", alignItems: "center", paddingVertical: 14, gap: 12 },
  schoolName: { fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: 2 },
  schoolSub: { fontSize: 12, color: colors.textLight },
  selectBtn: { backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 },
  selectBtnText: { color: colors.textInverse, fontSize: 13, fontWeight: "600" },
  separator: { height: 1, backgroundColor: colors.borderLight },
  pagination: { flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 12, gap: 20 },
  pageBtn: { padding: 8 },
  pageBtnText: { fontSize: 20, color: colors.primary, fontWeight: "600" },
  pageDisabled: { color: colors.textLight },
  pageInfo: { fontSize: 14, color: colors.textSecondary },
});
