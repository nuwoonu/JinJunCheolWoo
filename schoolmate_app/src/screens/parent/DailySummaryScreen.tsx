// [woo] 학부모 앱 - 자녀 하루 요약 화면
// 날짜 네비게이터로 일자별 요약 조회

import React, { useCallback, useState, useMemo } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl, ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import { useTheme, ThemeColors } from '@/hooks/useTheme'
import { useSelectedChild } from '@/context/SelectedChildContext'
import api from '@/api/client'

interface Summary {
  id: number
  studentId: number
  summaryDate: string
  content: string
}

export default function DailySummaryScreen() {
  const { colors } = useTheme()
  const styles = makeStyles(colors)
  const { selectedChild } = useSelectedChild()
  const [summaries, setSummaries] = useState<Summary[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // [woo] 로컬 날짜 기준 오늘 (toISOString은 UTC → KST 자정~오전9시 사이 하루 전 날짜 버그)
  const _now = new Date()
  const todayStr = `${_now.getFullYear()}-${String(_now.getMonth()+1).padStart(2,'0')}-${String(_now.getDate()).padStart(2,'0')}`
  const [selectedDate, setSelectedDate] = useState(todayStr)

  const load = useCallback(async () => {
    if (!selectedChild?.studentInfoId) { setLoading(false); setSummaries([]); return }
    try {
      const res = await api.get<Summary[]>(`/daily-summary/student/${selectedChild.studentInfoId}`)
      setSummaries(res.data ?? [])
    } catch {
      setSummaries([])
    } finally {
      setLoading(false)
    }
  }, [selectedChild])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false) }

  // [woo] 날짜 목록 (내림차순) — 실제 요약이 있는 날짜만
  const sortedDates = useMemo(() =>
    [...new Set(summaries.map(s => s.summaryDate))].sort((a, b) => b.localeCompare(a)),
  [summaries])

  // [woo] 현재 선택된 날짜의 요약
  const currentSummary = useMemo(() =>
    summaries.find(s => s.summaryDate === selectedDate) ?? null,
  [summaries, selectedDate])

  // [woo] 이전/다음 날짜 인덱스
  const currentIdx = sortedDates.indexOf(selectedDate)
  const hasPrev = currentIdx < sortedDates.length - 1  // 이전 날짜 (오래된 것)
  const hasNext = currentIdx > 0                        // 다음 날짜 (최근 것)

  const goPrev = () => { if (hasPrev) setSelectedDate(sortedDates[currentIdx + 1]) }
  const goNext = () => { if (hasNext) setSelectedDate(sortedDates[currentIdx - 1]) }

  // [woo] 요약이 처음 로드될 때 가장 최근 날짜로 맞춤
  useFocusEffect(useCallback(() => {
    if (sortedDates.length > 0 && !sortedDates.includes(selectedDate)) {
      setSelectedDate(sortedDates[0])
    }
  }, [sortedDates]))

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00')
    const days = ['일', '월', '화', '수', '목', '금', '토']
    const today = new Date()
    const isToday = d.toDateString() === today.toDateString()
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
    const isYesterday = d.toDateString() === yesterday.toDateString()

    const base = `${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`
    if (isToday) return `오늘 · ${base}`
    if (isYesterday) return `어제 · ${base}`
    return base
  }

  const isToday = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toDateString() === new Date().toDateString()
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="document-text-outline" size={22} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>하루 요약</Text>
          <Text style={styles.headerSub}>{selectedChild?.name ?? '-'}의 하루 기록</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : summaries.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="calendar-outline" size={40} color={colors.textLight} />
          <Text style={styles.emptyText}>작성된 요약이 없어요</Text>
          <Text style={styles.emptySubText}>선생님이 하루 요약을 작성하면 여기에 표시돼요</Text>
        </View>
      ) : (
        <>
          {/* [woo] 날짜 네비게이터 */}
          <View style={styles.dateNav}>
            <TouchableOpacity
              onPress={goPrev}
              style={[styles.navBtn, !hasPrev && styles.navBtnDisabled]}
              disabled={!hasPrev}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={20} color={hasPrev ? colors.primary : colors.textLight} />
            </TouchableOpacity>

            <View style={styles.dateCenter}>
              <Text style={[styles.dateLabel, isToday(selectedDate) && styles.dateLabelToday]}>
                {formatDate(selectedDate)}
              </Text>
              {sortedDates.length > 1 && (
                <Text style={styles.datePaging}>
                  {currentIdx + 1} / {sortedDates.length}
                </Text>
              )}
            </View>

            <TouchableOpacity
              onPress={goNext}
              style={[styles.navBtn, !hasNext && styles.navBtnDisabled]}
              disabled={!hasNext}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-forward" size={20} color={hasNext ? colors.primary : colors.textLight} />
            </TouchableOpacity>
          </View>

          {/* [woo] 선택된 날짜의 요약 */}
          {currentSummary ? (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryContent}>{currentSummary.content}</Text>
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Ionicons name="document-outline" size={36} color={colors.textLight} />
              <Text style={styles.emptyText}>이 날 요약이 없어요</Text>
            </View>
          )}

        </>
      )}
      <View style={{ height: 32 }} />
    </ScrollView>
  )
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
  },
  headerIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  headerSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },

  emptyCard: {
    margin: 16, backgroundColor: colors.card, borderRadius: 16,
    padding: 40, alignItems: 'center',
    shadowColor: colors.shadowColor, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  emptyText: { fontSize: 15, fontWeight: '600', color: colors.text, marginTop: 14 },
  emptySubText: { fontSize: 13, color: colors.textSecondary, marginTop: 6, textAlign: 'center' },

  // [woo] 날짜 네비게이터
  dateNav: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginBottom: 12,
    backgroundColor: colors.card, borderRadius: 16,
    paddingVertical: 12, paddingHorizontal: 8,
    shadowColor: colors.shadowColor, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  navBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  navBtnDisabled: { backgroundColor: colors.backgroundSecondary },
  dateCenter: { flex: 1, alignItems: 'center' },
  dateLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
  dateLabelToday: { color: colors.primary },
  datePaging: { fontSize: 11, color: colors.textLight, marginTop: 2 },

  // [woo] 요약 카드
  summaryCard: {
    marginHorizontal: 16, marginBottom: 12,
    backgroundColor: colors.card, borderRadius: 16, padding: 20,
    shadowColor: colors.shadowColor, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  summaryCardToday: {
    borderColor: colors.primary + '40',
    backgroundColor: colors.primaryLight + '55',
  },
  summaryContent: { fontSize: 15, color: colors.text, lineHeight: 26 },

  // [woo] 날짜 목록
  dateList: {
    marginHorizontal: 16, marginTop: 4,
    backgroundColor: colors.card, borderRadius: 16, padding: 16,
    shadowColor: colors.shadowColor, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  dateListTitle: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginBottom: 10 },
  dateItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: 10, borderRadius: 10,
  },
  dateItemActive: { backgroundColor: colors.primaryLight },
  dateItemText: { fontSize: 14, color: colors.textSecondary },
  dateItemTextActive: { color: colors.primary, fontWeight: '600' },
})
