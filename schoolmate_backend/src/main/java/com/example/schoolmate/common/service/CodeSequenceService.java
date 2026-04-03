package com.example.schoolmate.common.service;

import com.example.schoolmate.common.entity.SchoolCodeSeq;
import com.example.schoolmate.common.repository.SchoolCodeSeqRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

/**
 * 학번/사번 코드 원자적 채번 서비스
 *
 * REQUIRES_NEW 트랜잭션으로 실행되어 외부 트랜잭션 롤백 여부와 무관하게
 * 순번이 커밋됩니다. 중간에 gap이 생기는 것은 허용됩니다.
 */
@Service
@RequiredArgsConstructor
public class CodeSequenceService {

    private final SchoolCodeSeqRepository seqRepository;

    /**
     * 역할·학교·연도 기준으로 다음 코드를 원자적으로 발급합니다.
     *
     * @param schoolId 학교 ID. 학부모처럼 학교에 종속되지 않는 경우 null (→ 0L 전역 스코프 사용)
     * @param prefix   코드 접두어 ("T", "S", "E", "P")
     * @return 포맷된 코드 (예: T20260001)
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public String issue(Long schoolId, String prefix) {
        int year = LocalDate.now().getYear();
        long scopeId = (schoolId != null) ? schoolId : 0L;

        SchoolCodeSeq seq = seqRepository.findForUpdate(scopeId, prefix, year)
                .orElseGet(() -> seqRepository.saveAndFlush(new SchoolCodeSeq(scopeId, prefix, year)));

        int current = seq.getAndIncrement();
        return prefix + year + String.format("%04d", current);
    }
}
