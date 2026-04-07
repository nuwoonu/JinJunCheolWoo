// [woo] 알림 설정 화면 — APP 프로필 > 알림 설정에서 진입
// 서버의 NotificationPreference와 동기화하여 야간 방해금지 시간 직접 설정 가능
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Switch,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import api from "@/api/client";
import { useTheme, ThemeColors } from "@/hooks/useTheme"; // [woo] 다크모드

interface Preferences {
  pushEnabled: boolean;
  quietHoursEnabled: boolean;
  quietStart: string; // "HH:mm"
  quietEnd: string;   // "HH:mm"
}

const DEFAULT_PREFS: Preferences = {
  pushEnabled: true,
  quietHoursEnabled: false,
  quietStart: "22:00",
  quietEnd: "06:00",
};

// [woo] 시간 문자열 파싱/포맷 유틸
function parseTime(t: string): { h: number; m: number } {
  const [h, m] = t.split(":").map(Number);
  return { h: isNaN(h) ? 0 : h, m: isNaN(m) ? 0 : m };
}
function formatTime(h: number, m: number): string {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// [woo] 시간 선택 모달 컴포넌트
function TimePickerModal({
  visible,
  label,
  value,
  onConfirm,
  onClose,
  colors,
}: {
  visible: boolean;
  label: string;
  value: string;
  onConfirm: (time: string) => void;
  onClose: () => void;
  colors: ThemeColors;
}) {
  const [h, setH] = useState(0);
  const [m, setM] = useState(0);
  const modal = makeModalStyles(colors); // [woo]

  useEffect(() => {
    if (visible) {
      const parsed = parseTime(value);
      setH(parsed.h);
      setM(parsed.m);
    }
  }, [visible, value]);

  const MINUTES = [0, 10, 20, 30, 40, 50];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={modal.overlay}>
        <View style={modal.container}>
          <Text style={modal.title}>{label} 시간 설정</Text>

          <View style={modal.pickerRow}>
            {/* 시간 선택 */}
            <View style={modal.column}>
              <Text style={modal.colLabel}>시</Text>
              <TouchableOpacity
                style={modal.arrowBtn}
                onPress={() => setH((prev) => (prev + 1) % 24)}
              >
                <Text style={modal.arrow}>▲</Text>
              </TouchableOpacity>
              <View style={modal.valueBox}>
                <Text style={modal.valueText}>{String(h).padStart(2, "0")}</Text>
              </View>
              <TouchableOpacity
                style={modal.arrowBtn}
                onPress={() => setH((prev) => (prev - 1 + 24) % 24)}
              >
                <Text style={modal.arrow}>▼</Text>
              </TouchableOpacity>
            </View>

            <Text style={modal.colon}>:</Text>

            {/* 분 선택 (10분 단위) */}
            <View style={modal.column}>
              <Text style={modal.colLabel}>분</Text>
              <TouchableOpacity
                style={modal.arrowBtn}
                onPress={() =>
                  setM((prev) => {
                    const idx = MINUTES.indexOf(prev);
                    return MINUTES[(idx + 1) % MINUTES.length];
                  })
                }
              >
                <Text style={modal.arrow}>▲</Text>
              </TouchableOpacity>
              <View style={modal.valueBox}>
                <Text style={modal.valueText}>{String(m).padStart(2, "0")}</Text>
              </View>
              <TouchableOpacity
                style={modal.arrowBtn}
                onPress={() =>
                  setM((prev) => {
                    const idx = MINUTES.indexOf(prev);
                    return MINUTES[(idx - 1 + MINUTES.length) % MINUTES.length];
                  })
                }
              >
                <Text style={modal.arrow}>▼</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={modal.btnRow}>
            <TouchableOpacity style={modal.cancelBtn} onPress={onClose}>
              <Text style={modal.cancelText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={modal.confirmBtn}
              onPress={() => onConfirm(formatTime(h, m))}
            >
              <Text style={modal.confirmText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function NotificationSettingsScreen() {
  const { colors } = useTheme(); // [woo] 다크모드 색상
  const styles = makeStyles(colors); // [woo]
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // [woo] 시간 선택 모달 상태
  const [timePicker, setTimePicker] = useState<{
    visible: boolean;
    field: "quietStart" | "quietEnd";
  }>({ visible: false, field: "quietStart" });

  const fetchPrefs = async () => {
    try {
      const res = await api.get("/notifications/preferences");
      setPrefs(res.data);
    } catch {
      setPrefs(DEFAULT_PREFS);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPrefs();
    }, [])
  );

  const updatePref = async (patch: Partial<Preferences>) => {
    const newPrefs = { ...prefs, ...patch };
    setPrefs(newPrefs);
    setSaving(true);
    try {
      await api.put("/notifications/preferences", newPrefs);
    } catch {
      Alert.alert("오류", "설정 저장에 실패했습니다.");
      fetchPrefs();
    } finally {
      setSaving(false);
    }
  };

  const handleTimeConfirm = (time: string) => {
    setTimePicker((p) => ({ ...p, visible: false }));
    updatePref({ [timePicker.field]: time });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* [woo] 푸시 알림 전체 on/off */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>푸시 알림</Text>
        <View style={styles.row}>
          <View style={styles.rowTexts}>
            <Text style={styles.rowLabel}>알림 받기</Text>
            <Text style={styles.rowDesc}>앱 푸시 알림을 받습니다</Text>
          </View>
          <Switch
            value={prefs.pushEnabled}
            onValueChange={(v) => updatePref({ pushEnabled: v })}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>
      </View>

      {/* [woo] 야간 방해금지 */}
      <View style={[styles.section, !prefs.pushEnabled && styles.disabled]}>
        <Text style={styles.sectionTitle}>야간 방해금지</Text>
        <View style={styles.row}>
          <View style={styles.rowTexts}>
            <Text style={styles.rowLabel}>방해금지 모드</Text>
            <Text style={styles.rowDesc}>설정된 시간에는 알림을 받지 않습니다</Text>
          </View>
          <Switch
            value={prefs.quietHoursEnabled}
            onValueChange={(v) => updatePref({ quietHoursEnabled: v })}
            disabled={!prefs.pushEnabled}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        {/* [woo] 방해금지 시간 설정 — 배지 탭하면 시간 선택 모달 오픈 */}
        {prefs.quietHoursEnabled && prefs.pushEnabled && (
          <>
            <View style={styles.timeDivider} />
            <View style={styles.timeRow}>
              <View style={styles.timeBlock}>
                <Text style={styles.timeLabel}>시작</Text>
                <TouchableOpacity
                  style={styles.timeBadge}
                  onPress={() =>
                    setTimePicker({ visible: true, field: "quietStart" })
                  }
                >
                  <Text style={styles.timeValue}>{prefs.quietStart}</Text>
                  <Text style={styles.timeEditHint}>탭하여 변경</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.timeTilde}>~</Text>
              <View style={styles.timeBlock}>
                <Text style={styles.timeLabel}>종료</Text>
                <TouchableOpacity
                  style={styles.timeBadge}
                  onPress={() =>
                    setTimePicker({ visible: true, field: "quietEnd" })
                  }
                >
                  <Text style={styles.timeValue}>{prefs.quietEnd}</Text>
                  <Text style={styles.timeEditHint}>탭하여 변경</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </View>

      {/* [woo] 안내 문구 */}
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          방해금지 모드가 켜져 있으면{"\n"}
          {prefs.quietStart} ~ {prefs.quietEnd} 사이에는{"\n"}
          푸시 알림이 전송되지 않습니다.{"\n"}
          (앱 내 알림 목록에는 정상 기록됩니다)
        </Text>
      </View>

      {saving && (
        <View style={styles.savingOverlay}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.savingText}>저장 중...</Text>
        </View>
      )}

      {/* [woo] 시간 선택 모달 */}
      <TimePickerModal
        visible={timePicker.visible}
        label={timePicker.field === "quietStart" ? "시작" : "종료"}
        value={
          timePicker.field === "quietStart" ? prefs.quietStart : prefs.quietEnd
        }
        onConfirm={handleTimeConfirm}
        onClose={() => setTimePicker((p) => ({ ...p, visible: false }))}
        colors={colors}
      />
    </ScrollView>
  );
}

// [woo] makeStyles: 다크/라이트 모드 색상 반영
const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  content: { paddingBottom: 40 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.backgroundSecondary,
  },
  section: {
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  disabled: { opacity: 0.5 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowTexts: { flex: 1, marginRight: 12 },
  rowLabel: { fontSize: 16, fontWeight: "600", color: colors.text },
  rowDesc: { fontSize: 13, color: colors.textLight, marginTop: 2 },
  timeDivider: { height: 1, backgroundColor: colors.borderLight, marginTop: 14 },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },
  timeBlock: { alignItems: "center" },
  timeLabel: { fontSize: 12, color: colors.textLight, marginBottom: 6 },
  timeBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  timeValue: { fontSize: 22, fontWeight: "700", color: colors.primary },
  timeEditHint: { fontSize: 10, color: colors.primary, marginTop: 2, opacity: 0.7 },
  timeTilde: {
    fontSize: 20,
    color: colors.textLight,
    marginHorizontal: 16,
    marginTop: 10,
  },
  infoBox: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    backgroundColor: colors.warning + "22",
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
  },
  infoText: { fontSize: 13, color: colors.text, lineHeight: 20 },
  savingOverlay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    gap: 8,
  },
  savingText: { fontSize: 13, color: colors.textSecondary },
});

// [woo] 시간 선택 모달 스타일
const makeModalStyles = (colors: ThemeColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    backgroundColor: colors.card,
    borderRadius: 20,
    paddingHorizontal: 32,
    paddingTop: 24,
    paddingBottom: 20,
    width: 280,
    alignItems: "center",
  },
  title: { fontSize: 17, fontWeight: "700", color: colors.text, marginBottom: 24 },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 28,
  },
  column: { alignItems: "center", width: 72 },
  colLabel: { fontSize: 12, color: colors.textLight, marginBottom: 10 },
  arrowBtn: { padding: 8 },
  arrow: { fontSize: 18, color: colors.primary },
  valueBox: {
    backgroundColor: colors.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  valueText: { fontSize: 28, fontWeight: "700", color: colors.primary },
  colon: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.textLight,
    marginHorizontal: 8,
    marginTop: 20,
  },
  btnRow: { flexDirection: "row", gap: 12 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.borderLight,
    alignItems: "center",
  },
  cancelText: { fontSize: 15, fontWeight: "600", color: colors.textSecondary },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: "center",
  },
  confirmText: { fontSize: 15, fontWeight: "600", color: colors.textInverse },
});
