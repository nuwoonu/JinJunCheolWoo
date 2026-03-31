package com.example.schoolmate.soojin.service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import com.example.schoolmate.common.dto.dashboardinfo.SchoolCalendarDTO;
import com.example.schoolmate.common.dto.dashboardinfo.TimetableItemDTO;
import com.example.schoolmate.soojin.entity.constant.EventType;

import lombok.extern.log4j.Log4j2;

// [woo] NEIS API 실시간 연동 - 학교일정 + 시간표 (RestClient 사용 - Spring 6.1+)
@Log4j2
@Service
public class NeisCalendarService {

    private static final String NEIS_SCHEDULE_URL = "https://open.neis.go.kr/hub/SchoolSchedule";
    private static final String NEIS_TIMETABLE_URL = "https://open.neis.go.kr/hub/hisTimetable";
    // [soojin] 학교 종류별 시간표 엔드포인트 — schoolKind: "중학교" → misTimetable, "초등학교" → elsTimetable
    private static final String NEIS_TIMETABLE_URL_MIS = "https://open.neis.go.kr/hub/misTimetable";
    private static final String NEIS_TIMETABLE_URL_ELS = "https://open.neis.go.kr/hub/elsTimetable";
    private static final DateTimeFormatter NEIS_DATE_FMT = DateTimeFormatter.ofPattern("yyyyMMdd");
    private static final DateTimeFormatter RANGE_FMT = DateTimeFormatter.ofPattern("M/d(E)", Locale.KOREAN);

    @Value("${neis.api.key}")
    private String apiKey;

    @Value("${neis.school.atpt-code}")
    private String atptCode;

    @Value("${neis.school.code}")
    private String schulCode;

    // [woo] NEIS API는 Accept: application/json 헤더를 허용하지 않음 → 헤더 미설정
    private final RestClient restClient = RestClient.builder()
            .defaultHeader("User-Agent", "Mozilla/5.0")
            .build();

    public List<SchoolCalendarDTO> getMonthlyEvents(int year, int month, Integer grade) {
        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end = start.withDayOfMonth(start.lengthOfMonth());

        String url = NEIS_SCHEDULE_URL
                + "?KEY=" + apiKey
                + "&Type=json&pIndex=1&pSize=200"
                + "&ATPT_OFCDC_SC_CODE=" + atptCode
                + "&SD_SCHUL_CODE=" + schulCode
                + "&AA_FROM_YMD=" + start.format(NEIS_DATE_FMT)
                + "&AA_TO_YMD=" + end.format(NEIS_DATE_FMT);

        log.info("NEIS 학사일정 API 호출: {}", url);

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restClient.get()
                    .uri(url)
                    .retrieve()
                    .body(Map.class);

            if (response == null) return Collections.emptyList();
            if (response.containsKey("RESULT")) {
                log.warn("NEIS 학사일정 결과 없음: {}", response.get("RESULT"));
                return Collections.emptyList();
            }

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> wrapper = (List<Map<String, Object>>) response.get("SchoolSchedule");
            if (wrapper == null || wrapper.size() < 2) return Collections.emptyList();

            @SuppressWarnings("unchecked")
            List<Map<String, String>> rows = (List<Map<String, String>>) wrapper.get(1).get("row");
            if (rows == null) return Collections.emptyList();

            return rows.stream()
                    .map(this::rowToDto)
                    .filter(dto -> grade == null || dto.getTargetGrade() == null || dto.getTargetGrade().equals(grade))
                    .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("NEIS 학사일정 API 호출 실패: {}", e.getMessage(), e);
            return Collections.emptyList();
        }
    }

    private SchoolCalendarDTO rowToDto(Map<String, String> row) {
        String ymd = row.get("AA_YMD");
        LocalDate date = LocalDate.parse(ymd, NEIS_DATE_FMT);

        String eventNm = row.getOrDefault("EVENT_NM", "");
        String eventCntnt = row.getOrDefault("EVENT_CNTNT", "");
        String sbtrDdScNm = row.getOrDefault("SBTR_DD_SC_NM", "");

        EventType eventType = mapEventType(eventNm, sbtrDdScNm);
        Integer targetGrade = mapTargetGrade(row);

        return SchoolCalendarDTO.builder()
                .title(eventNm)
                .startDate(date)
                .endDate(date)
                .eventType(eventType)
                .targetGrade(targetGrade)
                .description(eventCntnt)
                .dDay((int) ChronoUnit.DAYS.between(LocalDate.now(), date))
                .dateRangeText(date.format(RANGE_FMT))
                .build();
    }

    private EventType mapEventType(String eventNm, String sbtrDdScNm) {
        if ("공휴일".equals(sbtrDdScNm) || "휴업일".equals(sbtrDdScNm)) return EventType.HOLIDAY;
        if (eventNm.contains("시험") || eventNm.contains("평가") || eventNm.contains("수능") || eventNm.contains("모의")) return EventType.EXAM;
        if (eventNm.contains("입학") || eventNm.contains("졸업") || eventNm.contains("행사") || eventNm.contains("대회")) return EventType.EVENT;
        return EventType.ACADEMIC;
    }

    private Integer mapTargetGrade(Map<String, String> row) {
        boolean g1 = "Y".equals(row.get("ONE_GRADE_EVENT_YN"));
        boolean g2 = "Y".equals(row.get("TW_GRADE_EVENT_YN"));
        boolean g3 = "Y".equals(row.get("THREE_GRADE_EVENT_YN"));
        if (g1 && g2 && g3) return null;
        if (g1 && !g2 && !g3) return 1;
        if (!g1 && g2 && !g3) return 2;
        if (!g1 && !g2 && g3) return 3;
        return null;
    }

    // [woo] NEIS 고등학교 시간표 조회 - 오늘 날짜 기준 특정 학년/반
    public List<TimetableItemDTO> getTodayTimetable(int grade, int classNum) {
        return getTodayTimetable(grade, classNum, atptCode, schulCode);
    }

    // [soojin] schoolId로 동적 학교 코드 지원 (학부모 다자녀 다학교 케이스)
    public List<TimetableItemDTO> getTodayTimetable(int grade, int classNum, String atptCode, String schulCode) {
        return getTodayTimetable(grade, classNum, atptCode, schulCode, null);
    }

    // [soojin] schoolKind에 따라 올바른 NEIS 엔드포인트 선택 (고등학교=hisTimetable, 중학교=misTimetable, 초등학교=elsTimetable)
    public List<TimetableItemDTO> getTodayTimetable(int grade, int classNum, String atptCode, String schulCode, String schoolKind) {
        String today = LocalDate.now().format(NEIS_DATE_FMT);
        String baseUrl;
        String responseKey;
        if (schoolKind != null && schoolKind.contains("중학")) {
            baseUrl = NEIS_TIMETABLE_URL_MIS;
            responseKey = "misTimetable";
        } else if (schoolKind != null && schoolKind.contains("초등")) {
            baseUrl = NEIS_TIMETABLE_URL_ELS;
            responseKey = "elsTimetable";
        } else {
            baseUrl = NEIS_TIMETABLE_URL;
            responseKey = "hisTimetable";
        }

        String url = baseUrl
                + "?KEY=" + apiKey
                + "&Type=json&pIndex=1&pSize=20"
                + "&ATPT_OFCDC_SC_CODE=" + atptCode
                + "&SD_SCHUL_CODE=" + schulCode
                + "&AY=" + LocalDate.now().getYear()
                + "&GRADE=" + grade
                + "&CLASS_NM=" + classNum
                + "&ALL_TI_YMD=" + today;

        log.info("NEIS 시간표 API 호출: {}", url);

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restClient.get()
                    .uri(url)
                    .retrieve()
                    .body(Map.class);

            if (response == null || response.containsKey("RESULT")) return Collections.emptyList();

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> wrapper = (List<Map<String, Object>>) response.get(responseKey);
            if (wrapper == null || wrapper.size() < 2) return Collections.emptyList();

            @SuppressWarnings("unchecked")
            List<Map<String, String>> rows = (List<Map<String, String>>) wrapper.get(1).get("row");
            if (rows == null) return Collections.emptyList();

            return rows.stream()
                    .map(r -> new TimetableItemDTO(
                            Integer.parseInt(r.getOrDefault("PERIO", "0")),
                            r.getOrDefault("ITRT_CNTNT", "")))
                    .sorted(Comparator.comparingInt(TimetableItemDTO::getPeriod))
                    .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("NEIS 시간표 API 호출 실패: {}", e.getMessage(), e);
            return Collections.emptyList();
        }
    }
}
