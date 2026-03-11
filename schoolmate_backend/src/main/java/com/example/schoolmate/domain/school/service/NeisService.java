package com.example.schoolmate.domain.school.service;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.HashSet;
import java.util.concurrent.atomic.AtomicBoolean;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.scheduling.annotation.Async;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import com.example.schoolmate.config.SchoolmateUrls;
import com.example.schoolmate.domain.school.entity.School;
import com.example.schoolmate.domain.school.repository.SchoolRepository;
import com.example.schoolmate.domain.log.service.LogService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class NeisService {

    private final SchoolRepository schoolRepository;
    private final LogService logService; // 로그 서비스 주입
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${neis.api.key}")
    private String neisApiKey;

    // 동기화 작업 실행 상태 플래그 (Thread-safe)
    private final AtomicBoolean isSyncing = new AtomicBoolean(false);

    public boolean isSyncRunning() {
        return isSyncing.get();
    }

    /**
     * 나이스 API를 통해 전국 학교 정보를 동기화합니다.
     * 데이터가 많으므로 페이지 단위로 반복 호출합니다.
     * 
     * @Async 적용: 백그라운드에서 실행되며, DB 부하를 줄이기 위해 페이지 단위로 트랜잭션을 끊어서 처리합니다.
     */
    @Async
    public void syncSchoolData(String requesterName) {
        // 중복 실행 방지 체크 (이중 안전장치)
        if (!isSyncing.compareAndSet(false, true)) {
            log.warn("이미 학교 데이터 동기화 작업이 진행 중입니다.");
            return;
        }

        logService.logAction(requesterName, "SYNC_START", "School", "NEIS 학교 정보 동기화 시작");

        int pIndex = 1;
        int pSize = 1000; // 한 번에 가져올 데이터 수 (최대 1000)
        int totalCount = 0;
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
                JsonNode root = objectMapper.readTree(responseBody);

                // 3. 에러 또는 데이터 없음 체크
                if (root.has("RESULT")) {
                    String code = root.get("RESULT").get("CODE").asText();
                    if (!"INFO-000".equals(code)) {
                        log.info("API 호출 종료 또는 에러: {}", root.get("RESULT").get("MESSAGE").asText());
                        break;
                    }
                }

                // schoolInfo 배열 확인
                JsonNode schoolInfoArr = root.get("schoolInfo");
                if (schoolInfoArr == null || !schoolInfoArr.isArray()) {
                    break;
                }

                // 4. 데이터 추출 (row는 배열의 두 번째 요소에 위치함)
                JsonNode rowNode = null;
                for (JsonNode node : schoolInfoArr) {
                    if (node.has("row")) {
                        rowNode = node.get("row");
                        break;
                    }
                }

                if (rowNode == null || !rowNode.isArray() || rowNode.isEmpty()) {
                    break;
                }

                // 5. 엔티티 변환 및 저장
                List<School> schoolsToSave = new ArrayList<>();
                Set<String> processedCodes = new HashSet<>();

                for (JsonNode row : rowNode) {
                    String rawSchoolCode = getText(row, "SD_SCHUL_CODE");

                    if (rawSchoolCode == null || rawSchoolCode.trim().isEmpty()) {
                        continue;
                    }
                    String schoolCode = rawSchoolCode.trim();

                    if (processedCodes.contains(schoolCode))
                        continue;
                    processedCodes.add(schoolCode);

                    // 이미 존재하는 학교면 업데이트, 없으면 생성
                    School school = schoolRepository.findBySchoolCode(schoolCode)
                            .orElse(new School());

                    school.setSchoolCode(schoolCode);
                    school.setName(getText(row, "SCHUL_NM"));
                    school.setOfficeOfEducation(getText(row, "ATPT_OFCDC_SC_NM"));
                    school.setSchoolKind(getText(row, "SCHUL_KND_SC_NM"));
                    school.setAddress(getText(row, "ORG_RDNMA"));
                    school.setPhoneNumber(getText(row, "ORG_TELNO"));
                    school.setHomepage(getText(row, "HMPG_ADRES"));
                    school.setFoundationType(getText(row, "FOND_SC_NM"));
                    school.setCoeduType(getText(row, "COEDU_SC_NM"));

                    schoolsToSave.add(school);
                }

                schoolRepository.saveAll(schoolsToSave);
                savedCount += schoolsToSave.size();
                totalCount += schoolsToSave.size();

                log.info("학교 데이터 동기화 진행 중... (현재 {}건 저장)", totalCount);

                // 다음 페이지
                pIndex++;

                // [부하 분산] API 호출 및 DB 쓰기 사이에 0.2초 대기
                Thread.sleep(200);
            }
            log.info("학교 데이터 동기화 완료: 총 {}개 저장됨", savedCount);
            logService.logAction(requesterName, "SYNC_COMPLETE", "School", "동기화 완료 (총 " + savedCount + "건 처리)");
        } catch (Exception e) {
            log.error("학교 데이터 동기화 중 오류 발생", e);
            logService.logAction(requesterName, "SYNC_FAIL", "School", "동기화 실패: " + e.getMessage());
        } finally {
            isSyncing.set(false); // 작업 종료 (성공/실패 무관)
        }
    }

    // Null 안전한 텍스트 추출 헬퍼
    private String getText(JsonNode node, String fieldName) {
        return node.has(fieldName) && !node.get(fieldName).isNull() ? node.get(fieldName).asText() : null;
    }
}
