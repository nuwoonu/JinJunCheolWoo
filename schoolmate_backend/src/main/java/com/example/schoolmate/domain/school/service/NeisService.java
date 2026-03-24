package com.example.schoolmate.domain.school.service;

import java.net.URI;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.scheduling.annotation.Async;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import com.example.schoolmate.config.SchoolmateUrls;
import com.example.schoolmate.domain.school.entity.School;
import com.example.schoolmate.domain.school.repository.SchoolRepository;
import com.example.schoolmate.common.util.LogHelper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class NeisService {

    private final SchoolRepository schoolRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // 연결 5초 / 읽기 30초 타임아웃
    private final RestTemplate restTemplate = createRestTemplate();

    @Value("${neis.api.key}")
    private String neisApiKey;

    // 동기화 작업 실행 상태 플래그 (Thread-safe)
    private final AtomicBoolean isSyncing = new AtomicBoolean(false);

    public boolean isSyncRunning() {
        return isSyncing.get();
    }

    /**
     * 나이스 API를 통해 전국 학교 정보를 동기화합니다.
     * 페이지 단위로 반복 호출하며, 한 페이지당 배치로 SELECT/INSERT/UPDATE 처리합니다.
     */
    @Async
    public void syncSchoolData(String requesterName) {
        if (!isSyncing.compareAndSet(false, true)) {
            log.warn("이미 학교 데이터 동기화 작업이 진행 중입니다.");
            return;
        }

        LogHelper.action(requesterName, "SYNC_START", "School", "NEIS 학교 정보 동기화 시작");

        int pIndex = 1;
        final int pSize = 1000; // NEIS API 최대 허용값
        int savedCount = 0;

        try {
            while (true) {
                // 1. API 호출 URL 생성
                URI uri = UriComponentsBuilder.fromUriString(SchoolmateUrls.Api.NEIS_SCHOOL_INFO)
                        .queryParam("KEY", neisApiKey)
                        .queryParam("Type", "json")
                        .queryParam("pIndex", pIndex)
                        .queryParam("pSize", pSize)
                        .build()
                        .toUri();

                // 2. 요청 및 응답 파싱
                String responseBody = restTemplate.getForObject(uri, String.class);
                if (responseBody == null) {
                    log.warn("NEIS API 응답이 null입니다. 동기화 중단.");
                    break;
                }
                JsonNode root = objectMapper.readTree(responseBody);

                // 3. API 레벨 에러 또는 마지막 페이지 확인
                if (root.has("RESULT")) {
                    String code = root.get("RESULT").get("CODE").asText();
                    if (!"INFO-000".equals(code)) {
                        log.info("NEIS API 종료: {}", root.get("RESULT").get("MESSAGE").asText());
                        break;
                    }
                }

                // 4. schoolInfo → row 추출
                JsonNode schoolInfoArr = root.get("schoolInfo");
                if (schoolInfoArr == null || !schoolInfoArr.isArray()) break;

                JsonNode rowNode = null;
                for (JsonNode node : schoolInfoArr) {
                    if (node.has("row")) {
                        rowNode = node.get("row");
                        break;
                    }
                }
                if (rowNode == null || !rowNode.isArray() || rowNode.isEmpty()) break;

                // 5. 이번 페이지의 유효 school code 수집 (순서 유지, 중복 제거)
                Set<String> codesInPage = new LinkedHashSet<>();
                for (JsonNode row : rowNode) {
                    String raw = getText(row, "SD_SCHUL_CODE");
                    if (raw != null && !raw.isBlank()) {
                        codesInPage.add(raw.trim());
                    }
                }

                // 유효 코드가 없으면 다음 페이지도 없다고 판단하고 종료
                if (codesInPage.isEmpty()) {
                    log.info("유효한 학교 코드가 없는 페이지 감지 (pIndex={}), 동기화 종료", pIndex);
                    break;
                }

                // 6. 배치 SELECT — 이미 존재하는 학교 한 번에 조회 (N+1 방지)
                Map<String, School> existingMap = schoolRepository
                        .findAllBySchoolCodeIn(codesInPage)
                        .stream()
                        .collect(Collectors.toMap(School::getSchoolCode, s -> s));

                // 7. 엔티티 빌드 (메모리에서 upsert)
                // pendingMap: 이번 페이지에서 처리 중인 신규 School (페이지 내 중복 코드 처리)
                Map<String, School> pendingMap = new java.util.LinkedHashMap<>();
                List<School> schoolsToSave = new ArrayList<>();

                for (JsonNode row : rowNode) {
                    String raw = getText(row, "SD_SCHUL_CODE");
                    if (raw == null || raw.isBlank()) continue;
                    String code = raw.trim();

                    // DB에 있으면 기존 엔티티, 이번 페이지에서 이미 만든 것이면 재사용, 둘 다 없으면 신규 생성
                    School school;
                    if (existingMap.containsKey(code)) {
                        school = existingMap.get(code);
                    } else if (pendingMap.containsKey(code)) {
                        school = pendingMap.get(code);
                    } else {
                        school = new School();
                        pendingMap.put(code, school);
                        schoolsToSave.add(school);
                    }

                    school.setSchoolCode(code);
                    school.setName(getText(row, "SCHUL_NM"));
                    school.setOfficeOfEducation(getText(row, "ATPT_OFCDC_SC_NM"));
                    school.setOfficeCode(getText(row, "ATPT_OFCDC_SC_CODE"));
                    school.setSchoolKind(getText(row, "SCHUL_KND_SC_NM"));
                    school.setAddress(getText(row, "ORG_RDNMA"));
                    school.setPhoneNumber(getText(row, "ORG_TELNO"));
                    school.setHomepage(getText(row, "HMPG_ADRES"));
                    school.setFoundationType(getText(row, "FOND_SC_NM"));
                    school.setCoeduType(getText(row, "COEDU_SC_NM"));

                    // 기존 엔티티는 schoolsToSave에 한 번만 추가
                    if (existingMap.containsKey(code) && !schoolsToSave.contains(school)) {
                        schoolsToSave.add(school);
                    }
                }

                schoolRepository.saveAll(schoolsToSave);
                savedCount += schoolsToSave.size();
                log.info("동기화 진행 중... pIndex={}, 이번 페이지 {}건 (누적 {}건)", pIndex, schoolsToSave.size(), savedCount);

                // 8. 마지막 페이지 판단: 받은 row 수가 pSize 미만이면 다음 페이지 없음
                if (rowNode.size() < pSize) break;

                pIndex++;

                // 부하 분산: API 호출 간격
                Thread.sleep(200);
            }

            log.info("학교 데이터 동기화 완료: 총 {}건 처리", savedCount);
            LogHelper.action(requesterName, "SYNC_COMPLETE", "School", "동기화 완료 (총 " + savedCount + "건 처리)");

        } catch (Exception e) {
            log.error("학교 데이터 동기화 중 오류 발생", e);
            LogHelper.action(requesterName, "SYNC_FAIL", "School", "동기화 실패: " + e.getMessage());
        } finally {
            isSyncing.set(false);
        }
    }

    private static RestTemplate createRestTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5_000);  // 연결 타임아웃 5초
        factory.setReadTimeout(30_000);    // 읽기 타임아웃 30초
        return new RestTemplate(factory);
    }

    private String getText(JsonNode node, String fieldName) {
        return node.has(fieldName) && !node.get(fieldName).isNull() ? node.get(fieldName).asText() : null;
    }
}
