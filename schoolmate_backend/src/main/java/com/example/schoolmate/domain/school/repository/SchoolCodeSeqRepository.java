package com.example.schoolmate.domain.school.repository;

import com.example.schoolmate.domain.school.entity.SchoolCodeSeq;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface SchoolCodeSeqRepository extends JpaRepository<SchoolCodeSeq, Long> {

    /**
     * PESSIMISTIC_WRITE 락으로 순번 행을 조회합니다.
     * 동시 요청이 동일 행을 읽는 것을 방지하여 채번 충돌을 막습니다.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM SchoolCodeSeq s WHERE s.schoolId = :schoolId AND s.roleType = :roleType AND s.year = :year")
    Optional<SchoolCodeSeq> findForUpdate(
            @Param("schoolId") Long schoolId,
            @Param("roleType") String roleType,
            @Param("year") int year);
}
